import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
  hasPermission: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "reminder" | "achievement" | "info";
  read: boolean;
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Waktu Dzuhur Telah Tiba 🕌",
    message: "Jangan lupa shalat dzuhur tepat waktu.",
    time: "12:05",
    type: "reminder",
    read: false,
  },
  {
    id: "2",
    title: "Streak 7 Hari! 🎉",
    message: "Alhamdulillah, kamu sudah konsisten 7 hari berturut-turut.",
    time: "Kemarin",
    type: "achievement",
    read: true,
  },
  {
    id: "3",
    title: "Refleksi Malam 🌙",
    message: "Sudah waktunya menulis catatan refleksi hari ini.",
    time: "Kemarin",
    type: "reminder",
    read: true,
  },
  {
    id: "4",
    title: "Video Baru Tersedia",
    message: "Ustadz Adi Hidayat: Cara Taubat Terbaik",
    time: "2 hari lalu",
    type: "info",
    read: true,
  },
];

export const NotificationPanel = ({
  isOpen,
  onClose,
  onRequestPermission,
  hasPermission,
}: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState(sampleNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4" />;
      case "achievement":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconBg = (type: Notification["type"]) => {
    switch (type) {
      case "reminder":
        return "bg-primary/20 text-primary";
      case "achievement":
        return "bg-accent/20 text-accent";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-4 right-4 left-4 max-w-md mx-auto z-50"
      >
        <Card variant="elevated" className="shadow-lg">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="iconSm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Permission Banner */}
            {!hasPermission && (
              <div className="p-3 bg-hope border-b border-border">
                <p className="text-xs text-hope-foreground mb-2">
                  Aktifkan notifikasi untuk menerima pengingat ibadah
                </p>
                <Button
                  variant="spiritual"
                  size="sm"
                  className="w-full"
                  onClick={onRequestPermission}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Aktifkan Notifikasi
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada notifikasi
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.read ? "bg-primary-soft/50" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(
                          notification.type
                        )}`}
                      >
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};
