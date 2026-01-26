import { motion } from "framer-motion";
import { Home, Book, Video, CheckSquare, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { t, language } = useLanguage();

  const tabs = [
    { id: "home", label: t('nav.home'), icon: Home },
    { id: "quran", label: "Qur'an", icon: Book },
    { id: "videos", label: t('nav.videos'), icon: Video },
    { id: "tasks", label: t('nav.tasks'), icon: CheckSquare },
    { id: "mosque", label: language === 'id' ? 'Masjid' : 'Mosque', icon: MapPin },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl px-2 py-2 shadow-card">
          <div className="grid grid-cols-5 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    />
                  )}
                  <Icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                  <span className={cn(
                    "relative z-10 mt-1 text-[10px] font-medium transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-70"
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
