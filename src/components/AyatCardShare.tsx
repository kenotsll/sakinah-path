import { useState, useRef, useMemo, useCallback } from "react";
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

// Theme configurations based on surah content
type ThemeType = 'mercy' | 'reminder' | 'history';

interface Theme {
  name: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

const THEMES: Record<ThemeType, Theme> = {
  mercy: {
    name: 'Rahmat',
    background: '#2D5A4C', // Sage/Emerald
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.8)',
    accent: '#8FBC8F',
  },
  reminder: {
    name: 'Pengingat',
    background: '#2C3E50', // Charcoal/Deep Blue
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.8)',
    accent: '#5DADE2',
  },
  history: {
    name: 'Sejarah',
    background: '#5D4E37', // Soft Sand/Earth Tone
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.85)',
    accent: '#D4A574',
  },
};

// Determine theme based on surah number (simplified logic)
const getSurahTheme = (surahNumber: number): ThemeType => {
  // Surahs about mercy, paradise, good news
  const mercySurahs = [1, 12, 19, 36, 55, 56, 67, 78, 93, 94, 95, 97, 108, 110];
  // Surahs about history and prophets
  const historySurahs = [2, 3, 4, 5, 7, 10, 11, 14, 15, 18, 20, 21, 26, 27, 28, 37, 38, 40, 71];
  
  if (mercySurahs.includes(surahNumber)) return 'mercy';
  if (historySurahs.includes(surahNumber)) return 'history';
  return 'reminder';
};

// Calculate if text is "long" (more than 2 lines approximately)
const isLongText = (text: string): boolean => {
  return text.length > 150;
};

// Auto-scale font size based on text length
const getArabicFontSize = (text: string, maxAyahs: number): number => {
  const totalLength = text.length;
  if (maxAyahs === 1) {
    if (totalLength > 300) return 24;
    if (totalLength > 200) return 28;
    if (totalLength > 100) return 32;
    return 36;
  }
  // Multiple ayahs
  if (totalLength > 500) return 20;
  if (totalLength > 300) return 24;
  return 28;
};

const getTranslationFontSize = (text: string, maxAyahs: number): number => {
  const totalLength = text.length;
  if (maxAyahs === 1) {
    if (totalLength > 200) return 12;
    if (totalLength > 100) return 14;
    return 16;
  }
  if (totalLength > 400) return 11;
  if (totalLength > 200) return 12;
  return 14;
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

  // Smart selection logic
  const canSelectMore = useMemo(() => {
    if (selectedAyahs.length >= 5) return false;
    
    // Check if any selected ayah is "long"
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
  
  const arabicFontSize = getArabicFontSize(combinedArabic, selectedContent.length);
  const translationFontSize = getTranslationFontSize(combinedTranslation || '', selectedContent.length);

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
        // Don't allow deselecting if only one selected
        if (prev.length === 1) return prev;
        return prev.filter(i => i !== index);
      }
      
      // Check if new ayah is long
      if (ayahs[index] && isLongText(ayahs[index].text)) {
        // If selecting a long ayah, only select that one
        return [index];
      }
      
      // Check if already at max
      if (prev.length >= 5) return prev;
      
      // Check if any existing is long
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
        pixelRatio: 3, // High DPI for crisp text
        width: 1080,
        height: 1920,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `istiqamah-${surahName}-ayat${ayahRangeText.replace(/\s/g, '')}.png`;
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
      
      // Convert to blob for sharing
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `istiqamah-${surahName}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${surahName} - ${ayahRangeText}`,
          text: `${surahName} ${ayahRangeText} - Istiqamah App`,
        });
      } else {
        // Fallback to download
        handleExport();
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback to download
      handleExport();
    } finally {
      setIsExporting(false);
    }
  }, [surahName, ayahRangeText, handleExport]);

  const cycleTheme = () => {
    const themes: ThemeType[] = ['mercy', 'reminder', 'history'];
    const currentIndex = themes.indexOf(currentTheme);
    setCurrentTheme(themes[(currentIndex + 1) % themes.length]);
  };

  // Navigate ayahs
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
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between z-10">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-semibold text-foreground">
              {language === 'id' ? 'Bagikan Ayat' : 'Share Verse'}
            </h2>
            <div className="w-10" />
          </div>

          <div className="p-4 space-y-4">
            {/* Theme Selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {language === 'id' ? 'Tema:' : 'Theme:'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={cycleTheme}
                className="gap-2"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ background: theme.background }}
                />
                {theme.name}
              </Button>
            </div>

            {/* Card Preview - Scaled down for preview */}
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              <div 
                className="transform scale-[0.32] origin-top-left"
                style={{ width: 1080, height: 1920 }}
              >
                <div
                  ref={cardRef}
                  className="w-full h-full flex flex-col items-center justify-center p-16"
                  style={{ 
                    background: theme.background,
                    fontFamily: "'Amiri', 'Plus Jakarta Sans', serif",
                  }}
                >
                  {/* Content Container */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[900px]">
                    {/* Arabic Text */}
                    <p 
                      className="text-center leading-[1.8] mb-12"
                      style={{ 
                        color: theme.textPrimary,
                        fontSize: `${arabicFontSize}px`,
                        fontFamily: "'Amiri', serif",
                        direction: 'rtl',
                      }}
                      dir="rtl"
                    >
                      {combinedArabic}
                    </p>

                    {/* Divider */}
                    <div 
                      className="w-32 h-1 rounded-full mb-12"
                      style={{ background: theme.accent }}
                    />

                    {/* Translation */}
                    <p 
                      className="text-center leading-relaxed"
                      style={{ 
                        color: theme.textSecondary,
                        fontSize: `${translationFontSize}px`,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {combinedTranslation}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="w-full flex items-end justify-between mt-auto pt-16">
                    {/* Branding - Left */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: theme.accent }}
                      >
                        <span className="text-2xl font-bold" style={{ color: theme.background }}>
                          إ
                        </span>
                      </div>
                      <span 
                        className="text-lg font-medium"
                        style={{ color: theme.textSecondary }}
                      >
                        Istiqamah
                      </span>
                    </div>

                    {/* Surah Info - Right */}
                    <div className="text-right">
                      <p 
                        className="text-xl font-medium"
                        style={{ color: theme.textPrimary }}
                      >
                        {surahName}
                      </p>
                      <p 
                        className="text-lg"
                        style={{ color: theme.textSecondary }}
                      >
                        {ayahRangeText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scaled container overlay for correct height */}
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  paddingBottom: `${(1920 / 1080) * 100}%`,
                }}
              />
            </div>

            {/* Ayah Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateAyah('prev')}
                disabled={Math.min(...selectedAyahs) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {ayahRangeText}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateAyah('next')}
                disabled={Math.max(...selectedAyahs) >= ayahs.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Multi-select hint */}
            {canSelectMore && (
              <p className="text-xs text-center text-muted-foreground">
                {language === 'id' 
                  ? 'Tap ayat di bawah untuk menambah pilihan (maks 5 ayat pendek)'
                  : 'Tap verses below to add (max 5 short verses)'}
              </p>
            )}

            {/* Ayah Selection - Horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {ayahs.slice(Math.max(0, initialAyahIndex - 2), initialAyahIndex + 5).map((ayah, idx) => {
                const realIndex = Math.max(0, initialAyahIndex - 2) + idx;
                const isSelected = selectedAyahs.includes(realIndex);
                const isLong = isLongText(ayah.text);
                
                return (
                  <button
                    key={ayah.number}
                    onClick={() => toggleAyahSelection(realIndex)}
                    className={`shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">Ayat {ayah.numberInSurah}</span>
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
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 gap-2"
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
                className="flex-1 gap-2 gradient-hero text-primary-foreground"
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
