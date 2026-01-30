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
  surahMeaning?: string;
  juzNumber?: number;
  ayahs: Ayah[];
  initialAyahIndex: number;
}

// Theme configurations - Vibrant solid colors
type ThemeType = 'mercy' | 'reminder' | 'history';

interface Theme {
  name: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

const THEMES: Record<ThemeType, Theme> = {
  mercy: {
    name: 'Rahmat',
    background: '#1B4332', // Deep forest green - Quran theme
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.95)',
    textMuted: 'rgba(255,255,255,0.6)',
  },
  reminder: {
    name: 'Pengingat',
    background: '#4A1942', // Deep maroon/burgundy
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.95)',
    textMuted: 'rgba(255,255,255,0.6)',
  },
  history: {
    name: 'Sejarah',
    background: '#1A1A2E', // Deep navy/charcoal
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.95)',
    textMuted: 'rgba(255,255,255,0.6)',
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

// Calculate font size based on text length
const getArabicFontSize = (textLength: number): string => {
  if (textLength > 300) return '1.375rem'; // 22px
  if (textLength > 200) return '1.625rem'; // 26px
  if (textLength > 100) return '1.875rem'; // 30px
  return '2.25rem'; // 36px
};

const getTranslationFontSize = (textLength: number): string => {
  if (textLength > 250) return '0.9375rem'; // 15px
  if (textLength > 150) return '1.0625rem'; // 17px
  return '1.1875rem'; // 19px - Bold, readable
};

export const AyatCardShare = ({ 
  isOpen, 
  onClose, 
  surahName, 
  surahArabic, 
  surahNumber,
  surahMeaning = '',
  juzNumber = 1,
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
        pixelRatio: 3, // High resolution for crisp text
        width: 1080,
        height: 1920,
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
        pixelRatio: 3,
        width: 1080,
        height: 1920,
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
          className="fixed inset-0 z-[100] overflow-y-auto bg-black"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-black/80 backdrop-blur-sm">
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
                {language === 'id' ? 'Warna:' : 'Color:'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={cycleTheme}
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ background: theme.background }}
                />
                {theme.name}
              </Button>
            </div>

            {/* Spotify-Style Card Preview - 9:16 Aspect Ratio */}
            <div 
              ref={cardRef}
              className="rounded-2xl overflow-hidden shadow-2xl mx-auto"
              style={{ 
                background: theme.background,
                aspectRatio: '9/16',
                maxHeight: '60vh',
                width: '100%',
                maxWidth: '340px',
              }}
            >
              {/* Full Card Content with generous padding */}
              <div 
                className="w-full h-full flex flex-col relative"
                style={{ 
                  background: theme.background,
                  padding: '32px 28px',
                }}
              >
                {/* Top Right - Metadata (Surah Name, Meaning, Juz) */}
                <div 
                  className="absolute top-0 right-0 text-right"
                  style={{ 
                    padding: '28px 24px',
                  }}
                >
                  <p 
                    className="font-semibold text-sm tracking-wide"
                    style={{ color: theme.textMuted }}
                  >
                    {surahName}
                  </p>
                  {surahMeaning && (
                    <p 
                      className="text-xs mt-0.5"
                      style={{ color: theme.textMuted, opacity: 0.8 }}
                    >
                      {surahMeaning}
                    </p>
                  )}
                  <p 
                    className="text-xs mt-0.5"
                    style={{ color: theme.textMuted, opacity: 0.7 }}
                  >
                    Juz {juzNumber}
                  </p>
                </div>

                {/* Center - Main Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Arabic Text - Large, clean, left aligned */}
                  <p 
                    className="font-arabic leading-[2.2] mb-6"
                    style={{ 
                      color: theme.textPrimary,
                      fontSize: getArabicFontSize(combinedArabic.length),
                      textAlign: 'right',
                      fontWeight: 400,
                    }}
                    dir="rtl"
                  >
                    {combinedArabic}
                  </p>

                  {/* Translation - Bold, readable, left aligned */}
                  {combinedTranslation && (
                    <p 
                      className="leading-relaxed font-semibold"
                      style={{ 
                        color: theme.textSecondary,
                        fontSize: getTranslationFontSize(combinedTranslation.length),
                        textAlign: 'left',
                      }}
                    >
                      "{combinedTranslation}"
                    </p>
                  )}

                  {/* Ayah Number */}
                  <p 
                    className="mt-4 text-sm"
                    style={{ color: theme.textMuted }}
                  >
                    {ayahRangeText}
                  </p>
                </div>

                {/* Bottom Left - Logo Branding */}
                <div 
                  className="absolute bottom-0 left-0 flex items-center gap-2"
                  style={{ padding: '28px 24px' }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <span 
                      className="text-base font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      إ
                    </span>
                  </div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.textMuted }}
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
              <p className="text-xs text-center text-white/50">
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
                        ? 'bg-white text-black' 
                        : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                    }`}
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

            {/* Action Buttons */}
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
                className="flex-1 gap-2 bg-white text-black hover:bg-white/90"
                onClick={handleShare}
                disabled={isExporting}
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
