import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Globe,
  Moon,
  Sun,
  Monitor,
  Clock,
  Bell,
  CheckCircle2,
  TrendingUp,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface ProfilePageProps {
  onBack: () => void;
}

interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  avatar: string | null;
  theme: "light" | "dark" | "system";
  language: "id" | "en" | "ar";
  timezone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Hamba Allah",
  username: "@hambaallah",
  email: "user@example.com",
  phone: "+62 812 3456 7890",
  avatar: null,
  theme: "system",
  language: "id",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  emailVerified: false,
  phoneVerified: true,
};

export const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("user_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { schedules, updateSchedule, requestPermission, permission } = useNotifications();

  // Weekly progress stats
  const [weeklyStats] = useState({
    tasksCompleted: 28,
    totalTasks: 35,
    streak: 12,
    reflections: 5,
  });

  const saveProfile = () => {
    setProfile(editProfile);
    localStorage.setItem("user_profile", JSON.stringify(editProfile));
    setIsEditing(false);
    toast.success("Profil berhasil disimpan!");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditProfile(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setProfile(prev => {
      const updated = { ...prev, theme };
      localStorage.setItem("user_profile", JSON.stringify(updated));
      
      // Apply theme
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }
      
      return updated;
    });
  };

  useEffect(() => {
    // Apply saved theme on mount
    if (profile.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (profile.theme === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="iconSm" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Pengaturan Akun</h1>
        </div>
      </motion.div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <Card variant="elevated">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="h-24 w-24 rounded-full gradient-hero flex items-center justify-center overflow-hidden border-4 border-card shadow-glow">
                {(isEditing ? editProfile.avatar : profile.avatar) ? (
                  <img
                    src={isEditing ? editProfile.avatar! : profile.avatar!}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-foreground" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {isEditing ? (
              <div className="w-full space-y-3">
                <Input
                  placeholder="Nama Lengkap"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Username"
                  value={editProfile.username}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, username: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" /> Batal
                  </Button>
                  <Button variant="spiritual" className="flex-1" onClick={saveProfile}>
                    <Save className="h-4 w-4 mr-1" /> Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.username}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setEditProfile(profile);
                    setIsEditing(true);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-1" /> Edit Profil
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Identity Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Identitas</h3>
        <Card variant="default">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Mail className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{profile.email}</p>
              </div>
              {profile.emailVerified ? (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              ) : (
                <Button variant="outline" size="sm">Verifikasi</Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-hope flex items-center justify-center">
                <Phone className="h-5 w-5 text-hope-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Nomor HP</p>
                <p className="text-sm font-medium text-foreground">{profile.phone}</p>
              </div>
              {profile.phoneVerified ? (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              ) : (
                <Button variant="outline" size="sm">Verifikasi</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferences Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mb-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Preferensi</h3>
        <Card variant="default">
          <CardContent className="p-4 space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center">
                  {profile.theme === "dark" ? (
                    <Moon className="h-5 w-5 text-accent-foreground" />
                  ) : profile.theme === "light" ? (
                    <Sun className="h-5 w-5 text-accent-foreground" />
                  ) : (
                    <Monitor className="h-5 w-5 text-accent-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tema</p>
                  <p className="text-xs text-muted-foreground">Tampilan aplikasi</p>
                </div>
              </div>
              <Select value={profile.theme} onValueChange={(v) => handleThemeChange(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-spiritual-soft flex items-center justify-center">
                  <Globe className="h-5 w-5 text-spiritual" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Bahasa</p>
                  <p className="text-xs text-muted-foreground">Pilihan bahasa</p>
                </div>
              </div>
              <Select value={profile.language} onValueChange={(v) => setProfile(prev => ({ ...prev, language: v as any }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Clock className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Zona Waktu</p>
                  <p className="text-xs text-muted-foreground">{profile.timezone}</p>
                </div>
              </div>
              <span className="text-xs text-primary">Auto</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mb-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Pengingat</h3>
        <Card variant="default">
          <CardContent className="p-4 space-y-4">
            {permission !== "granted" && (
              <Button
                variant="spiritual"
                className="w-full mb-2"
                onClick={requestPermission}
              >
                <Bell className="h-4 w-4 mr-2" />
                Aktifkan Notifikasi
              </Button>
            )}

            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{schedule.title.replace(/[🌙✨🌅🌆]/g, "").trim()}</p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.hour.toString().padStart(2, "0")}:{schedule.minute.toString().padStart(2, "0")}
                  </p>
                </div>
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => updateSchedule(schedule.id, { enabled: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5 mb-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Progress Mingguan</h3>
        <Card variant="spiritual">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {weeklyStats.tasksCompleted}/{weeklyStats.totalTasks}
                </p>
                <p className="text-xs text-muted-foreground">Tugas Selesai</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">{weeklyStats.streak}</p>
                <p className="text-xs text-muted-foreground">Hari Beruntun</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Konsistensi</span>
                <span className="font-semibold text-primary">
                  {Math.round((weeklyStats.tasksCompleted / weeklyStats.totalTasks) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(weeklyStats.tasksCompleted / weeklyStats.totalTasks) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="h-full gradient-hero rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
