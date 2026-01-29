import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeeklyLineChartProps {
  data?: number[];
}

interface TooltipData {
  x: number;
  y: number;
  value: number;
  day: string;
}

export const WeeklyLineChart = ({ data }: WeeklyLineChartProps) => {
  const { language } = useLanguage();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Default to current week with 0 values for new users
  const weekData = useMemo(() => {
    if (data && data.length === 7) return data;
    return [0, 0, 0, 0, 0, 0, 0];
  }, [data]);

  const dayLabels = language === 'id' 
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const fullDayLabels = language === 'id'
    ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const maxValue = Math.max(...weekData, 1); // At least 1 to avoid division by zero
  const chartHeight = 140;
  const chartWidth = 280;
  const padding = { left: 30, right: 15, top: 20, bottom: 30 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Calculate points for the line
  const points = weekData.map((value, index) => {
    const x = padding.left + (index / 6) * graphWidth;
    const y = padding.top + graphHeight - (value / maxValue) * graphHeight;
    return { x, y, value };
  });

  // Create smooth Bezier curve path
  const createBezierPath = () => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const tension = 0.3;
      
      const cp1x = current.x + (next.x - current.x) * tension;
      const cp1y = current.y;
      const cp2x = next.x - (next.x - current.x) * tension;
      const cp2y = next.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  const bezierPath = createBezierPath();

  // Create gradient area path with Bezier curve
  const areaPath = `${bezierPath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  // Calculate totals
  const totalCompleted = weekData.reduce((a, b) => a + b, 0);
  const averageDaily = (totalCompleted / 7).toFixed(1);

  const handlePointClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const point = points[index];
    if (tooltip && tooltip.day === fullDayLabels[index]) {
      setTooltip(null);
    } else {
      setTooltip({
        x: point.x,
        y: point.y,
        value: point.value,
        day: fullDayLabels[index]
      });
    }
  };

  return (
    <div className="w-full" onClick={() => setTooltip(null)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {language === 'id' ? 'Total Minggu Ini' : 'This Week Total'}
          </p>
          <p className="text-2xl font-bold text-primary">{totalCompleted}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {language === 'id' ? 'Rata-rata Harian' : 'Daily Average'}
          </p>
          <p className="text-lg font-semibold text-foreground">{averageDaily}</p>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
        <defs>
          <linearGradient id="lineGradientBezier" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--primary-glow))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <linearGradient id="areaGradientBezier" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadowFilter">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
          <line
            key={idx}
            x1={padding.left}
            y1={padding.top + graphHeight * (1 - ratio)}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight * (1 - ratio)}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
        ))}

        {/* Y-axis labels */}
        {[0, Math.round(maxValue / 2), maxValue].map((val, idx) => (
          <text
            key={idx}
            x={padding.left - 8}
            y={padding.top + graphHeight - (val / maxValue) * graphHeight + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            {val}
          </text>
        ))}

        {/* Gradient Area under curve */}
        <motion.path
          d={areaPath}
          fill="url(#areaGradientBezier)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        {/* Bezier Curve Line with Glow */}
        <motion.path
          d={bezierPath}
          fill="none"
          stroke="url(#lineGradientBezier)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadowFilter)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Interactive Data points */}
        {points.map((point, idx) => (
          <motion.g 
            key={idx} 
            onClick={(e) => handlePointClick(idx, e)}
            style={{ cursor: 'pointer' }}
          >
            {/* Outer glow ring on hover */}
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="10"
              fill="hsl(var(--primary))"
              opacity="0"
              whileHover={{ opacity: 0.2 }}
              transition={{ duration: 0.2 }}
            />
            {/* Main point */}
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.3 }}
              transition={{ delay: 0.4 + idx * 0.08 }}
            />
          </motion.g>
        ))}

        {/* X-axis labels */}
        {dayLabels.map((label, idx) => (
          <text
            key={idx}
            x={padding.left + (idx / 6) * graphWidth}
            y={chartHeight - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {label}
          </text>
        ))}

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              <rect
                x={tooltip.x - 45}
                y={tooltip.y - 48}
                width="90"
                height="40"
                rx="8"
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                filter="url(#shadowFilter)"
              />
              <text
                x={tooltip.x}
                y={tooltip.y - 32}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                {tooltip.day}
              </text>
              <text
                x={tooltip.x}
                y={tooltip.y - 18}
                textAnchor="middle"
                className="fill-primary text-[12px] font-bold"
              >
                {tooltip.value} {language === 'id' ? 'amalan' : 'tasks'}
              </text>
              {/* Tooltip arrow */}
              <polygon
                points={`${tooltip.x - 6},${tooltip.y - 8} ${tooltip.x + 6},${tooltip.y - 8} ${tooltip.x},${tooltip.y - 2}`}
                fill="hsl(var(--card))"
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
};
