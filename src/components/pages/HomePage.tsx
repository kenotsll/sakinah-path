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

      {/* Floating Tasbih Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="fixed bottom-24 right-5 z-30"
      >
        <Button
          onClick={onOpenTasbih}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg gradient-hero hover:opacity-90"
        >
          <Circle className="h-6 w-6 text-primary-foreground" />
        </Button>
      </motion.div>
    </div>
  );
};
