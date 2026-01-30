import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, RotateCcw, Target, Volume2, VolumeX, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface TasbihPageProps {
  onBack: () => void;
}

const DZIKIR_PRESETS = [
  { arabic: "سُبْحَانَ اللّٰهِ", latin: "Subhanallah", meaning: "Maha Suci Allah" },
  { arabic: "اَلْحَمْدُ لِلّٰهِ", latin: "Alhamdulillah", meaning: "Segala Puji Bagi Allah" },
  { arabic: "اللّٰهُ أَكْبَرُ", latin: "Allahu Akbar", meaning: "Allah Maha Besar" },
  { arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ", latin: "Laa ilaaha illallah", meaning: "Tiada Tuhan Selain Allah" },
  { arabic: "أَسْتَغْفِرُ اللّٰهَ", latin: "Astaghfirullah", meaning: "Aku Mohon Ampun kepada Allah" },
];

const TARGET_OPTIONS = [33, 99, 100, 1000];
const STORAGE_KEY = 'istiqamah_tasbih_state';

// Digital click sound using Web Audio API
const playDigitalClick = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.03);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (e) {
    // Audio not supported
  }
};

// Haptic feedback
const triggerHaptic = (type: 'light' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'heavy' ? [100, 50, 100] : 15);
  }
};

export const TasbihPage = ({ onBack }: TasbihPageProps) => {
  const { language } = useLanguage();
  
  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore errors
    }
    return { count: 0, target: 33, dzikirIndex: 0 };
  };

  const savedState = loadSavedState();
  
  const [count, setCount] = useState(savedState.count);
  const [target, setTarget] = useState(savedState.target);
  const [dzikirIndex, setDzikirIndex] = useState(savedState.dzikirIndex);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [targetReached, setTargetReached] = useState(savedState.count >= savedState.target);

  const dzikir = DZIKIR_PRESETS[dzikirIndex];
  const progress = Math.min((count / target) * 100, 100);

  // Save state to localStorage
  useEffect(() => {
    const state = { count, target, dzikirIndex };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [count, target, dzikirIndex]);

  const handleTap = useCallback(() => {
    if (count < target) {
      setCount((prev: number) => prev + 1);
      triggerHaptic('light');
      if (soundEnabled) playDigitalClick();
    }
  }, [count, target, soundEnabled]);

  // Check if target reached
  useEffect(() => {
    if (count >= target && !targetReached) {
      setTargetReached(true);
      triggerHaptic('heavy');
    }
  }, [count, target, targetReached]);

  const handleReset = () => {
    setCount(0);
    setTargetReached(false);
    triggerHaptic('light');
  };

  const handleSwipe = (info: PanInfo) => {
    if (Math.abs(info.offset.x) > 50) {
      const direction = info.offset.x > 0 ? -1 : 1;
      setDzikirIndex((prev: number) => {
        const newIndex = prev + direction;
        if (newIndex < 0) return DZIKIR_PRESETS.length - 1;
        if (newIndex >= DZIKIR_PRESETS.length) return 0;
        return newIndex;
      });
      triggerHaptic('light');
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      onClick={handleTap}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 p-4 flex items-center justify-between bg-background/90 backdrop-blur-sm border-b border-border"
        onClick={e => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {language === 'id' ? 'Tasbih Digital' : 'Digital Tasbih'}
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Dzikir Text with Swipe */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => handleSwipe(info)}
          className="text-center mb-8 cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <motion.p 
            key={dzikirIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-arabic text-3xl text-accent mb-2"
          >
            {dzikir.arabic}
          </motion.p>
          <p className="text-lg font-semibold text-foreground">{dzikir.latin}</p>
          <p className="text-sm text-muted-foreground">{dzikir.meaning}</p>
          <div className="flex justify-center gap-1.5 mt-3">
            {DZIKIR_PRESETS.map((_, idx) => (
              <Circle 
                key={idx} 
                className={`h-2 w-2 ${idx === dzikirIndex ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ← {language === 'id' ? 'Geser untuk ganti dzikir' : 'Swipe to change'} →
          </p>
        </motion.div>

        {/* Simple Circle Counter */}
        <div className="relative w-64 h-64 mb-8">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 110}
              initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 110 * (1 - progress / 100) }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={count}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-accent tabular-nums"
            >
              {count}
            </motion.span>
            <span className="text-lg text-muted-foreground">/ {target}</span>
          </div>
        </div>

        {/* Tap Instruction */}
        <p className="text-sm text-muted-foreground mb-8">
          {language === 'id' ? 'Ketuk layar untuk menghitung' : 'Tap screen to count'}
        </p>

        {/* Control Buttons */}
        <div className="flex gap-4" onClick={e => e.stopPropagation()}>
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <div className="relative">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowTargetMenu(!showTargetMenu)}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Target: {target}
            </Button>
            
            <AnimatePresence>
              {showTargetMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
                >
                  {TARGET_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTarget(opt);
                        setShowTargetMenu(false);
                        if (count >= opt) setTargetReached(true);
                        else setTargetReached(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${
                        target === opt ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                    >
                      {opt}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
};
