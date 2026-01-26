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
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showReflection, setShowReflection] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { permission, requestPermission } = useNotifications();

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
          />
        );
      case "quran":
        return <QuranPage />;
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
        return (
          <ConsultationPage 
            onOpenFAQ={() => setShowFAQ(true)} 
          />
        );
      case "mosque":
        return <MosqueFinderPage />;
      default:
        return (
          <HomePage 
            onNavigate={setActiveTab}
            onOpenProfile={() => setShowProfile(true)}
            onOpenNotifications={() => setShowNotifications(true)}
          />
        );
    }
  };

  // Close sub-pages when tab changes
  const handleTabChange = (tab: string) => {
    setShowReflection(false);
    setShowFAQ(false);
    setShowProfile(false);
    setActiveTab(tab);
  };

  const isSubPage = showReflection || showFAQ || showProfile;

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
        
        {/* Hide bottom nav when in sub-pages */}
        {!isSubPage && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onRequestPermission={requestPermission}
          hasPermission={permission === "granted"}
        />
      </div>
    </div>
  );
};

export default Index;
