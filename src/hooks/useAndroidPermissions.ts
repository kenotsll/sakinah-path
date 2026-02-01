/**
 * Android Permission Handler - Aggressive Permission Request
 * This hook ensures Android system dialog appears for location/notification permissions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications, Channel } from '@capacitor/local-notifications';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { toast } from 'sonner';

export interface AndroidPermissionState {
  location: 'granted' | 'denied' | 'prompt' | 'checking';
  notifications: 'granted' | 'denied' | 'prompt' | 'checking';
  gpsEnabled: boolean;
  isNative: boolean;
  isAndroid: boolean;
  hasChecked: boolean;
}

interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useAndroidPermissions = () => {
  const [state, setState] = useState<AndroidPermissionState>({
    location: 'checking',
    notifications: 'checking',
    gpsEnabled: false,
    isNative: Capacitor.isNativePlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    hasChecked: false,
  });

  const [lastLocation, setLastLocation] = useState<LocationResult | null>(null);
  const permissionCheckRef = useRef(false);
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';

  // Log for debugging
  const log = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[AndroidPermissions ${timestamp}] ${message}`, data || '');
  }, []);

  // Check current permission status
  const checkPermissions = useCallback(async () => {
    if (permissionCheckRef.current) return;
    permissionCheckRef.current = true;

    log('Checking permissions...', { isNative, isAndroid });

    try {
      if (!isNative) {
        // Web fallback
        const locationPerm = navigator.permissions 
          ? await navigator.permissions.query({ name: 'geolocation' }).then(r => r.state)
          : 'prompt';
        const notifPerm = 'Notification' in window ? Notification.permission : 'denied';
        
        setState(prev => ({
          ...prev,
          location: locationPerm as any,
          notifications: notifPerm as any,
          hasChecked: true,
        }));
        return;
      }

      // Native: Check permissions with Capacitor
      const [locationStatus, notifStatus] = await Promise.all([
        Geolocation.checkPermissions(),
        LocalNotifications.checkPermissions(),
      ]);

      log('Permission status:', { location: locationStatus.location, notifications: notifStatus.display });

      setState(prev => ({
        ...prev,
        location: mapCapacitorPermission(locationStatus.location),
        notifications: mapCapacitorPermission(notifStatus.display),
        hasChecked: true,
      }));

    } catch (err) {
      log('Error checking permissions:', err);
      setState(prev => ({ ...prev, hasChecked: true }));
    } finally {
      permissionCheckRef.current = false;
    }
  }, [isNative, isAndroid, log]);

  // Map Capacitor permission to our format
  const mapCapacitorPermission = (status: string): 'granted' | 'denied' | 'prompt' => {
    switch (status) {
      case 'granted': return 'granted';
      case 'denied': return 'denied';
      default: return 'prompt'; // 'prompt', 'prompt-with-rationale', etc.
    }
  };

  // Request location permission - AGGRESSIVE approach
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    log('Requesting location permission...');

    if (!isNative) {
      // Web: Use getCurrentPosition to trigger browser permission
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLastLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            setState(prev => ({ ...prev, location: 'granted', gpsEnabled: true }));
            log('Web location granted');
            resolve(true);
          },
          (error) => {
            log('Web location error:', error.message);
            setState(prev => ({ 
              ...prev, 
              location: error.code === 1 ? 'denied' : 'prompt',
              gpsEnabled: error.code !== 2,
            }));
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });
    }

    try {
      // Step 1: Check current status
      const currentStatus = await Geolocation.checkPermissions();
      log('Current location status:', currentStatus.location);

      // Step 2: If not granted, request permission (this shows Android dialog)
      if (currentStatus.location !== 'granted') {
        log('Requesting permission dialog...');
        const reqResult = await Geolocation.requestPermissions();
        log('Permission request result:', reqResult.location);

        if (reqResult.location !== 'granted') {
          setState(prev => ({ ...prev, location: 'denied' }));
          return false;
        }
      }

      // Step 3: Try to get actual location (this verifies GPS is working)
      log('Getting current position...');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
      });

      setLastLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      setState(prev => ({ ...prev, location: 'granted', gpsEnabled: true }));
      log('Location obtained:', { lat: position.coords.latitude, lng: position.coords.longitude });

      toast.success('Lokasi berhasil diaktifkan! 📍', {
        description: `Akurasi: ${Math.round(position.coords.accuracy)}m`,
      });

      return true;

    } catch (error: any) {
      log('Location error:', error);
      
      const errorMsg = error?.message || '';
      const isGpsDisabled = errorMsg.includes('disabled') || errorMsg.includes('unavailable');
      const isPermDenied = errorMsg.includes('denied') || error?.code === 1;

      setState(prev => ({
        ...prev,
        location: isPermDenied ? 'denied' : prev.location,
        gpsEnabled: !isGpsDisabled,
      }));

      if (isGpsDisabled) {
        toast.error('GPS Tidak Aktif', {
          description: 'Nyalakan GPS di pengaturan perangkat',
          action: {
            label: 'Pengaturan',
            onClick: () => openLocationSettings(),
          },
        });
      }

      return false;
    }
  }, [isNative, log]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    log('Requesting notification permission...');

    if (!isNative) {
      if (!('Notification' in window)) return false;
      const result = await Notification.requestPermission();
      setState(prev => ({ ...prev, notifications: result as any }));
      return result === 'granted';
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      
      log('Notification permission result:', result.display);
      setState(prev => ({ ...prev, notifications: granted ? 'granted' : 'denied' }));

      if (granted && isAndroid) {
        await createNotificationChannels();
        
        // Send test notification
        await LocalNotifications.schedule({
          notifications: [{
            id: 99999,
            title: '✓ Notifikasi Aktif',
            body: 'Pengingat sholat dan ibadah sudah diaktifkan!',
            schedule: { at: new Date(Date.now() + 2000) },
            channelId: 'daily-reminder',
            smallIcon: 'ic_stat_icon_config_sample',
          }],
        });

        toast.success('Notifikasi diaktifkan! 🔔');
      }

      return granted;
    } catch (error) {
      log('Notification permission error:', error);
      return false;
    }
  }, [isNative, isAndroid, log]);

  // Create Android notification channels
  const createNotificationChannels = async () => {
    if (!isAndroid) return;

    log('Creating notification channels...');

    const channels: Channel[] = [
      {
        id: 'prayer-times',
        name: 'Jadwal Sholat',
        description: 'Notifikasi waktu sholat (Adzan)',
        importance: 5 as const, // HIGH - makes sound and shows heads-up
        visibility: 1 as const, // PUBLIC
        vibration: true,
        sound: 'beep.wav',
        lights: true,
        lightColor: '#10B981',
      },
      {
        id: 'daily-reminder',
        name: 'Pengingat Ibadah',
        description: 'Pengingat tugas harian, dzikir, dan refleksi',
        importance: 4 as const, // DEFAULT
        visibility: 1 as const,
        vibration: true,
        sound: 'default',
      },
      {
        id: 'quran-reminder',
        name: 'Pengingat Al-Quran',
        description: 'Pengingat untuk melanjutkan bacaan Al-Quran',
        importance: 4 as const,
        visibility: 1 as const,
        vibration: true,
      },
      {
        id: 'streak-warning',
        name: 'Peringatan Streak',
        description: 'Peringatan sebelum streak hilang',
        importance: 5 as const,
        visibility: 1 as const,
        vibration: true,
      },
      {
        id: 'reflection',
        name: 'Refleksi Malam',
        description: 'Pengingat muhasabah dan taubat',
        importance: 3 as const, // LOW - no sound
        visibility: 0 as const, // PRIVATE
      },
    ];

    try {
      const existing = await LocalNotifications.listChannels();
      
      for (const channel of channels) {
        if (!existing.channels.find(c => c.id === channel.id)) {
          await LocalNotifications.createChannel(channel);
          log(`Channel created: ${channel.id}`);
        }
      }

      log('All notification channels ready');
    } catch (error) {
      log('Error creating channels:', error);
    }
  };

  // Request all permissions at once
  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    log('Requesting all permissions...');

    // Request in sequence for better UX (one dialog at a time)
    const locationGranted = await requestLocationPermission();
    
    // Small delay between permission requests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const notificationGranted = await requestNotificationPermission();

    return locationGranted && notificationGranted;
  }, [requestLocationPermission, requestNotificationPermission, log]);

  // Open app settings (for when permission is permanently denied)
  const openAppSettings = useCallback(() => {
    if (!isNative) return;

    log('Opening app settings...');

    if (isAndroid) {
      NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails })
        .catch(e => log('Failed to open Android settings:', e));
    } else {
      NativeSettings.openIOS({ option: IOSSettings.App })
        .catch(e => log('Failed to open iOS settings:', e));
    }
  }, [isNative, isAndroid, log]);

  // Open location settings (for GPS toggle)
  const openLocationSettings = useCallback(() => {
    if (!isNative) return;

    log('Opening location settings...');

    if (isAndroid) {
      NativeSettings.openAndroid({ option: AndroidSettings.Location })
        .catch(e => {
          log('Location settings failed, trying app settings:', e);
          NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
        });
    } else {
      NativeSettings.openIOS({ option: IOSSettings.App });
    }
  }, [isNative, isAndroid, log]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Re-check when app resumes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        permissionCheckRef.current = false;
        checkPermissions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkPermissions]);

  return {
    ...state,
    lastLocation,
    requestLocationPermission,
    requestNotificationPermission,
    requestAllPermissions,
    openAppSettings,
    openLocationSettings,
    checkPermissions,
  };
};
