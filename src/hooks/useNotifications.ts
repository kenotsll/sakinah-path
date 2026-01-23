import { useEffect, useCallback, useState } from 'react';
import { toast } from "sonner";

interface NotificationSchedule {
  id: string;
  title: string;
  message: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const DEFAULT_SCHEDULES: NotificationSchedule[] = [
  {
    id: "muhasabah",
    title: "Waktu Muhasabah 🌙",
    message: "Sudahkah kita beristighfar hari ini? Yuk, tulis refleksimu sebelum tidur.",
    hour: 21,
    minute: 0,
    enabled: true,
  },
  {
    id: "tahajjud",
    title: "Panggilan Tahajjud ✨",
    message: "Pintu taubat terbuka lebar di sepertiga malam terakhir.",
    hour: 3,
    minute: 0,
    enabled: true,
  },
  {
    id: "dzikir-pagi",
    title: "Dzikir Pagi 🌅",
    message: "Mulai harimu dengan mengingat Allah. Baca dzikir pagi untuk keberkahan.",
    hour: 5,
    minute: 30,
    enabled: true,
  },
  {
    id: "dzikir-petang",
    title: "Dzikir Petang 🌆",
    message: "Jangan lupa dzikir petang. Lindungi harimu dengan doa.",
    hour: 16,
    minute: 30,
    enabled: true,
  },
];

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [schedules, setSchedules] = useState<NotificationSchedule[]>(() => {
    const saved = localStorage.getItem("notification_schedules");
    return saved ? JSON.parse(saved) : DEFAULT_SCHEDULES;
  });

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Browser tidak mendukung notifikasi");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      toast.success("Notifikasi diaktifkan! 🔔", {
        description: "Kamu akan menerima pengingat ibadah",
      });
      return true;
    } else {
      toast.error("Izin notifikasi ditolak", {
        description: "Aktifkan di pengaturan browser untuk menerima pengingat",
      });
      return false;
    }
  }, []);

  // Send notification
  const sendNotification = useCallback((title: string, body: string) => {
    if (permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "istiqamah-reminder",
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Also show in-app toast as backup
    toast(title, {
      description: body,
      duration: 10000,
    });
  }, [permission]);

  // Update schedule
  const updateSchedule = useCallback((id: string, updates: Partial<NotificationSchedule>) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      localStorage.setItem("notification_schedules", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check and trigger scheduled notifications
  useEffect(() => {
    if (permission !== "granted") return;

    const checkSchedule = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      schedules.forEach(schedule => {
        if (schedule.enabled && 
            schedule.hour === currentHour && 
            schedule.minute === currentMinute) {
          // Check if already notified this minute
          const lastNotified = localStorage.getItem(`notified_${schedule.id}`);
          const today = now.toDateString();
          
          if (lastNotified !== today) {
            sendNotification(schedule.title, schedule.message);
            localStorage.setItem(`notified_${schedule.id}`, today);
          }
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkSchedule, 60000);
    checkSchedule(); // Initial check

    return () => clearInterval(interval);
  }, [permission, schedules, sendNotification]);

  // Check permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    permission,
    schedules,
    requestPermission,
    sendNotification,
    updateSchedule,
    isSupported: "Notification" in window,
  };
};
