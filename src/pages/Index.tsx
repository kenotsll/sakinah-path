import { useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomePage } from "@/components/pages/HomePage";
import { TaubatGuidePage } from "@/components/pages/TaubatGuidePage";
import { VideoMotivasiPage } from "@/components/pages/VideoMotivasiPage";
import { HijrahTasksPage } from "@/components/pages/HijrahTasksPage";
import { ConsultationPage } from "@/components/pages/ConsultationPage";
import { MosqueFinderPage } from "@/components/pages/MosqueFinderPage";
import { ReflectionPage } from "@/components/pages/ReflectionPage";
import { FAQPage } from "@/components/pages/FAQPage";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showReflection, setShowReflection] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const renderPage = () => {
    // Sub-pages that overlay the main navigation
    if (showReflection) {
      return <ReflectionPage />;
    }
    if (showFAQ) {
      return <FAQPage onBack={() => setShowFAQ(false)} />;
    }

    switch (activeTab) {
      case "home":
        return <HomePage onNavigate={setActiveTab} />;
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
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  // Close sub-pages when tab changes
  const handleTabChange = (tab: string) => {
    setShowReflection(false);
    setShowFAQ(false);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Container */}
      <div className="mx-auto max-w-lg min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${showReflection}-${showFAQ}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        
        {/* Hide bottom nav when in sub-pages */}
        {!showReflection && !showFAQ && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
};

export default Index;