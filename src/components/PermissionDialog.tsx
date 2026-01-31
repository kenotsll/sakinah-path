import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell, AlertTriangle, Settings, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNativePermissions } from '@/hooks/useNativePermissions';
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
    permissions,
    loading,
    requestAllPermissions,
    requestLocationPermission,
    requestNotificationPermission,
    checkGpsStatus,
    openLocationSettings,
  } = useNativePermissions();

  const [step, setStep] = useState<'intro' | 'requesting' | 'result'>('intro');
  const [gpsWarning, setGpsWarning] = useState(false);

  // Check GPS status when location is granted
  useEffect(() => {
    if (permissions.location === 'granted') {
      checkGpsStatus().then(enabled => {
        setGpsWarning(!enabled);
      });
    }
  }, [permissions.location, checkGpsStatus]);

  const handleRequestPermissions = async () => {
    setStep('requesting');
    
    const success = await requestAllPermissions();
    
    setStep('result');

    if (success) {
      onPermissionsGranted?.();
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleRequestSingle = async (type: 'location' | 'notification') => {
    if (type === 'location') {
      await requestLocationPermission();
    } else {
      await requestNotificationPermission();
    }
  };

  const handleFixLocation = async () => {
    // Try prompting system dialog first; if user previously chose "Don't ask again",
    // Android won't show the dialog and user must enable it from App Settings.
    const granted = await requestLocationPermission();
    if (!granted) openLocationSettings();
  };

  const allGranted = 
    permissions.location === 'granted' && 
    permissions.notifications === 'granted';

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
          Untuk pengalaman terbaik, aplikasi membutuhkan beberapa izin berikut:
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
              Untuk menampilkan jadwal sholat dan mencari masjid terdekat berdasarkan posisi Anda
            </p>
          </div>
          {permissions.location === 'granted' && (
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
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
              Untuk mengingatkan waktu sholat dan target harian Anda
            </p>
          </div>
          {permissions.notifications === 'granted' && (
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
      </div>

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
      <p className="text-muted-foreground">Meminta izin...</p>
      <p className="text-xs text-muted-foreground">
        Tekan "Izinkan" pada dialog yang muncul
      </p>
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
            <span className="text-3xl">✓</span>
          ) : (
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          )}
        </div>
        <h2 className="text-xl font-semibold">
          {allGranted ? 'Semua Izin Diberikan!' : 'Beberapa Izin Ditolak'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {allGranted 
            ? 'Aplikasi siap digunakan dengan semua fitur aktif' 
            : 'Beberapa fitur mungkin tidak berfungsi dengan baik'}
        </p>
      </div>

      {/* Permission Status */}
      <div className="space-y-3">
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          permissions.location === 'granted' ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <MapPin className={`h-5 w-5 ${
              permissions.location === 'granted' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span>Lokasi</span>
          </div>
          {permissions.location === 'granted' ? (
            <span className="text-green-500 text-sm">Diizinkan</span>
          ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFixLocation}
                >
                  Coba Lagi
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openLocationSettings}
                >
                  Pengaturan
                </Button>
              </div>
          )}
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg ${
          permissions.notifications === 'granted' ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <Bell className={`h-5 w-5 ${
              permissions.notifications === 'granted' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span>Notifikasi</span>
          </div>
          {permissions.notifications === 'granted' ? (
            <span className="text-green-500 text-sm">Diizinkan</span>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleRequestSingle('notification')}
            >
              Coba Lagi
            </Button>
          )}
        </div>
      </div>

      {/* GPS Warning */}
      {gpsWarning && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-600">GPS Tidak Aktif</p>
            <p className="text-xs text-muted-foreground">
              Nyalakan GPS di pengaturan perangkat untuk mendapatkan lokasi yang akurat
            </p>
          </div>
        </div>
      )}

      {/* Denied Warning */}
      {!allGranted && (
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>Catatan:</strong> Jika tombol "Coba Lagi" tidak membuka dialog izin, 
            buka Pengaturan → Aplikasi → Sakinah Path → Izin untuk mengaktifkan secara manual.
          </p>
        </div>
      )}

      <Button 
        className="w-full" 
        variant={allGranted ? "default" : "secondary"}
        onClick={onClose}
      >
        {allGranted ? 'Mulai' : 'Tutup'}
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
          className="relative w-full max-w-md bg-background rounded-2xl shadow-xl overflow-hidden"
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
