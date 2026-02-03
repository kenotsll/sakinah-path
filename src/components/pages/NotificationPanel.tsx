import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { useRealtimeNotifications, AppNotification } from "@/hooks/useRealtimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
  hasPermission: boolean;
}

export const NotificationPanel = ({
  isOpen,
  onClose,
  onRequestPermission,
  hasPermission,
}: NotificationPanelProps) => {
  const { 
    notifications, 
    isLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useRealtimeNotifications();
  const { language } = useLanguage();

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4" />;
      case "achievement":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconBg = (type: AppNotification["type"]) => {
    switch (type) {
      case "reminder":
        return "bg-primary/20 text-primary";
      case "achievement":
        return "bg-accent/20 text-accent";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: language === 'id' ? idLocale : undefined,
      });
    } catch {
      return dateString;
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
                <h3 className="font-semibold text-foreground">
                  {language === 'id' ? 'Notifikasi' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground"
                  >
                    {language === 'id' ? 'Tandai semua dibaca' : 'Mark all read'}
                  </Button>
                )}
                <Button variant="ghost" size="iconSm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Permission Banner */}
            {!hasPermission && (
              <div className="p-3 bg-hope border-b border-border">
                <p className="text-xs text-hope-foreground mb-2">
                  {language === 'id' 
                    ? 'Aktifkan notifikasi untuk menerima pengingat ibadah'
                    : 'Enable notifications to receive worship reminders'}
                </p>
                <Button
                  variant="spiritual"
                  size="sm"
                  className="w-full"
                  onClick={onRequestPermission}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  {language === 'id' ? 'Aktifkan Notifikasi' : 'Enable Notifications'}
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'id' ? 'Memuat...' : 'Loading...'}
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'id' ? 'Belum ada notifikasi' : 'No notifications yet'}
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
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                            )}
                            <Button
                              variant="ghost"
                              size="iconSm"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.created_at)}
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
