import { useState, useCallback } from 'react';
import { z } from 'zod';

// Zod schemas for API validation
const surahSchema = z.object({
  number: z.number(),
  name: z.string(),
  englishName: z.string(),
  englishNameTranslation: z.string(),
  numberOfAyahs: z.number(),
  revelationType: z.string(),
});

const ayahSchema = z.object({
  number: z.number(),
  text: z.string(),
  numberInSurah: z.number(),
  juz: z.number(),
  page: z.number(),
});

const translationSchema = z.object({
  number: z.number(),
  text: z.string(),
  numberInSurah: z.number(),
});

const surahListResponseSchema = z.object({
  code: z.number(),
  data: z.array(surahSchema),
});

const surahDetailResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    number: z.number(),
    name: z.string(),
    englishName: z.string(),
    englishNameTranslation: z.string(),
    numberOfAyahs: z.number(),
    revelationType: z.string(),
    ayahs: z.array(ayahSchema),
  }),
});

const translationResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    ayahs: z.array(translationSchema),
  }),
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

const API_BASE = 'https://api.alquran.cloud/v1';

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
      
      const validationResult = surahListResponseSchema.safeParse(data);
      if (!validationResult.success) {
        throw new Error('Data surah tidak valid');
      }

      if (validationResult.data.code === 200) {
        const surahList: Surah[] = validationResult.data.data.map((s) => ({
          number: s.number,
          name: s.name,
          englishName: s.englishName,
          englishNameTranslation: s.englishNameTranslation,
          numberOfAyahs: s.numberOfAyahs,
          revelationType: s.revelationType,
        }));
        setSurahs(surahList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar surah');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch surah detail with translation
  const fetchSurahDetail = useCallback(async (surahNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Arabic text
      const arabicRes = await fetch(`${API_BASE}/surah/${surahNumber}`);
      const arabicData = await arabicRes.json();
      
      const arabicValidation = surahDetailResponseSchema.safeParse(arabicData);
      if (!arabicValidation.success) {
        throw new Error('Data surah tidak valid');
      }

      // Fetch Indonesian translation
      const translationRes = await fetch(`${API_BASE}/surah/${surahNumber}/id.indonesian`);
      const translationData = await translationRes.json();
      
      const translationValidation = translationResponseSchema.safeParse(translationData);
      
      // Merge Arabic with translation
      const surahData = arabicValidation.data.data;
      const translations = translationValidation.success 
        ? translationValidation.data.data.ayahs 
        : [];

      const ayahs: Ayah[] = surahData.ayahs.map((ayah, index) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        page: ayah.page,
        translation: translations[index]?.text || '',
        audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
      }));

      const surahDetail: SurahDetail = {
        number: surahData.number,
        name: surahData.name,
        englishName: surahData.englishName,
        englishNameTranslation: surahData.englishNameTranslation,
        numberOfAyahs: surahData.numberOfAyahs,
        revelationType: surahData.revelationType,
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
