import { motion } from "framer-motion";
import { Bell, User, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  userName?: string;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
}

export const Header = ({ userName, onOpenProfile, onOpenNotifications }: HeaderProps) => {
  const { nextPrayer, location, loading, refetch } = usePrayerTimes();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return t('home.greeting.morning');
    if (hour < 15) return t('home.greeting.afternoon');
    if (hour < 18) return t('home.greeting.evening');
    return t('home.greeting.night');
  };

  const displayName = profile?.full_name || userName || 'Sahabat';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 safe-top bg-background/80 backdrop-blur-xl"
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-arabic text-lg">إ</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{getGreeting()}</p>
              <h2 className="text-base font-semibold text-foreground">{displayName}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="iconSm" className="relative" onClick={onOpenNotifications}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
            </Button>
            <Button variant="ghost" size="iconSm" onClick={onOpenProfile}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Location & Next Prayer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location?.city || t('common.loading')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {nextPrayer && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t('home.nextPrayer')}</p>
              <p className="text-sm font-semibold text-primary">
                {nextPrayer.name} - {nextPrayer.time}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
