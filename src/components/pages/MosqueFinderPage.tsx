import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, BookOpen, Phone, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

const nearbyMosques = [
  {
    id: "1",
    name: "Masjid Al-Ikhlas",
    address: "Jl. Kebon Jeruk No. 15",
    distance: "0.5 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC"],
    hasKajian: true,
    kajianTime: "Ba'da Maghrib",
    phone: "+6221-1234567",
    lat: -6.2088,
    lng: 106.8456,
  },
  {
    id: "2",
    name: "Masjid Raya Al-Hidayah",
    address: "Jl. Sudirman No. 88",
    distance: "1.2 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC", "Mushola Wanita"],
    hasKajian: true,
    kajianTime: "Setiap Ahad, 08:00",
    phone: "+6221-2345678",
    lat: -6.2188,
    lng: 106.8556,
  },
  {
    id: "3",
    name: "Masjid Nurul Iman",
    address: "Jl. Melati No. 42",
    distance: "1.8 km",
    nextPrayer: "Dzuhur - 12:10",
    facilities: ["Wudhu", "Parkir"],
    hasKajian: false,
    phone: "+6221-3456789",
    lat: -6.2288,
    lng: 106.8656,
  },
  {
    id: "4",
    name: "Masjid Baitul Rahman",
    address: "Jl. Anggrek No. 7",
    distance: "2.3 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC", "TPA"],
    hasKajian: true,
    kajianTime: "Ba'da Isya",
    phone: "+6221-4567890",
    lat: -6.2388,
    lng: 106.8756,
  },
];

export const MosqueFinderPage = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const { times, nextPrayer, coords, loading: prayerLoading, error: prayerError, refetch: refetchPrayer } = usePrayerTimes();

  const [sortedMosques, setSortedMosques] = useState(nearbyMosques);

  useEffect(() => {
    if (!coords) return;
    setLocation({ latitude: coords.lat, longitude: coords.lng, address: "Lokasi Anda Saat Ini" });
    setLocationError(null);
    setIsLoadingLocation(false);

    // Recompute distance + sort (simple client-side approximation).
    const next = [...nearbyMosques]
      .map((m) => ({
        ...m,
        _distanceKm: calculateDistance(coords.lat, coords.lng, m.lat, m.lng),
      }))
      .sort((a, b) => (a._distanceKm ?? 0) - (b._distanceKm ?? 0))
      .map((m) => ({
        ...m,
        distance: `${(m._distanceKm ?? 0).toFixed(1)} km`,
      }));

    setSortedMosques(next as any);
  }, [coords]);

  const requestLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser Anda");
      setIsLoadingLocation(false);
      return;
    }

    // Trigger hook's location refresh; UI here will update once coords changes.
    refetchPrayer();
  };

  const openGoogleMapsRoute = (mosque: typeof nearbyMosques[0]) => {
    let url: string;
    
    if (location) {
      // Use Google Maps Directions API format with origin and destination
      url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${mosque.lat},${mosque.lng}&travelmode=driving`;
    } else {
      // Just open the destination with directions mode
      url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}&travelmode=driving`;
    }
    
    window.open(url, "_blank");
  };

  const openGoogleMapsSearch = () => {
    let url: string;
    
    if (location) {
      url = `https://www.google.com/maps/search/masjid/@${location.latitude},${location.longitude},15z`;
    } else {
      url = `https://www.google.com/maps/search/masjid+terdekat`;
    }
    
    window.open(url, "_blank");
  };

  const callMosque = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Cari Masjid</h1>
        <p className="text-sm text-muted-foreground">Temukan masjid terdekat dari lokasimu</p>
      </motion.div>

      {/* Location Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-4"
      >
        <Card variant="spiritual">
          <CardContent className="p-4">
            {!location && !locationError ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Izinkan Akses Lokasi</p>
                  <p className="text-xs text-muted-foreground">
                    Kami membutuhkan lokasi untuk menemukan masjid terdekat
                  </p>
                </div>
                <Button 
                  variant="spiritual" 
                  size="sm" 
                  onClick={requestLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Izinkan"
                  )}
                </Button>
              </div>
            ) : locationError ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Lokasi Tidak Tersedia</p>
                  <p className="text-xs text-muted-foreground">{locationError}</p>
                </div>
                <Button variant="outline" size="sm" onClick={requestLocation}>
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Lokasimu saat ini</p>
                  <p className="text-sm font-medium text-foreground">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={requestLocation}>
                  Perbarui
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Prayer Times */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Jadwal Shalat Hari Ini</span>
            </div>
            <div className="flex justify-between">
              {prayerLoading && (
                <p className="text-xs text-muted-foreground">Memuat jadwal shalat...</p>
              )}

              {!prayerLoading && (prayerError || !times) && (
                <p className="text-xs text-muted-foreground">
                  {prayerError || "Jadwal shalat belum tersedia"}
                </p>
              )}

              {!prayerLoading && times && (
                <>
                  {([
                    { key: "Fajr", label: "Subuh" },
                    { key: "Dhuhr", label: "Dzuhur" },
                    { key: "Asr", label: "Ashar" },
                    { key: "Maghrib", label: "Maghrib" },
                    { key: "Isha", label: "Isya" },
                  ] as const).map(({ key, label }) => {
                    const isNext = nextPrayer?.name === label;
                    return (
                      <div
                        key={key}
                        className={`text-center ${isNext ? "text-primary" : "text-muted-foreground"}`}
                      >
                        <p className="text-xs font-medium mb-1">{label}</p>
                        <p className={`text-sm font-semibold ${isNext ? "text-primary" : "text-foreground"}`}>
                          {times[key]}
                        </p>
                        {isNext && (
                          <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded-full mt-1 inline-block">
                            Berikutnya
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Nearby Mosques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">Masjid Terdekat</h2>
        <div className="space-y-3">
          {sortedMosques.map((mosque: any, index) => (
            <motion.div
              key={mosque.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card variant="default" className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{mosque.name}</h3>
                      <p className="text-xs text-muted-foreground">{mosque.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-primary">{mosque.distance}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{mosque.nextPrayer}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mosque.facilities.map((facility) => (
                      <span key={facility} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {facility}
                      </span>
                    ))}
                    {mosque.hasKajian && (
                      <span className="text-[10px] bg-accent-soft text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        Kajian {mosque.kajianTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="spiritual" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openGoogleMapsRoute(mosque)}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Rute
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => callMosque(mosque.phone)}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mosque.lat},${mosque.lng}`, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Map Placeholder - Open in Google Maps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-5 mt-6"
      >
        <Card variant="elevated" className="overflow-hidden">
          <div className="h-40 bg-secondary flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Lihat Semua Masjid di Peta</p>
              <Button 
                variant="spiritual" 
                size="sm"
                onClick={openGoogleMapsSearch}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Buka Google Maps
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

// Calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}