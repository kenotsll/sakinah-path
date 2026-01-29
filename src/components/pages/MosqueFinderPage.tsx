import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Phone, ExternalLink, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMosqueSearch, Mosque } from "@/hooks/useMosqueSearch";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useLanguage } from "@/contexts/LanguageContext";

export const MosqueFinderPage = () => {
  const { t, language } = useLanguage();
  const { times, nextPrayer } = usePrayerTimes();
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

  const {
    mosques,
    loading: mosquesLoading,
    error: mosquesError,
    searchNearbyMosques,
  } = useMosqueSearch();

  const {
    address,
    loading: addressLoading,
    reverseGeocode,
  } = useReverseGeocode();

  // Ref for auto-refresh interval
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Start watching on mount
  useEffect(() => {
    startWatching();
    return () => {
      stopWatching();
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [startWatching, stopWatching]);

  // Search mosques when location changes and get address
  useEffect(() => {
    if (latitude && longitude) {
      // Check if coordinates changed significantly (more than 100m)
      const coordsChanged = !lastCoordsRef.current || 
        Math.abs(lastCoordsRef.current.lat - latitude) > 0.001 ||
        Math.abs(lastCoordsRef.current.lng - longitude) > 0.001;

      if (coordsChanged) {
        lastCoordsRef.current = { lat: latitude, lng: longitude };
        searchNearbyMosques(latitude, longitude, 5);
        reverseGeocode(latitude, longitude);
      }
    }
  }, [latitude, longitude, searchNearbyMosques, reverseGeocode]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (latitude && longitude) {
      // Clear existing interval
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }

      // Set up 5-minute auto-refresh
      autoRefreshRef.current = setInterval(() => {
        if (latitude && longitude) {
          searchNearbyMosques(latitude, longitude, 5);
          reverseGeocode(latitude, longitude);
        }
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        if (autoRefreshRef.current) {
          clearInterval(autoRefreshRef.current);
        }
      };
    }
  }, [latitude, longitude, searchNearbyMosques, reverseGeocode]);

  const hasLocation = latitude !== null && longitude !== null;
  const isLoading = geoLoading || mosquesLoading;

  // Navigation uses only coordinates for 100% accuracy
  const openGoogleMapsRoute = (mosque: Mosque) => {
    let url: string;
    
    if (hasLocation) {
      // Use absolute coordinates only - no text names to avoid confusion
      url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${mosque.lat},${mosque.lng}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}&travelmode=driving`;
    }
    
    window.open(url, "_blank");
  };

  const openGoogleMapsSearch = () => {
    let url: string;
    
    if (hasLocation) {
      // Expanded search: Masjid OR Musholla OR Mosque
      url = `https://www.google.com/maps/search/masjid+OR+musholla+OR+mosque/@${latitude},${longitude},15z`;
    } else {
      url = `https://www.google.com/maps/search/masjid+OR+musholla+OR+mosque`;
    }
    
    window.open(url, "_blank");
  };

  const callMosque = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleEnableLocation = () => {
    startWatching();
  };

  const handleRefresh = () => {
    if (latitude && longitude) {
      searchNearbyMosques(latitude, longitude, 5);
      reverseGeocode(latitude, longitude);
    } else {
      requestLocation();
    }
  };

  // Get clean location display - only street/area name
  const getLocationDisplay = () => {
    if (address) {
      // Prefer street, then district, then just area
      if (address.street) return address.street;
      if (address.district) return address.district;
      if (address.city) return address.city;
      return address.fullAddress;
    }
    return language === 'id' ? 'Mendapatkan lokasi...' : 'Getting location...';
  };

  // Get mosque address display - fallback to coordinates if no address
  const getMosqueAddress = (mosque: Mosque) => {
    if (mosque.address && mosque.address !== 'Alamat tidak tersedia') {
      return mosque.address;
    }
    // Don't show "Alamat tidak tersedia" - just show area info from context
    return `${mosque.distance} dari lokasimu`;
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header - Clean without city name */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{t('mosque.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {language === 'id' ? 'Temukan masjid & musholla terdekat' : 'Find nearby mosques'}
            </p>
          </div>
          {hasLocation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Location Card - Clean display */}
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
                  <p className="text-xs text-muted-foreground">
                    {language === 'id' ? 'Mencari lokasi...' : 'Finding location...'}
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    {language === 'id' ? 'Lokasimu' : 'Your location'}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {addressLoading ? (
                      <span className="text-muted-foreground animate-pulse">...</span>
                    ) : (
                      getLocationDisplay()
                    )}
                  </p>
                </div>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t('mosque.title')}</h2>
          {mosques.length > 0 && (
            <span className="text-xs text-muted-foreground">{mosques.length} ditemukan</span>
          )}
        </div>
        
        {/* Loading Mosques */}
        {mosquesLoading && hasLocation && (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {language === 'id' ? 'Mencari masjid terdekat...' : 'Searching nearby mosques...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Show message if location not available */}
        {!hasLocation && !geoLoading && (
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-6 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-foreground mb-1">{t('mosque.notAvailable')}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {permissionDenied 
                  ? (language === 'id' 
                      ? "Aktifkan izin lokasi di pengaturan browser"
                      : "Enable location in browser settings")
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

        {/* Error State */}
        {mosquesError && hasLocation && !mosquesLoading && (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">{mosquesError}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Show mosques when location is available */}
        {hasLocation && mosques.length > 0 && !mosquesLoading && (
          <div className="space-y-3">
            {mosques.map((mosque, index) => (
              <motion.div
                key={mosque.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mosque.type === "masjid" ? "🕌" : "📿"}</span>
                          <h3 className="text-sm font-semibold text-foreground">{mosque.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{getMosqueAddress(mosque)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">{mosque.distance}</span>
                        <p className="text-[10px] text-muted-foreground capitalize">{mosque.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 gradient-hero text-primary-foreground"
                        onClick={() => openGoogleMapsRoute(mosque)}
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1" />
                        {t('mosque.route')}
                      </Button>
                      {mosque.phone && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => callMosque(mosque.phone!)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'id' ? 'Lihat Semua di Peta' : 'View All on Map'}
              </p>
              <Button 
                size="sm"
                onClick={openGoogleMapsSearch}
                className="gradient-hero text-primary-foreground"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {language === 'id' ? 'Buka Google Maps' : 'Open Google Maps'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
