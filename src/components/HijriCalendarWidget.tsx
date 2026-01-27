import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X, Star, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHijriDate, islamicEvents } from "@/hooks/useHijriDate";
import { useLanguage } from "@/contexts/LanguageContext";

interface HijriCalendarWidgetProps {
  compact?: boolean;
}

export const HijriCalendarWidget = ({ compact = false }: HijriCalendarWidgetProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hijriDate, todayEvents, upcomingEvents, isSunnahFastingDay } = useHijriDate();
  const { language } = useLanguage();
  const fastingStatus = isSunnahFastingDay();

  if (!hijriDate) return null;

  const getFastingMessage = () => {
    if (fastingStatus.isMonday) return language === 'id' ? 'Hari Puasa Sunnah Senin' : 'Monday Sunnah Fasting';
    if (fastingStatus.isThursday) return language === 'id' ? 'Hari Puasa Sunnah Kamis' : 'Thursday Sunnah Fasting';
    if (fastingStatus.isAyyamulBidh) return language === 'id' ? 'Puasa Ayyamul Bidh' : 'Ayyamul Bidh Fasting';
    return null;
  };

  const fastingMessage = getFastingMessage();

  if (compact) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Moon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {hijriDate.day} {hijriDate.monthName} {hijriDate.year} H
        </span>
      </button>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <Card className="bg-card border-border overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {hijriDate.day} {hijriDate.monthName} {hijriDate.year} H
                  </p>
                  <p className="text-xs text-muted-foreground font-amiri">
                    {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year}
                  </p>
                </div>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Today's events or fasting day */}
            {(todayEvents.length > 0 || fastingMessage) && (
              <div className="mt-3 pt-3 border-t border-border">
                {todayEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {language === 'id' ? event.name : event.nameEn}
                    </span>
                  </div>
                ))}
                {fastingMessage && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🌙</span>
                    <span className="text-xs text-muted-foreground">{fastingMessage}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-card border-border shadow-xl">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between gradient-hero rounded-t-xl">
                    <div>
                      <h2 className="text-lg font-bold text-primary-foreground">
                        {language === 'id' ? 'Kalender Hijriah' : 'Hijri Calendar'}
                      </h2>
                      <p className="text-sm text-primary-foreground/80">
                        {hijriDate.formattedDate}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsModalOpen(false)}
                      className="text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Current Date Display */}
                  <div className="p-6 text-center border-b border-border">
                    <p className="text-4xl font-bold text-primary mb-2">{hijriDate.day}</p>
                    <p className="text-lg font-semibold text-foreground">{hijriDate.monthName}</p>
                    <p className="text-2xl font-amiri text-muted-foreground">{hijriDate.monthNameAr}</p>
                    <p className="text-sm text-muted-foreground mt-1">{hijriDate.year} H</p>
                  </div>

                  {/* Today's Events */}
                  {todayEvents.length > 0 && (
                    <div className="p-4 border-b border-border bg-primary/5">
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        {language === 'id' ? 'Hari Ini' : 'Today'}
                      </h3>
                      {todayEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-1">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {language === 'id' ? event.name : event.nameEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sunnah Fasting */}
                  {fastingMessage && (
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-hope/20">
                        <span className="text-lg">🌙</span>
                        <span className="text-sm font-medium text-foreground">{fastingMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Events */}
                  <div className="p-4 max-h-64 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      {language === 'id' ? 'Hari Besar Islam Mendatang' : 'Upcoming Islamic Events'}
                    </h3>
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted"
                          >
                            <div className={`h-2 w-2 rounded-full ${
                              event.type === 'major' ? 'bg-primary' : 
                              event.type === 'sunnah' ? 'bg-hope' : 'bg-spiritual'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {language === 'id' ? event.name : event.nameEn}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.date.split('-').reverse().join('/')} (Hijriah)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {language === 'id' ? 'Tidak ada hari besar dalam 30 hari ke depan' : 'No major events in the next 30 days'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
