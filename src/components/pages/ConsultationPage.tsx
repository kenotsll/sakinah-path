import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, MessageCircle, User, Clock, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { consultants, topics, isConsultantAvailable, getAvailabilityText } from "@/data/consultants";

interface ConsultationPageProps {
  onOpenFAQ?: () => void;
}

export const ConsultationPage = ({ onOpenFAQ }: ConsultationPageProps) => {
  const [selectedTopics, setSelectedTopics] = useState<Record<string, string>>({});
  const [filterTopic, setFilterTopic] = useState<string>("all");

  // Filter consultants by topic
  const filteredConsultants = useMemo(() => {
    if (filterTopic === "all") return consultants;
    return consultants.filter((c) => c.topics.includes(filterTopic));
  }, [filterTopic]);

  const handleWhatsAppContact = (consultant: typeof consultants[0]) => {
    const selectedTopic = selectedTopics[consultant.id];
    const topicLabel = topics.find((t) => t.id === selectedTopic)?.label || "konsultasi";

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
        <p className="text-sm text-muted-foreground">
          Bicara dengan ustadz/ustadzah secara anonim
        </p>
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
              <p className="text-xs text-muted-foreground">
                Identitasmu terjaga, bicaralah dengan tenang
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topic Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">Filter Topik</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterTopic("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterTopic === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border hover:border-primary/50"
            }`}
          >
            📚 Semua
          </button>
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setFilterTopic(topic.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterTopic === topic.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border hover:border-primary/50"
              }`}
            >
              <span>{topic.icon}</span>
              {topic.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Available Consultants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Konsultan Tersedia</h2>
          <span className="text-xs text-muted-foreground">
            {filteredConsultants.length} ustadz/ah
          </span>
        </div>
        <div className="space-y-3">
          {filteredConsultants.map((consultant, index) => {
            const isAvailable = isConsultantAvailable(consultant);

            return (
              <motion.div
                key={consultant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card variant="elevated" className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-14 w-14 rounded-full gradient-hero flex items-center justify-center text-primary-foreground relative">
                        <User className="h-7 w-7" />
                        {/* Online Status Indicator */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center ${
                            isAvailable ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <Circle
                            className={`h-2 w-2 ${isAvailable ? "text-green-200" : "text-red-200"}`}
                            fill="currentColor"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {consultant.name}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {consultant.specialty}
                        </p>
                        
                        {/* Availability Hours */}
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {getAvailabilityText(consultant)}
                          </span>
                          <span
                            className={`text-xs font-medium ml-1 ${
                              isAvailable ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {isAvailable ? "• Online" : "• Offline"}
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-xs font-medium text-foreground">
                            {consultant.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({consultant.reviews} ulasan)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {consultant.bio}
                    </p>

                    {/* Topic Selection */}
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Pilih Topik:</p>
                      <Select
                        value={selectedTopics[consultant.id] || ""}
                        onValueChange={(value) =>
                          setSelectedTopics({
                            ...selectedTopics,
                            [consultant.id]: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih topik konsultasi..." />
                        </SelectTrigger>
                        <SelectContent>
                          {topics
                            .filter((t) => consultant.topics.includes(t.id))
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
            );
          })}
        </div>
      </motion.div>

      {/* FAQ Link */}
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
