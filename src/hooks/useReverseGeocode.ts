import { useState, useCallback } from 'react';

interface GeocodedAddress {
  street: string;
  city: string;
  district: string;
  province: string;
  country: string;
  fullAddress: string;
}

export function useReverseGeocode() {
  const [address, setAddress] = useState<GeocodedAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);

    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id',
            'User-Agent': 'SakinahPathApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get address');
      }

      const data = await response.json();
      const addr = data.address || {};

      const geocodedAddress: GeocodedAddress = {
        street: addr.road || addr.pedestrian || addr.footway || '',
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        district: addr.suburb || addr.city_district || addr.district || '',
        province: addr.state || addr.province || '',
        country: addr.country || '',
        fullAddress: data.display_name || '',
      };

      setAddress(geocodedAddress);
      return geocodedAddress;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mendapatkan alamat';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    address,
    loading,
    error,
    reverseGeocode,
    clearAddress: () => setAddress(null),
  };
}
