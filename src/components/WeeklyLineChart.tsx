import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeeklyLineChartProps {
  data?: number[];
}

export const WeeklyLineChart = ({ data }: WeeklyLineChartProps) => {
  const { language } = useLanguage();

  // Default to current week with 0 values for new users
  const weekData = useMemo(() => {
    if (data && data.length === 7) return data;
    return [0, 0, 0, 0, 0, 0, 0];
  }, [data]);

  const dayLabels = language === 'id' 
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const maxValue = Math.max(...weekData, 1); // At least 1 to avoid division by zero
  const chartHeight = 120;
  const chartWidth = 260;
  const padding = { left: 30, right: 10, top: 10, bottom: 25 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Calculate points for the line
  const points = weekData.map((value, index) => {
    const x = padding.left + (index / 6) * graphWidth;
    const y = padding.top + graphHeight - (value / maxValue) * graphHeight;
    return { x, y, value };
  });

  // Create SVG path
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create gradient area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  // Calculate totals
  const totalCompleted = weekData.reduce((a, b) => a + b, 0);
  const averageDaily = (totalCompleted / 7).toFixed(1);

  return (
    <div className="w-full">
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
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
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
            strokeDasharray="3,3"
          />
        ))}

        {/* Y-axis labels */}
        {[0, Math.round(maxValue / 2), maxValue].map((val, idx) => (
          <text
            key={idx}
            x={padding.left - 5}
            y={padding.top + graphHeight - (val / maxValue) * graphHeight + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[8px]"
          >
            {val}
          </text>
        ))}

        {/* Area under line */}
        <motion.path
          d={areaPath}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Data points */}
        {points.map((point, idx) => (
          <motion.g key={idx}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            />
            {/* Value label on hover point */}
            {point.value > 0 && (
              <text
                x={point.x}
                y={point.y - 8}
                textAnchor="middle"
                className="fill-foreground text-[8px] font-medium"
              >
                {point.value}
              </text>
            )}
          </motion.g>
        ))}

        {/* X-axis labels */}
        {dayLabels.map((label, idx) => (
          <text
            key={idx}
            x={padding.left + (idx / 6) * graphWidth}
            y={chartHeight - 5}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
};
