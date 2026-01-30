import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: false, // Use network location first for faster response
  timeout: 30000,
  maximumAge: 5 * 60 * 1000, // Cache location for 5 minutes
};

// Minimum distance change (in km) to trigger update
const MIN_DISTANCE_CHANGE = 0.5; // 500 meters

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
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
  });

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const newLat = position.coords.latitude;
    const newLng = position.coords.longitude;
    const now = Date.now();

    // Check if we should update (significant distance change or first update)
    const lastUpdate = lastUpdateRef.current;
    
    if (lastUpdate) {
      const distance = calculateDistance(lastUpdate.lat, lastUpdate.lng, newLat, newLng);
      const timeDiff = now - lastUpdate.time;
      
      // Only update if moved more than 500m OR more than 5 minutes passed
      if (distance < MIN_DISTANCE_CHANGE && timeDiff < 5 * 60 * 1000) {
        // Skip update - location hasn't changed significantly
        setState(prev => ({
          ...prev,
          loading: false,
        }));
        return;
      }
    }

    // Update location
    lastUpdateRef.current = { lat: newLat, lng: newLng, time: now };
    
    setState({
      latitude: newLat,
      longitude: newLng,
      accuracy: position.coords.accuracy,
      loading: false,
      error: null,
      permissionDenied: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Gagal mendapatkan lokasi';
    let permissionDenied = false;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Akses lokasi ditolak';
        permissionDenied = true;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Lokasi tidak tersedia';
        break;
      case error.TIMEOUT:
        errorMessage = 'Waktu habis saat mencari lokasi';
        break;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: errorMessage,
      permissionDenied,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Get initial position with cache
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 5 * 60 * 1000, // Accept 5 minute old cache
      }
    );
  }, [handleSuccess, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        loading: false,
      }));
      return;
    }

    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Get initial position first (faster with cache)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 5 * 60 * 1000,
      }
    );

    // Then start watching with less aggressive settings
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 2 * 60 * 1000, // Accept 2 minute old cache when watching
      }
    );
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current !== null,
  };
};
