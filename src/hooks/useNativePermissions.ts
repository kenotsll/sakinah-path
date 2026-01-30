import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface PermissionStatus {
  location: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
  gpsEnabled: boolean;
}

interface UseNativePermissionsReturn {
  permissions: PermissionStatus;
  loading: boolean;
  error: string | null;
  requestAllPermissions: () => Promise<boolean>;
  requestLocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  checkGpsStatus: () => Promise<boolean>;
  openLocationSettings: () => void;
  isNative: boolean;
}

export const useNativePermissions = (): UseNativePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    location: 'unknown',
    notifications: 'unknown',
    gpsEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Check current permission status
  const checkPermissions = useCallback(async () => {
    try {
      if (!isNative) {
        // For web, use browser APIs
        const locationPerm = await checkWebLocationPermission();
        const notifPerm = await checkWebNotificationPermission();
        
        setPermissions({
          location: locationPerm,
          notifications: notifPerm,
          gpsEnabled: true, // Assume GPS is enabled on web
        });
        return;
      }

      // Native platform - use Capacitor plugins
      const [locationStatus, notifStatus] = await Promise.all([
        Geolocation.checkPermissions(),
        LocalNotifications.checkPermissions(),
      ]);

      setPermissions({
        location: mapPermissionState(locationStatus.location),
        notifications: mapPermissionState(notifStatus.display),
        gpsEnabled: true, // Will be checked separately
      });
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError('Gagal memeriksa izin');
    } finally {
      setLoading(false);
    }
  }, [isNative]);

  // Check web location permission
  const checkWebLocationPermission = async (): Promise<PermissionStatus['location']> => {
    try {
      if (!navigator.permissions) return 'unknown';
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as PermissionStatus['location'];
    } catch {
      return 'unknown';
    }
  };

  // Check web notification permission
  const checkWebNotificationPermission = async (): Promise<PermissionStatus['notifications']> => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission as PermissionStatus['notifications'];
  };

  // Map Capacitor permission state to our format
  const mapPermissionState = (state: string): PermissionStatus['location'] => {
    switch (state) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'prompt':
      case 'prompt-with-rationale':
        return 'prompt';
      default:
        return 'unknown';
    }
  };

  // Request location permission
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!isNative) {
        // Web: Use browser geolocation API to trigger permission
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissions(prev => ({ ...prev, location: 'granted' }));
              resolve(true);
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                setPermissions(prev => ({ ...prev, location: 'denied' }));
              }
              resolve(false);
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        });
      }

      // Native: Use Capacitor Geolocation plugin
      const result = await Geolocation.requestPermissions();
      const granted = result.location === 'granted';
      
      setPermissions(prev => ({
        ...prev,
        location: granted ? 'granted' : 'denied',
      }));

      return granted;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  }, [isNative]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!isNative) {
        // Web: Use browser Notification API
        if (!('Notification' in window)) return false;
        
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        
        setPermissions(prev => ({
          ...prev,
          notifications: granted ? 'granted' : 'denied',
        }));

        return granted;
      }

      // Native: Use Capacitor LocalNotifications plugin
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';

      // Create notification channel for Android
      if (granted && Capacitor.getPlatform() === 'android') {
        await createNotificationChannels();
      }

      setPermissions(prev => ({
        ...prev,
        notifications: granted ? 'granted' : 'denied',
      }));

      return granted;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [isNative]);

  // Create Android notification channels (required for Android 8.0+)
  const createNotificationChannels = async () => {
    try {
      await LocalNotifications.createChannel({
        id: 'prayer-times',
        name: 'Waktu Sholat',
        description: 'Notifikasi pengingat waktu sholat',
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // PUBLIC
        vibration: true,
        sound: 'beep.wav',
        lights: true,
        lightColor: '#10B981',
      });

      await LocalNotifications.createChannel({
        id: 'daily-reminder',
        name: 'Pengingat Harian',
        description: 'Notifikasi pengingat target harian',
        importance: 4, // IMPORTANCE_DEFAULT
        visibility: 1,
        vibration: true,
        sound: 'default',
      });

      await LocalNotifications.createChannel({
        id: 'streak-warning',
        name: 'Peringatan Streak',
        description: 'Notifikasi peringatan sebelum streak hilang',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'default',
      });

      console.log('Notification channels created successfully');
    } catch (err) {
      console.error('Error creating notification channels:', err);
    }
  };

  // Check if GPS is enabled
  const checkGpsStatus = useCallback(async (): Promise<boolean> => {
    try {
      if (!isNative) {
        // Web: Try to get position to check if location services work
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            (error) => {
              if (error.code === error.POSITION_UNAVAILABLE) {
                resolve(false);
              } else {
                resolve(true); // Permission issue, not GPS issue
              }
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
          );
        });
      }

      // Native: Try to get current position
      try {
        await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 5000,
        });
        setPermissions(prev => ({ ...prev, gpsEnabled: true }));
        return true;
      } catch {
        setPermissions(prev => ({ ...prev, gpsEnabled: false }));
        return false;
      }
    } catch {
      return false;
    }
  }, [isNative]);

  // Open location settings (Android)
  const openLocationSettings = useCallback(() => {
    if (isNative && Capacitor.getPlatform() === 'android') {
      // On Android, we can't directly open settings from Capacitor
      // Show a message to user instead
      console.log('Please enable GPS in your device settings');
    }
  }, [isNative]);

  // Request all permissions at once
  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const [locationGranted, notificationGranted] = await Promise.all([
        requestLocationPermission(),
        requestNotificationPermission(),
      ]);

      // Check GPS status after location permission is granted
      if (locationGranted) {
        await checkGpsStatus();
      }

      return locationGranted && notificationGranted;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setError('Gagal meminta izin');
      return false;
    } finally {
      setLoading(false);
    }
  }, [requestLocationPermission, requestNotificationPermission, checkGpsStatus]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissions,
    loading,
    error,
    requestAllPermissions,
    requestLocationPermission,
    requestNotificationPermission,
    checkGpsStatus,
    openLocationSettings,
    isNative,
  };
};
