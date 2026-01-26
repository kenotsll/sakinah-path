import { useState, useEffect, useRef } from "react";
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
  Loader2
} from "lucide-react";
import { useQuran, Surah, SurahDetail, Ayah } from "@/hooks/useQuran";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t, language } = useLanguage();
  
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
const AyahCard = ({ ayah, surahNumber }: { ayah: Ayah; surahNumber: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(ayah.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
              className="h-8 w-8"
              onClick={toggleAudio}
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

// Surah Detail Component
const SurahDetailView = ({ 
  surah, 
  onBack 
}: { 
  surah: SurahDetail; 
  onBack: () => void;
}) => {
  const [playingAll, setPlayingAll] = useState(false);

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <AyahCard ayah={ayah} surahNumber={surah.number} />
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
  }, [fetchSurahs]);

  const filteredSurahs = searchSurahs(searchQuery);

  const handleSelectSurah = (surahNumber: number) => {
    fetchSurahDetail(surahNumber);
  };

  if (currentSurah) {
    return <SurahDetailView surah={currentSurah} onBack={clearCurrentSurah} />;
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
