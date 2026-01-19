import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Heart, BookOpen, CheckCircle } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Menghentikan Dosa",
    description: "Berhenti sepenuhnya dari perbuatan dosa yang dilakukan",
    icon: "🛑",
  },
  {
    number: 2,
    title: "Menyesal dengan Sungguh-sungguh",
    description: "Merasakan penyesalan yang mendalam atas dosa yang diperbuat",
    icon: "💔",
  },
  {
    number: 3,
    title: "Bertekad Tidak Mengulangi",
    description: "Berazam kuat untuk tidak kembali pada dosa tersebut",
    icon: "✊",
  },
  {
    number: 4,
    title: "Mengembalikan Hak (jika ada)",
    description: "Jika dosa terkait hak orang lain, kembalikan haknya atau minta maaf",
    icon: "🤝",
  },
];

const prayers = [
  {
    title: "Sayyidul Istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ...",
    translation: "Ya Allah, Engkau adalah Tuhanku, tidak ada Tuhan selain Engkau...",
  },
  {
    title: "Istighfar Sederhana",
    arabic: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ",
    translation: "Aku memohon ampunan kepada Allah Yang Maha Agung",
  },
];

export const TaubatGuidePage = () => {
  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="gradient-hero px-5 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-card/20 backdrop-blur-sm mb-4">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">
              Panduan Taubat
            </h1>
            <p className="text-sm text-primary-foreground/80 max-w-xs mx-auto">
              Langkah-langkah menuju ampunan Allah dengan penuh harapan
            </p>
          </motion.div>
        </div>
        <div className="h-6 bg-gradient-to-b from-primary/20 to-transparent" />
      </motion.div>

      {/* Dalil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 -mt-2"
      >
        <Card variant="elevated">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-arabic text-lg text-foreground text-right leading-relaxed mb-2">
                  وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  "Barangsiapa yang mengerjakan kejahatan dan menganiaya dirinya, kemudian ia mohon ampun kepada Allah, niscaya ia mendapati Allah Maha Pengampun lagi Maha Penyayang."
                </p>
                <p className="text-xs text-primary font-medium">QS. An-Nisa: 110</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Syarat Taubat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mt-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Syarat Taubat Nasuha</h2>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card variant="default" className="hover:shadow-glow transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center text-2xl flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                        Langkah {step.number}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Doa Taubat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-5 mt-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Doa Taubat</h2>
        <div className="space-y-3">
          {prayers.map((prayer, index) => (
            <Card key={index} variant="spiritual">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">{prayer.title}</h3>
                <p className="font-arabic text-lg text-foreground text-right leading-relaxed mb-2">
                  {prayer.arabic}
                </p>
                <p className="text-xs text-muted-foreground italic">{prayer.translation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-5 mt-6"
      >
        <Button variant="spiritual" size="lg" className="w-full">
          <CheckCircle className="h-5 w-5" />
          Mulai Perjalanan Taubat
        </Button>
      </motion.div>
    </div>
  );
};
