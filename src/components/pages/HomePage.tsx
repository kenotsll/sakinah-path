import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { DailyQuote } from "@/components/DailyQuote";
import { QuickActions } from "@/components/QuickActions";
import { DailyProgress } from "@/components/DailyProgress";
import { VideoRecommendations } from "@/components/VideoRecommendations";
import { DualCalendar } from "@/components/DualCalendar";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Circle } from "lucide-react";

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onCalendarToggle?: (isOpen: boolean) => void;
  onOpenAyah?: (surahNumber: number, ayahNumber: number) => void;
  onOpenTasbih?: () => void;
}

export const HomePage = ({ onNavigate, onOpenProfile, onOpenNotifications, onCalendarToggle, onOpenAyah, onOpenTasbih }: HomePageProps) => {
  const handleActionClick = (actionId: string) => {
    const tabMap: Record<string, string> = {
      quran: "quran",
      taubat: "guide",
      video: "videos",
      target: "tasks",
      konsultasi: "guide",
      masjid: "mosque",
      doa: "guide",
    };
    onNavigate(tabMap[actionId] || "home");
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      <Header onOpenProfile={onOpenProfile} onOpenNotifications={onOpenNotifications} />
      
      {/* Hero Carousel - 4 Slides */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <HeroCarousel onNavigate={onNavigate} onOpenAyah={onOpenAyah} />
      </motion.div>

      {/* Calendar Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <DualCalendar onModalToggle={onCalendarToggle} />
      </motion.div>

      {/* Daily Quote */}
      <div className="px-5 mb-6">
        <DailyQuote />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions onActionClick={handleActionClick} />
      </div>

      {/* Daily Progress */}
      <div className="mb-6">
        <DailyProgress onNavigate={onNavigate} />
      </div>

      {/* Video Recommendations */}
      <div className="mb-6">
        <VideoRecommendations />
      </div>

      {/* Motivational Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-5 text-center"
      >
        <p className="text-sm text-muted-foreground italic">
          "Sebaik-baik orang yang berdosa adalah yang bertaubat."
        </p>
        <p className="text-xs text-primary mt-1">— HR. Tirmidzi</p>
      </motion.div>

      {/* Floating Draggable Tasbih Button */}
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
        dragMomentum={false}
        dragElastic={0.05}
        whileDrag={{ scale: 1.15, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="fixed bottom-24 right-5 z-30 touch-none"
        style={{ touchAction: "none" }}
      >
        <motion.button
          onClick={onOpenTasbih}
          whileTap={{ scale: 0.9 }}
          className="h-14 w-14 rounded-full shadow-lg gradient-hero flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <Circle className="h-6 w-6 text-primary-foreground" />
        </motion.button>
      </motion.div>
    </div>
  );
};
