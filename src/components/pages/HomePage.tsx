import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { DailyQuote } from "@/components/DailyQuote";
import { QuickActions } from "@/components/QuickActions";
import { DailyProgress } from "@/components/DailyProgress";
import { VideoRecommendations } from "@/components/VideoRecommendations";
import { DualCalendar } from "@/components/DualCalendar";
import { HeroCarousel } from "@/components/HeroCarousel";

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onCalendarToggle?: (isOpen: boolean) => void;
}

export const HomePage = ({ onNavigate, onOpenProfile, onOpenNotifications, onCalendarToggle }: HomePageProps) => {
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
        <HeroCarousel onNavigate={onNavigate} />
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
    </div>
  );
};
