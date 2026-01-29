import { useEffect, useCallback, useState, useRef } from 'react';
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
  
  // Track if document is visible
  const isVisibleRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request permission with better error handling
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Browser tidak mendukung notifikasi", {
        description: "Gunakan browser modern seperti Chrome atau Firefox",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Notifikasi diaktifkan! 🔔", {
          description: "Kamu akan menerima pengingat ibadah tepat waktu",
        });
        
        // Send test notification to confirm it works
        setTimeout(() => {
          sendNotification(
            "Notifikasi Aktif ✓", 
            "Pengingat sholat dan ibadah sudah aktif!"
          );
        }, 1000);
        
        return true;
      } else if (result === "denied") {
        toast.error("Izin notifikasi ditolak", {
          description: "Untuk mengaktifkan: Buka Pengaturan Browser > Izin Situs > Notifikasi",
        });
      } else {
        toast.info("Izin notifikasi tertunda", {
          description: "Silakan izinkan notifikasi saat diminta",
        });
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Gagal meminta izin notifikasi");
      return false;
    }
  }, []);

  // Send notification with improved reliability
  const sendNotification = useCallback((title: string, body: string, options?: { tag?: string; requireInteraction?: boolean }) => {
    // Always show in-app toast as backup/confirmation
    toast(title, {
      description: body,
      duration: 8000,
    });

    // Try to send browser notification
    if (permission === "granted" && "Notification" in window) {
      try {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: options?.tag || "istiqamah-reminder",
          requireInteraction: options?.requireInteraction ?? false,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto close after 10 seconds if requireInteraction is false
        if (!options?.requireInteraction) {
          setTimeout(() => notification.close(), 10000);
        }
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  }, [permission]);

  // Update schedule
  const updateSchedule = useCallback((id: string, updates: Partial<NotificationSchedule>) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      localStorage.setItem("notification_schedules", JSON.stringify(updated));
      return updated;
    });
    
    toast.success("Pengaturan notifikasi diperbarui");
  }, []);

  // Check scheduled notifications
  const checkScheduledNotifications = useCallback(() => {
    if (permission !== "granted") return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toDateString();

    schedules.forEach(schedule => {
      if (!schedule.enabled) return;
      if (schedule.hour !== currentHour || schedule.minute !== currentMinute) return;

      // Check if already notified today
      const lastNotifiedKey = `notified_${schedule.id}`;
      const lastNotified = localStorage.getItem(lastNotifiedKey);
      
      if (lastNotified === today) return;

      // Send notification
      sendNotification(schedule.title, schedule.message, {
        tag: schedule.id,
        requireInteraction: true,
      });
      
      // Mark as notified for today
      localStorage.setItem(lastNotifiedKey, today);
    });
  }, [permission, schedules, sendNotification]);

  // Handle visibility change to restart checking when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
      
      if (isVisibleRef.current) {
        // Check immediately when app becomes visible
        checkScheduledNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkScheduledNotifications]);

  // Main interval for checking notifications
  useEffect(() => {
    if (permission !== "granted") return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial check
    checkScheduledNotifications();

    // Check every 30 seconds for more accurate timing
    intervalRef.current = setInterval(checkScheduledNotifications, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [permission, checkScheduledNotifications]);

  // Check permission on mount and when window regains focus
  useEffect(() => {
    const checkPermission = () => {
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    };

    checkPermission();

    // Re-check when window gains focus
    window.addEventListener("focus", checkPermission);
    return () => window.removeEventListener("focus", checkPermission);
  }, []);

  // Manual trigger for testing
  const testNotification = useCallback(() => {
    sendNotification(
      "Test Notifikasi 🔔",
      "Ini adalah notifikasi percobaan dari aplikasi Istiqamah!",
      { tag: "test" }
    );
  }, [sendNotification]);

  return {
    permission,
    schedules,
    requestPermission,
    sendNotification,
    updateSchedule,
    testNotification,
    isSupported: "Notification" in window,
  };
};
