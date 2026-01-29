import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Bookmark, Play, Flame, AlertTriangle } from "lucide-react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStreak } from "@/hooks/useStreak";
import { videoDatabase } from "@/data/videos";
import heroMosque from "@/assets/hero-mosque.jpg";

interface BookmarkedAyah {
  surahNumber: number;
  surahName: string;
  surahArabic?: string;
  ayahNumber: number;
  text: string;
  translation: string;
  showOnCarousel?: boolean;
}

interface HeroCarouselProps {
  onNavigate?: (tab: string) => void;
  onOpenAyah?: (surahNumber: number, ayahNumber: number) => void;
}

export const HeroCarousel = ({ onNavigate, onOpenAyah }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<BookmarkedAyah[]>([]);
  const { times, location } = usePrayerTimes();
  const { language } = useLanguage();
  const { streakCount, yellowCardsThisWeek, todayStatus, isStreakAtRisk } = useStreak();

  const totalSlides = 5; // Now 5 slides with streak

  // Load bookmarks from localStorage
  useEffect(() => {
    const loadBookmarks = () => {
      const saved = localStorage.getItem('istiqamah_bookmarks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBookmarkedAyahs(parsed);
        } catch (e) {
          console.error('Error parsing bookmarks:', e);
        }
      }
    };
    
    loadBookmarks();
    
    // Listen for storage changes
    const handleStorageChange = () => loadBookmarks();
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('bookmarks-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookmarks-updated', handleStorageChange);
    };
  }, []);

  // Auto-advance slides every 5 seconds (only if user hasn't interacted)
  useEffect(() => {
    if (userInteracted) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [userInteracted]);

  const goToSlide = (index: number) => {
    setUserInteracted(true);
    setCurrentSlide(index);
  };

  const goNext = () => {
    setUserInteracted(true);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goPrev = () => {
    setUserInteracted(true);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Prayer times data (no emoji icons)
  const prayerList = times
    ? [
        { name: "Subuh", time: times.Fajr },
        { name: "Dzuhur", time: times.Dhuhr },
        { name: "Ashar", time: times.Asr },
        { name: "Maghrib", time: times.Maghrib },
        { name: "Isya", time: times.Isha },
      ]
    : [];

  // Get latest video from database
  const latestVideo = videoDatabase[0];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderSlide = (index: number) => {
    switch (index) {
      case 0:
        // Slide 1: Branding
        return (
          <div className="relative h-full w-full">
            <img
              src={heroMosque}
              alt="Mosque at sunrise"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="font-arabic text-xl text-primary-foreground leading-relaxed mb-1">
                ۞ اِسْتِقَامَة ۞
              </p>
              <h1 className="text-lg font-bold text-primary-foreground">Istiqamah</h1>
              <p className="text-xs text-primary-foreground/80">
                {language === 'id' ? 'Langkah Menuju Kebaikan' : 'Steps Toward Goodness'}
              </p>
            </div>
          </div>
        );

      case 1:
        // Slide 2: Prayer Times
        return (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                {language === 'id' ? 'Jadwal Shalat' : 'Prayer Times'}
              </h3>
              {location && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {location.city}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {prayerList.map((prayer) => (
                <div key={prayer.name} className="text-center bg-card/40 rounded-lg py-2 px-1">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{prayer.name}</p>
                  <p className="text-sm font-bold text-foreground">{prayer.time}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        // Slide 3: Featured Ayah (1 large ayah that has showOnCarousel = true)
        const featuredAyah = bookmarkedAyahs.find(a => a.showOnCarousel);
        
        return (
          <div 
            className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 p-4 flex flex-col cursor-pointer"
            onClick={() => featuredAyah 
              ? onOpenAyah?.(featuredAyah.surahNumber, featuredAyah.ayahNumber)
              : onNavigate?.("quran")
            }
          >
            {featuredAyah ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary fill-primary" />
                    <span className="text-xs font-medium text-primary">
                      {featuredAyah.surahName} : {featuredAyah.ayahNumber}
                    </span>
                  </div>
                  <span className="font-arabic text-sm text-primary">
                    {featuredAyah.surahArabic || ''}
                  </span>
                </div>
                
                {/* Arabic Text - Large */}
                <div className="flex-1 flex items-center justify-center">
                  <p className="font-arabic text-xl text-foreground text-center leading-loose line-clamp-3" dir="rtl">
                    {featuredAyah.text}
                  </p>
                </div>
                
                {/* Translation */}
                <p className="text-xs text-muted-foreground text-center line-clamp-2 mt-2">
                  {featuredAyah.translation}
                </p>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  {language === 'id' 
                    ? 'Belum ada ayat ditampilkan' 
                    : 'No featured verse yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'id'
                    ? 'Pilih "Tampilkan di Beranda" saat menyimpan ayat'
                    : 'Choose "Show on Home" when saving a verse'}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.("quran");
                  }}
                  className="text-xs text-primary mt-2 hover:underline"
                >
                  {language === 'id' ? 'Baca Al-Qur\'an →' : 'Read Quran →'}
                </button>
              </div>
            )}
          </div>
        );

      case 3:
        // Slide 4: Latest Video from database
        return (
          <div className="h-full w-full relative">
            <img
              src={latestVideo.thumbnail}
              alt={latestVideo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => window.open(latestVideo.youtubeUrl, '_blank')}
                className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-primary-foreground/80 bg-primary/60 px-2 py-0.5 rounded-full">
                  {latestVideo.category}
                </span>
                <span className="text-[10px] text-primary-foreground/70">
                  {latestVideo.duration}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-primary-foreground line-clamp-1">
                {latestVideo.title}
              </h3>
              <p className="text-[10px] text-primary-foreground/70">
                {latestVideo.speaker}
              </p>
            </div>
          </div>
        );

      case 4:
        // Slide 5: Streak Status
        return (
          <div 
            className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 p-4 pb-8 flex flex-col justify-center cursor-pointer"
            onClick={() => onNavigate?.("tasks")}
          >
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className={`h-5 w-5 ${streakCount > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <h3 className="font-semibold text-sm text-foreground">
                {language === 'id' ? 'Status Streak' : 'Streak Status'}
              </h3>
            </div>

            {/* Streak Count */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center gap-2">
                <span className={`text-4xl font-bold ${streakCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {streakCount}
                </span>
                <Flame className={`h-6 w-6 ${streakCount > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'id' ? 'Hari berturut-turut' : 'Days in a row'}
              </p>
            </div>

            {/* Yellow Cards Status */}
            <div className="flex items-center justify-center">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                yellowCardsThisWeek.length > 0 
                  ? 'bg-yellow-500/20 text-yellow-600' 
                  : 'bg-primary/10 text-primary'
              }`}>
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">
                  {yellowCardsThisWeek.length}/3 {language === 'id' ? 'Kartu Kuning' : 'Yellow Cards'}
                </span>
              </div>
            </div>

            {/* Status Message */}
            <div className="mt-2 text-center">
              {yellowCardsThisWeek.length >= 3 ? (
                <p className="text-[10px] text-destructive font-medium">
                  ⚠️ {language === 'id' ? 'Streak direset! Yuk mulai lagi.' : 'Streak reset! Start again.'}
                </p>
              ) : isStreakAtRisk ? (
                <p className="text-[10px] text-yellow-600 font-medium">
                  ⚠️ {language === 'id' ? '1 kartu lagi = reset streak' : '1 more card = reset'}
                </p>
              ) : todayStatus === 'completed' ? (
                <p className="text-[10px] text-primary font-medium">
                  ✅ {language === 'id' ? 'Target hari ini tercapai!' : 'Today\'s targets done!'}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {language === 'id' ? 'Selesaikan target "Sangat Penting" sebelum 00:00' : 'Complete important targets before midnight'}
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative mx-5 mb-6 overflow-hidden rounded-2xl h-48 bg-card">
      {/* Slides */}
      <AnimatePresence mode="wait" custom={currentSlide}>
        <motion.div
          key={currentSlide}
          custom={currentSlide}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {renderSlide(currentSlide)}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors z-10"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors z-10"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {[...Array(totalSlides)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentSlide 
                ? 'w-4 bg-primary' 
                : 'w-1.5 bg-primary-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
