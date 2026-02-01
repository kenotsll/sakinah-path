/**
 * Scheduled Notifications System
 * Handles multi-category notifications: Prayer, Tasks, Reflection, Quran
 */

import { useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { toast } from 'sonner';

interface PrayerTime {
  name: string;
  englishName: string;
  time: string;
}

interface ScheduledNotificationsConfig {
  prayerTimes?: PrayerTime[];
  hasUncompletedTasks?: boolean;
  lastQuranRead?: { surahName: string; ayahNumber: number } | null;
  streakCount?: number;
}

// Fixed notification IDs for each category
const NOTIFICATION_IDS = {
  // Prayer times (1-10)
  FAJR: 1,
  DHUHR: 2,
  ASR: 3,
  MAGHRIB: 4,
  ISHA: 5,
  
  // Task reminders (11-20)
  TASK_REMINDER_17: 11,
  TASK_REMINDER_21: 12,
  
  // Reflection/Muhasabah (21-30)
  REFLECTION_NIGHT: 21,
  TAHAJJUD_CALL: 22,
  
  // Quran reminders (31-40)
  QURAN_MORNING: 31,
  
  // Dzikir reminders (41-50)
  DZIKIR_MORNING: 41,
  DZIKIR_EVENING: 42,
  
  // Streak warnings (51-60)
  STREAK_WARNING: 51,
  STREAK_FINAL: 52,
};

const PRAYER_NAME_MAP: Record<string, number> = {
  fajr: NOTIFICATION_IDS.FAJR,
  subuh: NOTIFICATION_IDS.FAJR,
  dhuhr: NOTIFICATION_IDS.DHUHR,
  dzuhur: NOTIFICATION_IDS.DHUHR,
  asr: NOTIFICATION_IDS.ASR,
  ashar: NOTIFICATION_IDS.ASR,
  maghrib: NOTIFICATION_IDS.MAGHRIB,
  isha: NOTIFICATION_IDS.ISHA,
  isya: NOTIFICATION_IDS.ISHA,
};

export const useScheduledNotifications = () => {
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const scheduledRef = useRef(false);

  // Log helper
  const log = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[Notifications ${timestamp}] ${message}`, data || '');
  }, []);

  // Parse time string to Date (for today or tomorrow)
  const parseTimeToDate = useCallback((timeStr: string, offsetMinutes: number = 0): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes - offsetMinutes,
      0
    );

    // If time has passed, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }, []);

  // Get Date for specific hour:minute
  const getScheduleTime = useCallback((hour: number, minute: number, allowPast: boolean = false): Date => {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0
    );

    if (!allowPast && target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }, []);

  // Schedule prayer notifications (5 minutes before each prayer)
  const schedulePrayerNotifications = useCallback(async (prayers: PrayerTime[]) => {
    if (!isNative) return;

    log('Scheduling prayer notifications...', prayers);

    try {
      // Cancel existing prayer notifications
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
        const key = prayer.englishName.toLowerCase();
        const notifId = PRAYER_NAME_MAP[key];
        
        if (!notifId) continue;

        const scheduledTime = parseTimeToDate(prayer.time, 5); // 5 min before

        notifications.push({
          id: notifId,
          title: `🕌 Waktu ${prayer.name}`,
          body: `${prayer.name} akan masuk dalam 5 menit (${prayer.time}). Bersiaplah untuk sholat.`,
          schedule: { at: scheduledTime, allowWhileIdle: true },
          channelId: 'prayer-times',
          smallIcon: 'ic_stat_icon_config_sample',
          largeIcon: 'ic_launcher',
          sound: 'beep.wav',
          autoCancel: true,
          extra: { type: 'prayer', prayer: prayer.englishName },
        });

        log(`Prayer scheduled: ${prayer.name} at ${scheduledTime.toLocaleTimeString()}`);
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        log(`✓ ${notifications.length} prayer notifications scheduled`);
      }

    } catch (error) {
      log('Error scheduling prayer notifications:', error);
    }
  }, [isNative, parseTimeToDate, log]);

  // Schedule task reminders (17:00 and 21:00)
  const scheduleTaskReminders = useCallback(async (hasUncompletedTasks: boolean = true) => {
    if (!isNative) return;

    log('Scheduling task reminders...');

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_IDS.TASK_REMINDER_17 },
          { id: NOTIFICATION_IDS.TASK_REMINDER_21 },
        ],
      });

      if (!hasUncompletedTasks) {
        log('No uncompleted tasks, skipping task reminders');
        return;
      }

      const notifications: ScheduleOptions['notifications'] = [
        {
          id: NOTIFICATION_IDS.TASK_REMINDER_17,
          title: '📋 Cek Target Hijrahmu',
          body: 'Masih ada 7 jam sebelum reset! Yuk selesaikan target harian di "Target Hijrah".',
          schedule: { 
            at: getScheduleTime(17, 0),
            every: 'day',
            allowWhileIdle: true,
          },
          channelId: 'daily-reminder',
          smallIcon: 'ic_stat_icon_config_sample',
          autoCancel: true,
          extra: { type: 'task', hour: 17 },
        },
        {
          id: NOTIFICATION_IDS.TASK_REMINDER_21,
          title: '⏰ 3 Jam Lagi Reset!',
          body: 'Jangan sampai streak terputus! Pastikan semua target "Sangat Penting" sudah selesai.',
          schedule: {
            at: getScheduleTime(21, 0),
            every: 'day',
            allowWhileIdle: true,
          },
          channelId: 'daily-reminder',
          smallIcon: 'ic_stat_icon_config_sample',
          autoCancel: true,
          extra: { type: 'task', hour: 21 },
        },
      ];

      await LocalNotifications.schedule({ notifications });
      log('✓ Task reminders scheduled (17:00, 21:00)');

    } catch (error) {
      log('Error scheduling task reminders:', error);
    }
  }, [isNative, getScheduleTime, log]);

  // Schedule reflection/muhasabah notification (21:30 or 22:00)
  const scheduleReflectionReminder = useCallback(async () => {
    if (!isNative) return;

    log('Scheduling reflection reminder...');

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_IDS.REFLECTION_NIGHT },
          { id: NOTIFICATION_IDS.TAHAJJUD_CALL },
        ],
      });

      const notifications: ScheduleOptions['notifications'] = [
        {
          id: NOTIFICATION_IDS.REFLECTION_NIGHT,
          title: '🌙 Waktu Muhasabah',
          body: 'Sudahkah kita beristighfar hari ini? Luangkan waktu untuk refleksi dan jurnal taubat.',
          schedule: {
            at: getScheduleTime(21, 30),
            every: 'day',
            allowWhileIdle: true,
          },
          channelId: 'reflection',
          smallIcon: 'ic_stat_icon_config_sample',
          autoCancel: true,
          extra: { type: 'reflection' },
        },
        {
          id: NOTIFICATION_IDS.TAHAJJUD_CALL,
          title: '✨ Panggilan Tahajjud',
          body: 'Pintu taubat terbuka lebar di sepertiga malam terakhir. Bangunlah dan bermunajat.',
          schedule: {
            at: getScheduleTime(3, 30),
            every: 'day',
            allowWhileIdle: true,
          },
          channelId: 'reflection',
          smallIcon: 'ic_stat_icon_config_sample',
          autoCancel: true,
          extra: { type: 'tahajjud' },
        },
      ];

      await LocalNotifications.schedule({ notifications });
      log('✓ Reflection reminders scheduled (21:30, 03:30)');

    } catch (error) {
      log('Error scheduling reflection reminders:', error);
    }
  }, [isNative, getScheduleTime, log]);

  // Schedule Quran reading reminder (06:00)
  const scheduleQuranReminder = useCallback(async (lastRead?: { surahName: string; ayahNumber: number } | null) => {
    if (!isNative) return;

    log('Scheduling Quran reminder...');

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: NOTIFICATION_IDS.QURAN_MORNING }],
      });

      const bodyMessage = lastRead 
        ? `Lanjutkan membaca dari ${lastRead.surahName} ayat ${lastRead.ayahNumber}. Yuk tadabbur hari ini!`
        : 'Mulai harimu dengan membaca Al-Quran. Yuk tadabbur hari ini!';

      await LocalNotifications.schedule({
        notifications: [{
          id: NOTIFICATION_IDS.QURAN_MORNING,
          title: '📖 Pengingat Al-Quran',
          body: bodyMessage,
          schedule: {
            at: getScheduleTime(6, 0),
            every: 'day',
            allowWhileIdle: true,
          },
          channelId: 'quran-reminder',
          smallIcon: 'ic_stat_icon_config_sample',
          autoCancel: true,
          extra: { type: 'quran', lastRead },
        }],
      });

      log('✓ Quran reminder scheduled (06:00)');

    } catch (error) {
      log('Error scheduling Quran reminder:', error);
    }
  }, [isNative, getScheduleTime, log]);

  // Schedule dzikir reminders (morning & evening)
  const scheduleDzikirReminders = useCallback(async () => {
    if (!isNative) return;

    log('Scheduling dzikir reminders...');

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_IDS.DZIKIR_MORNING },
          { id: NOTIFICATION_IDS.DZIKIR_EVENING },
        ],
      });

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.DZIKIR_MORNING,
            title: '🌅 Dzikir Pagi',
            body: 'Mulai harimu dengan mengingat Allah. Lindungi dirimu dengan dzikir pagi.',
            schedule: {
              at: getScheduleTime(5, 30),
              every: 'day',
              allowWhileIdle: true,
            },
            channelId: 'daily-reminder',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
            extra: { type: 'dzikir', time: 'morning' },
          },
          {
            id: NOTIFICATION_IDS.DZIKIR_EVENING,
            title: '🌆 Dzikir Petang',
            body: 'Jangan lupa dzikir petang untuk perlindungan malam harimu.',
            schedule: {
              at: getScheduleTime(16, 30),
              every: 'day',
              allowWhileIdle: true,
            },
            channelId: 'daily-reminder',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
            extra: { type: 'dzikir', time: 'evening' },
          },
        ],
      });

      log('✓ Dzikir reminders scheduled (05:30, 16:30)');

    } catch (error) {
      log('Error scheduling dzikir reminders:', error);
    }
  }, [isNative, getScheduleTime, log]);

  // Schedule streak warning (customizable time)
  const scheduleStreakWarning = useCallback(async (hour: number = 22, minute: number = 30, streakCount: number = 0) => {
    if (!isNative) return;

    log('Scheduling streak warning...');

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_IDS.STREAK_WARNING },
          { id: NOTIFICATION_IDS.STREAK_FINAL },
        ],
      });

      const streakText = streakCount > 0 ? ` Streak ${streakCount} hari akan hilang!` : '';

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.STREAK_WARNING,
            title: '🔥 Jaga Streak-mu!',
            body: `Jangan sampai streak terputus!${streakText} Selesaikan target sebelum tengah malam.`,
            schedule: {
              at: getScheduleTime(hour, minute),
              every: 'day',
              allowWhileIdle: true,
            },
            channelId: 'streak-warning',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
            extra: { type: 'streak', streakCount },
          },
          {
            id: NOTIFICATION_IDS.STREAK_FINAL,
            title: '⚠️ TERAKHIR! 30 Menit Lagi Reset',
            body: 'Ini peringatan terakhir! Segera selesaikan target atau streak akan hilang.',
            schedule: {
              at: getScheduleTime(23, 30),
              every: 'day',
              allowWhileIdle: true,
            },
            channelId: 'streak-warning',
            smallIcon: 'ic_stat_icon_config_sample',
            autoCancel: true,
            extra: { type: 'streak-final' },
          },
        ],
      });

      log(`✓ Streak warnings scheduled (${hour}:${minute}, 23:30)`);

    } catch (error) {
      log('Error scheduling streak warning:', error);
    }
  }, [isNative, getScheduleTime, log]);

  // Schedule all notifications at once
  const scheduleAllNotifications = useCallback(async (config: ScheduledNotificationsConfig = {}) => {
    if (!isNative || scheduledRef.current) return;

    log('Scheduling all notifications...', config);
    scheduledRef.current = true;

    try {
      // Schedule in parallel for speed
      await Promise.all([
        config.prayerTimes && schedulePrayerNotifications(config.prayerTimes),
        scheduleTaskReminders(config.hasUncompletedTasks ?? true),
        scheduleReflectionReminder(),
        scheduleQuranReminder(config.lastQuranRead),
        scheduleDzikirReminders(),
        scheduleStreakWarning(22, 30, config.streakCount ?? 0),
      ]);

      log('✓ All notifications scheduled successfully');
      
      // List pending for verification
      const pending = await LocalNotifications.getPending();
      log(`Total pending notifications: ${pending.notifications.length}`);
      pending.notifications.forEach(n => {
        log(`  - [${n.id}] ${n.title}`);
      });

    } catch (error) {
      log('Error scheduling all notifications:', error);
    } finally {
      scheduledRef.current = false;
    }
  }, [
    isNative,
    schedulePrayerNotifications,
    scheduleTaskReminders,
    scheduleReflectionReminder,
    scheduleQuranReminder,
    scheduleDzikirReminders,
    scheduleStreakWarning,
    log,
  ]);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        log(`Cancelled ${pending.notifications.length} notifications`);
      }
    } catch (error) {
      log('Error cancelling notifications:', error);
    }
  }, [isNative, log]);

  // Get pending notifications (for debugging)
  const getPendingNotifications = useCallback(async () => {
    if (!isNative) return [];

    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      log('Error getting pending notifications:', error);
      return [];
    }
  }, [isNative, log]);

  // Listen for notification events
  useEffect(() => {
    if (!isNative) return;

    const setupListeners = async () => {
      // Notification received
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        log('Notification received:', notification.title);
      });

      // Notification action performed (user tapped)
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        log('Notification tapped:', action.notification.title);
        // Handle deep linking based on notification type
        const extra = action.notification.extra;
        if (extra?.type) {
          log('Notification type:', extra.type);
        }
      });
    };

    setupListeners();

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [isNative, log]);

  return {
    schedulePrayerNotifications,
    scheduleTaskReminders,
    scheduleReflectionReminder,
    scheduleQuranReminder,
    scheduleDzikirReminders,
    scheduleStreakWarning,
    scheduleAllNotifications,
    cancelAllNotifications,
    getPendingNotifications,
    isNative,
    isAndroid,
  };
};
