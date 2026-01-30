import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  gpsDisabled: boolean;
}

interface UseNativeGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseNativeGeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 30000,
  maximumAge: 5 * 60 * 1000, // 5 minutes cache
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

export const useNativeGeolocation = (options: UseNativeGeolocationOptions = {}) => {
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
  const lastUpdateRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  const isNative = Capacitor.isNativePlatform();

  const handlePosition = useCallback((position: Position) => {
    const newLat = position.coords.latitude;
    const newLng = position.coords.longitude;
    const now = Date.now();

    const lastUpdate = lastUpdateRef.current;

    if (lastUpdate) {
      const distance = calculateDistance(lastUpdate.lat, lastUpdate.lng, newLat, newLng);
      const timeDiff = now - lastUpdate.time;

      // Only update if moved more than 500m OR more than 5 minutes passed
      if (distance < MIN_DISTANCE_CHANGE && timeDiff < 5 * 60 * 1000) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
    }

    lastUpdateRef.current = { lat: newLat, lng: newLng, time: now };

    setState({
      latitude: newLat,
      longitude: newLng,
      accuracy: position.coords.accuracy,
      loading: false,
      error: null,
      permissionDenied: false,
      gpsDisabled: false,
    });
  }, []);

  const handleError = useCallback((error: any) => {
    let errorMessage = 'Gagal mendapatkan lokasi';
    let permissionDenied = false;
    let gpsDisabled = false;

    // Handle both native and web errors
    const errorCode = error.code || error;
    const errorMsg = error.message || '';

    if (errorCode === 1 || errorMsg.includes('permission')) {
      errorMessage = 'Akses lokasi ditolak';
      permissionDenied = true;
    } else if (errorCode === 2 || errorMsg.includes('unavailable') || errorMsg.includes('disabled')) {
      errorMessage = 'GPS tidak aktif. Silakan nyalakan GPS di pengaturan.';
      gpsDisabled = true;
    } else if (errorCode === 3 || errorMsg.includes('timeout')) {
      errorMessage = 'Waktu habis saat mencari lokasi';
    }

    setState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage,
      permissionDenied,
      gpsDisabled,
    }));
  }, []);

  const requestLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (isNative) {
        // Native: Check permission first
        const permission = await Geolocation.checkPermissions();
        
        if (permission.location === 'denied') {
          // Request permission
          const newPermission = await Geolocation.requestPermissions();
          if (newPermission.location !== 'granted') {
            handleError({ code: 1, message: 'Permission denied' });
            return;
          }
        }

        // Get current position
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        });
        
        handlePosition(position);
      } else {
        // Web: Use browser geolocation
        navigator.geolocation.getCurrentPosition(
          (pos) => handlePosition({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            },
            timestamp: pos.timestamp,
          }),
          handleError,
          {
            enableHighAccuracy: mergedOptions.enableHighAccuracy,
            timeout: mergedOptions.timeout,
            maximumAge: mergedOptions.maximumAge,
          }
        );
      }
    } catch (err) {
      handleError(err);
    }
  }, [isNative, mergedOptions, handlePosition, handleError]);

  const startWatching = useCallback(async () => {
    if (watchIdRef.current) {
      return; // Already watching
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (isNative) {
        // Request initial position first
        await requestLocation();

        // Start watching
        watchIdRef.current = await Geolocation.watchPosition(
          {
            enableHighAccuracy: false,
            timeout: 60000,
            maximumAge: 2 * 60 * 1000,
          },
          (position, err) => {
            if (err) {
              handleError(err);
            } else if (position) {
              handlePosition(position);
            }
          }
        );
      } else {
        // Web: Use browser geolocation watch
        await requestLocation();

        const id = navigator.geolocation.watchPosition(
          (pos) => handlePosition({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            },
            timestamp: pos.timestamp,
          }),
          handleError,
          {
            enableHighAccuracy: false,
            timeout: 60000,
            maximumAge: 2 * 60 * 1000,
          }
        );
        watchIdRef.current = String(id);
      }
    } catch (err) {
      handleError(err);
    }
  }, [isNative, requestLocation, handlePosition, handleError]);

  const stopWatching = useCallback(async () => {
    if (watchIdRef.current) {
      if (isNative) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      } else {
        navigator.geolocation.clearWatch(Number(watchIdRef.current));
      }
      watchIdRef.current = null;
    }
  }, [isNative]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        if (isNative) {
          Geolocation.clearWatch({ id: watchIdRef.current });
        } else {
          navigator.geolocation.clearWatch(Number(watchIdRef.current));
        }
      }
    };
  }, [isNative]);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current !== null,
    isNative,
  };
};
