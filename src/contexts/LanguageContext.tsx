import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

interface Translations {
  [key: string]: {
    id: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { id: 'Beranda', en: 'Home' },
  'nav.quran': { id: "Qur'an", en: "Qur'an" },
  'nav.guide': { id: 'Panduan', en: 'Guide' },
  'nav.videos': { id: 'Video', en: 'Videos' },
  'nav.tasks': { id: 'Tugas', en: 'Tasks' },
  'nav.consult': { id: 'Konsultasi', en: 'Consult' },
  'nav.mosque': { id: 'Masjid', en: 'Mosque' },
  
  // Home
  'home.greeting.morning': { id: 'Selamat Pagi', en: 'Good Morning' },
  'home.greeting.afternoon': { id: 'Selamat Siang', en: 'Good Afternoon' },
  'home.greeting.evening': { id: 'Selamat Sore', en: 'Good Evening' },
  'home.greeting.night': { id: 'Selamat Malam', en: 'Good Night' },
  'home.subtitle': { id: 'Semoga harimu penuh berkah', en: 'May your day be blessed' },
  'home.prayerTimes': { id: 'Jadwal Shalat Hari Ini', en: "Today's Prayer Times" },
  'home.nextPrayer': { id: 'Shalat Berikutnya', en: 'Next Prayer' },
  'home.dailyProgress': { id: 'Progres Hari Ini', en: "Today's Progress" },
  'home.quickActions': { id: 'Akses Cepat', en: 'Quick Actions' },
  'home.videoRecommendations': { id: 'Video Rekomendasi', en: 'Recommended Videos' },
  'home.viewAll': { id: 'Lihat Semua', en: 'View All' },
  
  // Tasks
  'tasks.title': { id: 'Target Hijrah', en: 'Hijrah Goals' },
  'tasks.addTask': { id: 'Tambah Tugas', en: 'Add Task' },
  'tasks.weeklyProgress': { id: 'Progres Mingguan', en: 'Weekly Progress' },
  'tasks.todayProgress': { id: 'Progres Hari Ini', en: "Today's Progress" },
  'tasks.completed': { id: 'Selesai', en: 'Completed' },
  'tasks.reflection': { id: 'Refleksi Diri', en: 'Self Reflection' },
  'tasks.reflectionDesc': { id: 'Luangkan waktu untuk muhasabah', en: 'Take time for self-reflection' },
  'tasks.category.ibadah': { id: 'Ibadah', en: 'Worship' },
  'tasks.category.akhlak': { id: 'Akhlak', en: 'Character' },
  'tasks.category.ilmu': { id: 'Ilmu', en: 'Knowledge' },
  'tasks.category.hijrah': { id: 'Hijrah', en: 'Transformation' },
  'tasks.filter.all': { id: 'Semua', en: 'All' },
  
  // Guide
  'guide.title': { id: 'Panduan Taubat', en: 'Repentance Guide' },
  'guide.stepByStep': { id: 'Langkah demi Langkah', en: 'Step by Step' },
  'guide.step': { id: 'Langkah', en: 'Step' },
  
  // Consultation
  'consult.title': { id: 'Konsultasi', en: 'Consultation' },
  'consult.anonymous': { id: 'Konsultasi Anonim', en: 'Anonymous Consultation' },
  'consult.anonymousDesc': { id: 'Identitas Anda aman dan terjaga', en: 'Your identity is safe and protected' },
  'consult.available': { id: 'Online', en: 'Available' },
  'consult.unavailable': { id: 'Offline', en: 'Unavailable' },
  'consult.contact': { id: 'Hubungi via WhatsApp', en: 'Contact via WhatsApp' },
  'consult.selectTopic': { id: 'Pilih topik...', en: 'Select topic...' },
  'consult.faq': { id: 'Pertanyaan Umum', en: 'FAQ' },
  'consult.faqDesc': { id: 'Temukan jawaban cepat', en: 'Find quick answers' },
  
  // Videos
  'videos.title': { id: 'Video Motivasi', en: 'Motivation Videos' },
  'videos.bookmark': { id: 'Simpan', en: 'Bookmark' },
  'videos.watch': { id: 'Tonton', en: 'Watch' },
  
  // Mosque
  'mosque.title': { id: 'Masjid Terdekat', en: 'Nearby Mosques' },
  'mosque.notAvailable': { id: 'Masjid Terdekat Tidak Tersedia', en: 'Nearby Mosques Not Available' },
  'mosque.enableLocation': { id: 'Aktifkan Lokasi', en: 'Enable Location' },
  'mosque.enableLocationDesc': { id: 'Aktifkan GPS untuk menemukan masjid terdekat', en: 'Enable GPS to find nearby mosques' },
  'mosque.route': { id: 'Rute', en: 'Route' },
  'mosque.distance': { id: 'km', en: 'km' },
  
  // Profile
  'profile.title': { id: 'Profil', en: 'Profile' },
  'profile.edit': { id: 'Edit Profil', en: 'Edit Profile' },
  'profile.save': { id: 'Simpan', en: 'Save' },
  'profile.cancel': { id: 'Batal', en: 'Cancel' },
  'profile.name': { id: 'Nama Lengkap', en: 'Full Name' },
  'profile.email': { id: 'Email', en: 'Email' },
  'profile.phone': { id: 'Nomor HP', en: 'Phone Number' },
  'profile.theme': { id: 'Tema', en: 'Theme' },
  'profile.theme.light': { id: 'Terang', en: 'Light' },
  'profile.theme.dark': { id: 'Gelap', en: 'Dark' },
  'profile.theme.system': { id: 'Sistem', en: 'System' },
  'profile.language': { id: 'Bahasa', en: 'Language' },
  'profile.notifications': { id: 'Notifikasi', en: 'Notifications' },
  'profile.weeklyProgress': { id: 'Progres Mingguan', en: 'Weekly Progress' },
  'profile.logout': { id: 'Keluar', en: 'Logout' },
  
  // Auth
  'auth.login': { id: 'Masuk', en: 'Login' },
  'auth.signup': { id: 'Daftar', en: 'Sign Up' },
  'auth.email': { id: 'Email', en: 'Email' },
  'auth.password': { id: 'Kata Sandi', en: 'Password' },
  'auth.confirmPassword': { id: 'Konfirmasi Kata Sandi', en: 'Confirm Password' },
  'auth.fullName': { id: 'Nama Lengkap', en: 'Full Name' },
  'auth.phone': { id: 'Nomor HP (opsional)', en: 'Phone (optional)' },
  'auth.noAccount': { id: 'Belum punya akun?', en: "Don't have an account?" },
  'auth.hasAccount': { id: 'Sudah punya akun?', en: 'Already have an account?' },
  'auth.welcome': { id: 'Selamat Datang', en: 'Welcome' },
  'auth.welcomeBack': { id: 'Selamat Datang Kembali', en: 'Welcome Back' },
  'auth.tagline': { id: 'Mulai perjalanan hijrahmu', en: 'Begin your spiritual journey' },
  
  // Notifications
  'notifications.title': { id: 'Notifikasi', en: 'Notifications' },
  'notifications.enable': { id: 'Aktifkan Notifikasi', en: 'Enable Notifications' },
  'notifications.enableDesc': { id: 'Dapatkan pengingat ibadah', en: 'Get worship reminders' },
  
  // Common
  'common.loading': { id: 'Memuat...', en: 'Loading...' },
  'common.error': { id: 'Terjadi kesalahan', en: 'An error occurred' },
  'common.retry': { id: 'Coba Lagi', en: 'Try Again' },
  'common.back': { id: 'Kembali', en: 'Back' },
  'common.next': { id: 'Selanjutnya', en: 'Next' },
  'common.done': { id: 'Selesai', en: 'Done' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export const LanguageProvider = ({ children, initialLanguage = 'id' }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const savedLang = localStorage.getItem('app-language') as Language;
    if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
