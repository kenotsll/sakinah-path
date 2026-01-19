import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, Clock, Filter, Search } from "lucide-react";
import heroMosque from "@/assets/hero-mosque.jpg";

const categories = [
  { id: "all", label: "Semua" },
  { id: "penyesalan", label: "Penyesalan" },
  { id: "harapan", label: "Harapan" },
  { id: "hijrah", label: "Hijrah" },
  { id: "istiqomah", label: "Istiqomah" },
];

const videos = [
  {
    id: "1",
    title: "Jangan Putus Asa dari Rahmat Allah",
    category: "harapan",
    duration: "5:32",
    thumbnail: heroMosque,
    speaker: "Ustadz Adi Hidayat",
    views: "12K",
    isBookmarked: true,
  },
  {
    id: "2",
    title: "Langkah Pertama Menuju Hijrah",
    category: "hijrah",
    duration: "8:15",
    thumbnail: heroMosque,
    speaker: "Ustadz Hanan Attaki",
    views: "8K",
    isBookmarked: false,
  },
  {
    id: "3",
    title: "Keutamaan Bertaubat di Malam Hari",
    category: "penyesalan",
    duration: "6:45",
    thumbnail: heroMosque,
    speaker: "Ustadz Khalid Basalamah",
    views: "15K",
    isBookmarked: true,
  },
  {
    id: "4",
    title: "Menjaga Istiqomah di Tengah Godaan",
    category: "istiqomah",
    duration: "12:30",
    thumbnail: heroMosque,
    speaker: "Ustadz Abdul Somad",
    views: "20K",
    isBookmarked: false,
  },
  {
    id: "5",
    title: "Air Mata Taubat yang Memadamkan Api Neraka",
    category: "penyesalan",
    duration: "7:20",
    thumbnail: heroMosque,
    speaker: "Ustadz Adi Hidayat",
    views: "18K",
    isBookmarked: false,
  },
];

import { useState } from "react";

export const VideoMotivasiPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredVideos = activeCategory === "all"
    ? videos
    : videos.filter(v => v.category === activeCategory);

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Video Motivasi</h1>
        <p className="text-sm text-muted-foreground">Temukan inspirasi untuk perjalanan hijrahmu</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari video motivasi..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Daily Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">Rekomendasi Hari Ini</h2>
        <Card variant="elevated" className="overflow-hidden">
          <div className="relative h-44">
            <img
              src={heroMosque}
              alt="Featured video"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 w-16 rounded-full gradient-hero flex items-center justify-center shadow-glow cursor-pointer"
              >
                <Play className="h-7 w-7 text-primary-foreground ml-1" />
              </motion.div>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-medium text-primary-foreground bg-accent/80 px-2 py-0.5 rounded-full">
                Harapan
              </span>
              <h3 className="text-base font-semibold text-primary-foreground mt-2">
                Jangan Putus Asa dari Rahmat Allah
              </h3>
              <p className="text-xs text-primary-foreground/70 mt-1">
                Ustadz Adi Hidayat • 5:32
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Video List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Semua Video</h2>
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
        <div className="space-y-3">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <Card variant="default" className="overflow-hidden cursor-pointer hover:shadow-glow transition-all">
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    <div className="relative w-32 h-20 flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover rounded-l-2xl"
                      />
                      <div className="absolute inset-0 bg-foreground/20 rounded-l-2xl" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                          <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 text-[10px] text-primary-foreground bg-foreground/60 px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <div className="flex-1 py-2 pr-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight mb-1">
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">{video.speaker}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{video.views} views</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          video.category === "harapan" ? "bg-primary-soft text-primary" :
                          video.category === "hijrah" ? "bg-spiritual-soft text-spiritual" :
                          video.category === "istiqomah" ? "bg-secondary text-secondary-foreground" :
                          "bg-hope text-hope-foreground"
                        }`}>
                          {categories.find(c => c.id === video.category)?.label}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="iconSm" className="self-center mr-2">
                      <Bookmark className={`h-4 w-4 ${video.isBookmarked ? "fill-primary text-primary" : ""}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
