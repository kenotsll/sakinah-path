export interface Consultant {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  whatsapp: string;
  topics: string[];
  avatar?: string;
  availableFrom: number; // hour in 24h format
  availableTo: number; // hour in 24h format
  bio: string;
}

export const consultants: Consultant[] = [
  {
    id: "1",
    name: "Ustadz Ahmad Fauzi, Lc.",
    specialty: "Akhlak & Ibadah",
    rating: 4.9,
    reviews: 128,
    whatsapp: "6281234567890",
    topics: ["akhlak", "ibadah"],
    availableFrom: 8,
    availableTo: 21,
    bio: "Lulusan Al-Azhar Mesir, berpengalaman 15 tahun dalam bimbingan spiritual.",
  },
  {
    id: "2",
    name: "Ustadzah Fatimah Zahra, M.A.",
    specialty: "Keluarga & Pergaulan",
    rating: 4.8,
    reviews: 95,
    whatsapp: "6281234567891",
    topics: ["keluarga", "pergaulan"],
    availableFrom: 9,
    availableTo: 17,
    bio: "Konselor keluarga islami dengan pendekatan empatik dan ramah.",
  },
  {
    id: "3",
    name: "Ustadz Muhammad Ridwan, Lc.",
    specialty: "Dosa & Taubat, Hijrah",
    rating: 4.9,
    reviews: 156,
    whatsapp: "6281234567892",
    topics: ["dosa", "hijrah"],
    availableFrom: 7,
    availableTo: 22,
    bio: "Spesialis pendampingan hijrah, memahami perjuangan generasi muda.",
  },
  {
    id: "4",
    name: "Ustadz Syauqi Abdillah, S.Ag.",
    specialty: "Akidah & Tauhid",
    rating: 4.7,
    reviews: 89,
    whatsapp: "6281234567893",
    topics: ["akhlak", "ibadah"],
    availableFrom: 8,
    availableTo: 20,
    bio: "Mengajar tauhid dengan bahasa yang mudah dipahami pemula.",
  },
  {
    id: "5",
    name: "Ustadzah Khadijah Salsabila",
    specialty: "Masalah Remaja Muslimah",
    rating: 4.9,
    reviews: 203,
    whatsapp: "6281234567894",
    topics: ["pergaulan", "keluarga", "hijrah"],
    availableFrom: 10,
    availableTo: 21,
    bio: "Founder komunitas hijrah muslimah, ahli menangani masalah remaja.",
  },
  {
    id: "6",
    name: "Ustadz Hasan Basri, Lc., M.A.",
    specialty: "Fiqih Muamalah",
    rating: 4.8,
    reviews: 112,
    whatsapp: "6281234567895",
    topics: ["ibadah", "akhlak"],
    availableFrom: 6,
    availableTo: 18,
    bio: "Ahli fiqih kontemporer, menjawab masalah ibadah sehari-hari.",
  },
  {
    id: "7",
    name: "Ustadz Umar Fadillah, S.Pd.I.",
    specialty: "Tahsin & Tahfidz",
    rating: 4.9,
    reviews: 178,
    whatsapp: "6281234567896",
    topics: ["ibadah"],
    availableFrom: 5,
    availableTo: 23,
    bio: "Hafidz 30 Juz, membimbing dengan sabar dan penuh pengertian.",
  },
  {
    id: "8",
    name: "Ustadzah Aisyah Rahmawati",
    specialty: "Konseling Pranikah",
    rating: 4.7,
    reviews: 67,
    whatsapp: "6281234567897",
    topics: ["keluarga", "pergaulan"],
    availableFrom: 9,
    availableTo: 16,
    bio: "Psikolog muslim, membantu mempersiapkan rumah tangga islami.",
  },
  {
    id: "9",
    name: "Ustadz Bilal Habibi, Lc.",
    specialty: "Pemuda & Hijrah",
    rating: 4.9,
    reviews: 234,
    whatsapp: "6281234567898",
    topics: ["hijrah", "dosa", "pergaulan"],
    availableFrom: 7,
    availableTo: 24,
    bio: "Dai muda, pernah di jalan yang salah, kini membantu pemuda berhijrah.",
  },
  {
    id: "10",
    name: "Ustadz Ibrahim Malik",
    specialty: "Ruqyah & Dzikir",
    rating: 4.8,
    reviews: 145,
    whatsapp: "6281234567899",
    topics: ["ibadah", "dosa"],
    availableFrom: 8,
    availableTo: 20,
    bio: "Praktisi ruqyah syar'iyyah, ahli terapi dzikir dan muhasabah.",
  },
  {
    id: "11",
    name: "Ustadzah Zainab Husna, M.Pd.",
    specialty: "Parenting Islami",
    rating: 4.9,
    reviews: 189,
    whatsapp: "6281234567800",
    topics: ["keluarga"],
    availableFrom: 8,
    availableTo: 17,
    bio: "Pakar pendidikan anak islami, membantu orang tua mendidik generasi sholeh.",
  },
  {
    id: "12",
    name: "Ustadz Yusuf Mansur, Lc.",
    specialty: "Motivasi & Sedekah",
    rating: 4.8,
    reviews: 298,
    whatsapp: "6281234567801",
    topics: ["akhlak", "hijrah"],
    availableFrom: 9,
    availableTo: 21,
    bio: "Dai motivator, mengajarkan kekuatan sedekah dan tawakal.",
  },
];

export const topics = [
  { id: "akhlak", label: "Akhlak", icon: "💫" },
  { id: "ibadah", label: "Ibadah", icon: "🕌" },
  { id: "dosa", label: "Dosa & Taubat", icon: "💔" },
  { id: "hijrah", label: "Hijrah", icon: "🌱" },
  { id: "keluarga", label: "Keluarga", icon: "👨‍👩‍👧" },
  { id: "pergaulan", label: "Pergaulan", icon: "👥" },
];

export const isConsultantAvailable = (consultant: Consultant): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= consultant.availableFrom && currentHour < consultant.availableTo;
};

export const getAvailabilityText = (consultant: Consultant): string => {
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };
  return `${formatHour(consultant.availableFrom)} - ${formatHour(consultant.availableTo)}`;
};
