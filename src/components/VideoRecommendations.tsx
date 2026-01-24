import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { videoDatabase } from "@/data/videos";

const videos = videoDatabase.slice(0, 8);

export const VideoRecommendations = () => {
  const openYouTube = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="px-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Video Motivasi</h3>
        <button className="text-xs font-medium text-primary">Lihat semua</button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            className="flex-shrink-0 w-48"
          >
            <Card
              variant="elevated"
              className="overflow-hidden cursor-pointer hover:shadow-glow transition-shadow"
              onClick={() => openYouTube(video.youtubeUrl)}
            >
              <div className="relative h-28">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-[10px] font-medium text-primary-foreground/80 bg-primary/80 px-2 py-0.5 rounded-full">
                    {video.category}
                  </span>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="h-10 w-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Play className="h-4 w-4 text-primary ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] text-primary-foreground/80">
                  {video.duration}
                </span>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                  {video.title}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
