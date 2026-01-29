import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Bookmark, Play } from "lucide-react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useLanguage } from "@/contexts/LanguageContext";
import { videoDatabase } from "@/data/videos";
import heroMosque from "@/assets/hero-mosque.jpg";

interface BookmarkedAyah {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  translation: string;
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

  const totalSlides = 4;

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
        // Slide 3: Bookmarked Ayahs (max 3, with translation)
        return (
          <div className="h-full w-full bg-gradient-to-br from-accent/20 via-accent/10 to-primary/20 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                {language === 'id' ? 'Ayat Tersimpan' : 'Bookmarked Verses'}
              </h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {bookmarkedAyahs.length} ayat
              </span>
            </div>
            {bookmarkedAyahs.length > 0 ? (
              <div className="flex-1 overflow-hidden space-y-1.5">
                {bookmarkedAyahs.slice(0, 3).map((ayah, idx) => (
                  <div 
                    key={idx} 
                    className="bg-card/60 rounded-lg p-2 cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => onOpenAyah?.(ayah.surahNumber, ayah.ayahNumber)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-arabic text-xs text-foreground text-right leading-relaxed line-clamp-1" dir="rtl">
                          {ayah.text}
                        </p>
                        <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">
                          {ayah.translation}
                        </p>
                      </div>
                      <span className="text-[9px] text-primary shrink-0">
                        {ayah.surahName}:{ayah.ayahNumber}
                      </span>
                    </div>
                  </div>
                ))}
                {bookmarkedAyahs.length > 3 && (
                  <button 
                    onClick={() => onNavigate?.("quran")}
                    className="text-[10px] text-primary hover:underline w-full text-center pt-1"
                  >
                    +{bookmarkedAyahs.length - 3} {language === 'id' ? 'ayat lainnya' : 'more verses'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Bookmark className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {language === 'id' 
                    ? 'Belum ada ayat tersimpan' 
                    : 'No bookmarked verses yet'}
                </p>
                <button 
                  onClick={() => onNavigate?.("quran")}
                  className="text-xs text-primary mt-1 hover:underline"
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
