import { useState, useCallback } from 'react';
import { z } from 'zod';

// Overpass API response validation
const osmNodeSchema = z.object({
  type: z.literal('node'),
  id: z.number(),
  lat: z.number(),
  lon: z.number(),
  tags: z.object({
    name: z.string().optional(),
    amenity: z.string().optional(),
    'addr:street': z.string().optional(),
    'addr:city': z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
  }).passthrough().optional(),
});

const overpassResponseSchema = z.object({
  elements: z.array(osmNodeSchema.or(z.object({}).passthrough())),
});

export interface Mosque {
  id: string;
  name: string;
  type: 'masjid' | 'musholla';
  address: string;
  distance: string;
  distanceKm: number;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useMosqueSearch = () => {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNearbyMosques = useCallback(async (
    latitude: number, 
    longitude: number,
    radiusKm: number = 5
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Overpass API query for mosques and prayer rooms
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusKm * 1000},${latitude},${longitude});
          node["building"="mosque"](around:${radiusKm * 1000},${latitude},${longitude});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusKm * 1000},${latitude},${longitude});
          way["building"="mosque"](around:${radiusKm * 1000},${latitude},${longitude});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data masjid');
      }

      const data = await response.json();
      
      // Basic validation
      const elements = data.elements || [];
      
      const parsedMosques: Mosque[] = elements
        .filter((el: any) => el.lat && el.lon)
        .map((el: any) => {
          const lat = el.lat || el.center?.lat;
          const lng = el.lon || el.center?.lon;
          const dist = calculateDistance(latitude, longitude, lat, lng);
          const name = el.tags?.name || el.tags?.['name:id'] || 'Masjid/Musholla';
          const isMusholla = name.toLowerCase().includes('mushol') || 
                            name.toLowerCase().includes('mushal') ||
                            name.toLowerCase().includes('langgar') ||
                            name.toLowerCase().includes('surau');
          
          return {
            id: el.id.toString(),
            name: name,
            type: isMusholla ? 'musholla' : 'masjid',
            address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || 'Alamat tidak tersedia',
            distance: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
            distanceKm: dist,
            lat,
            lng,
            phone: el.tags?.phone,
            website: el.tags?.website,
          } as Mosque;
        })
        .sort((a: Mosque, b: Mosque) => a.distanceKm - b.distanceKm)
        .slice(0, 20); // Limit to 20 results

      setMosques(parsedMosques);
      
      if (parsedMosques.length === 0) {
        setError('Tidak ditemukan masjid dalam radius 5km');
      }
      
      return parsedMosques;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mencari masjid terdekat';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mosques,
    loading,
    error,
    searchNearbyMosques,
    clearMosques: () => setMosques([]),
  };
};
