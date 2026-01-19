import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Lock, ChevronRight, Star, Clock, User } from "lucide-react";

const topics = [
  { id: "akhlak", label: "Akhlak", icon: "💫", count: 12 },
  { id: "ibadah", label: "Ibadah", icon: "🕌", count: 8 },
  { id: "dosa", label: "Dosa & Taubat", icon: "💔", count: 15 },
  { id: "hijrah", label: "Hijrah", icon: "🌱", count: 10 },
  { id: "keluarga", label: "Keluarga", icon: "👨‍👩‍👧", count: 6 },
  { id: "pergaulan", label: "Pergaulan", icon: "👥", count: 9 },
];

const consultants = [
  {
    id: "1",
    name: "Ustadz Ahmad Fauzi",
    specialty: "Akhlak & Ibadah",
    rating: 4.9,
    reviews: 128,
    available: true,
    nextSlot: "Hari ini, 14:00",
  },
  {
    id: "2",
    name: "Ustadzah Fatimah Zahra",
    specialty: "Keluarga & Pergaulan",
    rating: 4.8,
    reviews: 95,
    available: true,
    nextSlot: "Hari ini, 16:30",
  },
  {
    id: "3",
    name: "Ustadz Muhammad Ridwan",
    specialty: "Dosa & Taubat, Hijrah",
    rating: 4.9,
    reviews: 156,
    available: false,
    nextSlot: "Besok, 09:00",
  },
];

export const ConsultationPage = () => {
  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Konsultasi</h1>
        <p className="text-sm text-muted-foreground">Bicara dengan ustadz/ustadzah secara anonim</p>
      </motion.div>

      {/* Anonymous Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <Card variant="spiritual">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">100% Anonim & Rahasia</h3>
              <p className="text-xs text-muted-foreground">Identitasmu terjaga, bicaralah dengan tenang</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topic Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">Pilih Topik</h2>
        <div className="grid grid-cols-3 gap-2">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card variant="default" className="cursor-pointer hover:shadow-glow hover:border-primary/30 transition-all">
                <CardContent className="p-3 text-center">
                  <span className="text-2xl block mb-1">{topic.icon}</span>
                  <p className="text-xs font-medium text-foreground">{topic.label}</p>
                  <p className="text-[10px] text-muted-foreground">{topic.count} konsultan</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="spiritual" size="lg" className="h-auto py-4 flex-col gap-2">
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm">Chat Sekarang</span>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
            <Calendar className="h-6 w-6" />
            <span className="text-sm">Jadwalkan</span>
          </Button>
        </div>
      </motion.div>

      {/* Available Consultants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Konsultan Tersedia</h2>
          <Button variant="ghost" size="sm">Lihat semua</Button>
        </div>
        <div className="space-y-3">
          {consultants.map((consultant, index) => (
            <motion.div
              key={consultant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card variant="elevated" className="cursor-pointer hover:shadow-glow transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">{consultant.name}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{consultant.specialty}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          <span className="text-xs font-medium text-foreground">{consultant.rating}</span>
                          <span className="text-xs text-muted-foreground">({consultant.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${consultant.available ? "text-primary" : "text-muted-foreground"}`}>
                            {consultant.nextSlot}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-5 mt-6"
      >
        <Card variant="hope">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Punya Pertanyaan?</h3>
              <p className="text-xs text-muted-foreground">Lihat FAQ atau hubungi support</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
