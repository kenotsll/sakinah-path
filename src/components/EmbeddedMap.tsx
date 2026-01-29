import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Loader2, RefreshCw, Satellite, Map } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmbeddedMapProps {
  onOpenExternal?: () => void;
}

export const EmbeddedMap = ({ onOpenExternal }: EmbeddedMapProps) => {
  const { language } = useLanguage();
  const { latitude, longitude, loading, error, startWatching } = useGeolocation();
  const [mapView, setMapView] = useState<'satellite' | 'roadmap'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const hasLocation = latitude !== null && longitude !== null;

  useEffect(() => {
    startWatching();
  }, [startWatching]);

  // Google Maps Embed URL with satellite/hybrid view
  const getMapUrl = () => {
    if (!hasLocation) return null;
    
    // Using Google Maps Embed API with satellite view
    const mapType = mapView === 'satellite' ? 'k' : 'm'; // k = satellite, m = roadmap
    const query = encodeURIComponent('masjid OR musholla OR mosque');
    
    // Use satellite view with markers
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}&center=${latitude},${longitude}&zoom=15&maptype=${mapView}`;
  };

  // External link to Google Maps
  const openInGoogleMaps = () => {
    if (hasLocation) {
      const url = `https://www.google.com/maps/search/masjid+OR+musholla+OR+mosque/@${latitude},${longitude},15z`;
      window.open(url, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/masjid+OR+musholla+OR+mosque`, "_blank");
    }
    onOpenExternal?.();
  };

  // Navigate to specific coordinates
  const navigateTo = (destLat: number, destLng: number) => {
    if (hasLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving`;
      window.open(url, "_blank");
    }
  };

  if (!hasLocation && !loading) {
    return (
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-foreground mb-2">
            {language === 'id' ? 'Aktifkan Lokasi' : 'Enable Location'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {language === 'id' 
              ? 'Izinkan akses lokasi untuk melihat masjid terdekat di peta'
              : 'Allow location access to see nearby mosques on map'}
          </p>
          <Button 
            onClick={startWatching} 
            className="gradient-hero text-primary-foreground"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {language === 'id' ? 'Aktifkan Lokasi' : 'Enable Location'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={mapView === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('satellite')}
          >
            <Satellite className="h-4 w-4 mr-1" />
            Satelit
          </Button>
          <Button
            variant={mapView === 'roadmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('roadmap')}
          >
            <Map className="h-4 w-4 mr-1" />
            Peta
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={openInGoogleMaps}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          {language === 'id' ? 'Buka di Maps' : 'Open in Maps'}
        </Button>
      </div>

      {/* Embedded Map */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="relative aspect-[4/3] bg-muted">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {language === 'id' ? 'Memuat peta...' : 'Loading map...'}
                </p>
              </div>
            </div>
          )}
          
          {hasLocation && (
            <>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={getMapUrl() || undefined}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
                title="Peta Masjid Terdekat"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <CardContent className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1 gradient-hero text-primary-foreground"
              onClick={openInGoogleMaps}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {language === 'id' ? 'Cari Rute Masjid' : 'Find Mosque Route'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setMapLoaded(false);
                startWatching();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {language === 'id' 
              ? 'Titik biru = lokasimu • Marker = masjid/musholla'
              : 'Blue dot = your location • Markers = mosques'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
