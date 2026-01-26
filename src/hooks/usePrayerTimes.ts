import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

// Zod schema for validating prayer time format (HH:MM or HH:MM (TZ))
const timeSchema = z.string().regex(/^\d{2}:\d{2}(\s*\([A-Z]+\))?$/, "Invalid time format");

// Schema for validating the prayer times object from API
const prayerTimesSchema = z.object({
  Fajr: timeSchema,
  Sunrise: timeSchema,
  Dhuhr: timeSchema,
  Asr: timeSchema,
  Maghrib: timeSchema,
  Isha: timeSchema,
});

// Schema for API response validation
const apiResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    timings: prayerTimesSchema,
    meta: z.object({
      timezone: z.string().optional(),
    }).optional(),
  }),
});

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerTimesData {
  times: PrayerTimes | null;
  nextPrayer: { name: string; time: string; remaining: string } | null;
  location: { city: string; country: string } | null;
  coords: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const PRAYER_NAMES: Record<string, string> = {
  Fajr: "Subuh",
  Sunrise: "Syuruq",
  Dhuhr: "Dzuhur",
  Asr: "Ashar",
  Maghrib: "Maghrib",
  Isha: "Isya",
};

// Helper to extract clean time (remove timezone suffix like "(WIB)")
const cleanTime = (time: string): string => time.replace(/\s*\([A-Z]+\)$/, '');

export const usePrayerTimes = (): PrayerTimesData => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchPrayerTimes = useCallback(async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      // Fetch prayer times from Aladhan API
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=20`
      );
      
      if (!response.ok) throw new Error("Gagal mengambil jadwal shalat");

      const data = await response.json();
      
      // Validate API response with Zod schema
      const validationResult = apiResponseSchema.safeParse(data);
      
      if (!validationResult.success) {
        throw new Error("Data jadwal shalat tidak valid");
      }

      const validatedData = validationResult.data;
      
      if (validatedData.code === 200) {
        const timings = validatedData.data.timings;
        
        // Clean time values and set state
        setTimes({
          Fajr: cleanTime(timings.Fajr),
          Sunrise: cleanTime(timings.Sunrise),
          Dhuhr: cleanTime(timings.Dhuhr),
          Asr: cleanTime(timings.Asr),
          Maghrib: cleanTime(timings.Maghrib),
          Isha: cleanTime(timings.Isha),
        });

        // Get location name from meta
        if (validatedData.data.meta?.timezone) {
          const timezone = validatedData.data.meta.timezone;
          const city = timezone.split("/").pop()?.replace(/_/g, " ") || "Unknown";
          setLocation({ city, country: "Indonesia" });
        }
      } else {
        throw new Error("API mengembalikan kode error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolokasi tidak didukung browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        fetchPrayerTimes(latitude, longitude);
      },
      (err) => {
        // Use default Jakarta coordinates if location denied
        const defaultCoords = { lat: -6.2088, lng: 106.8456 };
        setCoords(defaultCoords);
        setLocation({ city: "Jakarta", country: "Indonesia" });
        fetchPrayerTimes(defaultCoords.lat, defaultCoords.lng);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchPrayerTimes]);

  const calculateNextPrayer = useCallback(() => {
    if (!times) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    
    for (const prayer of prayerOrder) {
      const [hours, minutes] = times[prayer as keyof PrayerTimes].split(":").map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentTime) {
        const remaining = prayerMinutes - currentTime;
        const hoursRemaining = Math.floor(remaining / 60);
        const minutesRemaining = remaining % 60;

        return {
          name: PRAYER_NAMES[prayer] || prayer,
          time: times[prayer as keyof PrayerTimes],
          remaining: hoursRemaining > 0 
            ? `${hoursRemaining}j ${minutesRemaining}m lagi`
            : `${minutesRemaining} menit lagi`,
        };
      }
    }

    // If all prayers passed, next is Fajr tomorrow
    return {
      name: PRAYER_NAMES.Fajr,
      time: times.Fajr,
      remaining: "Besok",
    };
  }, [times]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Watch for location changes
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // If we don't have coords yet, set them and fetch.
        if (!coords) {
          setCoords({ lat: latitude, lng: longitude });
          fetchPrayerTimes(latitude, longitude);
          return;
        }

        // Only refetch if moved more than 1km
        const distance = calculateDistance(
          coords.lat,
          coords.lng,
          latitude,
          longitude
        );

        if (distance > 1) {
          setCoords({ lat: latitude, lng: longitude });
          fetchPrayerTimes(latitude, longitude);
        }
      },
      (err) => {
        // Keep silent (browser may spam errors). We'll rely on initial getCurrentPosition fallback.
        // Still record for UI debugging.
        setError(err?.message || "Gagal memantau lokasi");
      },
      { enableHighAccuracy: true, maximumAge: 60000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [coords, fetchPrayerTimes]);

  return {
    times,
    nextPrayer: calculateNextPrayer(),
    location,
    coords,
    loading,
    error,
    refetch: getLocation,
  };
};

// Calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
