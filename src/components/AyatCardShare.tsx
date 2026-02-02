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
  const [selectedAyahs, setSelectedAyahs] = useState<number[]>([initialAyahIndex]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'share' | 'download' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('green');

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

  // Generate Base64 data URL from component
  // Generate Base64 data URL from component
  const generateImageDataUrl = useCallback(async (): Promise<string | null> => {
    const startTime = Date.now();
    console.log('[AyatCardShare] ========== generateImageDataUrl START ==========');
    console.log('[AyatCardShare] [1/10] Initializing... timestamp:', startTime);
    
    // Create a temporary container for the full-size story
    // Use opacity: 0 instead of left: -9999px to keep element in document flow
    // This ensures html-to-image can capture the element properly on Android
    console.log('[AyatCardShare] [2/10] Creating container element...');
    const container = document.createElement('div');
    container.id = 'ayat-export-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '1080px';
    container.style.height = '1920px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    console.log('[AyatCardShare] [2/10] Container created with styles:', {
      position: container.style.position,
      width: container.style.width,
      height: container.style.height,
      opacity: container.style.opacity,
    });
    
    console.log('[AyatCardShare] [3/10] Appending container to document.body...');
    document.body.appendChild(container);
    console.log('[AyatCardShare] [3/10] Container appended. Container in DOM:', !!document.getElementById('ayat-export-container'));

    // Calculate font sizes for full resolution
    console.log('[AyatCardShare] [4/10] Calculating font sizes...');
    console.log('[AyatCardShare] [4/10] Arabic text length:', combinedArabicText.length);
    console.log('[AyatCardShare] [4/10] Translation text length:', combinedTranslation.length);
    
    const arabicSize = combinedArabicText.length > 300 ? '42px' : 
                       combinedArabicText.length > 200 ? '52px' : 
                       combinedArabicText.length > 100 ? '62px' : '72px';
    
    const translationSize = combinedTranslation.length > 250 ? '32px' : 
                            combinedTranslation.length > 150 ? '38px' : '44px';
    
    console.log('[AyatCardShare] [4/10] Calculated sizes - Arabic:', arabicSize, 'Translation:', translationSize);

    // Generate Arabic HTML with circled numbers (sanitized)
    console.log('[AyatCardShare] [5/10] Generating Arabic HTML with circled numbers...');
    const arabicHtml = generateArabicWithCircledNumbers();
    console.log('[AyatCardShare] [5/10] Arabic HTML generated, length:', arabicHtml.length);

    // Sanitize all user-facing content to prevent XSS
    console.log('[AyatCardShare] [6/10] Sanitizing user content...');
    const safeSurahName = escapeHtml(surahName);
    const safeSurahMeaning = surahMeaning ? escapeHtml(surahMeaning) : '';
    const safeTranslation = escapeHtml(combinedTranslation);
    const safeAyahRangeText = escapeHtml(ayahRangeText);
    console.log('[AyatCardShare] [6/10] Content sanitized:', { safeSurahName, safeAyahRangeText });

    // Build HTML string
    console.log('[AyatCardShare] [7/10] Building HTML content string...');
    console.log('[AyatCardShare] [7/10] Using theme background:', theme.background);
    
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
    console.log('[AyatCardShare] [7/10] HTML content built, length:', htmlContent.length);

    // Sanitize the final HTML with DOMPurify
    console.log('[AyatCardShare] [8/10] Sanitizing HTML with DOMPurify...');
    const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style'],
      ALLOW_DATA_ATTR: false,
    });
    container.innerHTML = sanitizedHtml;
    console.log('[AyatCardShare] [8/10] HTML sanitized and set to container');

    try {
      console.log('[AyatCardShare] [9/10] Finding story element...');
      const storyEl = container.firstElementChild as HTMLElement | null;
      
      if (!storyEl) {
        console.error('[AyatCardShare] FATAL: story root element not found!');
        console.error('[AyatCardShare] Container innerHTML length:', container.innerHTML.length);
        console.error('[AyatCardShare] Container children count:', container.children.length);
        document.body.removeChild(container);
        alert('Error: Story element tidak ditemukan');
        return null;
      }
      
      console.log('[AyatCardShare] [9/10] Story element found:', {
        tagName: storyEl.tagName,
        offsetWidth: storyEl.offsetWidth,
        offsetHeight: storyEl.offsetHeight,
        clientWidth: storyEl.clientWidth,
        clientHeight: storyEl.clientHeight,
      });

      // Wait for fonts to render, especially Arabic fonts on Android
      console.log('[AyatCardShare] [9/10] Waiting 500ms for fonts to render...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[AyatCardShare] [9/10] Font wait complete');

      // Set up timeout warning at 5 seconds
      console.log('[AyatCardShare] [10/10] Starting toPng with 15s timeout...');
      console.log('[AyatCardShare] [10/10] toPng options:', {
        quality: 1,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
        backgroundColor: theme.background,
        skipFonts: false,
      });
      
      let renderStuck = false;
      const stuckWarningTimeout = setTimeout(() => {
        renderStuck = true;
        console.warn('[AyatCardShare] WARNING: Render stuck for 5+ seconds!');
        alert('Proses Render Gambar Macet');
      }, 5000);
      
      // Create a promise race between toPng and 15s timeout
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error('toPng timeout after 15 seconds'));
        }, 15000);
      });
      
      const toPngStartTime = Date.now();
      console.log('[AyatCardShare] [10/10] Calling toPng at:', toPngStartTime);
      
      const dataUrl = await Promise.race([
        toPng(storyEl, {
          quality: 1,
          pixelRatio: 1,
          width: 1080,
          height: 1920,
          backgroundColor: theme.background,
          skipFonts: false,
        }),
        timeoutPromise,
      ]);
      
      // Clear the stuck warning timeout
      clearTimeout(stuckWarningTimeout);
      
      const toPngEndTime = Date.now();
      const toPngDuration = toPngEndTime - toPngStartTime;
      console.log('[AyatCardShare] [10/10] toPng completed in:', toPngDuration, 'ms');
      console.log('[AyatCardShare] [10/10] Was render stuck warning shown?', renderStuck);
      
      document.body.removeChild(container);
      console.log('[AyatCardShare] Container removed from DOM');
      console.log('[AyatCardShare] PNG dataUrl generated, length:', dataUrl.length);
      console.log('[AyatCardShare] Total duration:', Date.now() - startTime, 'ms');
      console.log('[AyatCardShare] ========== generateImageDataUrl SUCCESS ==========');
      
      return dataUrl;
    } catch (error) {
      console.error('[AyatCardShare] ========== generateImageDataUrl FAILED ==========');
      console.error('[AyatCardShare] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[AyatCardShare] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[AyatCardShare] Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('[AyatCardShare] Time elapsed before error:', Date.now() - startTime, 'ms');
      
      // Cleanup
      try {
        document.body.removeChild(container);
        console.log('[AyatCardShare] Container cleaned up after error');
      } catch {
        console.warn('[AyatCardShare] Container cleanup failed (may already be removed)');
      }
      
      alert(`Render Error: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, [theme.background, combinedArabicText, combinedTranslation, surahName, surahMeaning, juzNumber, ayahRangeText, generateArabicWithCircledNumbers]);

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
        toast.error(`Gagal share: ${errMsg}`);
        // Show alert for debugging on device
        alert(`Share Error:\n${errMsg}`);
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
      toast.error(`Gagal download: ${errMsg}`);
      alert(`Download Error:\n${errMsg}`);
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
      const dataUrl = await generateImageDataUrl();
      if (!dataUrl) {
        throw new Error('Gagal membuat gambar');
      }

      // Convert dataUrl to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
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
        toast.error(`Gagal: ${errMsg}`);
      }
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [generateImageDataUrl, surahName, ayahRangeText]);

  // =====================================================
  // WEB DOWNLOAD - Fallback for browser
  // =====================================================
  const handleWebDownload = useCallback(async () => {
    console.log('[AyatCardShare] ===== WEB DOWNLOAD START =====');
    
    setIsProcessing(true);
    setProcessingAction('download');

    try {
      const dataUrl = await generateImageDataUrl();
      if (!dataUrl) {
        throw new Error('Gagal membuat gambar');
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();
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
      toast.error(`Gagal download: ${errMsg}`);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [generateImageDataUrl, surahName, ayahRangeText]);

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
