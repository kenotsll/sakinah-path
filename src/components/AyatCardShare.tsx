import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toPng } from "html-to-image";
import { Ayah } from "@/hooks/useQuran";
import DOMPurify from "dompurify";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
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

// Theme configurations - Vibrant solid colors like Spotify
type ThemeType = 'green' | 'maroon' | 'navy' | 'coral';

interface Theme {
  name: string;
  background: string;
}

const THEMES: Record<ThemeType, Theme> = {
  green: {
    name: 'Hijau',
    background: '#1B4332',
  },
  maroon: {
    name: 'Maroon',
    background: '#722F37',
  },
  navy: {
    name: 'Biru',
    background: '#1A1A2E',
  },
  coral: {
    name: 'Coral',
    background: '#E85D75',
  },
};

// Escape HTML special characters to prevent XSS
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Check if text is "long"
const isLongText = (text: string): boolean => {
  return text.length > 150;
};

// Calculate font size based on text length (for preview)
const getArabicFontSize = (textLength: number): string => {
  if (textLength > 300) return '1.25rem';
  if (textLength > 200) return '1.5rem';
  if (textLength > 100) return '1.75rem';
  return '2rem';
};

const getTranslationFontSize = (textLength: number): string => {
  if (textLength > 250) return '0.875rem';
  if (textLength > 150) return '1rem';
  return '1.125rem';
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
  const lastTapRef = useRef<number>(0);
  const [selectedAyahs, setSelectedAyahs] = useState<number[]>([initialAyahIndex]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('green');

  const theme = THEMES[currentTheme];

  // Reset when modal opens with new ayah
  useEffect(() => {
    if (isOpen) {
      setSelectedAyahs([initialAyahIndex]);
    }
  }, [isOpen, initialAyahIndex]);

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

  // Build Arabic text with circled ayah numbers as end-of-ayah markers
  // For the export image, we'll inject HTML with CSS-styled circles
  // For the preview, we use a simpler approach
  const combinedArabicText = selectedContent.map(a => a.text?.trim?.() ?? a.text).join(' ');
  const combinedTranslation = selectedContent.map(a => a.translation).join(' ');

  // Generate HTML for Arabic text with circled numbers (for image export)
  // Using Unicode combining enclosing circle (U+20DD) or simple parentheses with styling
  const generateArabicWithCircledNumbers = useCallback(() => {
    return selectedContent
      .map((a) => {
        const text = a.text?.trim?.() ?? a.text;
        const num = a.numberInSurah;
        // Use a simple styled span for the ayah number
        // The circle is created with border-radius
        const circledNum = `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:1.8em;height:1.8em;border:2px solid rgba(255,255,255,0.5);border-radius:50%;font-size:0.45em;margin:0 0.3em;vertical-align:middle;color:rgba(255,255,255,0.8);font-family:sans-serif;font-weight:600;padding:2px;">${num}</span>`;
        return `${text}${circledNum}`;
      })
      .join(' ');
  }, [selectedContent]);

  // For preview display - use simple Arabic number marker
  const combinedArabicPreview = selectedContent
    .map((a) => {
      const text = a.text?.trim?.() ?? a.text;
      const num = a.numberInSurah;
      // Use Arabic-Indic numerals in a simple format
      return `${text} ﴿${num}﴾`;
    })
    .join(' ');

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

  // Generate full-screen story image
  const generateStoryImage = useCallback(async (): Promise<Blob | null> => {
    // Create a temporary container for the full-size story
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1080px';
    container.style.height = '1920px';
    document.body.appendChild(container);

    // Calculate font sizes for full resolution
    const arabicSize = combinedArabicText.length > 300 ? '42px' : 
                       combinedArabicText.length > 200 ? '52px' : 
                       combinedArabicText.length > 100 ? '62px' : '72px';
    
    const translationSize = combinedTranslation.length > 250 ? '32px' : 
                            combinedTranslation.length > 150 ? '38px' : '44px';

    // Generate Arabic HTML with circled numbers (sanitized)
    const arabicHtml = generateArabicWithCircledNumbers();

    // Sanitize all user-facing content to prevent XSS
    const safeSurahName = escapeHtml(surahName);
    const safeSurahMeaning = surahMeaning ? escapeHtml(surahMeaning) : '';
    const safeTranslation = escapeHtml(combinedTranslation);
    const safeAyahRangeText = escapeHtml(ayahRangeText);

    // Build HTML string
    const htmlContent = `
      <div style="
        width: 1080px;
        height: 1920px;
        background: ${theme.background};
        display: flex;
        flex-direction: column;
        padding: 80px 60px;
        box-sizing: border-box;
        font-family: 'Plus Jakarta Sans', sans-serif;
      ">
        <!-- Top Right Metadata -->
        <div style="
          position: absolute;
          top: 80px;
          right: 60px;
          text-align: right;
        ">
          <p style="
            font-size: 28px;
            font-weight: 600;
            color: rgba(255,255,255,0.6);
            margin: 0;
            letter-spacing: 0.5px;
          ">${safeSurahName}</p>
          ${safeSurahMeaning ? `<p style="
            font-size: 22px;
            color: rgba(255,255,255,0.5);
            margin: 8px 0 0 0;
          ">${safeSurahMeaning}</p>` : ''}
          <p style="
            font-size: 22px;
            color: rgba(255,255,255,0.4);
            margin: 8px 0 0 0;
          ">Juz ${juzNumber}</p>
        </div>

        <!-- Center Content -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: 100px;
        ">
          <!-- Arabic Text with circled ayah numbers -->
          <div style="
            font-family: 'Amiri', serif;
            font-size: ${arabicSize};
            line-height: 2.2;
            color: #FFFFFF;
            text-align: right;
            margin: 0 0 48px 0;
            direction: rtl;
          ">${arabicHtml}</div>

          <!-- Translation -->
          <p style="
            font-size: ${translationSize};
            font-weight: 600;
            line-height: 1.6;
            color: rgba(255,255,255,0.95);
            text-align: left;
            margin: 0;
          ">"${safeTranslation}"</p>

          <!-- Ayah Number -->
          <p style="
            font-size: 28px;
            color: rgba(255,255,255,0.5);
            margin: 32px 0 0 0;
            text-align: left;
          ">${safeAyahRangeText}</p>
        </div>

        <!-- Bottom Left Branding -->
        <div style="
          display: flex;
          align-items: center;
          gap: 16px;
        ">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(255,255,255,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              font-size: 24px;
              font-weight: 700;
              color: #FFFFFF;
              font-family: 'Amiri', serif;
            ">إ</span>
          </div>
          <span style="
            font-size: 28px;
            font-weight: 500;
            color: rgba(255,255,255,0.6);
          ">Istiqamah</span>
        </div>
      </div>
    `;

    // Sanitize the final HTML with DOMPurify
    container.innerHTML = DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style'],
      ALLOW_DATA_ATTR: false,
    });

    try {
      // IMPORTANT: container.firstChild can be a Text node (whitespace), which breaks html-to-image
      // and can lead to errors like reading 'fontFamily' of undefined.
      const storyEl = container.firstElementChild as HTMLElement | null;
      if (!storyEl) {
        console.error('Failed to generate image: story root element not found');
        document.body.removeChild(container);
        return null;
      }

      const dataUrl = await toPng(storyEl, {
        quality: 1,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
      });
      
      document.body.removeChild(container);
      
      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (error) {
      document.body.removeChild(container);
      console.error('Failed to generate image:', error);
      return null;
    }
  }, [theme.background, combinedArabicText, combinedTranslation, surahName, surahMeaning, juzNumber, ayahRangeText, generateArabicWithCircledNumbers]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      console.log('[AyatCardShare] export tapped', { isNative: Capacitor.isNativePlatform() });
      const blob = await generateStoryImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `istiqamah-${surahName}-${ayahRangeText.replace(/\s/g, '')}.png`;
        link.href = url;
        // iOS/Safari can ignore programmatic clicks unless the element is in the DOM.
        // Appending + removing makes the gesture more reliable across mobile browsers.
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Revoke a bit later to avoid cancelling the download on some browsers.
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [generateStoryImage, surahName, ayahRangeText]);

  const runOncePerTap = useCallback((fn: () => void) => {
    // Android WebView sometimes fires multiple pointer/click events for a single tap.
    // This guard keeps it to one execution.
    const now = Date.now();
    if (now - lastTapRef.current < 650) return;
    lastTapRef.current = now;
    fn();
  }, []);

  const handleShare = useCallback(async () => {
    setIsExporting(true);
    try {
      console.log('[AyatCardShare] share tapped', { isNative: Capacitor.isNativePlatform() });
      const blob = await generateStoryImage();
      if (!blob) {
        handleExport();
        return;
      }

      // Check if running on native platform (Capacitor)
      if (Capacitor.isNativePlatform()) {
        try {
          // Convert blob to base64 for Capacitor Filesystem
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
          });
          reader.readAsDataURL(blob);
          const base64Data = await base64Promise;
          
          // Save file to cache directory
          const fileName = `istiqamah-${surahName}-${Date.now()}.png`;
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });
          
          // Share using Capacitor Share plugin
          await Share.share({
            title: `${surahName} - ${ayahRangeText}`,
            text: `${surahName} ${ayahRangeText} - Istiqamah App`,
            url: savedFile.uri,
            dialogTitle: 'Bagikan Ayat',
          });
          
          setExportSuccess(true);
          setTimeout(() => setExportSuccess(false), 2000);
          
          // Clean up temp file after sharing
          try {
            await Filesystem.deleteFile({
              path: fileName,
              directory: Directory.Cache,
            });
          } catch {
            // Ignore cleanup errors
          }
          
          return;
        } catch (nativeError) {
          console.error('Native share failed, falling back:', nativeError);
          // Fall through to web share or download
        }
      }

      // Web share fallback
      const file = new File([blob], `istiqamah-${surahName}.png`, { type: 'image/png' });
      
      // Try native share (web)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
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
  }, [generateStoryImage, surahName, ayahRangeText, handleExport]);

  const cycleTheme = () => {
    const themes: ThemeType[] = ['green', 'maroon', 'navy', 'coral'];
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

            {/* Preview Card - Shows how it will look */}
            <div 
              ref={cardRef}
              className="rounded-2xl overflow-hidden shadow-2xl mx-auto"
              style={{ 
                background: theme.background,
                aspectRatio: '9/16',
                maxHeight: '55vh',
                width: '100%',
              }}
            >
              <div 
                className="w-full h-full flex flex-col relative p-6"
                style={{ background: theme.background }}
              >
                {/* Top Right - Metadata */}
                <div className="absolute top-4 right-4 text-right">
                  <p 
                    className="font-semibold text-xs tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {surahName}
                  </p>
                  {surahMeaning && (
                    <p 
                      className="text-[10px] mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {surahMeaning}
                    </p>
                  )}
                  <p 
                    className="text-[10px] mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Juz {juzNumber}
                  </p>
                </div>

                {/* Center - Main Content */}
                <div className="flex-1 flex flex-col justify-center pt-8">
                  <p 
                    className="font-arabic leading-[2.2] mb-4 text-white"
                    style={{ 
                      fontSize: getArabicFontSize(combinedArabicText.length),
                      textAlign: 'right',
                    }}
                    dir="rtl"
                  >
                    {combinedArabicPreview}
                  </p>

                  {combinedTranslation && (
                    <p 
                      className="leading-relaxed font-semibold"
                      style={{ 
                        color: 'rgba(255,255,255,0.95)',
                        fontSize: getTranslationFontSize(combinedTranslation.length),
                        textAlign: 'left',
                      }}
                    >
                      "{combinedTranslation}"
                    </p>
                  )}

                  <p 
                    className="mt-3 text-xs"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {ayahRangeText}
                  </p>
                </div>

                {/* Bottom Left - Logo */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <span className="text-xs font-bold text-white font-arabic">إ</span>
                  </div>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
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
            <div className="flex gap-3 pt-2" onClick={e => e.stopPropagation()}>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  runOncePerTap(() => handleExport());
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  runOncePerTap(() => handleExport());
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  runOncePerTap(() => handleExport());
                }}
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  runOncePerTap(() => handleShare());
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  runOncePerTap(() => handleShare());
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  runOncePerTap(() => handleShare());
                }}
                disabled={isExporting}
              >
                <Share2 className="h-4 w-4" />
                {language === 'id' ? 'Bagikan' : 'Share'}
              </Button>
            </div>

            <p className="text-xs text-center text-white/40">
              {language === 'id' 
                ? 'Gambar akan di-generate dalam resolusi 1080x1920 (Story)' 
                : 'Image will be generated at 1080x1920 (Story size)'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
