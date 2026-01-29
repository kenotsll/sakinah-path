import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, RotateCcw, Target, Volume2, VolumeX, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface TasbihDigitalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DZIKIR_PRESETS = [
  { arabic: "سُبْحَانَ اللّٰهِ", latin: "Subhanallah", meaning: "Maha Suci Allah" },
  { arabic: "اَلْحَمْدُ لِلّٰهِ", latin: "Alhamdulillah", meaning: "Segala Puji Bagi Allah" },
  { arabic: "اللّٰهُ أَكْبَرُ", latin: "Allahu Akbar", meaning: "Allah Maha Besar" },
  { arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ", latin: "Laa ilaaha illallah", meaning: "Tiada Tuhan Selain Allah" },
  { arabic: "أَسْتَغْفِرُ اللّٰهَ", latin: "Astaghfirullah", meaning: "Aku Mohon Ampun kepada Allah" },
];

const TARGET_OPTIONS = [33, 99, 100, 1000];

// Simple click sound using Web Audio API
const playClickSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
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

export const TasbihDigital = ({ isOpen, onClose }: TasbihDigitalProps) => {
  const { language } = useLanguage();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [dzikirIndex, setDzikirIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [targetReached, setTargetReached] = useState(false);

  const dzikir = DZIKIR_PRESETS[dzikirIndex];
  const progress = (count / target) * 100;

  const handleTap = useCallback(() => {
    if (count < target) {
      setCount(prev => prev + 1);
      triggerHaptic('light');
      if (soundEnabled) playClickSound();
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
      setDzikirIndex(prev => {
        const newIndex = prev + direction;
        if (newIndex < 0) return DZIKIR_PRESETS.length - 1;
        if (newIndex >= DZIKIR_PRESETS.length) return 0;
        return newIndex;
      });
      triggerHaptic('light');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
          onClick={handleTap}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
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
          <div className="h-full flex flex-col items-center justify-center px-6">
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
              <p className="text-lg font-medium text-foreground">{dzikir.latin}</p>
              <p className="text-sm text-muted-foreground">{dzikir.meaning}</p>
              <div className="flex justify-center gap-1 mt-3">
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

            {/* Counter Circle */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="relative w-56 h-56 mb-8"
            >
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="112"
                  cy="112"
                  r="100"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
                  initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 100 * (1 - progress / 100) }}
                  transition={{ duration: 0.3 }}
                />
              </svg>
              
              {/* Counter Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={count}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-accent"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {count}
                </motion.span>
                <span className="text-muted-foreground">/ {target}</span>
              </div>

              {/* Target Reached Animation */}
              <AnimatePresence>
                {targetReached && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full"
                  >
                    <span className="text-2xl">✨</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

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
                      className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
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
                          className={`w-full px-4 py-2 text-left hover:bg-muted transition-colors ${
                            target === opt ? 'bg-primary/10 text-primary' : ''
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
