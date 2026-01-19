import { useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomePage } from "@/components/pages/HomePage";
import { TaubatGuidePage } from "@/components/pages/TaubatGuidePage";
import { VideoMotivasiPage } from "@/components/pages/VideoMotivasiPage";
import { HijrahTasksPage } from "@/components/pages/HijrahTasksPage";
import { ConsultationPage } from "@/components/pages/ConsultationPage";
import { MosqueFinderPage } from "@/components/pages/MosqueFinderPage";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage onNavigate={setActiveTab} />;
      case "guide":
        return <TaubatGuidePage />;
      case "videos":
        return <VideoMotivasiPage />;
      case "tasks":
        return <HijrahTasksPage />;
      case "consult":
        return <ConsultationPage />;
      case "mosque":
        return <MosqueFinderPage />;
      default:
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Container */}
      <div className="mx-auto max-w-lg min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
