import { useState } from "react";
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
import { TasbihDigital } from "@/components/TasbihDigital";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showReflection, setShowReflection] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTasbih, setShowTasbih] = useState(false);
  // State for navigating to specific ayah from carousel bookmark
  const [pendingAyah, setPendingAyah] = useState<{ surahNumber: number; ayahNumber: number } | null>(null);

  const { permission, requestPermission } = useNotifications();

  // Handle opening ayah from carousel bookmark
  const handleOpenAyah = (surahNumber: number, ayahNumber: number) => {
    setPendingAyah({ surahNumber, ayahNumber });
    setActiveTab("quran");
  };

  const renderPage = () => {
    // Sub-pages that overlay the main navigation
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

  // Close sub-pages when tab changes
  const handleTabChange = (tab: string) => {
    setShowReflection(false);
    setShowFAQ(false);
    setShowProfile(false);
    setShowCalendar(false);
    setPendingAyah(null);
    setActiveTab(tab);
  };

  // Callback when calendar modal opens/closes
  const handleCalendarToggle = (isOpen: boolean) => {
    setShowCalendar(isOpen);
  };

  // Auto-hide footer conditions: sub-pages OR calendar modal open (NOT Quran page anymore)
  const isSubPage = showReflection || showFAQ || showProfile;
  const shouldHideFooter = isSubPage || showCalendar;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Container */}
      <div className="mx-auto max-w-lg min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${showReflection}-${showFAQ}-${showProfile}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        
        {/* Hide bottom nav when in sub-pages or Quran page */}
        {!shouldHideFooter && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onRequestPermission={requestPermission}
          hasPermission={permission === "granted"}
        />

        {/* Tasbih Digital Modal */}
        <TasbihDigital 
          isOpen={showTasbih} 
          onClose={() => setShowTasbih(false)} 
        />
      </div>
    </div>
  );
};

export default Index;
