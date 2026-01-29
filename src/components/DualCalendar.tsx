import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Star, Moon, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface HijriDate {
  day: number;
  month: number;
  monthName: string;
  monthNameAr: string;
  year: number;
}

interface IslamicEvent {
  date: string;
  name: string;
  nameEn: string;
  type: 'major' | 'sunnah' | 'fasting';
}

// Islamic calendar events (Hijri dates)
const islamicEvents: IslamicEvent[] = [
  { date: "01-01", name: "Tahun Baru Islam", nameEn: "Islamic New Year", type: "major" },
  { date: "10-01", name: "Hari Asyura", nameEn: "Day of Ashura", type: "sunnah" },
  { date: "12-03", name: "Maulid Nabi Muhammad ﷺ", nameEn: "Prophet's Birthday", type: "major" },
  { date: "27-07", name: "Isra Mi'raj", nameEn: "Isra Mi'raj", type: "major" },
  { date: "15-08", name: "Nisfu Sya'ban", nameEn: "Mid-Sha'ban", type: "sunnah" },
  { date: "01-09", name: "Awal Ramadhan", nameEn: "Start of Ramadan", type: "major" },
  { date: "17-09", name: "Nuzulul Qur'an", nameEn: "Quran Revelation", type: "major" },
  { date: "21-09", name: "Lailatul Qadr (Perkiraan)", nameEn: "Night of Power (Est.)", type: "major" },
  { date: "01-10", name: "Idul Fitri", nameEn: "Eid al-Fitr", type: "major" },
  { date: "09-12", name: "Hari Arafah", nameEn: "Day of Arafah", type: "sunnah" },
  { date: "10-12", name: "Idul Adha", nameEn: "Eid al-Adha", type: "major" },
  { date: "11-12", name: "Hari Tasyrik 1", nameEn: "Tashreeq Day 1", type: "sunnah" },
  { date: "12-12", name: "Hari Tasyrik 2", nameEn: "Tashreeq Day 2", type: "sunnah" },
  { date: "13-12", name: "Hari Tasyrik 3", nameEn: "Tashreeq Day 3", type: "sunnah" },
];

const hijriMonthNames = [
  { ar: "محرم", id: "Muharram" },
  { ar: "صفر", id: "Safar" },
  { ar: "ربيع الأول", id: "Rabiul Awal" },
  { ar: "ربيع الثاني", id: "Rabiul Akhir" },
  { ar: "جمادى الأولى", id: "Jumadil Awal" },
  { ar: "جمادى الآخرة", id: "Jumadil Akhir" },
  { ar: "رجب", id: "Rajab" },
  { ar: "شعبان", id: "Sya'ban" },
  { ar: "رمضان", id: "Ramadhan" },
  { ar: "شوال", id: "Syawal" },
  { ar: "ذو القعدة", id: "Dzulqa'dah" },
  { ar: "ذو الحجة", id: "Dzulhijjah" },
];

const gregorianMonthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Convert Gregorian to Hijri
function gregorianToHijri(date: Date): HijriDate {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth();
  const gregorianDay = date.getDate();

  let jd = Math.floor((1461 * (gregorianYear + 4800 + Math.floor((gregorianMonth - 14) / 12))) / 4) +
           Math.floor((367 * (gregorianMonth - 2 - 12 * Math.floor((gregorianMonth - 14) / 12))) / 12) -
           Math.floor((3 * Math.floor((gregorianYear + 4900 + Math.floor((gregorianMonth - 14) / 12)) / 100)) / 4) +
           gregorianDay - 32075;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
            Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  const monthData = hijriMonthNames[month - 1] || { ar: "", id: "" };

  return {
    day,
    month,
    monthName: monthData.id,
    monthNameAr: monthData.ar,
    year,
  };
}

interface DualCalendarProps {
  compact?: boolean;
  onModalToggle?: (isOpen: boolean) => void;
}

export const DualCalendar = ({ compact = false, onModalToggle }: DualCalendarProps) => {
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Notify parent when modal state changes
  const handleModalOpen = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    onModalToggle?.(isOpen);
  };

  const today = new Date();
  const todayHijri = gregorianToHijri(today);

  // Check if today is a sunnah fasting day
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;
  const isThursday = dayOfWeek === 4;
  const isAyyamulBidh = [13, 14, 15].includes(todayHijri.day);

  const getFastingMessage = () => {
    if (isMonday) return language === 'id' ? 'Hari Puasa Sunnah Senin' : 'Monday Sunnah Fasting';
    if (isThursday) return language === 'id' ? 'Hari Puasa Sunnah Kamis' : 'Thursday Sunnah Fasting';
    if (isAyyamulBidh) return language === 'id' ? 'Puasa Ayyamul Bidh' : 'Ayyamul Bidh Fasting';
    return null;
  };

  const fastingMessage = getFastingMessage();

  // Get today's events
  const todayKey = `${todayHijri.day.toString().padStart(2, '0')}-${todayHijri.month.toString().padStart(2, '0')}`;
  const todayEvents = islamicEvents.filter(e => e.date === todayKey);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ gregorian: Date; hijri: HijriDate; isCurrentMonth: boolean }> = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        gregorian: date,
        hijri: gregorianToHijri(date),
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        gregorian: date,
        hijri: gregorianToHijri(date),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        gregorian: date,
        hijri: gregorianToHijri(date),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  // Get events for a specific date
  const getEventsForDate = (hijri: HijriDate) => {
    const dateKey = `${hijri.day.toString().padStart(2, '0')}-${hijri.month.toString().padStart(2, '0')}`;
    return islamicEvents.filter(e => e.date === dateKey);
  };

  // Check if date has sunnah fasting
  const hasSunnahFasting = (gregorian: Date, hijri: HijriDate) => {
    const dayOfWeek = gregorian.getDay();
    const isMonday = dayOfWeek === 1;
    const isThursday = dayOfWeek === 4;
    const isAyyamulBidh = [13, 14, 15].includes(hijri.day);
    return isMonday || isThursday || isAyyamulBidh;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const selectedDateHijri = selectedDate ? gregorianToHijri(selectedDate) : null;
  const selectedDateEvents = selectedDateHijri ? getEventsForDate(selectedDateHijri) : [];
  const selectedDateHasFasting = selectedDate && selectedDateHijri 
    ? hasSunnahFasting(selectedDate, selectedDateHijri) 
    : false;

  if (compact) {
    return (
      <button
        onClick={() => handleModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Moon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {todayHijri.day} {todayHijri.monthName} {todayHijri.year} H
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
        onClick={() => handleModalOpen(true)}
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
                    {todayHijri.day} {todayHijri.monthName} {todayHijri.year} H
                  </p>
                  <p className="text-xs text-muted-foreground font-amiri">
                    {todayHijri.day} {todayHijri.monthNameAr} {todayHijri.year}
                  </p>
                </div>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>

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

      {/* Full Calendar Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => handleModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-card border-border shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
              <CardContent className="p-0 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between gradient-hero shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-primary-foreground">
                      {language === 'id' ? 'Kalender' : 'Calendar'}
                    </h2>
                    <p className="text-sm text-primary-foreground/80">
                      {gregorianMonthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleModalOpen(false)}
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Month Navigation */}
                <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
                  <Button variant="ghost" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {gregorianMonthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Calendar Grid - Scrollable */}
                <div className="p-3 overflow-y-auto flex-1">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const events = getEventsForDate(day.hijri);
                      const hasFasting = hasSunnahFasting(day.gregorian, day.hijri);
                      const isTodayDate = isToday(day.gregorian);
                      const isSelected = selectedDate?.toDateString() === day.gregorian.toDateString();

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(day.gregorian)}
                          className={`
                            relative p-1 rounded-lg text-center transition-all min-h-[52px] flex flex-col justify-center
                            ${!day.isCurrentMonth ? 'opacity-40' : ''}
                            ${isTodayDate ? 'bg-primary text-primary-foreground' : ''}
                            ${isSelected && !isTodayDate ? 'bg-primary/20 ring-2 ring-primary' : ''}
                            ${!isTodayDate && !isSelected ? 'hover:bg-muted' : ''}
                          `}
                        >
                          {/* Gregorian Date */}
                          <span className={`text-sm font-semibold ${isTodayDate ? 'text-primary-foreground' : 'text-foreground'}`}>
                            {day.gregorian.getDate()}
                          </span>
                          {/* Hijri Date */}
                          <span className={`text-[10px] ${isTodayDate ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {day.hijri.day}
                          </span>
                          {/* Event/Fasting Indicator */}
                          {(events.length > 0 || hasFasting) && (
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {events.length > 0 && (
                                <div className={`h-1 w-1 rounded-full ${
                                  events[0].type === 'major' ? 'bg-primary' : 'bg-hope'
                                }`} />
                              )}
                              {hasFasting && events.length === 0 && (
                                <div className="h-1 w-1 rounded-full bg-spiritual" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Details */}
                {selectedDate && (
                  <div className="p-3 border-t border-border bg-muted/50 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedDate.getDate()} {gregorianMonthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </p>
                        {selectedDateHijri && (
                          <p className="text-xs text-muted-foreground">
                            {selectedDateHijri.day} {selectedDateHijri.monthName} {selectedDateHijri.year} H
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedDateEvents.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {selectedDateEvents.map((event, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                            <Star className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              {language === 'id' ? event.name : event.nameEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDateHasFasting && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-spiritual/10">
                        <span>🌙</span>
                        <span className="text-sm text-foreground">
                          {(() => {
                            const dow = selectedDate.getDay();
                            if (dow === 1) return language === 'id' ? 'Puasa Sunnah Senin' : 'Monday Fasting';
                            if (dow === 4) return language === 'id' ? 'Puasa Sunnah Kamis' : 'Thursday Fasting';
                            if (selectedDateHijri && [13, 14, 15].includes(selectedDateHijri.day)) {
                              return language === 'id' ? 'Puasa Ayyamul Bidh' : 'Ayyamul Bidh';
                            }
                            return '';
                          })()}
                        </span>
                      </div>
                    )}

                    {selectedDateEvents.length === 0 && !selectedDateHasFasting && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {language === 'id' ? 'Tidak ada agenda Islam' : 'No Islamic events'}
                      </p>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="p-3 border-t border-border shrink-0">
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{language === 'id' ? 'Hari Besar' : 'Major Event'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-hope" />
                      <span>{language === 'id' ? 'Sunnah' : 'Sunnah'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-spiritual" />
                      <span>{language === 'id' ? 'Puasa' : 'Fasting'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
