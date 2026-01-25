import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, BookOpen, Phone, ExternalLink, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Mosque {
  id: string;
  name: string;
  type: "masjid" | "musholla";
  address: string;
  distance: string;
  nextPrayer: string;
  facilities: string[];
  hasKajian: boolean;
  kajianTime?: string;
  phone: string;
  lat: number;
  lng: number;
}

// Demo data - includes both masjid and musholla
const nearbyMosques: Mosque[] = [
  {
    id: "1",
    name: "Masjid Al-Ikhlas",
    type: "masjid",
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
    name: "Musholla Ar-Rahman",
    type: "musholla",
    address: "Jl. Thamrin No. 45",
    distance: "0.8 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu"],
    hasKajian: false,
    phone: "+6221-2345678",
    lat: -6.1954,
    lng: 106.8234,
  },
  {
    id: "3",
    name: "Masjid Raya Al-Hidayah",
    type: "masjid",
    address: "Jl. Sudirman No. 88",
    distance: "1.2 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC", "Mushola Wanita"],
    hasKajian: true,
    kajianTime: "Setiap Ahad, 08:00",
    phone: "+6221-3456789",
    lat: -6.2188,
    lng: 106.8556,
  },
  {
    id: "4",
    name: "Musholla Baitul Makmur",
    type: "musholla",
    address: "Jl. Melati No. 42",
    distance: "1.5 km",
    nextPrayer: "Dzuhur - 12:10",
    facilities: ["Wudhu"],
    hasKajian: false,
    phone: "+6221-4567890",
    lat: -6.2288,
    lng: 106.8656,
  },
  {
    id: "5",
    name: "Masjid Nurul Iman",
    type: "masjid",
    address: "Jl. Anggrek No. 7",
    distance: "1.8 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir"],
    hasKajian: false,
    phone: "+6221-5678901",
    lat: -6.2388,
    lng: 106.8756,
  },
  {
    id: "6",
    name: "Musholla An-Nur",
    type: "musholla",
    address: "Jl. Menteng Raya No. 56",
    distance: "2.0 km",
    nextPrayer: "Dzuhur - 12:10",
    facilities: ["Wudhu", "AC"],
    hasKajian: true,
    kajianTime: "Ba'da Ashar",
    phone: "+6221-6789012",
    lat: -6.1920,
    lng: 106.8410,
  },
  {
    id: "7",
    name: "Masjid Baitul Rahman",
    type: "masjid",
    address: "Jl. Cempaka No. 12",
    distance: "2.3 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC", "TPA"],
    hasKajian: true,
    kajianTime: "Ba'da Isya",
    phone: "+6221-7890123",
    lat: -6.2488,
    lng: 106.8856,
  },
];

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

export const MosqueFinderPage = () => {
  const { t } = useLanguage();
  const { times, nextPrayer, location: prayerLocation } = usePrayerTimes();
  const { 
    latitude, 
    longitude, 
    loading: geoLoading, 
    error: geoError, 
    permissionDenied,
    startWatching,
    stopWatching,
    requestLocation 
  } = useGeolocation();

  // Start watching on mount
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  // Sort mosques by distance when coordinates change
  const sortedMosques = useMemo(() => {
    if (!latitude || !longitude) return [];
    
    return [...nearbyMosques]
      .map((mosque) => ({
        ...mosque,
        _distanceKm: calculateDistance(latitude, longitude, mosque.lat, mosque.lng),
        distance: `${calculateDistance(latitude, longitude, mosque.lat, mosque.lng).toFixed(1)} km`,
      }))
      .sort((a, b) => a._distanceKm - b._distanceKm);
  }, [latitude, longitude]);

  const hasLocation = latitude !== null && longitude !== null;

  const openGoogleMapsRoute = (mosque: Mosque) => {
    let url: string;
    
    if (hasLocation) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${mosque.lat},${mosque.lng}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}&travelmode=driving`;
    }
    
    window.open(url, "_blank");
  };

  const openGoogleMapsSearch = () => {
    let url: string;
    
    if (hasLocation) {
      url = `https://www.google.com/maps/search/masjid+musholla/@${latitude},${longitude},15z`;
    } else {
      url = `https://www.google.com/maps/search/masjid+musholla+terdekat`;
    }
    
    window.open(url, "_blank");
  };

  const callMosque = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleEnableLocation = () => {
    startWatching();
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{t('mosque.title')}</h1>
            {prayerLocation && (
              <p className="text-sm text-muted-foreground">📍 {prayerLocation.city}</p>
            )}
          </div>
          {hasLocation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={requestLocation}
              disabled={geoLoading}
            >
              <RefreshCw className={`h-5 w-5 ${geoLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Location Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-4"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            {geoLoading && !hasLocation ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('common.loading')}</p>
                  <p className="text-xs text-muted-foreground">Mencari lokasi dengan akurasi tinggi...</p>
                </div>
              </div>
            ) : !hasLocation ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('mosque.notAvailable')}</p>
                  <p className="text-xs text-muted-foreground">
                    {permissionDenied ? geoError : t('mosque.enableLocationDesc')}
                  </p>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleEnableLocation}
                  className="gradient-hero text-primary-foreground"
                >
                  {t('mosque.enableLocation')}
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
                    {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">🔄 Auto-update</span>
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
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{t('home.prayerTimes')}</span>
            </div>
            <div className="flex justify-between">
              {times ? (
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
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full mt-1 inline-block">
                            {t('home.nextPrayer')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
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
        <h2 className="text-sm font-semibold text-foreground mb-3">{t('mosque.title')}</h2>
        
        {/* Show message if location not available */}
        {!hasLocation && !geoLoading && (
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-6 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-foreground mb-1">{t('mosque.notAvailable')}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {permissionDenied 
                  ? "Aktifkan izin lokasi di pengaturan browser untuk melihat masjid terdekat"
                  : t('mosque.enableLocationDesc')}
              </p>
              <Button 
                onClick={handleEnableLocation} 
                disabled={geoLoading}
                className="gradient-hero text-primary-foreground"
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <MapPin className="h-4 w-4 mr-1" />
                )}
                {t('mosque.enableLocation')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Show mosques when location is available */}
        {hasLocation && sortedMosques.length > 0 && (
          <div className="space-y-3">
            {sortedMosques.map((mosque, index) => (
              <motion.div
                key={mosque.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mosque.type === "masjid" ? "🕌" : "📿"}</span>
                          <h3 className="text-sm font-semibold text-foreground">{mosque.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{mosque.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-primary">{mosque.distance}</span>
                        <p className="text-[10px] text-muted-foreground capitalize">{mosque.type}</p>
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
                        <span className="text-[10px] bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <BookOpen className="h-2.5 w-2.5" />
                          Kajian {mosque.kajianTime}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 gradient-hero text-primary-foreground"
                        onClick={() => openGoogleMapsRoute(mosque)}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        {t('mosque.route')}
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
        )}
      </motion.div>

      {/* Map Placeholder - Open in Google Maps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-5 mt-6"
      >
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-40 bg-muted flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Lihat Semua Masjid & Musholla di Peta</p>
              <Button 
                size="sm"
                onClick={openGoogleMapsSearch}
                className="gradient-hero text-primary-foreground"
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
