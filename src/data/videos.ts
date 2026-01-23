export interface Video {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
  youtubeUrl: string;
  speaker: string;
}

export const videoDatabase: Video[] = [
  // Taubat Category
  {
    id: "v1",
    title: "CARA TAUBAT TERBAIK",
    category: "Taubat",
    duration: "15:42",
    thumbnail: "https://img.youtube.com/vi/XsDPzGvB1DQ/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/XsDPzGvB1DQ?si=I5nWjDMv98h1C1q3",
    speaker: "Ustadz Adi Hidayat",
  },
  {
    id: "v2",
    title: "TAUBAT, MAKSIAT LAGI?",
    category: "Taubat",
    duration: "12:38",
    thumbnail: "https://img.youtube.com/vi/uL4mm6bYnsc/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/uL4mm6bYnsc?si=XXRwCagxLCbZ8MIz",
    speaker: "Ustadz Adi Hidayat",
  },
  {
    id: "v3",
    title: "Bagaimana Taubat Diterima?",
    category: "Taubat",
    duration: "8:24",
    thumbnail: "https://img.youtube.com/vi/9QmIeTDkxAU/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/9QmIeTDkxAU?si=oNiSbDCeLP8msdYx",
    speaker: "Ustadz Abdul Somad",
  },
  {
    id: "v4",
    title: "Taubat dari Zina",
    category: "Taubat",
    duration: "14:55",
    thumbnail: "https://img.youtube.com/vi/zay4W2WHGnY/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/zay4W2WHGnY?si=3fD-uQQhXFTOavAR",
    speaker: "Ustadz Khalid Basalamah",
  },

  // Istiqamah Category  
  {
    id: "v5",
    title: "Untukmu yang Susah Lawan Nafsu",
    category: "Istiqamah",
    duration: "18:22",
    thumbnail: "https://img.youtube.com/vi/bYkS9xdvBXE/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/bYkS9xdvBXE?si=ny1ojoWc8MTRFQa3",
    speaker: "Ustadz Hanan Attaki",
  },
  {
    id: "v6",
    title: "Istigfarmu Palsu?",
    category: "Istiqamah",
    duration: "10:15",
    thumbnail: "https://img.youtube.com/vi/_EjeWOLddgs/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/_EjeWOLddgs?si=SorG3UaFKq6dEri0",
    speaker: "Ustadz Hanan Attaki",
  },

  // Harapan Category
  {
    id: "v7",
    title: "Jangan Gengsi untuk Taubat",
    category: "Harapan",
    duration: "9:33",
    thumbnail: "https://img.youtube.com/vi/7P3tvlPWA7k/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/7P3tvlPWA7k?si=fvW8A0hNh6PxgY18",
    speaker: "Ustadz Adi Hidayat",
  },
  {
    id: "v8",
    title: "Pendosa Bisa Dicintai oleh Allah",
    category: "Harapan",
    duration: "11:47",
    thumbnail: "https://img.youtube.com/vi/C_cRlNNiMVU/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/C_cRlNNiMVU?si=DtyGM0_V2gRw8Btr",
    speaker: "Ustadz Hanan Attaki",
  },
  {
    id: "v9",
    title: "Cara Cepat Terkabulnya Doa",
    category: "Harapan",
    duration: "16:28",
    thumbnail: "https://img.youtube.com/vi/gnq7AGbqLws/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/gnq7AGbqLws?si=KJeLaiVjLA1i8DAT",
    speaker: "Ustadz Abdul Somad",
  },

  // Hijrah Category
  {
    id: "v10",
    title: "Rahasia Hidup Tenang dan Nyaman",
    category: "Hijrah",
    duration: "1:24:15",
    thumbnail: "https://img.youtube.com/vi/o_q6TSY7Bj8/maxresdefault.jpg",
    youtubeUrl: "https://www.youtube.com/live/o_q6TSY7Bj8?si=B-yk0oto-Ynb-3_G",
    speaker: "Ustadz Adi Hidayat",
  },
  {
    id: "v11",
    title: "Langkah Awal Hidup Jadi Baik",
    category: "Hijrah",
    duration: "13:42",
    thumbnail: "https://img.youtube.com/vi/fzflf1AR5Nk/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/fzflf1AR5Nk?si=RmhOy5aYRP7k3nod",
    speaker: "Ustadz Adi Hidayat",
  },
  {
    id: "v12",
    title: "Perbaiki Sholatmu, Allah Perbaiki Urusanmu",
    category: "Hijrah",
    duration: "17:55",
    thumbnail: "https://img.youtube.com/vi/sX-kePnlgy4/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/sX-kePnlgy4?si=FiubR5jSxVfXJaao",
    speaker: "Ustadz Adi Hidayat",
  },
  {
    id: "v13",
    title: "Keluar dari Lingkungan Toxic",
    category: "Hijrah",
    duration: "12:08",
    thumbnail: "https://img.youtube.com/vi/Dev9XJO8kJM/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/Dev9XJO8kJM?si=if787YGnaKhH7LpB",
    speaker: "Ustadz Hanan Attaki",
  },

  // Penyesalan Category
  {
    id: "v14",
    title: "Khutbah Jumat Paling Menyentuh Hati",
    category: "Penyesalan",
    duration: "22:34",
    thumbnail: "https://img.youtube.com/vi/ol94Llcba2c/maxresdefault.jpg",
    youtubeUrl: "https://youtu.be/ol94Llcba2c?si=xsNk2dN-vYpQpKGl",
    speaker: "Ustadz Hanan Attaki",
  },
];

export const videoCategories = [
  { id: "all", label: "Semua", icon: "📚" },
  { id: "Taubat", label: "Taubat", icon: "💔" },
  { id: "Istiqamah", label: "Istiqamah", icon: "🌱" },
  { id: "Harapan", label: "Harapan", icon: "✨" },
  { id: "Hijrah", label: "Hijrah", icon: "🚀" },
  { id: "Penyesalan", label: "Penyesalan", icon: "😢" },
];
