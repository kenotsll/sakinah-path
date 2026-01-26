import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Video, CheckSquare, BookOpen, MapPin, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export const QuickActions = ({ onActionClick }: QuickActionsProps) => {
  const { language } = useLanguage();

  const quickActions = [
    {
      id: "quran",
      label: "Al-Qur'an",
      icon: Book,
      color: "bg-primary-soft",
      iconColor: "text-primary",
    },
    {
      id: "video",
      label: language === 'id' ? "Video Motivasi" : "Motivation Videos",
      icon: Video,
      color: "bg-secondary",
      iconColor: "text-secondary-foreground",
    },
    {
      id: "target",
      label: language === 'id' ? "Target Hijrah" : "Hijrah Goals",
      icon: CheckSquare,
      color: "bg-spiritual-soft",
      iconColor: "text-spiritual",
    },
    {
      id: "taubat",
      label: language === 'id' ? "Panduan Taubat" : "Repentance Guide",
      icon: BookOpen,
      color: "bg-hope",
      iconColor: "text-hope-foreground",
    },
    {
      id: "masjid",
      label: language === 'id' ? "Cari Masjid" : "Find Mosque",
      icon: MapPin,
      color: "bg-accent-soft",
      iconColor: "text-accent",
    },
    {
      id: "doa",
      label: language === 'id' ? "Doa Taubat" : "Prayer",
      icon: Heart,
      color: "bg-primary-soft",
      iconColor: "text-primary",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="px-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        {language === 'id' ? 'Akses Cepat' : 'Quick Actions'}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
            >
              <Card
                variant="elevated"
                className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                onClick={() => onActionClick(action.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {action.label}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
