import { useState, useCallback, useEffect, useMemo } from "react";
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
const TOTAL_BEADS = 33;
const STORAGE_KEY = 'istiqamah_tasbih_state';

// Modern digital click sound using Web Audio API
const playDigitalClick = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillators for a sharper, more digital sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sharp attack frequencies
    osc1.frequency.setValueAtTime(2000, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.02);
    osc1.type = 'triangle';
    
    osc2.frequency.setValueAtTime(1500, audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.025);
    osc2.type = 'sine';
    
    // High-pass filter for crisp sound
    filter.type = 'highpass';
    filter.frequency.value = 600;
    filter.Q.value = 2;
    
    // Sharp attack, quick decay
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.06);
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.06);
    osc2.stop(audioContext.currentTime + 0.06);
  } catch (e) {
    // Audio not supported
  }
};

// Haptic feedback
const triggerHaptic = (type: 'light' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'heavy' ? [100, 50, 100] : 20);
  }
};

// 3D Octagon Bead Component
const OctagonBead3D = ({ 
  isActive, 
  isCurrent,
  index,
  onTap,
}: { 
  isActive: boolean; 
  isCurrent: boolean;
  index: number;
  onTap: () => void;
}) => {
  // Octagon points for SVG
  const size = 56;
  const cx = size / 2;
  const cy = size / 2;
  const r = 24;
  
  // Generate octagon points
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
    return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  }).join(' ');

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isCurrent ? 1.15 : 1,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        delay: index * 0.02,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
      >
        {/* Outer glow for current bead */}
        {isCurrent && (
          <polygon
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            opacity="0.4"
            filter="blur(4px)"
          />
        )}
        
        {/* Main octagon with 3D gradient */}
        <defs>
          <linearGradient id={`bead-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isActive ? (
              <>
                <stop offset="0%" stopColor="hsl(142, 40%, 55%)" />
                <stop offset="50%" stopColor="hsl(142, 35%, 45%)" />
                <stop offset="100%" stopColor="hsl(142, 30%, 35%)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="hsl(0, 0%, 35%)" />
                <stop offset="50%" stopColor="hsl(0, 0%, 25%)" />
                <stop offset="100%" stopColor="hsl(0, 0%, 18%)" />
              </>
            )}
          </linearGradient>
          
          {/* Faceted crystal highlight */}
          <linearGradient id={`highlight-${index}`} x1="0%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        {/* Base octagon */}
        <polygon
          points={points}
          fill={`url(#bead-gradient-${index})`}
          stroke={isActive ? "hsl(142, 35%, 55%)" : "hsl(0, 0%, 30%)"}
          strokeWidth="1.5"
        />
        
        {/* Facet lines for crystal effect */}
        <line 
          x1={cx} y1={cy - r * 0.7} 
          x2={cx} y2={cy} 
          stroke="rgba(255,255,255,0.15)" 
          strokeWidth="0.5"
        />
        <line 
          x1={cx - r * 0.5} y1={cy - r * 0.5} 
          x2={cx} y2={cy} 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="0.5"
        />
        <line 
          x1={cx + r * 0.5} y1={cy - r * 0.5} 
          x2={cx} y2={cy} 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="0.5"
        />
        
        {/* Top highlight for 3D effect */}
        <polygon
          points={points}
          fill={`url(#highlight-${index})`}
          opacity="0.6"
        />
        
        {/* Small center facet */}
        <circle
          cx={cx}
          cy={cy}
          r="4"
          fill={isActive ? "hsl(142, 40%, 60%)" : "hsl(0, 0%, 35%)"}
          opacity="0.5"
        />
      </svg>
    </motion.div>
  );
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
  const fullRounds = Math.floor(count / TOTAL_BEADS);

  // Save state to localStorage
  useEffect(() => {
    const state = { count, target, dzikirIndex };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [count, target, dzikirIndex]);

  const handleTap = useCallback(() => {
    if (count < target) {
      setCount(prev => prev + 1);
      triggerHaptic('light');
      if (soundEnabled) playDigitalClick();
    } else if (!targetReached) {
      setTargetReached(true);
      triggerHaptic('heavy');
    }
  }, [count, target, soundEnabled, targetReached]);

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

  // Generate visible beads (show around current count position)
  const visibleBeads = useMemo(() => {
    const beads = [];
    const currentBeadInRound = count % TOTAL_BEADS;
    
    for (let i = 0; i < TOTAL_BEADS; i++) {
      beads.push({
        index: i,
        isActive: i < currentBeadInRound || (count > 0 && i === currentBeadInRound),
        isCurrent: i === currentBeadInRound && count < target,
      });
    }
    return beads;
  }, [count, target]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 flex items-center justify-between bg-background/90 backdrop-blur-sm border-b border-border">
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
      <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
        {/* Dzikir Text with Swipe */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => handleSwipe(info)}
          className="text-center mb-4 cursor-grab active:cursor-grabbing"
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

        {/* Counter Display */}
        <div className="text-center mb-6">
          <motion.span
            key={count}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl font-bold text-accent tabular-nums"
          >
            {count}
          </motion.span>
          <span className="text-2xl text-muted-foreground ml-2">/ {target}</span>
          {fullRounds > 0 && (
            <p className="text-sm text-primary mt-1">
              🔄 {fullRounds} {language === 'id' ? 'putaran selesai' : 'rounds completed'}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Vertical Bead List with scroll */}
        <div 
          className="flex-1 overflow-y-auto -mx-2 px-2"
          style={{ maxHeight: '35vh' }}
        >
          <div className="flex flex-wrap justify-center gap-2 py-2">
            {visibleBeads.map((bead) => (
              <OctagonBead3D
                key={bead.index}
                index={bead.index}
                isActive={bead.isActive}
                isCurrent={bead.isCurrent}
                onTap={handleTap}
              />
            ))}
          </div>
        </div>

        {/* Target Reached Animation */}
        <AnimatePresence>
          {targetReached && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setTargetReached(false)}
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="bg-card p-8 rounded-3xl text-center shadow-2xl"
              >
                <span className="text-6xl mb-4 block">✨</span>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {language === 'id' ? 'Alhamdulillah!' : 'Alhamdulillah!'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'id' ? 'Target tercapai' : 'Target reached'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap Area */}
        <motion.button
          className="w-full py-6 mt-4 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 text-primary font-medium"
          whileTap={{ scale: 0.98, backgroundColor: 'hsl(var(--primary) / 0.2)' }}
          onClick={handleTap}
        >
          {language === 'id' ? 'Ketuk di sini untuk menghitung' : 'Tap here to count'}
        </motion.button>

        {/* Control Buttons */}
        <div className="flex gap-4 mt-4 pb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <div className="relative flex-1">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowTargetMenu(!showTargetMenu)}
              className="w-full gap-2"
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
