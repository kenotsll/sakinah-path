import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ChevronRight, Star, User, MessageCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const topics = [
  { id: "akhlak", label: "Akhlak", icon: "💫" },
  { id: "ibadah", label: "Ibadah", icon: "🕌" },
  { id: "dosa", label: "Dosa & Taubat", icon: "💔" },
  { id: "hijrah", label: "Hijrah", icon: "🌱" },
  { id: "keluarga", label: "Keluarga", icon: "👨‍👩‍👧" },
  { id: "pergaulan", label: "Pergaulan", icon: "👥" },
];

const consultants = [
  {
    id: "1",
    name: "Ustadz Ahmad Fauzi",
    specialty: "Akhlak & Ibadah",
    rating: 4.9,
    reviews: 128,
    whatsapp: "6281234567890",
    topics: ["akhlak", "ibadah"],
  },
  {
    id: "2",
    name: "Ustadzah Fatimah Zahra",
    specialty: "Keluarga & Pergaulan",
    rating: 4.8,
    reviews: 95,
    whatsapp: "6281234567891",
    topics: ["keluarga", "pergaulan"],
  },
  {
    id: "3",
    name: "Ustadz Muhammad Ridwan",
    specialty: "Dosa & Taubat, Hijrah",
    rating: 4.9,
    reviews: 156,
    whatsapp: "6281234567892",
    topics: ["dosa", "hijrah"],
  },
];

interface ConsultationPageProps {
  onOpenFAQ?: () => void;
}

export const ConsultationPage = ({ onOpenFAQ }: ConsultationPageProps) => {
  const [selectedTopics, setSelectedTopics] = useState<Record<string, string>>({});

  const handleWhatsAppContact = (consultant: typeof consultants[0]) => {
    const selectedTopic = selectedTopics[consultant.id];
    const topicLabel = topics.find(t => t.id === selectedTopic)?.label || "konsultasi";
    
    const message = `Assalamu'alaikum ${consultant.name}, saya pengguna aplikasi Istiqamah. Saya ingin berkonsultasi mengenai topik: ${topicLabel}.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${consultant.whatsapp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };

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
        <h2 className="text-sm font-semibold text-foreground mb-3">Topik Konsultasi</h2>
        <div className="grid grid-cols-3 gap-2">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card variant="default" className="hover:shadow-glow hover:border-primary/30 transition-all">
                <CardContent className="p-3 text-center">
                  <span className="text-2xl block mb-1">{topic.icon}</span>
                  <p className="text-xs font-medium text-foreground">{topic.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
        </div>
        <div className="space-y-3">
          {consultants.map((consultant, index) => (
            <motion.div
              key={consultant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card variant="elevated" className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{consultant.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{consultant.specialty}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-xs font-medium text-foreground">{consultant.rating}</span>
                        <span className="text-xs text-muted-foreground">({consultant.reviews} ulasan)</span>
                      </div>
                    </div>
                  </div>

                  {/* Topic Selection */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Pilih Topik:</p>
                    <Select
                      value={selectedTopics[consultant.id] || ""}
                      onValueChange={(value) => setSelectedTopics({
                        ...selectedTopics,
                        [consultant.id]: value
                      })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih topik konsultasi..." />
                      </SelectTrigger>
                      <SelectContent>
                        {topics
                          .filter(t => consultant.topics.includes(t.id))
                          .map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              <span className="flex items-center gap-2">
                                <span>{topic.icon}</span>
                                <span>{topic.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* WhatsApp Button */}
                  <Button
                    variant="spiritual"
                    className="w-full"
                    onClick={() => handleWhatsAppContact(consultant)}
                    disabled={!selectedTopics[consultant.id]}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Hubungi via WhatsApp
                  </Button>
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
        <Card 
          variant="hope" 
          className="cursor-pointer hover:shadow-glow transition-all"
          onClick={onOpenFAQ}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Bantuan & FAQ</h3>
              <p className="text-xs text-muted-foreground">Lihat FAQ atau kirim feedback</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};