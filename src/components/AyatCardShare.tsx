import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toPng } from "html-to-image";
import { Ayah } from "@/hooks/useQuran";

interface AyatCardShareProps {
  isOpen: boolean;
  onClose: () => void;
  surahName: string;
  surahArabic: string;
  surahNumber: number;
  ayahs: Ayah[];
  initialAyahIndex: number;
}

// Theme configurations - Spotify-style solid colors
type ThemeType = 'mercy' | 'reminder' | 'history';

interface Theme {
  name: string;
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
}

const THEMES: Record<ThemeType, Theme> = {
  mercy: {
    name: 'Rahmat',
    background: '#1a3d34', // Dark sage background
    cardBackground: '#2D5A4C', // Sage/Emerald card
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.85)',
  },
  reminder: {
    name: 'Pengingat',
    background: '#1a2530', // Dark blue background
    cardBackground: '#2C3E50', // Charcoal/Deep Blue card
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.85)',
  },
  history: {
    name: 'Sejarah',
    background: '#2a2218', // Dark earth background
    cardBackground: '#5D4E37', // Soft Sand/Earth Tone card
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.9)',
  },
};

// Determine theme based on surah number
const getSurahTheme = (surahNumber: number): ThemeType => {
  const mercySurahs = [1, 12, 19, 36, 55, 56, 67, 78, 93, 94, 95, 97, 108, 110];
  const historySurahs = [2, 3, 4, 5, 7, 10, 11, 14, 15, 18, 20, 21, 26, 27, 28, 37, 38, 40, 71];
  
  if (mercySurahs.includes(surahNumber)) return 'mercy';
  if (historySurahs.includes(surahNumber)) return 'history';
  return 'reminder';
};

// Check if text is "long"
const isLongText = (text: string): boolean => {
  return text.length > 150;
};

export const AyatCardShare = ({ 
  isOpen, 
  onClose, 
  surahName, 
  surahArabic, 
  surahNumber,
  ayahs,
  initialAyahIndex,
}: AyatCardShareProps) => {
  const { language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedAyahs, setSelectedAyahs] = useState<number[]>([initialAyahIndex]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(getSurahTheme(surahNumber));

  const theme = THEMES[currentTheme];

  // Reset when modal opens with new ayah
  useEffect(() => {
    if (isOpen) {
      setSelectedAyahs([initialAyahIndex]);
      setCurrentTheme(getSurahTheme(surahNumber));
    }
  }, [isOpen, initialAyahIndex, surahNumber]);

  // Smart selection logic
  const canSelectMore = useMemo(() => {
    if (selectedAyahs.length >= 5) return false;
    const hasLongAyah = selectedAyahs.some(idx => 
      ayahs[idx] && isLongText(ayahs[idx].text)
    );
    return !hasLongAyah && selectedAyahs.length < 5;
  }, [selectedAyahs, ayahs]);

  // Get combined text for selected ayahs
  const selectedContent = useMemo(() => {
    const sorted = [...selectedAyahs].sort((a, b) => a - b);
    return sorted.map(idx => ayahs[idx]).filter(Boolean);
  }, [selectedAyahs, ayahs]);

  const combinedArabic = selectedContent.map(a => a.text).join(' ');
  const combinedTranslation = selectedContent.map(a => a.translation).join(' ');

  // Ayah range text
  const ayahRangeText = useMemo(() => {
    const sorted = [...selectedAyahs].sort((a, b) => a - b);
    if (sorted.length === 1) {
      return `Ayat ${ayahs[sorted[0]]?.numberInSurah}`;
    }
    const first = ayahs[sorted[0]]?.numberInSurah;
    const last = ayahs[sorted[sorted.length - 1]]?.numberInSurah;
    return `Ayat ${first}-${last}`;
  }, [selectedAyahs, ayahs]);

  const toggleAyahSelection = (index: number) => {
    setSelectedAyahs(prev => {
      if (prev.includes(index)) {
        if (prev.length === 1) return prev;
        return prev.filter(i => i !== index);
      }
      
      if (ayahs[index] && isLongText(ayahs[index].text)) {
        return [index];
      }
      
      if (prev.length >= 5) return prev;
      
      const hasLong = prev.some(i => ayahs[i] && isLongText(ayahs[i].text));
      if (hasLong) return prev;
      
      return [...prev, index];
    });
  };

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `istiqamah-${surahName}-${ayahRangeText.replace(/\s/g, '')}.png`;
      link.href = dataUrl;
      link.click();
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [surahName, ayahRangeText]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      
      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `istiqamah-${surahName}.png`, { type: 'image/png' });
      
      // Try native share first
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${surahName} - ${ayahRangeText}`,
          text: `${surahName} ${ayahRangeText} - Istiqamah App`,
        });
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      } else {
        // Fallback to download
        handleExport();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        handleExport();
      }
    } finally {
      setIsExporting(false);
    }
  }, [surahName, ayahRangeText, handleExport]);

  const cycleTheme = () => {
    const themes: ThemeType[] = ['mercy', 'reminder', 'history'];
    const currentIndex = themes.indexOf(currentTheme);
    setCurrentTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const navigateAyah = (direction: 'prev' | 'next') => {
    const currentFirst = Math.min(...selectedAyahs);
    const newIndex = direction === 'prev' ? currentFirst - 1 : currentFirst + 1;
    if (newIndex >= 0 && newIndex < ayahs.length) {
      setSelectedAyahs([newIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto"
          style={{ background: theme.background }}
        >
          {/* Header */}
          <div 
            className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
            style={{ background: theme.background }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-semibold text-white">
              {language === 'id' ? 'Bagikan Ayat' : 'Share Verse'}
            </h2>
            <div className="w-10" />
          </div>

          <div className="p-4 space-y-4 pb-8">
            {/* Theme Selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">
                {language === 'id' ? 'Tema:' : 'Theme:'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={cycleTheme}
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ background: theme.cardBackground }}
                />
                {theme.name}
              </Button>
            </div>

            {/* Spotify-Style Card Preview */}
            <div 
              ref={cardRef}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ 
                background: theme.background,
                aspectRatio: '9/16',
                maxHeight: '65vh',
              }}
            >
              {/* Full Card with centered content */}
              <div 
                className="w-full h-full flex flex-col p-6"
                style={{ background: theme.background }}
              >
                {/* Top - Surah Info */}
                <div className="flex items-center gap-3 mb-auto">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: theme.cardBackground }}
                  >
                    <span className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                      {surahNumber}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-base" style={{ color: theme.textPrimary }}>
                      {surahName}
                    </p>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {ayahRangeText}
                    </p>
                  </div>
                </div>

                {/* Center - Main Content Card */}
                <div 
                  className="rounded-2xl p-6 my-4"
                  style={{ background: theme.cardBackground }}
                >
                  {/* Arabic Text - Large and readable */}
                  <p 
                    className="text-center leading-[2] mb-6 font-arabic"
                    style={{ 
                      color: theme.textPrimary,
                      fontSize: combinedArabic.length > 200 ? '1.25rem' : combinedArabic.length > 100 ? '1.5rem' : '1.75rem',
                    }}
                    dir="rtl"
                  >
                    {combinedArabic}
                  </p>

                  {/* Translation - Readable size */}
                  {combinedTranslation && (
                    <p 
                      className="text-center leading-relaxed"
                      style={{ 
                        color: theme.textSecondary,
                        fontSize: combinedTranslation.length > 200 ? '0.875rem' : '1rem',
                      }}
                    >
                      "{combinedTranslation}"
                    </p>
                  )}
                </div>

                {/* Bottom - Branding */}
                <div className="flex items-center gap-2 mt-auto">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: theme.cardBackground }}
                  >
                    <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>
                      إ
                    </span>
                  </div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.textSecondary }}
                  >
                    Istiqamah
                  </span>
                </div>
              </div>
            </div>

            {/* Ayah Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateAyah('prev')}
                disabled={Math.min(...selectedAyahs) === 0}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-white/80">
                {ayahRangeText}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateAyah('next')}
                disabled={Math.max(...selectedAyahs) >= ayahs.length - 1}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Multi-select hint */}
            {canSelectMore && (
              <p className="text-xs text-center text-white/60">
                {language === 'id' 
                  ? 'Tap ayat di bawah untuk menambah pilihan (maks 5 ayat pendek)'
                  : 'Tap verses below to add (max 5 short verses)'}
              </p>
            )}

            {/* Ayah Selection Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {ayahs.slice(Math.max(0, initialAyahIndex - 2), initialAyahIndex + 5).map((ayah, idx) => {
                const realIndex = Math.max(0, initialAyahIndex - 2) + idx;
                const isSelected = selectedAyahs.includes(realIndex);
                const isLong = isLongText(ayah.text);
                
                return (
                  <button
                    key={ayah.number}
                    onClick={() => toggleAyahSelection(realIndex)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-white/70 hover:text-white'
                    }`}
                    style={{
                      background: isSelected ? theme.cardBackground : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    Ayat {ayah.numberInSurah}
                    {isLong && (
                      <span className="ml-1 text-[10px] opacity-70">
                        (panjang)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={handleExport}
                disabled={isExporting}
              >
                {exportSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    {language === 'id' ? 'Tersimpan!' : 'Saved!'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {language === 'id' ? 'Unduh' : 'Download'}
                  </>
                )}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleShare}
                disabled={isExporting}
                style={{ 
                  background: theme.cardBackground,
                  color: theme.textPrimary,
                }}
              >
                <Share2 className="h-4 w-4" />
                {language === 'id' ? 'Bagikan' : 'Share'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
