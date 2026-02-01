import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell, AlertTriangle, Settings, X, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAndroidPermissions } from '@/hooks/useAndroidPermissions';
import { useLanguage } from '@/contexts/LanguageContext';

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsGranted?: () => void;
}

export const PermissionDialog = ({ 
  isOpen, 
  onClose, 
  onPermissionsGranted 
}: PermissionDialogProps) => {
  const { t } = useLanguage();
  const {
    location,
    notifications,
    gpsEnabled,
    isNative,
    isAndroid,
    lastLocation,
    requestLocationPermission,
    requestNotificationPermission,
    requestAllPermissions,
    openAppSettings,
    openLocationSettings,
  } = useAndroidPermissions();

  const [step, setStep] = useState<'intro' | 'requesting' | 'result'>('intro');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isRequestingNotification, setIsRequestingNotification] = useState(false);

  // Handle permission request completion
  useEffect(() => {
    if (step === 'result' && location === 'granted' && notifications === 'granted') {
      onPermissionsGranted?.();
      // Auto close after success
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, location, notifications, onPermissionsGranted, onClose]);

  const handleRequestPermissions = async () => {
    setStep('requesting');
    await requestAllPermissions();
    setStep('result');
  };

  const handleRequestLocation = async () => {
    setIsRequestingLocation(true);
    await requestLocationPermission();
    setIsRequestingLocation(false);
  };

  const handleRequestNotification = async () => {
    setIsRequestingNotification(true);
    await requestNotificationPermission();
    setIsRequestingNotification(false);
  };

  const allGranted = location === 'granted' && notifications === 'granted';
  const someGranted = location === 'granted' || notifications === 'granted';

  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Izin Diperlukan</h2>
        <p className="text-sm text-muted-foreground">
          Agar aplikasi berfungsi optimal, kami membutuhkan izin berikut:
        </p>
      </div>

      <div className="space-y-4">
        {/* Location Permission */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Lokasi</h3>
            <p className="text-sm text-muted-foreground">
              Untuk jadwal sholat akurat dan mencari masjid terdekat
            </p>
          </div>
          {location === 'granted' && (
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          )}
        </div>

        {/* Notification Permission */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Notifikasi</h3>
            <p className="text-sm text-muted-foreground">
              Untuk pengingat sholat, dzikir, dan target harian
            </p>
          </div>
          {notifications === 'granted' && (
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          )}
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {isNative && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <p>Platform: {isAndroid ? 'Android' : 'iOS'} | Status: L={location}, N={notifications}</p>
        </div>
      )}

      <Button 
        className="w-full" 
        size="lg"
        onClick={handleRequestPermissions}
      >
        Izinkan Semua
      </Button>

      <button
        onClick={onClose}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Nanti saja
      </button>
    </motion.div>
  );

  const renderRequesting = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center py-8 space-y-4"
    >
      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
      <p className="text-lg font-medium">Meminta izin...</p>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          📱 Akan muncul dialog izin Android
        </p>
        <p className="text-sm text-muted-foreground font-medium text-primary">
          Tekan "Izinkan" atau "Allow" pada dialog
        </p>
      </div>
    </motion.div>
  );

  const renderResult = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center ${
          allGranted ? 'bg-green-500/10' : 'bg-yellow-500/10'
        }`}>
          {allGranted ? (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          )}
        </div>
        <h2 className="text-xl font-semibold">
          {allGranted ? 'Semua Izin Diberikan!' : 'Ada Izin Yang Belum Aktif'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {allGranted 
            ? 'Aplikasi siap digunakan dengan semua fitur aktif' 
            : 'Beberapa fitur tidak akan berfungsi'}
        </p>
      </div>

      {/* Permission Status */}
      <div className="space-y-3">
        {/* Location Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          location === 'granted' ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <MapPin className={`h-5 w-5 ${
              location === 'granted' ? 'text-green-500' : 'text-red-500'
            }`} />
            <div>
              <span className="font-medium">Lokasi</span>
              {location === 'granted' && lastLocation && (
                <p className="text-xs text-muted-foreground">
                  ✓ Terdeteksi ({lastLocation.latitude.toFixed(4)}, {lastLocation.longitude.toFixed(4)})
                </p>
              )}
            </div>
          </div>
          {location === 'granted' ? (
            <span className="text-green-500 text-sm font-medium">Aktif</span>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestLocation}
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Coba Lagi'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openAppSettings}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Notification Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          notifications === 'granted' ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <Bell className={`h-5 w-5 ${
              notifications === 'granted' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span className="font-medium">Notifikasi</span>
          </div>
          {notifications === 'granted' ? (
            <span className="text-green-500 text-sm font-medium">Aktif</span>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestNotification}
                disabled={isRequestingNotification}
              >
                {isRequestingNotification ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Coba Lagi'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openAppSettings}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* GPS Warning */}
      {location === 'granted' && !gpsEnabled && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-600">GPS Tidak Aktif</p>
            <p className="text-xs text-muted-foreground">
              Nyalakan GPS untuk lokasi yang akurat
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openLocationSettings}
          >
            Nyalakan
          </Button>
        </div>
      )}

      {/* Manual Instructions */}
      {!allGranted && (
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium">Cara mengaktifkan manual:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Tekan ikon <ExternalLink className="h-3 w-3 inline" /> untuk buka Pengaturan</li>
            <li>Pilih "Izin" atau "Permissions"</li>
            <li>Aktifkan "Lokasi" dan "Notifikasi"</li>
            <li>Kembali ke aplikasi</li>
          </ol>
        </div>
      )}

      <Button 
        className="w-full" 
        variant={allGranted ? "default" : "secondary"}
        onClick={onClose}
      >
        {allGranted ? 'Mulai Menggunakan' : 'Tutup'}
      </Button>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-background rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'intro' && renderIntro()}
              {step === 'requesting' && renderRequesting()}
              {step === 'result' && renderResult()}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
