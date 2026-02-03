import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Ayah } from "@/hooks/useQuran";
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

// Theme configurations - Sage to Deep Green gradient (Spotify aesthetic)
type ThemeType = 'sage' | 'forest' | 'ocean' | 'dusk';

interface Theme {
  name: string;
  background: string;
  gradient: string;
}

const THEMES: Record<ThemeType, Theme> = {
  sage: {
    name: 'Sage',
    background: '#2D5A4A',
    gradient: 'linear-gradient(165deg, #6B8E7D 0%, #2D5A4A 35%, #1B4332 100%)',
  },
  forest: {
    name: 'Forest',
    background: '#1B4332',
    gradient: 'linear-gradient(165deg, #40916C 0%, #2D6A4F 35%, #1B4332 100%)',
  },
  ocean: {
    name: 'Ocean',
    background: '#1A3A4A',
    gradient: 'linear-gradient(165deg, #4A7C8A 0%, #2A5A6A 35%, #1A3A4A 100%)',
  },
  dusk: {
    name: 'Dusk',
    background: '#3A2A4A',
    gradient: 'linear-gradient(165deg, #6A5A7A 0%, #4A3A5A 35%, #3A2A4A 100%)',
  },
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
  const lastActionTapRef = useRef<number>(0);
  const [lastRenderError, setLastRenderError] = useState<string | null>(null);
  const [selectedAyahs, setSelectedAyahs] = useState<number[]>([initialAyahIndex]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'share' | 'download' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('sage');

  const theme = THEMES[currentTheme];
  const isNative = Capacitor.isNativePlatform();

  const runOncePerTap = useCallback((fn: () => void) => {
    const now = Date.now();
    // Prevent duplicate fire on Android where onClick + onTouchEnd can both trigger.
    if (now - lastActionTapRef.current < 600) return;
    lastActionTapRef.current = now;
    fn();
  }, []);

  // Reset when modal opens with new ayah
  useEffect(() => {
    if (isOpen) {
      setSelectedAyahs([initialAyahIndex]);
      setDownloadSuccess(false);
      setLastRenderError(null);
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

  const renderAyatCanvas = useCallback((): HTMLCanvasElement | null => {
    const startTime = Date.now();
    console.log('[AyatCardShare] ========== renderAyatCanvas START ==========');
    setLastRenderError(null);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[AyatCardShare] Failed to get canvas 2d context');
      setLastRenderError('Canvas 2D context unavailable');
      return null;
    }

    // 9:16
    canvas.width = 1080;
    canvas.height = 1920;

    const gradientColors = theme.gradient.match(/#[a-fA-F0-9]{6}/g) || [theme.background, theme.background];
    const bg = ctx.createLinearGradient(0, 0, canvas.width * 0.3, canvas.height);
    bg.addColorStop(0, gradientColors[0] || '#6B8E7D');
    bg.addColorStop(0.35, gradientColors[1] || '#2D5A4A');
    bg.addColorStop(1, gradientColors[2] || gradientColors[1] || '#1B4332');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // System fonts for max iOS compatibility
    const arabicFont = 'serif';
    const latinFont = 'sans-serif';

    // Metadata
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 28px ${latinFont}`;
    ctx.fillText(surahName, canvas.width - 60, 110);

    if (surahMeaning) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `22px ${latinFont}`;
      ctx.fillText(surahMeaning, canvas.width - 60, 145);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `22px ${latinFont}`;
    ctx.fillText(`Juz ${juzNumber}`, canvas.width - 60, surahMeaning ? 180 : 145);

    const arabicSize = combinedArabicText.length > 300 ? 42 :
      combinedArabicText.length > 200 ? 52 :
        combinedArabicText.length > 100 ? 62 : 72;

    const translationSize = combinedTranslation.length > 250 ? 32 :
      combinedTranslation.length > 150 ? 38 : 44;

    const arabicTextWithNumbers = selectedContent
      .map((a) => {
        const text = a.text?.trim?.() ?? a.text;
        const num = a.numberInSurah;
        return `${text} ﴿${num}﴾`;
      })
      .join(' ');

    // Arabic
    ctx.textAlign = 'right';
    try {
      (ctx as unknown as { direction?: string }).direction = 'rtl';
    } catch {
      // ignore
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${arabicSize}px ${arabicFont}`;

    const maxWidth = canvas.width - 120;
    const arabicLines = wrapTextHelper(ctx, arabicTextWithNumbers, maxWidth);
    const lineHeight = arabicSize * 2.2;
    const totalTextHeight = arabicLines.length * lineHeight + translationSize * 2 + 80;
    let yPosition = (canvas.height - totalTextHeight) / 2 + arabicSize;

    arabicLines.forEach((line) => {
      ctx.fillText(line, canvas.width - 60, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 20;

    // Translation
    ctx.textAlign = 'left';
    try {
      (ctx as unknown as { direction?: string }).direction = 'ltr';
    } catch {
      // ignore
    }
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `600 ${translationSize}px ${latinFont}`;

    const translationWithQuotes = `"${combinedTranslation}"`;
    const translationLines = wrapTextHelper(ctx, translationWithQuotes, maxWidth);
    const translationLineHeight = translationSize * 1.6;
    translationLines.forEach((line) => {
      ctx.fillText(line, 60, yPosition);
      yPosition += translationLineHeight;
    });

    // Ayah range
    yPosition += 20;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `28px ${latinFont}`;
    ctx.fillText(ayahRangeText, 60, yPosition);

    // Branding
    const logoY = canvas.height - 100;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRectHelper(ctx, 60, logoY - 36, 48, 48, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 24px ${arabicFont}`;
    ctx.textAlign = 'center';
    ctx.fillText('إ', 84, logoY + 4);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `500 28px ${latinFont}`;
    ctx.fillText('Istiqamah', 124, logoY);

    console.log('[AyatCardShare] Canvas rendered in', Date.now() - startTime, 'ms');
    console.log('[AyatCardShare] ========== renderAyatCanvas SUCCESS ==========');
    return canvas;
  }, [theme.background, theme.gradient, combinedArabicText, combinedTranslation, surahName, surahMeaning, juzNumber, ayahRangeText, selectedContent]);

  // Generate Base64 data URL (used by native flow)
  const generateImageDataUrl = useCallback(async (): Promise<string | null> => {
    try {
      const canvas = renderAyatCanvas();
      if (!canvas) return null;
      return canvas.toDataURL('image/png', 1.0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastRenderError(msg?.slice(0, 180) || 'Unknown error');
      return null;
    }
  }, [renderAyatCanvas]);

  // Generate Blob (preferred on iOS web to avoid huge base64 memory)
  const generateImageBlob = useCallback(async (): Promise<Blob | null> => {
    try {
      const canvas = renderAyatCanvas();
      if (!canvas) return null;

      return await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setLastRenderError('canvas.toBlob() returned null');
              resolve(null);
              return;
            }
            resolve(blob);
          },
          'image/png',
          1.0
        );
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastRenderError(msg?.slice(0, 180) || 'Unknown error');
      return null;
    }
  }, [renderAyatCanvas]);
  
  // Helper function to wrap text (defined outside useCallback to avoid recreation)
  const wrapTextHelper = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };
  
  // Helper function to draw rounded rectangle
  const roundRectHelper = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };
  
  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };
  
  // Helper function to draw rounded rectangle
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Extract base64 from data URL
  const dataUrlToBase64 = (dataUrl: string): string => {
    return dataUrl.split(',')[1];
  };

  // =====================================================
  // NATIVE SHARE - Full Capacitor Implementation
  // =====================================================
  const handleNativeShare = useCallback(async () => {
    console.log('[AyatCardShare] ===== NATIVE SHARE START =====');
    
    setIsProcessing(true);
    setProcessingAction('share');

    try {
      // Step 1: Generate image as dataUrl
      console.log('[AyatCardShare] Step 1: Generating image...');
      const dataUrl = await generateImageDataUrl();
      
      if (!dataUrl) {
        throw new Error('Gagal membuat gambar');
      }
      console.log('[AyatCardShare] Step 1 DONE: Image generated');

      // Step 2: Convert to base64
      console.log('[AyatCardShare] Step 2: Converting to base64...');
      const base64Data = dataUrlToBase64(dataUrl);
      const fileName = `istiqamah-${surahName.replace(/\s/g, '-')}-${Date.now()}.png`;
      console.log('[AyatCardShare] Step 2 DONE: base64 ready, fileName:', fileName);

      // Step 3: Save to cache directory
      console.log('[AyatCardShare] Step 3: Saving to Directory.Cache...');
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      console.log('[AyatCardShare] Step 3 DONE: File saved, URI:', savedFile.uri);

      // Step 4: Share using Capacitor Share plugin with file URI
      console.log('[AyatCardShare] Step 4: Opening native share dialog...');
      await Share.share({
        title: `${surahName} - ${ayahRangeText}`,
        text: `${surahName} ${ayahRangeText} - Istiqamah App`,
        url: savedFile.uri,
        dialogTitle: 'Bagikan Ayat',
      });
      console.log('[AyatCardShare] Step 4 DONE: Share dialog opened');
      
      toast.success('Berhasil dibagikan!');

      // Cleanup temp file after delay
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
      }, 10000);

      console.log('[AyatCardShare] ===== NATIVE SHARE SUCCESS =====');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AyatCardShare] ===== NATIVE SHARE FAILED =====');
      console.error('[AyatCardShare] Error:', errMsg);
      
      // Check if user cancelled (not an error)
      if (errMsg.includes('cancel') || errMsg.includes('dismissed') || errMsg.includes('Share canceled')) {
        console.log('[AyatCardShare] User cancelled share');
      } else {
        toast.error('Gagal membuat gambar. Coba lagi.');
      }
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [generateImageDataUrl, surahName, ayahRangeText]);

  // =====================================================
  // NATIVE DOWNLOAD - Save to Gallery using Media plugin
  // =====================================================
  const handleNativeDownload = useCallback(async () => {
    console.log('[AyatCardShare] ===== NATIVE DOWNLOAD START =====');
    
    setIsProcessing(true);
    setProcessingAction('download');

    try {
      // Step 1: Generate image as dataUrl
      console.log('[AyatCardShare] Step 1: Generating image...');
      const dataUrl = await generateImageDataUrl();
      
      if (!dataUrl) {
        throw new Error('Gagal membuat gambar');
      }
      console.log('[AyatCardShare] Step 1 DONE: Image generated');

      // Step 2: Convert to base64
      console.log('[AyatCardShare] Step 2: Converting to base64...');
      const base64Data = dataUrlToBase64(dataUrl);
      const fileName = `istiqamah-${surahName.replace(/\s/g, '-')}-${Date.now()}.png`;
      console.log('[AyatCardShare] Step 2 DONE: base64 ready');

      // Step 3: Save to cache first
      console.log('[AyatCardShare] Step 3: Saving to Directory.Cache...');
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      console.log('[AyatCardShare] Step 3 DONE: Cached file URI:', savedFile.uri);

      // Step 4: Save to Gallery using Media plugin
      console.log('[AyatCardShare] Step 4: Saving to Gallery with Media.savePhoto...');
      try {
        await Media.savePhoto({
          path: savedFile.uri,
          albumIdentifier: 'Istiqamah',
        });
        console.log('[AyatCardShare] Step 4 DONE: Saved to Gallery!');
        toast.success('Tersimpan ke Galeri!');
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (mediaError) {
        console.log('[AyatCardShare] Media.savePhoto failed, trying fallback...', mediaError);
        
        // Fallback: Save to Downloads folder
        try {
          await Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: base64Data,
            directory: Directory.ExternalStorage,
            recursive: true,
          });
          console.log('[AyatCardShare] Fallback: Saved to Downloads folder');
          toast.success('Tersimpan ke folder Download!');
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
        } catch (fallbackError) {
          console.log('[AyatCardShare] Fallback also failed:', fallbackError);
          // Use Share as final fallback to let user save manually
          toast.info('Gunakan tombol Bagikan untuk menyimpan gambar');
        }
      }

      console.log('[AyatCardShare] ===== NATIVE DOWNLOAD SUCCESS =====');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AyatCardShare] ===== NATIVE DOWNLOAD FAILED =====');
      console.error('[AyatCardShare] Error:', errMsg);
      toast.error('Gagal menyimpan gambar. Coba lagi.');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [generateImageDataUrl, surahName]);

  // =====================================================
  // WEB SHARE - Fallback for browser
  // =====================================================
  const handleWebShare = useCallback(async () => {
    console.log('[AyatCardShare] ===== WEB SHARE START =====');
    
    setIsProcessing(true);
    setProcessingAction('share');

    try {
      const blob = await generateImageBlob();
      if (!blob) throw new Error('Gagal membuat gambar');
      const file = new File([blob], `istiqamah-${surahName}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${surahName} - ${ayahRangeText}`,
        });
        toast.success('Berhasil dibagikan!');
      } else {
        // Fallback: download file
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `istiqamah-${surahName}-${ayahRangeText.replace(/\s/g, '')}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.info('Gambar diunduh (share tidak tersedia)');
      }

      console.log('[AyatCardShare] ===== WEB SHARE SUCCESS =====');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (!errMsg.includes('AbortError')) {
        console.error('[AyatCardShare] Web share failed:', errMsg);
        toast.error(lastRenderError ? `Gagal membuat gambar: ${lastRenderError}` : 'Gagal membuat gambar. Coba lagi.');
      }
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [generateImageBlob, surahName, ayahRangeText, lastRenderError]);

  // =====================================================
  // WEB DOWNLOAD - Fallback for browser
  // =====================================================
  const handleWebDownload = useCallback(async () => {
    console.log('[AyatCardShare] ===== WEB DOWNLOAD START =====');
    
    setIsProcessing(true);
    setProcessingAction('download');

    try {
      const blob = await generateImageBlob();
      if (!blob) throw new Error('Gagal membuat gambar');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `istiqamah-${surahName}-${ayahRangeText.replace(/\s/g, '')}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
      console.log('[AyatCardShare] ===== WEB DOWNLOAD SUCCESS =====');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AyatCardShare] Web download failed:', errMsg);
      toast.error(lastRenderError ? `Gagal membuat gambar: ${lastRenderError}` : 'Gagal menyimpan gambar. Coba lagi.');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [generateImageDataUrl, surahName, ayahRangeText, lastRenderError]);

  // Main handlers that route to native or web
  const handleShare = useCallback(() => {
    if (isNative) {
      handleNativeShare();
    } else {
      handleWebShare();
    }
  }, [isNative, handleNativeShare, handleWebShare]);

  const handleDownload = useCallback(() => {
    if (isNative) {
      handleNativeDownload();
    } else {
      handleWebDownload();
    }
  }, [isNative, handleNativeDownload, handleWebDownload]);

  const cycleTheme = () => {
    const themes: ThemeType[] = ['sage', 'forest', 'ocean', 'dusk'];
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
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black"
          style={{ 
            touchAction: 'pan-y',
            pointerEvents: 'auto',
          }}
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
                background: theme.gradient,
                aspectRatio: '9/16',
                maxHeight: '55vh',
                width: '100%',
              }}
            >
              <div 
                className="w-full h-full flex flex-col relative p-6"
                style={{ background: 'transparent' }}
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
                    style={{ 
                      touchAction: 'manipulation',
                      cursor: 'pointer',
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {/* Download Button */}
              <Button
                variant="outline"
                className="flex-1 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                type="button"
                onPointerDown={() => runOncePerTap(handleDownload)}
                onTouchStart={() => runOncePerTap(handleDownload)}
                onClick={() => runOncePerTap(handleDownload)}
                disabled={isProcessing}
                style={{
                  touchAction: 'manipulation',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  zIndex: 9999,
                }}
              >
                {processingAction === 'download' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {language === 'id' ? 'Menyimpan...' : 'Saving...'}
                  </>
                ) : downloadSuccess ? (
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

              {/* Share Button */}
              <Button
                className="flex-1 gap-2 bg-white text-black hover:bg-white/90"
                type="button"
                onPointerDown={() => runOncePerTap(handleShare)}
                onTouchStart={() => runOncePerTap(handleShare)}
                onClick={() => runOncePerTap(handleShare)}
                disabled={isProcessing}
                style={{
                  touchAction: 'manipulation',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  zIndex: 9999,
                }}
              >
                {processingAction === 'share' ? (
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
