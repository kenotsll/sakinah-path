import { useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

interface PrayerTime {
  name: string;
  time: string;
  englishName: string;
}

interface UseNativeNotificationsReturn {
  schedulePrayerNotifications: (prayers: PrayerTime[]) => Promise<void>;
  scheduleDailyReminders: () => Promise<void>;
  scheduleStreakWarning: (hour: number, minute: number) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  isNative: boolean;
}

// Notification IDs (fixed IDs for each prayer and reminder type)
const NOTIFICATION_IDS = {
  FAJR: 1,
  DHUHR: 2,
  ASR: 3,
  MAGHRIB: 4,
  ISHA: 5,
  DAILY_REMINDER_17: 10,
  DAILY_REMINDER_21: 11,
  STREAK_WARNING: 20,
};

export const useNativeNotifications = (): UseNativeNotificationsReturn => {
  const isNative = Capacitor.isNativePlatform();
  const scheduledRef = useRef(false);

  // Initialize notification channels on mount (Android only)
  useEffect(() => {
    if (isNative && Capacitor.getPlatform() === 'android') {
      initializeChannels();
    }
  }, [isNative]);

  const initializeChannels = async () => {
    try {
      // Check if channels exist first
      const channels = await LocalNotifications.listChannels();
      
      if (!channels.channels.find(c => c.id === 'prayer-times')) {
        await LocalNotifications.createChannel({
          id: 'prayer-times',
          name: 'Waktu Sholat',
          description: 'Notifikasi pengingat waktu sholat',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'beep.wav',
          lights: true,
          lightColor: '#10B981',
        });
      }

      if (!channels.channels.find(c => c.id === 'daily-reminder')) {
        await LocalNotifications.createChannel({
          id: 'daily-reminder',
          name: 'Pengingat Harian',
          description: 'Notifikasi pengingat target harian',
          importance: 4,
          visibility: 1,
          vibration: true,
        });
      }

      if (!channels.channels.find(c => c.id === 'streak-warning')) {
        await LocalNotifications.createChannel({
          id: 'streak-warning',
          name: 'Peringatan Streak',
          description: 'Notifikasi peringatan streak',
          importance: 5,
          visibility: 1,
          vibration: true,
        });
      }
    } catch (err) {
      console.error('Error initializing notification channels:', err);
    }
  };

  // Parse time string (HH:MM) to Date object for today/tomorrow
  const parseTimeToDate = (timeStr: string, offsetMinutes: number = 0): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes - offsetMinutes,
      0
    );

    // If time has passed today, schedule for tomorrow
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    return targetDate;
  };

  // Schedule prayer time notifications
  const schedulePrayerNotifications = useCallback(async (prayers: PrayerTime[]) => {
    if (!isNative) return;

    try {
      // Cancel existing prayer notifications first
      await LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_IDS.FAJR },
          { id: NOTIFICATION_IDS.DHUHR },
          { id: NOTIFICATION_IDS.ASR },
          { id: NOTIFICATION_IDS.MAGHRIB },
          { id: NOTIFICATION_IDS.ISHA },
        ],
      });

      const notifications: ScheduleOptions['notifications'] = [];

      for (const prayer of prayers) {
        const prayerName = prayer.englishName.toLowerCase();
        let notificationId: number;

        switch (prayerName) {
          case 'fajr':
            notificationId = NOTIFICATION_IDS.FAJR;
            break;
          case 'dhuhr':
            notificationId = NOTIFICATION_IDS.DHUHR;
            break;
          case 'asr':
            notificationId = NOTIFICATION_IDS.ASR;
            break;
          case 'maghrib':
            notificationId = NOTIFICATION_IDS.MAGHRIB;
            break;
          case 'isha':
            notificationId = NOTIFICATION_IDS.ISHA;
            break;
          default:
            continue;
        }

        // Schedule 5 minutes before prayer time
        const scheduledTime = parseTimeToDate(prayer.time, 5);

        notifications.push({
          id: notificationId,
          title: `🕌 ${prayer.name}`,
          body: `Waktu ${prayer.name} akan masuk dalam 5 menit (${prayer.time})`,
          schedule: { at: scheduledTime },
          channelId: 'prayer-times',
          sound: 'beep.wav',
          smallIcon: 'ic_stat_icon_config_sample',
          largeIcon: 'ic_launcher',
          autoCancel: true,
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log('Prayer notifications scheduled:', notifications.length);
      }
    } catch (err) {
      console.error('Error scheduling prayer notifications:', err);
    }
  }, [isNative]);

  // Schedule daily reminders at 17:00 and 21:00
  const scheduleDailyReminders = useCallback(async () => {
    if (!isNative) return;

    try {
      // Cancel existing daily reminders
      await LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_IDS.DAILY_REMINDER_17 },
          { id: NOTIFICATION_IDS.DAILY_REMINDER_21 },
        ],
      });

      const now = new Date();
      
      // Schedule 17:00 reminder
      const reminder17 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        17, 0, 0
      );
      if (reminder17 <= now) {
        reminder17.setDate(reminder17.getDate() + 1);
      }

      // Schedule 21:00 reminder
      const reminder21 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        21, 0, 0
      );
      if (reminder21 <= now) {
        reminder21.setDate(reminder21.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.DAILY_REMINDER_17,
            title: '📋 Cek Target Harianmu',
            body: 'Masih ada waktu untuk menyelesaikan target hari ini sebelum reset tengah malam!',
            schedule: { at: reminder17, every: 'day' },
            channelId: 'daily-reminder',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
          },
          {
            id: NOTIFICATION_IDS.DAILY_REMINDER_21,
            title: '⏰ 3 Jam Lagi Reset!',
            body: 'Pastikan semua target harian sudah selesai sebelum tengah malam',
            schedule: { at: reminder21, every: 'day' },
            channelId: 'daily-reminder',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
          },
        ],
      });

      console.log('Daily reminders scheduled');
    } catch (err) {
      console.error('Error scheduling daily reminders:', err);
    }
  }, [isNative]);

  // Schedule streak warning notification
  const scheduleStreakWarning = useCallback(async (hour: number, minute: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: NOTIFICATION_IDS.STREAK_WARNING }],
      });

      const now = new Date();
      const warningTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0
      );
      if (warningTime <= now) {
        warningTime.setDate(warningTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.STREAK_WARNING,
            title: '🔥 Jaga Streak-mu!',
            body: 'Jangan sampai streak kamu terputus! Selesaikan target harian sebelum tengah malam.',
            schedule: { at: warningTime },
            channelId: 'streak-warning',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
          },
        ],
      });

      console.log('Streak warning scheduled for', `${hour}:${minute}`);
    } catch (err) {
      console.error('Error scheduling streak warning:', err);
    }
  }, [isNative]);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      console.log('All notifications cancelled');
    } catch (err) {
      console.error('Error cancelling notifications:', err);
    }
  }, [isNative]);

  return {
    schedulePrayerNotifications,
    scheduleDailyReminders,
    scheduleStreakWarning,
    cancelAllNotifications,
    isNative,
  };
};
