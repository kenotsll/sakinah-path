import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomePage } from "@/components/pages/HomePage";
import { QuranPage } from "@/components/pages/QuranPage";
import { TaubatGuidePage } from "@/components/pages/TaubatGuidePage";
import { VideoMotivasiPage } from "@/components/pages/VideoMotivasiPage";
import { HijrahTasksPage } from "@/components/pages/HijrahTasksPage";
import { ConsultationPage } from "@/components/pages/ConsultationPage";
import { MosqueFinderPage } from "@/components/pages/MosqueFinderPage";
import { ReflectionPage } from "@/components/pages/ReflectionPage";
import { FAQPage } from "@/components/pages/FAQPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { NotificationPanel } from "@/components/pages/NotificationPanel";
import { TasbihPage } from "@/components/pages/TasbihPage";
import { PermissionDialog } from "@/components/PermissionDialog";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useAndroidPermissions } from "@/hooks/useAndroidPermissions";
import { useScheduledNotifications } from "@/hooks/useScheduledNotifications";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { Capacitor } from "@capacitor/core";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showReflection, setShowReflection] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTasbih, setShowTasbih] = useState(false);
  const [showAyatShare, setShowAyatShare] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingAyah, setPendingAyah] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);

  const { permission, requestPermission } = useNotifications();
  const { location, notifications, isNative, lastLocation, requestAllPermissions } = useAndroidPermissions();
  const { 
    scheduleAllNotifications, 
    schedulePrayerNotifications,
    scheduleTaskReminders,
    scheduleReflectionReminder,
    scheduleQuranReminder,
    scheduleDzikirReminders,
    scheduleStreakWarning,
  } = useScheduledNotifications();
  const { times: prayerTimes } = usePrayerTimes();

  // Show permission dialog on first load (native only)
  useEffect(() => {
    const hasShownPermission = localStorage.getItem('permission_dialog_shown');
    
    if (Capacitor.isNativePlatform() && !hasShownPermission) {
      // Delay to let app initialize
      const timer = setTimeout(() => {
        setShowPermissionDialog(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-request permissions on native if not shown dialog yet
  useEffect(() => {
    const hasShownPermission = localStorage.getItem('permission_dialog_shown');
    
    // If native and permissions not granted and dialog was shown before, try requesting again
    if (Capacitor.isNativePlatform() && hasShownPermission) {
      if (location !== 'granted' || notifications !== 'granted') {
        // Small delay then try to request
        const timer = setTimeout(() => {
          requestAllPermissions();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [location, notifications, requestAllPermissions]);

  // Schedule notifications when permissions are granted
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (notifications !== 'granted') return;

    console.log('[Index] Scheduling notifications - permissions granted');

    // Schedule all notification types
    const setupNotifications = async () => {
      // Schedule task reminders (17:00, 21:00)
      await scheduleTaskReminders(true);
      
      // Schedule reflection/muhasabah (21:30, 03:30)
      await scheduleReflectionReminder();
      
      // Schedule Quran reminder (06:00)
      const lastRead = localStorage.getItem('quran_last_read');
      await scheduleQuranReminder(lastRead ? JSON.parse(lastRead) : null);
      
      // Schedule dzikir reminders (05:30, 16:30)
      await scheduleDzikirReminders();
      
      // Schedule streak warnings (22:30, 23:30)
      const streakData = localStorage.getItem('user_streak');
      const streakCount = streakData ? JSON.parse(streakData).count || 0 : 0;
      await scheduleStreakWarning(22, 30, streakCount);
    };

    setupNotifications();
  }, [notifications, scheduleTaskReminders, scheduleReflectionReminder, scheduleQuranReminder, scheduleDzikirReminders, scheduleStreakWarning]);

  // Schedule prayer notifications when prayer times are available
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (notifications !== 'granted') return;
    if (!prayerTimes) return;

    console.log('[Index] Scheduling prayer notifications');

    const prayers = [
      { name: 'Subuh', englishName: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dzuhur', englishName: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Ashar', englishName: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', englishName: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isya', englishName: 'Isha', time: prayerTimes.Isha },
    ];

    schedulePrayerNotifications(prayers);
  }, [notifications, prayerTimes, schedulePrayerNotifications]);

  const handlePermissionsGranted = () => {
    localStorage.setItem('permission_dialog_shown', 'true');
    console.log('[Index] Permissions granted callback');
  };

  const handleClosePermissionDialog = () => {
    setShowPermissionDialog(false);
    localStorage.setItem('permission_dialog_shown', 'true');
  };

  const handleOpenAyah = (surahNumber: number, ayahNumber: number) => {
    setPendingAyah({ surahNumber, ayahNumber });
    setActiveTab("quran");
  };

  const renderPage = () => {
    if (showTasbih) {
      return <TasbihPage onBack={() => setShowTasbih(false)} />;
    }
    if (showProfile) {
      return <ProfilePage onBack={() => setShowProfile(false)} />;
    }
    if (showReflection) {
      return <ReflectionPage onBack={() => setShowReflection(false)} />;
    }
    if (showFAQ) {
      return <FAQPage onBack={() => setShowFAQ(false)} />;
    }

    switch (activeTab) {
      case "home":
        return (
          <HomePage 
            onNavigate={setActiveTab} 
            onOpenProfile={() => setShowProfile(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            onCalendarToggle={handleCalendarToggle}
            onOpenAyah={handleOpenAyah}
            onOpenTasbih={() => setShowTasbih(true)}
          />
        );
      case "quran":
        return (
          <QuranPage 
            initialSurah={pendingAyah?.surahNumber}
            initialAyah={pendingAyah?.ayahNumber}
            onNavigated={() => setPendingAyah(null)}
            onShareModalChange={setShowAyatShare}
          />
        );
      case "guide":
        return <TaubatGuidePage />;
      case "videos":
        return <VideoMotivasiPage />;
      case "tasks":
        return (
          <HijrahTasksPage 
            onOpenReflection={() => setShowReflection(true)} 
          />
        );
      case "consult":
        return <ConsultationPage />;
      case "mosque":
        return <MosqueFinderPage />;
      default:
        return (
          <HomePage 
            onNavigate={setActiveTab}
            onOpenProfile={() => setShowProfile(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            onCalendarToggle={handleCalendarToggle}
            onOpenAyah={handleOpenAyah}
            onOpenTasbih={() => setShowTasbih(true)}
          />
        );
    }
  };

  const handleTabChange = (tab: string) => {
    setShowReflection(false);
    setShowFAQ(false);
    setShowProfile(false);
    setShowCalendar(false);
    setPendingAyah(null);
    setActiveTab(tab);
  };

  const handleCalendarToggle = (isOpen: boolean) => {
    setShowCalendar(isOpen);
  };

  const isSubPage = showReflection || showFAQ || showProfile || showTasbih;
  const shouldHideFooter = isSubPage || showCalendar || showAyatShare;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${showReflection}-${showFAQ}-${showProfile}-${showTasbih}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        
        {!shouldHideFooter && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}

        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onRequestPermission={requestPermission}
          hasPermission={permission === "granted"}
        />

        <PermissionDialog
          isOpen={showPermissionDialog}
          onClose={handleClosePermissionDialog}
          onPermissionsGranted={handlePermissionsGranted}
        />
      </div>
    </div>
  );
};

export default Index;
