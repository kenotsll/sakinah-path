import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Book, 
  Search, 
  ChevronLeft, 
  Play, 
  Pause, 
  Volume2, 
  Bookmark,
  ChevronDown,
  ChevronUp,
  Loader2,
  SkipForward,
  SkipBack,
  VolumeX
} from "lucide-react";
import { useQuran, Surah, SurahDetail, Ayah } from "@/hooks/useQuran";
import { useLanguage } from "@/contexts/LanguageContext";

// Global audio manager for continuous playback
let globalAudio: HTMLAudioElement | null = null;
let globalPlayingAyahId: number | null = null;
let globalOnPlayingChange: ((ayahId: number | null) => void) | null = null;

const stopGlobalAudio = () => {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.src = '';
    globalAudio = null;
  }
  globalPlayingAyahId = null;
  globalOnPlayingChange?.(null);
};

// Surah List Component
const SurahList = ({ 
  surahs, 
  onSelect, 
  searchQuery, 
  onSearchChange 
}: { 
  surahs: Surah[]; 
  onSelect: (num: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) => {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={language === 'id' ? 'Cari surah...' : 'Search surah...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Surah List */}
      <div className="px-5 space-y-2 pb-32">
        {surahs.map((surah, index) => (
          <motion.div
            key={surah.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card 
              className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelect(surah.number)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{surah.number}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{surah.englishName}</h3>
                    <span className="font-arabic text-lg text-primary">{surah.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{surah.englishNameTranslation}</span>
                    <span>•</span>
                    <span>{surah.numberOfAyahs} Ayat</span>
                    <span>•</span>
                    <span>{surah.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Ayah Card Component with Audio
const AyahCard = ({ 
  ayah, 
  surahNumber, 
  isPlaying,
  onPlay,
  onPause,
}: { 
  ayah: Ayah; 
  surahNumber: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Ayah Number & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {ayah.numberInSurah}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Juz {ayah.juz} • Hal {ayah.page}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${isPlaying ? 'text-primary bg-primary/10' : ''}`}
              onClick={isPlaying ? onPause : onPlay}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-primary" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Arabic Text */}
        <p className="font-arabic text-2xl text-foreground text-right leading-loose" dir="rtl">
          {ayah.text}
        </p>

        {/* Translation */}
        <div className="pt-2 border-t border-border">
          <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && 'line-clamp-2'}`}>
            {ayah.translation}
          </p>
          {ayah.translation && ayah.translation.length > 120 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto mt-1 text-xs text-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>Sembunyikan <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Selengkapnya <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Surah Detail Component with Continuous Playback
const SurahDetailView = ({ 
  surah, 
  onBack 
}: { 
  surah: SurahDetail; 
  onBack: () => void;
}) => {
  const { language } = useLanguage();
  const [playingAyahId, setPlayingAyahId] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Register the global callback
  useEffect(() => {
    globalOnPlayingChange = (ayahId) => {
      setPlayingAyahId(ayahId);
      if (ayahId === null) {
        setIsPlayingAll(false);
      }
    };

    return () => {
      globalOnPlayingChange = null;
    };
  }, []);

  // Stop audio when leaving the page
  useEffect(() => {
    return () => {
      stopGlobalAudio();
    };
  }, []);

  // Handle visibility change - stop audio when leaving
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopGlobalAudio();
        setIsPlayingAll(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const playAyah = useCallback((ayah: Ayah, continueToNext: boolean = false) => {
    stopGlobalAudio();

    globalAudio = new Audio(ayah.audioUrl);
    globalPlayingAyahId = ayah.number;
    setPlayingAyahId(ayah.number);

    globalAudio.onended = () => {
      if (continueToNext) {
        // Find next ayah
        const currentIndex = surah.ayahs.findIndex(a => a.number === ayah.number);
        if (currentIndex < surah.ayahs.length - 1) {
          const nextAyah = surah.ayahs[currentIndex + 1];
          // Scroll to next ayah
          const nextRef = ayahRefs.current.get(nextAyah.number);
          nextRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Play next
          setTimeout(() => playAyah(nextAyah, true), 300);
        } else {
          // End of surah
          stopGlobalAudio();
          setIsPlayingAll(false);
        }
      } else {
        stopGlobalAudio();
      }
    };

    globalAudio.onerror = () => {
      console.error('Audio playback error');
      stopGlobalAudio();
    };

    globalAudio.play().catch(err => {
      console.error('Play failed:', err);
      stopGlobalAudio();
    });
  }, [surah.ayahs]);

  const handlePlayAll = () => {
    if (isPlayingAll) {
      stopGlobalAudio();
      setIsPlayingAll(false);
    } else {
      setIsPlayingAll(true);
      if (surah.ayahs.length > 0) {
        playAyah(surah.ayahs[0], true);
      }
    }
  };

  const handlePlaySingleAyah = (ayah: Ayah) => {
    if (playingAyahId === ayah.number) {
      stopGlobalAudio();
    } else {
      setIsPlayingAll(false);
      playAyah(ayah, false);
    }
  };

  const handleBack = () => {
    stopGlobalAudio();
    onBack();
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-foreground">{surah.englishName}</h1>
              <span className="font-arabic text-lg text-primary">{surah.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {surah.englishNameTranslation} • {surah.numberOfAyahs} Ayat
            </p>
          </div>
        </div>

        {/* Play All Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <Button
            variant={isPlayingAll ? "default" : "outline"}
            size="sm"
            onClick={handlePlayAll}
            className={isPlayingAll ? "gradient-hero text-primary-foreground" : ""}
          >
            {isPlayingAll ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                {language === 'id' ? 'Hentikan' : 'Stop'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                {language === 'id' ? 'Putar Semua' : 'Play All'}
              </>
            )}
          </Button>
          {isPlayingAll && playingAyahId && (
            <span className="text-xs text-primary animate-pulse">
              ▶ Ayat {surah.ayahs.find(a => a.number === playingAyahId)?.numberInSurah || '...'}
            </span>
          )}
        </div>
      </div>

      {/* Bismillah (except for At-Taubah) */}
      {surah.number !== 9 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-5 py-6"
        >
          <div className="text-center">
            <p className="font-arabic text-2xl text-primary leading-relaxed">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Dengan nama Allah Yang Maha Pengasih, Maha Penyayang
            </p>
          </div>
        </motion.div>
      )}

      {/* Ayahs */}
      <div className="px-5 space-y-3">
        {surah.ayahs.map((ayah, index) => (
          <motion.div
            key={ayah.number}
            ref={(el) => {
              if (el) ayahRefs.current.set(ayah.number, el);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <AyahCard 
              ayah={ayah} 
              surahNumber={surah.number}
              isPlaying={playingAyahId === ayah.number}
              onPlay={() => handlePlaySingleAyah(ayah)}
              onPause={() => stopGlobalAudio()}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main Quran Page
export const QuranPage = () => {
  const { t, language } = useLanguage();
  const { 
    surahs, 
    currentSurah, 
    loading, 
    error, 
    fetchSurahs, 
    fetchSurahDetail,
    searchSurahs,
    clearCurrentSurah 
  } = useQuran();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSurahs();
    // Stop any playing audio when component mounts fresh
    stopGlobalAudio();
  }, [fetchSurahs]);

  // Stop audio when unmounting
  useEffect(() => {
    return () => {
      stopGlobalAudio();
    };
  }, []);

  const filteredSurahs = searchSurahs(searchQuery);

  const handleSelectSurah = (surahNumber: number) => {
    stopGlobalAudio();
    fetchSurahDetail(surahNumber);
  };

  const handleBack = () => {
    stopGlobalAudio();
    clearCurrentSurah();
  };

  if (currentSurah) {
    return <SurahDetailView surah={currentSurah} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Book className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Al-Qur'an</h1>
            <p className="text-sm text-muted-foreground">
              {language === 'id' ? '114 Surah • Audio & Terjemahan' : '114 Surahs • Audio & Translation'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && surahs.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && surahs.length === 0 && (
        <div className="px-5 py-20 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSurahs} variant="outline">
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* Surah List */}
      {surahs.length > 0 && (
        <SurahList
          surahs={filteredSurahs}
          onSelect={handleSelectSurah}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Loading Surah Detail */}
      {loading && surahs.length > 0 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Memuat surah...</p>
          </div>
        </div>
      )}
    </div>
  );
};
