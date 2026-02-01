import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toPng } from "html-to-image";
import { Ayah } from "@/hooks/useQuran";
import DOMPurify from "dompurify";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Media } from "@capacitor-community/media";
import { toast } from "sonner";

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

// Helper to show debug alert on native
const showDebugAlert = (title: string, message: string) => {
  console.log(`[AyatCardShare] ${title}:`, message);
  if (Capacitor.isNativePlatform()) {
    // Use native alert for debugging on real device
    alert(`${title}\n\n${message}`);
  }
};

// Convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
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
  const combinedArabicText = selectedContent.map(a => a.text?.trim?.() ?? a.text).join(' ');
  const combinedTranslation = selectedContent.map(a => a.translation).join(' ');

  // Generate HTML for Arabic text with circled numbers (for image export)
  const generateArabicWithCircledNumbers = useCallback(() => {
    return selectedContent
      .map((a) => {
        const text = a.text?.trim?.() ?? a.text;
        const num = a.numberInSurah;
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
    console.log('[AyatCardShare] generateStoryImage started');
    
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
      const storyEl = container.firstElementChild as HTMLElement | null;
      if (!storyEl) {
        console.error('[AyatCardShare] Failed to generate image: story root element not found');
        document.body.removeChild(container);
        return null;
      }

      console.log('[AyatCardShare] Converting to PNG...');
      const dataUrl = await toPng(storyEl, {
        quality: 1,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
      });
      
      document.body.removeChild(container);
      console.log('[AyatCardShare] PNG generated successfully');
      
      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (error) {
      document.body.removeChild(container);
      console.error('[AyatCardShare] Failed to generate image:', error);
      return null;
    }
  }, [theme.background, combinedArabicText, combinedTranslation, surahName, surahMeaning, juzNumber, ayahRangeText, generateArabicWithCircledNumbers]);

  // Native download - save to Gallery
  const handleNativeDownload = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      console.log('[AyatCardShare] Starting native download...');
      const base64Data = await blobToBase64(blob);
      const fileName = `istiqamah-${surahName.replace(/\s/g, '-')}-${Date.now()}.png`;
      
      // First save to cache
      console.log('[AyatCardShare] Saving to cache...');
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      console.log('[AyatCardShare] Saved to cache:', savedFile.uri);

      // Try to save to gallery using Media plugin
      try {
        console.log('[AyatCardShare] Saving to gallery...');
        await Media.savePhoto({
          path: savedFile.uri,
          albumIdentifier: 'Istiqamah',
        });
        console.log('[AyatCardShare] Saved to gallery successfully!');
        toast.success('Tersimpan ke Galeri!');
        return true;
      } catch (mediaError) {
        console.log('[AyatCardShare] Media.savePhoto failed, trying alternative...', mediaError);
        
        // Fallback: save directly to Documents which is more accessible
        try {
          await Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: base64Data,
            directory: Directory.ExternalStorage,
            recursive: true,
          });
          console.log('[AyatCardShare] Saved to Downloads folder');
          toast.success('Tersimpan ke folder Download!');
          return true;
        } catch (extError) {
          console.log('[AyatCardShare] External storage failed:', extError);
          // Keep the cache file and notify user
          toast.success('Gambar tersimpan! Gunakan tombol Bagikan untuk menyimpan ke Galeri.');
          return true;
        }
      }
    } catch (error) {
      console.error('[AyatCardShare] Native download failed:', error);
      showDebugAlert('Download Error', String(error));
      return false;
    }
  }, [surahName]);

  // Web download fallback
  const handleWebDownload = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `istiqamah-${surahName}-${ayahRangeText.replace(/\s/g, '')}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, [surahName, ayahRangeText]);

  const handleExport = useCallback(async () => {
    console.log('[AyatCardShare] ===== handleExport START =====');
    console.log('[AyatCardShare] Platform:', Capacitor.getPlatform());
    console.log('[AyatCardShare] isNative:', Capacitor.isNativePlatform());
    
    setIsExporting(true);
    
    try {
      console.log('[AyatCardShare] Step 1: Generating story image...');
      const blob = await generateStoryImage();
      
      if (!blob) {
        const errMsg = 'generateStoryImage returned null';
        console.error('[AyatCardShare] Error:', errMsg);
        toast.error('Gagal membuat gambar');
        showDebugAlert('Export Error', errMsg);
        setIsExporting(false);
        return;
      }
      
      console.log('[AyatCardShare] Step 2: Image blob created, size:', blob.size);

      if (Capacitor.isNativePlatform()) {
        console.log('[AyatCardShare] Step 3: Using native download...');
        const success = await handleNativeDownload(blob);
        console.log('[AyatCardShare] Native download result:', success);
        if (success) {
          setExportSuccess(true);
          setTimeout(() => setExportSuccess(false), 2000);
        }
      } else {
        console.log('[AyatCardShare] Step 3: Using web download...');
        handleWebDownload(blob);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      }
      
      console.log('[AyatCardShare] ===== handleExport SUCCESS =====');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AyatCardShare] ===== handleExport FAILED =====');
      console.error('[AyatCardShare] Error:', errMsg);
      console.error('[AyatCardShare] Stack:', error instanceof Error ? error.stack : 'N/A');
      toast.error('Gagal menyimpan gambar');
      showDebugAlert('Export Error', errMsg);
    } finally {
      setIsExporting(false);
    }
  }, [generateStoryImage, handleNativeDownload, handleWebDownload]);

  // Debounce guard for touch events
  const runOncePerTap = useCallback((fn: () => void) => {
    const now = Date.now();
    if (now - lastTapRef.current < 800) {
      console.log('[AyatCardShare] Debounced duplicate tap');
      return;
    }
    lastTapRef.current = now;
    fn();
  }, []);

  // Native share implementation
  const handleNativeShare = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      console.log('[AyatCardShare] Starting native share...');
      const base64Data = await blobToBase64(blob);
      const fileName = `istiqamah-${surahName.replace(/\s/g, '-')}-${Date.now()}.png`;
      
      // Save to cache first
      console.log('[AyatCardShare] Saving to cache for share...');
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      console.log('[AyatCardShare] File saved for share:', savedFile.uri);
      
      // Share using Capacitor Share plugin
      console.log('[AyatCardShare] Opening share dialog...');
      await Share.share({
        title: `${surahName} - ${ayahRangeText}`,
        text: `${surahName} ${ayahRangeText} - Istiqamah App`,
        url: savedFile.uri,
        dialogTitle: 'Bagikan Ayat',
      });
      console.log('[AyatCardShare] Share completed successfully!');
      
      // Clean up temp file after a delay
      setTimeout(async () => {
        try {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Cache,
          });
          console.log('[AyatCardShare] Temp file cleaned up');
        } catch {
          // Ignore cleanup errors
        }
      }, 5000);
      
      return true;
    } catch (error) {
      // Check if user cancelled
      if ((error as Error).message?.includes('cancel') || 
          (error as Error).message?.includes('dismissed')) {
        console.log('[AyatCardShare] Share cancelled by user');
        return true; // Not an error, user just cancelled
      }
      console.error('[AyatCardShare] Native share failed:', error);
      showDebugAlert('Share Error', String(error));
      return false;
    }
  }, [surahName, ayahRangeText]);

  // Web share fallback
  const handleWebShare = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      const file = new File([blob], `istiqamah-${surahName}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${surahName} - ${ayahRangeText}`,
          text: `${surahName} ${ayahRangeText} - Istiqamah App`,
        });
        return true;
      }
      return false;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[AyatCardShare] Web share failed:', error);
      }
      return false;
    }
  }, [surahName, ayahRangeText]);

  const handleShare = useCallback(async () => {
    console.log('[AyatCardShare] ===== handleShare START =====');
    console.log('[AyatCardShare] Platform:', Capacitor.getPlatform());
    console.log('[AyatCardShare] isNative:', Capacitor.isNativePlatform());
    
    setIsExporting(true);
    
    try {
      console.log('[AyatCardShare] Step 1: Generating story image...');
      const blob = await generateStoryImage();
      
      if (!blob) {
        const errMsg = 'generateStoryImage returned null';
        console.error('[AyatCardShare] Error:', errMsg);
        toast.error('Gagal membuat gambar');
        showDebugAlert('Share Error', errMsg);
        setIsExporting(false);
        return;
      }
      
      console.log('[AyatCardShare] Step 2: Image blob created, size:', blob.size);

      let success = false;

      if (Capacitor.isNativePlatform()) {
        console.log('[AyatCardShare] Step 3: Using native share...');
        success = await handleNativeShare(blob);
        console.log('[AyatCardShare] Native share result:', success);
      } else {
        console.log('[AyatCardShare] Step 3: Using web share...');
        success = await handleWebShare(blob);
        console.log('[AyatCardShare] Web share result:', success);
      }

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
        console.log('[AyatCardShare] ===== handleShare SUCCESS =====');
      } else {
        console.log('[AyatCardShare] Share failed, falling back to download');
        handleWebDownload(blob);
        toast.info('Gambar diunduh karena share tidak tersedia');
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AyatCardShare] ===== handleShare FAILED =====');
      console.error('[AyatCardShare] Error:', errMsg);
      console.error('[AyatCardShare] Stack:', error instanceof Error ? error.stack : 'N/A');
      toast.error('Gagal membagikan gambar');
      showDebugAlert('Share Error', errMsg);
    } finally {
      setIsExporting(false);
    }
  }, [generateStoryImage, handleNativeShare, handleWebShare, handleWebDownload]);

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

  // Button wrapper component with proper touch handling for Android WebView
  const ActionButton = useCallback(({ 
    onClick, 
    variant = 'default',
    disabled,
    children 
  }: { 
    onClick: () => void; 
    variant?: 'outline' | 'default';
    disabled?: boolean;
    children: React.ReactNode;
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('[AyatCardShare] ActionButton onClick fired');
      if (!disabled) {
        runOncePerTap(onClick);
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      console.log('[AyatCardShare] ActionButton onTouchEnd fired');
      if (!disabled) {
        runOncePerTap(onClick);
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      console.log('[AyatCardShare] ActionButton onPointerUp fired');
      if (!disabled) {
        runOncePerTap(onClick);
      }
    };

    const baseClass = variant === 'outline' 
      ? "flex-1 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white pointer-events-auto"
      : "flex-1 gap-2 bg-white text-black hover:bg-white/90 pointer-events-auto";

    return (
      <Button
        type="button"
        variant={variant}
        className={baseClass}
        disabled={disabled}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        onPointerUp={handlePointerUp}
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 9999,
        }}
      >
        {children}
      </Button>
    );
  }, [runOncePerTap]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black pointer-events-auto"
          style={{ touchAction: 'pan-y' }}
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
                    style={{ touchAction: 'manipulation' }}
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

            {/* Action Buttons - with improved touch handling */}
            <div 
              className="flex gap-3 pt-2" 
              style={{ 
                position: 'relative', 
                zIndex: 60,
                touchAction: 'manipulation',
              }}
            >
              <ActionButton 
                variant="outline" 
                onClick={handleExport} 
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {language === 'id' ? 'Memproses...' : 'Processing...'}
                  </>
                ) : exportSuccess ? (
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
              </ActionButton>
              <ActionButton 
                onClick={handleShare} 
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {language === 'id' ? 'Memproses...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    {language === 'id' ? 'Bagikan' : 'Share'}
                  </>
                )}
              </ActionButton>
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
