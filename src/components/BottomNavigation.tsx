import { motion } from "framer-motion";
import { Home, Book, Video, CheckSquare, MapPin, BookHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef, useEffect } from "react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: "home", label: t('nav.home'), icon: Home },
    { id: "quran", label: "Qur'an", icon: Book },
    { id: "guide", label: language === 'id' ? 'Panduan' : 'Guide', icon: BookHeart },
    { id: "videos", label: t('nav.videos'), icon: Video },
    { id: "tasks", label: t('nav.tasks'), icon: CheckSquare },
    { id: "mosque", label: language === 'id' ? 'Masjid' : 'Mosque', icon: MapPin },
  ];

  // Scroll active tab into view
  useEffect(() => {
    if (containerRef.current) {
      const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
      const container = containerRef.current;
      const buttons = container.querySelectorAll('button');
      
      if (buttons[activeIndex]) {
        const button = buttons[activeIndex] as HTMLButtonElement;
        const containerWidth = container.offsetWidth;
        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.offsetWidth;
        
        // Center the active tab
        const scrollTo = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        container.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl px-2 py-2 shadow-card">
          <div 
            ref={containerRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 flex-shrink-0 min-w-[3.5rem]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  style={{ scrollSnapAlign: 'center' }}
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
                    "relative z-10 mt-1 text-[10px] font-medium transition-all duration-300 whitespace-nowrap",
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
