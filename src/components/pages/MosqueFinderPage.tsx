import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, AlertCircle, Loader2, RefreshCw, ExternalLink, Navigation } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmbeddedMap } from "@/components/EmbeddedMap";

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
    requestLocation 
  } = useGeolocation();

  const {
    address,
    loading: addressLoading,
    reverseGeocode,
  } = useReverseGeocode();

  // Auto-refresh interval
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Start watching on mount
  useEffect(() => {
    startWatching();
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [startWatching]);

  // Get address when location changes
  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude);
    }
  }, [latitude, longitude, reverseGeocode]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (latitude && longitude) {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }

      autoRefreshRef.current = setInterval(() => {
        if (latitude && longitude) {
          reverseGeocode(latitude, longitude);
        }
      }, 5 * 60 * 1000);

      return () => {
        if (autoRefreshRef.current) {
          clearInterval(autoRefreshRef.current);
        }
      };
    }
  }, [latitude, longitude, reverseGeocode]);

  const hasLocation = latitude !== null && longitude !== null;
  const isLoading = geoLoading;

  // Get clean location display
  const getLocationDisplay = () => {
    if (address) {
      if (address.street) return address.street;
      if (address.district) return address.district;
      if (address.city) return address.city;
      return address.fullAddress;
    }
    return language === 'id' ? 'Mendapatkan lokasi...' : 'Getting location...';
  };

  const handleRefresh = () => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude);
    } else {
      requestLocation();
    }
  };

  const openGoogleMapsSearch = () => {
    let url: string;
    if (hasLocation) {
      url = `https://www.google.com/maps/search/masjid+OR+musholla+OR+mosque/@${latitude},${longitude},15z`;
    } else {
      url = `https://www.google.com/maps/search/masjid+OR+musholla+OR+mosque`;
    }
    window.open(url, "_blank");
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
                  onClick={() => startWatching()}
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

      {/* Embedded Map with Satellite View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {language === 'id' ? 'Peta Masjid Terdekat' : 'Nearby Mosques Map'}
        </h2>
        <EmbeddedMap />
      </motion.div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {language === 'id' ? 'Aksi Cepat' : 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
                onClick={openGoogleMapsSearch}
              >
                <Navigation className="h-4 w-4" />
                <span className="text-sm">
                  {language === 'id' ? 'Cari Masjid' : 'Find Mosque'}
                </span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => {
                  if (hasLocation) {
                    window.open(`https://www.google.com/maps/search/musholla/@${latitude},${longitude},15z`, "_blank");
                  } else {
                    window.open(`https://www.google.com/maps/search/musholla`, "_blank");
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">
                  {language === 'id' ? 'Cari Musholla' : 'Find Musholla'}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
