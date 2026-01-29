import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BookmarkedAyah {
  id?: string;
  surahNumber: number;
  surahName: string;
  surahArabic?: string;
  ayahNumber: number;
  ayahText: string;
  translation?: string;
  showOnCarousel: boolean;
}

const BOOKMARKS_STORAGE_KEY = 'quran_bookmarks';

const loadLocalBookmarks = (): BookmarkedAyah[] => {
  try {
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading bookmarks:', e);
  }
  return [];
};

const saveLocalBookmarks = (bookmarks: BookmarkedAyah[]) => {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Error saving bookmarks:', e);
  }
};

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedAyah[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks(loadLocalBookmarks());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedBookmarks: BookmarkedAyah[] = data.map(b => ({
          id: b.id,
          surahNumber: b.surah_number,
          surahName: b.surah_name,
          surahArabic: b.surah_arabic || undefined,
          ayahNumber: b.ayah_number,
          ayahText: b.ayah_text,
          translation: b.translation || undefined,
          showOnCarousel: b.show_on_carousel,
        }));
        setBookmarks(mappedBookmarks);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks(loadLocalBookmarks());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = useCallback(async (bookmark: Omit<BookmarkedAyah, 'id'>) => {
    // Check if already bookmarked
    const exists = bookmarks.some(
      b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber
    );
    if (exists) return;

    if (!user) {
      const newBookmarks = [...bookmarks, bookmark];
      setBookmarks(newBookmarks);
      saveLocalBookmarks(newBookmarks);
      return;
    }

    try {
      // If showOnCarousel is true, unset others first
      if (bookmark.showOnCarousel) {
        await supabase
          .from('user_bookmarks')
          .update({ show_on_carousel: false })
          .eq('user_id', user.id)
          .eq('show_on_carousel', true);
      }

      const { data, error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: user.id,
          surah_number: bookmark.surahNumber,
          surah_name: bookmark.surahName,
          surah_arabic: bookmark.surahArabic,
          ayah_number: bookmark.ayahNumber,
          ayah_text: bookmark.ayahText,
          translation: bookmark.translation,
          show_on_carousel: bookmark.showOnCarousel,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newBookmark: BookmarkedAyah = {
          id: data.id,
          surahNumber: data.surah_number,
          surahName: data.surah_name,
          surahArabic: data.surah_arabic || undefined,
          ayahNumber: data.ayah_number,
          ayahText: data.ayah_text,
          translation: data.translation || undefined,
          showOnCarousel: data.show_on_carousel,
        };
        
        setBookmarks(prev => {
          // Update showOnCarousel for others if needed
          const updated = bookmark.showOnCarousel 
            ? prev.map(b => ({ ...b, showOnCarousel: false }))
            : prev;
          return [newBookmark, ...updated];
        });
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  }, [bookmarks, user]);

  const removeBookmark = useCallback(async (surahNumber: number, ayahNumber: number) => {
    if (!user) {
      const newBookmarks = bookmarks.filter(
        b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
      );
      setBookmarks(newBookmarks);
      saveLocalBookmarks(newBookmarks);
      return;
    }

    // Optimistic update
    setBookmarks(prev => prev.filter(
      b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
    ));

    try {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('surah_number', surahNumber)
        .eq('ayah_number', ayahNumber);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      fetchBookmarks();
    }
  }, [bookmarks, user, fetchBookmarks]);

  const setCarouselBookmark = useCallback(async (surahNumber: number, ayahNumber: number) => {
    if (!user) {
      const newBookmarks = bookmarks.map(b => ({
        ...b,
        showOnCarousel: b.surahNumber === surahNumber && b.ayahNumber === ayahNumber,
      }));
      setBookmarks(newBookmarks);
      saveLocalBookmarks(newBookmarks);
      return;
    }

    try {
      // Unset all first
      await supabase
        .from('user_bookmarks')
        .update({ show_on_carousel: false })
        .eq('user_id', user.id);

      // Set the selected one
      await supabase
        .from('user_bookmarks')
        .update({ show_on_carousel: true })
        .eq('user_id', user.id)
        .eq('surah_number', surahNumber)
        .eq('ayah_number', ayahNumber);

      setBookmarks(prev => prev.map(b => ({
        ...b,
        showOnCarousel: b.surahNumber === surahNumber && b.ayahNumber === ayahNumber,
      })));
    } catch (error) {
      console.error('Error setting carousel bookmark:', error);
      fetchBookmarks();
    }
  }, [bookmarks, user, fetchBookmarks]);

  const isBookmarked = useCallback((surahNumber: number, ayahNumber: number) => {
    return bookmarks.some(
      b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
  }, [bookmarks]);

  const getCarouselBookmark = useCallback(() => {
    return bookmarks.find(b => b.showOnCarousel);
  }, [bookmarks]);

  const getBookmarksBySurah = useCallback(() => {
    const grouped: Record<number, BookmarkedAyah[]> = {};
    bookmarks.forEach(b => {
      if (!grouped[b.surahNumber]) {
        grouped[b.surahNumber] = [];
      }
      grouped[b.surahNumber].push(b);
    });
    return grouped;
  }, [bookmarks]);

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    setCarouselBookmark,
    isBookmarked,
    getCarouselBookmark,
    getBookmarksBySurah,
    refetch: fetchBookmarks,
  };
};
