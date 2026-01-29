import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Camera, User, Mail, Phone, Globe, Palette, Bell, 
  Check, LogOut, Loader2, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Bagaimana cara memulai konsultasi?",
    answer: "Pilih ustadz/ustadzah yang tersedia, pilih topik konsultasi yang sesuai dengan masalah Anda, lalu klik tombol 'Hubungi via WhatsApp'. Pesan akan otomatis terformat dengan topik yang dipilih."
  },
  {
    question: "Apakah identitas saya terjaga?",
    answer: "Ya, 100% anonim. Anda bisa menggunakan nama samaran saat berkonsultasi. Kami tidak menyimpan data pribadi Anda."
  },
  {
    question: "Berapa biaya konsultasi?",
    answer: "Konsultasi melalui aplikasi Istiqamah sepenuhnya gratis. Ustadz/ustadzah kami mengabdikan diri untuk membantu umat."
  },
  {
    question: "Bagaimana cara menambah target hijrah?",
    answer: "Di halaman 'Target Hijrah', klik tombol + di pojok kanan atas. Masukkan nama target dan pilih kategori yang sesuai."
  },
  {
    question: "Bagaimana cara menemukan masjid terdekat?",
    answer: "Buka halaman 'Masjid', aplikasi akan meminta izin lokasi. Setelah diizinkan, peta akan menampilkan masjid terdekat."
  },
];

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, profile, signOut, updateProfile, loading: authLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { permission, requestPermission, schedules, updateSchedule } = useNotifications();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
  });

  // Initialize edit data from profile
  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Apply theme from profile
  useEffect(() => {
    if (profile?.theme) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (profile.theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(systemDark ? 'dark' : 'light');
      } else {
        root.classList.add(profile.theme);
      }
    }
  }, [profile?.theme]);

  // Apply language from profile
  useEffect(() => {
    if (profile?.language && profile.language !== language) {
      setLanguage(profile.language);
    }
  }, [profile?.language]);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    const { error } = await updateProfile({ theme: newTheme });
    if (error) {
      toast.error('Gagal mengubah tema');
    } else {
      toast.success('Tema berhasil diubah');
    }
  };

  const handleLanguageChange = async (newLang: 'id' | 'en') => {
    setLanguage(newLang);
    const { error } = await updateProfile({ language: newLang });
    if (error) {
      toast.error('Gagal mengubah bahasa');
    } else {
      toast.success(newLang === 'id' ? 'Bahasa berhasil diubah' : 'Language changed successfully');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: editData.full_name,
      phone: editData.phone,
    });
    setSaving(false);

    if (error) {
      toast.error('Gagal menyimpan profil');
    } else {
      toast.success(t('profile.save') + ' ✓');
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Berhasil keluar');
  };

  // Calculate real progress from profile/database
  // New users start at 0
  const weeklyProgress = profile ? 0 : 0; // Will be updated when we add task tracking
  const daysActive = 0; // Will be calculated from real activity data

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {profile?.full_name || 'Pengguna'}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </motion.div>

      <div className="px-5 space-y-4">
        {/* Edit Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{t('profile.edit')}</h3>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                    >
                      {t('profile.cancel')}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={saving}
                      className="gradient-hero text-primary-foreground"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('profile.save')}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                  >
                    {t('profile.edit')}
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      placeholder={t('profile.name')}
                      className="bg-input border-border"
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t('profile.name')}</p>
                      <p className="text-sm text-foreground">{profile?.full_name || '-'}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t('profile.email')}</p>
                    <p className="text-sm text-foreground">{user?.email}</p>
                  </div>
                  <Check className="h-4 w-4 text-primary" />
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder={t('profile.phone')}
                      className="bg-input border-border"
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t('profile.phone')}</p>
                      <p className="text-sm text-foreground">{profile?.phone || '-'}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{t('profile.theme')}</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      profile?.theme === theme
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {theme === 'light' ? t('profile.theme.light') : 
                     theme === 'dark' ? t('profile.theme.dark') : 
                     t('profile.theme.system')}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{t('profile.language')}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLanguageChange('id')}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    language === 'id'
                      ? 'lang-switcher-active'
                      : 'lang-switcher-inactive'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    language === 'en'
                      ? 'lang-switcher-active'
                      : 'lang-switcher-inactive'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{t('profile.notifications')}</h3>
              </div>

              {permission !== 'granted' && (
                <Button 
                  onClick={requestPermission}
                  className="w-full mb-3 gradient-hero text-primary-foreground"
                >
                  {t('notifications.enable')}
                </Button>
              )}

              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{schedule.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {schedule.hour.toString().padStart(2, '0')}:{schedule.minute.toString().padStart(2, '0')}
                      </p>
                    </div>
                    <button
                      onClick={() => updateSchedule(schedule.id, { enabled: !schedule.enabled })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        schedule.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${
                        schedule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{t('profile.weeklyProgress')}</h3>
                <span className="text-2xl font-bold text-primary">{weeklyProgress}%</span>
              </div>
              
              <Progress value={weeklyProgress} className="h-3 mb-3" />
              
              <p className="text-sm text-muted-foreground">
                {language === 'id' 
                  ? `Aktif ${daysActive} dari 7 hari minggu ini`
                  : `Active ${daysActive} of 7 days this week`
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">
                  {language === 'id' ? 'Bantuan & FAQ' : 'Help & FAQ'}
                </h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-none">
                    <div className="bg-muted rounded-lg">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-left">
                        <span className="text-xs font-medium text-foreground">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <p className="text-xs text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Button
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('profile.logout')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
