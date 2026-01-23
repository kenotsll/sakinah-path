import { motion } from "framer-motion";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userName?: string;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
}

export const Header = ({ userName = "Hamba Allah", onOpenProfile, onOpenNotifications }: HeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 safe-top"
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-arabic text-lg">إ</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assalamu'alaikum,</p>
              <h2 className="text-base font-semibold text-foreground">{userName}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="iconSm" className="relative" onClick={onOpenNotifications}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
            </Button>
            <Button variant="ghost" size="iconSm" onClick={onOpenProfile}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
