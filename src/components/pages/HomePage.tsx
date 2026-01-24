import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { DailyQuote } from "@/components/DailyQuote";
import { QuickActions } from "@/components/QuickActions";
import { DailyProgress } from "@/components/DailyProgress";
import { VideoRecommendations } from "@/components/VideoRecommendations";
import heroMosque from "@/assets/hero-mosque.jpg";

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
}

export const HomePage = ({ onNavigate, onOpenProfile, onOpenNotifications }: HomePageProps) => {
  const handleActionClick = (actionId: string) => {
    const tabMap: Record<string, string> = {
      taubat: "guide",
      video: "videos",
      target: "tasks",
      konsultasi: "consult",
      masjid: "mosque",
      doa: "guide",
    };
    onNavigate(tabMap[actionId] || "home");
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      <Header onOpenProfile={onOpenProfile} onOpenNotifications={onOpenNotifications} />
      
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mx-5 mb-6 overflow-hidden rounded-2xl"
      >
        <img
          src={heroMosque}
          alt="Mosque at sunrise"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <p className="font-arabic text-xl text-primary-foreground text-center leading-relaxed mb-1">
            ۞ اِسْتِقَامَة ۞
          </p>
          <h1 className="text-lg font-bold text-primary-foreground text-center">
            Istiqamah
          </h1>
          <p className="text-xs text-primary-foreground/80 text-center">
            Langkah Menuju Kebaikan
          </p>
        </motion.div>
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
