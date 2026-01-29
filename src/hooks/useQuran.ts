import { useState, useCallback } from 'react';
import { z } from 'zod';

// Zod schemas for Kemenag-based API (SantriKoding)
const ayatSchema = z.object({
  id: z.number(),
  surah: z.number(),
  nomor: z.number(),
  ar: z.string(),
  tr: z.string(),
  idn: z.string(),
});

const surahDetailResponseSchema = z.object({
  status: z.boolean(),
  nomor: z.number(),
  nama: z.string(),
  nama_latin: z.string(),
  jumlah_ayat: z.number(),
  tempat_turun: z.string(),
  arti: z.string(),
  deskripsi: z.string(),
  audio: z.string(),
  ayat: z.array(ayatSchema),
});

const surahListItemSchema = z.object({
  nomor: z.number(),
  nama: z.string(),
  nama_latin: z.string(),
  jumlah_ayat: z.number(),
  tempat_turun: z.string(),
  arti: z.string(),
  deskripsi: z.string(),
  audio: z.string(),
});

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  translation?: string;
  transliteration?: string;
  juz?: number;
  page?: number;
  audioUrl?: string;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

// Using Kemenag-based API from SantriKoding
const API_BASE = 'https://quran-api.santrikoding.com/api';

// Approximate juz and page calculations
const getJuzForAyah = (surahNumber: number, ayahNumber: number): number => {
  // Simplified juz calculation based on surah and ayah
  const juzStarts = [
    { surah: 1, ayah: 1 }, // Juz 1
    { surah: 2, ayah: 142 }, // Juz 2
    { surah: 2, ayah: 253 }, // Juz 3
    { surah: 3, ayah: 93 }, // Juz 4
    { surah: 4, ayah: 24 }, // Juz 5
    { surah: 4, ayah: 148 }, // Juz 6
    { surah: 5, ayah: 82 }, // Juz 7
    { surah: 6, ayah: 111 }, // Juz 8
    { surah: 7, ayah: 88 }, // Juz 9
    { surah: 8, ayah: 41 }, // Juz 10
    { surah: 9, ayah: 93 }, // Juz 11
    { surah: 11, ayah: 6 }, // Juz 12
    { surah: 12, ayah: 53 }, // Juz 13
    { surah: 15, ayah: 1 }, // Juz 14
    { surah: 17, ayah: 1 }, // Juz 15
    { surah: 18, ayah: 75 }, // Juz 16
    { surah: 21, ayah: 1 }, // Juz 17
    { surah: 23, ayah: 1 }, // Juz 18
    { surah: 25, ayah: 21 }, // Juz 19
    { surah: 27, ayah: 56 }, // Juz 20
    { surah: 29, ayah: 46 }, // Juz 21
    { surah: 33, ayah: 31 }, // Juz 22
    { surah: 36, ayah: 28 }, // Juz 23
    { surah: 39, ayah: 32 }, // Juz 24
    { surah: 41, ayah: 47 }, // Juz 25
    { surah: 46, ayah: 1 }, // Juz 26
    { surah: 51, ayah: 31 }, // Juz 27
    { surah: 58, ayah: 1 }, // Juz 28
    { surah: 67, ayah: 1 }, // Juz 29
    { surah: 78, ayah: 1 }, // Juz 30
  ];

  for (let i = juzStarts.length - 1; i >= 0; i--) {
    if (surahNumber > juzStarts[i].surah || 
        (surahNumber === juzStarts[i].surah && ayahNumber >= juzStarts[i].ayah)) {
      return i + 1;
    }
  }
  return 1;
};

const getPageForAyah = (surahNumber: number, ayahNumber: number): number => {
  // Approximate page calculation (simplified)
  const totalAyahsBefore = (surahNumber - 1) * 10 + ayahNumber;
  return Math.ceil(totalAyahsBefore / 15) + 1;
};

export const useQuran = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentSurah, setCurrentSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all surahs
  const fetchSurahs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/surah`);
      const data = await response.json();
      
      // Parse as array of surah list items
      const parsed = z.array(surahListItemSchema).safeParse(data);
      
      if (!parsed.success) {
        throw new Error('Data surah tidak valid');
      }

      const surahList: Surah[] = parsed.data.map((s) => ({
        number: s.nomor,
        name: s.nama,
        englishName: s.nama_latin,
        englishNameTranslation: s.arti,
        numberOfAyahs: s.jumlah_ayat,
        revelationType: s.tempat_turun === 'mekah' ? 'Meccan' : 'Medinan',
      }));
      setSurahs(surahList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar surah');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch surah detail with translation (from Kemenag-based API)
  const fetchSurahDetail = useCallback(async (surahNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/surah/${surahNumber}`);
      const data = await response.json();
      
      const validation = surahDetailResponseSchema.safeParse(data);
      if (!validation.success) {
        console.error('Validation error:', validation.error);
        throw new Error('Data surah tidak valid');
      }

      const surahData = validation.data;

      const ayahs: Ayah[] = surahData.ayat.map((ayat) => ({
        number: ayat.id,
        text: ayat.ar,
        numberInSurah: ayat.nomor,
        translation: ayat.idn,
        transliteration: ayat.tr,
        juz: getJuzForAyah(surahNumber, ayat.nomor),
        page: getPageForAyah(surahNumber, ayat.nomor),
        audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayat.id}.mp3`,
      }));

      const surahDetail: SurahDetail = {
        number: surahData.nomor,
        name: surahData.nama,
        englishName: surahData.nama_latin,
        englishNameTranslation: surahData.arti,
        numberOfAyahs: surahData.jumlah_ayat,
        revelationType: surahData.tempat_turun === 'mekah' ? 'Meccan' : 'Medinan',
        ayahs,
      };

      setCurrentSurah(surahDetail);
      return surahDetail;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat surah');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search surahs
  const searchSurahs = useCallback((query: string) => {
    if (!query.trim()) return surahs;
    
    const lowerQuery = query.toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(lowerQuery) ||
        s.englishNameTranslation.toLowerCase().includes(lowerQuery) ||
        s.name.includes(query) ||
        s.number.toString() === query
    );
  }, [surahs]);

  return {
    surahs,
    currentSurah,
    loading,
    error,
    fetchSurahs,
    fetchSurahDetail,
    searchSurahs,
    clearCurrentSurah: () => setCurrentSurah(null),
  };
};
