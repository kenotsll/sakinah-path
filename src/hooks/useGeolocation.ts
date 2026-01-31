import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  gpsDisabled: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 30000,
  maximumAge: 5 * 60 * 1000,
};

// Minimum distance change (in km) to trigger update
const MIN_DISTANCE_CHANGE = 0.5; // 500 meters

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionDenied: false,
    gpsDisabled: false,
  });

  const watchIdRef = useRef<string | null>(null);
  const webWatchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  const isNative = Capacitor.isNativePlatform();

  // Handle successful position update
  const handlePositionUpdate = useCallback((latitude: number, longitude: number, accuracy: number) => {
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current;
    
    if (lastUpdate) {
      const distance = calculateDistance(lastUpdate.lat, lastUpdate.lng, latitude, longitude);
      const timeDiff = now - lastUpdate.time;
      
      // Only update if moved more than 500m OR more than 5 minutes passed
      if (distance < MIN_DISTANCE_CHANGE && timeDiff < 5 * 60 * 1000) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
    }

    lastUpdateRef.current = { lat: latitude, lng: longitude, time: now };
    
    setState({
      latitude,
      longitude,
      accuracy,
      loading: false,
      error: null,
      permissionDenied: false,
      gpsDisabled: false,
    });
  }, []);

  // Native location request
  const requestNativeLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First check permissions
      const permStatus = await Geolocation.checkPermissions();
      
      if (permStatus.location === 'denied') {
        // Request permissions
        const reqResult = await Geolocation.requestPermissions();
        if (reqResult.location === 'denied') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Akses lokasi ditolak',
            permissionDenied: true,
          }));
          return;
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
      });

      handlePositionUpdate(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy
      );
    } catch (error: any) {
      console.error('Native geolocation error:', error);
      
      let errorMessage = 'Gagal mendapatkan lokasi';
      let gpsDisabled = false;
      let permissionDenied = false;

      if (error?.message?.includes('denied') || error?.code === 1) {
        errorMessage = 'Akses lokasi ditolak';
        permissionDenied = true;
      } else if (error?.message?.includes('disabled') || error?.message?.includes('unavailable')) {
        errorMessage = 'GPS tidak aktif. Nyalakan GPS di pengaturan.';
        gpsDisabled = true;
      } else if (error?.code === 3) {
        errorMessage = 'Waktu habis saat mencari lokasi';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionDenied,
        gpsDisabled,
      }));
    }
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, handlePositionUpdate]);

  // Web location handlers
  const handleWebSuccess = useCallback((position: GeolocationPosition) => {
    handlePositionUpdate(
      position.coords.latitude,
      position.coords.longitude,
      position.coords.accuracy
    );
  }, [handlePositionUpdate]);

  const handleWebError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Gagal mendapatkan lokasi';
    let permissionDenied = false;
    let gpsDisabled = false;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Akses lokasi ditolak';
        permissionDenied = true;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Lokasi tidak tersedia';
        gpsDisabled = true;
        break;
      case error.TIMEOUT:
        errorMessage = 'Waktu habis saat mencari lokasi';
        break;
    }

    setState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage,
      permissionDenied,
      gpsDisabled,
    }));
  }, []);

  // Request location (works for both native and web)
  const requestLocation = useCallback(() => {
    if (isNative) {
      requestNativeLocation();
      return;
    }

    // Web fallback
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      handleWebSuccess,
      handleWebError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [isNative, requestNativeLocation, handleWebSuccess, handleWebError, mergedOptions]);

  // Start watching location
  const startWatching = useCallback(async () => {
    if (isNative) {
      // Stop any existing watch
      if (watchIdRef.current) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Check/request permissions first
        const permStatus = await Geolocation.checkPermissions();
        
        if (permStatus.location === 'denied') {
          const reqResult = await Geolocation.requestPermissions();
          if (reqResult.location === 'denied') {
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Akses lokasi ditolak',
              permissionDenied: true,
            }));
            return;
          }
        }

        // Get initial position
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 30000,
        });

        handlePositionUpdate(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy
        );

        // Start watching
        watchIdRef.current = await Geolocation.watchPosition(
          { enableHighAccuracy: false },
          (position, err) => {
            if (err) {
              console.error('Watch position error:', err);
              return;
            }
            if (position) {
              handlePositionUpdate(
                position.coords.latitude,
                position.coords.longitude,
                position.coords.accuracy
              );
            }
          }
        );
      } catch (error: any) {
        console.error('Error starting native watch:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Gagal memulai pelacakan lokasi',
        }));
      }
      return;
    }

    // Web fallback
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        loading: false,
      }));
      return;
    }

    // Clear existing web watch
    if (webWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(webWatchIdRef.current);
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleWebSuccess,
      handleWebError,
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 5 * 60 * 1000,
      }
    );

    // Start watching
    webWatchIdRef.current = navigator.geolocation.watchPosition(
      handleWebSuccess,
      handleWebError,
      {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 2 * 60 * 1000,
      }
    );
  }, [isNative, handlePositionUpdate, handleWebSuccess, handleWebError]);

  // Stop watching
  const stopWatching = useCallback(async () => {
    if (isNative && watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    
    if (webWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(webWatchIdRef.current);
      webWatchIdRef.current = null;
    }
  }, [isNative]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      if (webWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(webWatchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current !== null || webWatchIdRef.current !== null,
  };
};
