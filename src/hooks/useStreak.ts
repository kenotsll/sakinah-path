import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StreakData {
  streakCount: number;
  lastCompletedDate: string | null;
  yellowCards: YellowCard[];
  todayStatus: 'pending' | 'completed' | 'failed';
}

export interface YellowCard {
  date: string;
  reason: 'no_task_completed' | 'incomplete_sangat_penting';
}

const STREAK_STORAGE_KEY = 'istiqamah_streak';

const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

const getDefaultStreakData = (): StreakData => ({
  streakCount: 0,
  lastCompletedDate: null,
  yellowCards: [],
  todayStatus: 'pending',
});

const loadLocalStreakData = (): StreakData => {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading streak data:', e);
  }
  return getDefaultStreakData();
};

const saveLocalStreakData = (data: StreakData) => {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('streak-updated'));
  } catch (e) {
    console.error('Error saving streak data:', e);
  }
};

export const useStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>(() => 
    user ? getDefaultStreakData() : loadLocalStreakData()
  );
  const [loading, setLoading] = useState(true);

  const today = getDateString();

  // Fetch streak from Supabase
  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreakData(loadLocalStreakData());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const yellowCards: YellowCard[] = (data.yellow_card_dates || []).map((date: string) => ({
          date,
          reason: 'no_task_completed' as const,
        }));

        setStreakData({
          streakCount: data.streak_count,
          lastCompletedDate: data.last_completed_date,
          yellowCards,
          todayStatus: data.last_completed_date === today ? 'completed' : 'pending',
        });
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('user_streaks')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;

        if (inserted) {
          setStreakData({
            streakCount: inserted.streak_count,
            lastCompletedDate: inserted.last_completed_date,
            yellowCards: [],
            todayStatus: 'pending',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
      setStreakData(loadLocalStreakData());
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Save streak
  const saveStreak = useCallback(async (data: StreakData) => {
    if (!user) {
      saveLocalStreakData(data);
      return;
    }

    try {
      const yellowCardDates = data.yellowCards.map(c => c.date);
      
      await supabase
        .from('user_streaks')
        .update({
          streak_count: data.streakCount,
          yellow_cards: data.yellowCards.length,
          last_completed_date: data.lastCompletedDate,
          yellow_card_dates: yellowCardDates,
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving streak:', error);
    }
  }, [user]);

  // Get yellow cards from this week
  const getYellowCardsThisWeek = useCallback((): YellowCard[] => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = getDateString(sevenDaysAgo);
    return streakData.yellowCards.filter(card => card.date >= cutoffDate);
  }, [streakData.yellowCards]);

  // Mark today as completed (called externally when all sangat_penting tasks done)
  const markTodayCompleted = useCallback(() => {
    setStreakData(prev => {
      if (prev.lastCompletedDate === today) return prev;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateString(yesterday);
      
      let newStreakCount = prev.streakCount;
      if (prev.lastCompletedDate === yesterdayStr || prev.streakCount === 0) {
        newStreakCount = prev.streakCount + 1;
      } else {
        newStreakCount = 1;
      }
      
      const newData: StreakData = {
        ...prev,
        streakCount: newStreakCount,
        lastCompletedDate: today,
        todayStatus: 'completed',
      };
      
      saveStreak(newData);
      return newData;
    });
  }, [today, saveStreak]);

  // Add yellow card
  const addYellowCard = useCallback((reason: YellowCard['reason']) => {
    setStreakData(prev => {
      const alreadyHasCard = prev.yellowCards.some(card => card.date === today);
      if (alreadyHasCard) return prev;

      const newYellowCards = [...prev.yellowCards, { date: today, reason }];
      
      const recentCards = newYellowCards.filter(card => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return card.date >= getDateString(sevenDaysAgo);
      });
      
      const shouldReset = recentCards.length >= 3;
      
      const newData: StreakData = {
        ...prev,
        yellowCards: newYellowCards,
        todayStatus: 'failed',
        streakCount: shouldReset ? 0 : prev.streakCount,
        lastCompletedDate: shouldReset ? null : prev.lastCompletedDate,
      };
      
      saveStreak(newData);
      return newData;
    });
  }, [today, saveStreak]);

  // Listen for storage updates (non-authenticated)
  useEffect(() => {
    if (user) return;

    const handleUpdate = () => {
      setStreakData(loadLocalStreakData());
    };

    window.addEventListener('streak-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('streak-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const yellowCardsThisWeek = getYellowCardsThisWeek();
  const isStreakAtRisk = yellowCardsThisWeek.length >= 2;

  return {
    streakCount: streakData.streakCount,
    yellowCards: streakData.yellowCards,
    yellowCardsThisWeek,
    todayStatus: streakData.todayStatus,
    isStreakAtRisk,
    loading,
    markTodayCompleted,
    addYellowCard,
    refetch: fetchStreak,
  };
};
