import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const quotes = [
  {
    arabic: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ",
    translation: "Sesungguhnya Allah menyukai orang-orang yang bertaubat",
    source: "QS. Al-Baqarah: 222"
  },
  {
    arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا",
    translation: "Dan bertaubatlah kamu sekalian kepada Allah",
    source: "QS. An-Nur: 31"
  },
  {
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
    translation: "Katakanlah: Wahai hamba-hamba-Ku yang melampaui batas, janganlah kamu berputus asa dari rahmat Allah",
    source: "QS. Az-Zumar: 53"
  }
];

export const DailyQuote = () => {
  const today = new Date().getDay();
  const quote = quotes[today % quotes.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card variant="elevated" className="overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="w-full h-full islamic-pattern" />
        </div>
        <CardContent className="p-5 relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-accent-soft flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <span className="text-xs font-medium text-accent">Mutiara Hari Ini</span>
          </div>
          
          <p className="font-arabic text-xl text-foreground leading-relaxed text-right mb-3">
            {quote.arabic}
          </p>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            "{quote.translation}"
          </p>
          
          <p className="text-xs text-primary font-medium">
            {quote.source}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
