import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, MessageCircle, User, Clock, Circle, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { consultants, topics, isConsultantAvailable, getAvailabilityText } from "@/data/consultants";
import { useLanguage } from "@/contexts/LanguageContext";

export const ConsultationPage = () => {
  const { language } = useLanguage();
  const [selectedTopics, setSelectedTopics] = useState<Record<string, string>>({});
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter consultants by topic and search query
  const filteredConsultants = useMemo(() => {
    let result = consultants;
    
    // Filter by topic
    if (filterTopic !== "all") {
      result = result.filter((c) => c.topics.includes(filterTopic));
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => 
        c.name.toLowerCase().includes(query) ||
        c.specialty.toLowerCase().includes(query) ||
        c.bio.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [filterTopic, searchQuery]);

  const handleWhatsAppContact = (consultant: typeof consultants[0]) => {
    const selectedTopic = selectedTopics[consultant.id];
    const topicLabel = topics.find((t) => t.id === selectedTopic)?.label || "konsultasi";

    const message = `Assalamu'alaikum ${consultant.name}, saya pengguna aplikasi Istiqamah. Saya ingin berkonsultasi mengenai topik: ${topicLabel}.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${consultant.whatsapp}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {language === 'id' ? 'Konsultasi' : 'Consultation'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === 'id' ? 'Bicara dengan ustadz/ustadzah secara anonim' : 'Talk to scholars anonymously'}
        </p>
      </motion.div>

      {/* Anonymous Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-4"
      >
        <Card variant="spiritual">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                {language === 'id' ? '100% Anonim & Rahasia' : '100% Anonymous & Confidential'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'id' ? 'Identitasmu terjaga, bicaralah dengan tenang' : 'Your identity is protected, speak freely'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 mb-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'id' ? "Cari ustadz/ustadzah..." : "Search scholars..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="iconSm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Topic Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {language === 'id' ? 'Filter Topik' : 'Filter by Topic'}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterTopic("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterTopic === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border hover:border-primary/50"
            }`}
          >
            📚 {language === 'id' ? 'Semua' : 'All'}
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
          <h2 className="text-sm font-semibold text-foreground">
            {language === 'id' ? 'Konsultan Tersedia' : 'Available Consultants'}
          </h2>
          <span className="text-xs text-muted-foreground">
            {filteredConsultants.length} {language === 'id' ? 'ustadz/ah' : 'scholars'}
          </span>
        </div>

        {/* No Results Message */}
        {filteredConsultants.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {language === 'id' 
                  ? `Tidak ditemukan ustadz dengan pencarian "${searchQuery}"`
                  : `No scholars found for "${searchQuery}"`}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={clearSearch}>
                {language === 'id' ? 'Hapus Pencarian' : 'Clear Search'}
              </Button>
            </CardContent>
          </Card>
        )}

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
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center ${
                            isAvailable 
                              ? "bg-[hsl(var(--success))]" 
                              : "bg-destructive"
                          }`}
                        >
                          <Circle
                            className="h-2 w-2 text-card"
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
                        
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {getAvailabilityText(consultant)}
                          </span>
                          <span
                            className={`text-xs font-medium ml-1 ${
                              isAvailable 
                                ? "text-[hsl(var(--success))]" 
                                : "text-destructive"
                            }`}
                          >
                            {isAvailable ? "• Online" : "• Offline"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-xs font-medium text-foreground">
                            {consultant.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({consultant.reviews} {language === 'id' ? 'ulasan' : 'reviews'})
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {consultant.bio}
                    </p>

                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        {language === 'id' ? 'Pilih Topik:' : 'Select Topic:'}
                      </p>
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
                          <SelectValue placeholder={language === 'id' ? "Pilih topik konsultasi..." : "Choose consultation topic..."} />
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

                    <Button
                      variant="spiritual"
                      className="w-full"
                      onClick={() => handleWhatsAppContact(consultant)}
                      disabled={!selectedTopics[consultant.id]}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {language === 'id' ? 'Hubungi via WhatsApp' : 'Contact via WhatsApp'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
