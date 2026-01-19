import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Users, BookOpen, Phone, ExternalLink } from "lucide-react";

const nearbyMosques = [
  {
    id: "1",
    name: "Masjid Al-Ikhlas",
    address: "Jl. Kebon Jeruk No. 15",
    distance: "0.5 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC"],
    hasKajian: true,
    kajianTime: "Ba'da Maghrib",
  },
  {
    id: "2",
    name: "Masjid Raya Al-Hidayah",
    address: "Jl. Sudirman No. 88",
    distance: "1.2 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC", "Mushola Wanita"],
    hasKajian: true,
    kajianTime: "Setiap Ahad, 08:00",
  },
  {
    id: "3",
    name: "Masjid Nurul Iman",
    address: "Jl. Melati No. 42",
    distance: "1.8 km",
    nextPrayer: "Dzuhur - 12:10",
    facilities: ["Wudhu", "Parkir"],
    hasKajian: false,
  },
  {
    id: "4",
    name: "Masjid Baitul Rahman",
    address: "Jl. Anggrek No. 7",
    distance: "2.3 km",
    nextPrayer: "Dzuhur - 12:05",
    facilities: ["Wudhu", "Parkir", "AC", "TPA"],
    hasKajian: true,
    kajianTime: "Ba'da Isya",
  },
];

const prayerTimes = [
  { name: "Subuh", time: "04:35", isNext: false },
  { name: "Dzuhur", time: "12:05", isNext: true },
  { name: "Ashar", time: "15:20", isNext: false },
  { name: "Maghrib", time: "18:10", isNext: false },
  { name: "Isya", time: "19:25", isNext: false },
];

export const MosqueFinderPage = () => {
  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Cari Masjid</h1>
        <p className="text-sm text-muted-foreground">Temukan masjid terdekat dari lokasimu</p>
      </motion.div>

      {/* Location Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-4"
      >
        <Card variant="spiritual">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Lokasimu saat ini</p>
              <p className="text-sm font-medium text-foreground">Jl. Kebon Jeruk, Jakarta Barat</p>
            </div>
            <Button variant="ghost" size="sm">Ubah</Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Prayer Times */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Jadwal Shalat Hari Ini</span>
            </div>
            <div className="flex justify-between">
              {prayerTimes.map((prayer) => (
                <div key={prayer.name} className={`text-center ${prayer.isNext ? "text-primary" : "text-muted-foreground"}`}>
                  <p className="text-xs font-medium mb-1">{prayer.name}</p>
                  <p className={`text-sm font-semibold ${prayer.isNext ? "text-primary" : "text-foreground"}`}>
                    {prayer.time}
                  </p>
                  {prayer.isNext && (
                    <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded-full mt-1 inline-block">
                      Berikutnya
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Nearby Mosques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">Masjid Terdekat</h2>
        <div className="space-y-3">
          {nearbyMosques.map((mosque, index) => (
            <motion.div
              key={mosque.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card variant="default" className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{mosque.name}</h3>
                      <p className="text-xs text-muted-foreground">{mosque.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-primary">{mosque.distance}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{mosque.nextPrayer}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mosque.facilities.map((facility) => (
                      <span key={facility} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {facility}
                      </span>
                    ))}
                    {mosque.hasKajian && (
                      <span className="text-[10px] bg-accent-soft text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        Kajian {mosque.kajianTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="spiritual" size="sm" className="flex-1">
                      <Navigation className="h-3.5 w-3.5" />
                      Navigasi
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Map Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-5 mt-6"
      >
        <Card variant="elevated" className="overflow-hidden">
          <div className="h-40 bg-secondary flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Peta Interaktif</p>
              <Button variant="spiritual" size="sm" className="mt-2">
                Buka Peta
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
