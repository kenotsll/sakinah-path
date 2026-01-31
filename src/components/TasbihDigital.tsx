import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
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
const TOTAL_BEADS = 33;

// Persistent audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (happens after user gesture requirement)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch (e) {
    console.error('AudioContext not supported:', e);
    return null;
  }
};

// Modern digital click sound using Web Audio API
const playDigitalClick = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if needed (must be done in user gesture)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Create a more modern, crisp digital click
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Modern digital click - higher frequency, sharper attack
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
    oscillator.type = 'sine';
    
    // Crisp filter
    filter.type = 'highpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    
    // Sharp attack, quick decay
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Audio not supported
    console.warn('Audio playback failed:', e);
  }
};

// Haptic feedback
const triggerHaptic = (type: 'light' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'heavy' ? [100, 50, 100] : 15);
  }
};

// Generate octagon bead positions
const generateOctagonPositions = (totalBeads: number, radius: number) => {
  const positions: { x: number; y: number; angle: number }[] = [];
  const beadsPerSide = Math.ceil(totalBeads / 8);
  
  // Octagon vertices (8 corners)
  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 - Math.PI / 2; // Start from top
    vertices.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  
  // Place beads along each side
  let beadIndex = 0;
  for (let side = 0; side < 8 && beadIndex < totalBeads; side++) {
    const startVertex = vertices[side];
    const endVertex = vertices[(side + 1) % 8];
    
    const beadsOnThisSide = side === 7 
      ? totalBeads - beadIndex 
      : Math.min(beadsPerSide, totalBeads - beadIndex);
    
    for (let j = 0; j < beadsOnThisSide && beadIndex < totalBeads; j++) {
      const t = beadsOnThisSide > 1 ? j / beadsOnThisSide : 0;
      positions.push({
        x: startVertex.x + (endVertex.x - startVertex.x) * t,
        y: startVertex.y + (endVertex.y - startVertex.y) * t,
        angle: (side * 45) + (j * 45 / beadsOnThisSide),
      });
      beadIndex++;
    }
  }
  
  return positions;
};

export const TasbihDigital = ({ isOpen, onClose }: TasbihDigitalProps) => {
  const { language } = useLanguage();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [dzikirIndex, setDzikirIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [targetReached, setTargetReached] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);

  const dzikir = DZIKIR_PRESETS[dzikirIndex];
  const progress = (count / target) * 100;
  
  // Initialize audio context on first user interaction
  const audioInitializedRef = useRef(false);
  
  // Generate bead positions
  const beadPositions = useMemo(() => generateOctagonPositions(TOTAL_BEADS, 100), []);
  
  // Calculate which beads are "counted"
  const countedBeads = count % TOTAL_BEADS;
  const fullRounds = Math.floor(count / TOTAL_BEADS);

  // Initialize audio on first interaction (required by browsers)
  const initAudio = useCallback(() => {
    if (!audioInitializedRef.current) {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      audioInitializedRef.current = true;
    }
  }, []);

  const handleTap = useCallback(() => {
    // Initialize audio on first tap
    initAudio();
    
    if (count < target) {
      setCount(prev => prev + 1);
      // Rotate the entire octagon by one bead position
      setRotationOffset(prev => prev + (360 / TOTAL_BEADS));
      triggerHaptic('light');
      if (soundEnabled) playDigitalClick();
    }
  }, [count, target, soundEnabled, initAudio]);

  // Check if target reached
  useEffect(() => {
    if (count >= target && !targetReached) {
      setTargetReached(true);
      triggerHaptic('heavy');
    }
  }, [count, target, targetReached]);

  const handleReset = () => {
    setCount(0);
    setRotationOffset(0);
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
          className="fixed inset-0 z-50 bg-background"
          onClick={handleTap}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {language === 'id' ? 'Tasbih Kinetik' : 'Kinetic Tasbih'}
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
              className="text-center mb-6 cursor-grab active:cursor-grabbing"
              onClick={e => e.stopPropagation()}
            >
              <motion.p 
                key={dzikirIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-arabic text-2xl text-accent mb-1"
              >
                {dzikir.arabic}
              </motion.p>
              <p className="text-base font-medium text-foreground">{dzikir.latin}</p>
              <p className="text-xs text-muted-foreground">{dzikir.meaning}</p>
              <div className="flex justify-center gap-1 mt-2">
                {DZIKIR_PRESETS.map((_, idx) => (
                  <Circle 
                    key={idx} 
                    className={`h-1.5 w-1.5 ${idx === dzikirIndex ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                ← {language === 'id' ? 'Geser untuk ganti dzikir' : 'Swipe to change'} →
              </p>
            </motion.div>

            {/* Octagon Tasbih */}
            <motion.div
              className="relative w-64 h-64 mb-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Octagon outline */}
              <svg className="absolute inset-0 w-full h-full" viewBox="-130 -130 260 260">
                {/* Octagon path */}
                <polygon
                  points="-100,-42 -42,-100 42,-100 100,-42 100,42 42,100 -42,100 -100,42"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  opacity="0.3"
                />
              </svg>
              
              {/* Rotating Beads Container */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -rotationOffset }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              >
                <svg className="w-full h-full" viewBox="-130 -130 260 260">
                  {beadPositions.map((pos, index) => {
                    const isCounted = index < countedBeads;
                    const isCurrentBead = index === countedBeads - 1;
                    
                    return (
                      <motion.circle
                        key={index}
                        cx={pos.x}
                        cy={pos.y}
                        r={7}
                        initial={false}
                        animate={{
                          fill: isCounted 
                            ? "hsl(var(--primary))" 
                            : "hsl(var(--muted))",
                          scale: isCurrentBead ? 1.3 : 1,
                          filter: isCurrentBead ? "drop-shadow(0 0 6px hsl(var(--primary)))" : "none",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        stroke={isCounted ? "hsl(var(--primary-glow))" : "hsl(var(--border))"}
                        strokeWidth={isCounted ? 2 : 1}
                      />
                    );
                  })}
                </svg>
              </motion.div>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.span
                  key={count}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold text-accent tabular-nums"
                >
                  {count}
                </motion.span>
                <span className="text-sm text-muted-foreground">/ {target}</span>
                {fullRounds > 0 && (
                  <span className="text-xs text-primary mt-1">
                    🔄 {fullRounds}x
                  </span>
                )}
              </div>

              {/* Progress Ring (outer) */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="-130 -130 260 260">
                <circle
                  cx="0"
                  cy="0"
                  r="120"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                  opacity="0.3"
                />
                <motion.circle
                  cx="0"
                  cy="0"
                  r="120"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 120}
                  initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100) }}
                  transition={{ duration: 0.3 }}
                />
              </svg>

              {/* Target Reached Animation */}
              <AnimatePresence>
                {targetReached && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full pointer-events-none"
                  >
                    <span className="text-3xl">✨</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tap Instruction */}
            <p className="text-sm text-muted-foreground mb-6">
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
