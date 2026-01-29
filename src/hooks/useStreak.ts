import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from './useTasks';

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
  const [streakData, setStreakData] = useState<StreakData>(getDefaultStreakData);
  const [loading, setLoading] = useState(true);
  const { tasks } = useTasks();

  // Get today's date string
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
        // Convert yellow_card_dates array to YellowCard objects
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
        // Create initial streak record
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

  // Save streak to Supabase
  const saveStreak = useCallback(async (data: StreakData) => {
    if (!user) {
      saveLocalStreakData(data);
      return;
    }

    try {
      const yellowCardDates = data.yellowCards.map(c => c.date);
      
      const { error } = await supabase
        .from('user_streaks')
        .update({
          streak_count: data.streakCount,
          yellow_cards: data.yellowCards.length,
          last_completed_date: data.lastCompletedDate,
          yellow_card_dates: yellowCardDates,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving streak:', error);
    }
  }, [user]);

  // Check if all "sangat_penting" tasks are completed
  const checkSangatPentingCompleted = useCallback((): boolean => {
    const sangatPentingTasks = tasks.filter(t => t.priority === 'sangat_penting');
    if (sangatPentingTasks.length === 0) return true;
    return sangatPentingTasks.every(t => t.completed);
  }, [tasks]);

  // Check if any task is completed today
  const hasAnyTaskCompleted = useCallback((): boolean => {
    return tasks.some(t => t.completed);
  }, [tasks]);

  // Get yellow cards from this week (last 7 days)
  const getYellowCardsThisWeek = useCallback((): YellowCard[] => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = getDateString(sevenDaysAgo);
    
    return streakData.yellowCards.filter(card => card.date >= cutoffDate);
  }, [streakData.yellowCards]);

  // Check and update streak status
  const updateStreakStatus = useCallback(() => {
    const allSangatPentingDone = checkSangatPentingCompleted();
    const anyTaskDone = hasAnyTaskCompleted();
    
    setStreakData(prev => {
      const newData = { ...prev };
      
      if (allSangatPentingDone && anyTaskDone) {
        newData.todayStatus = 'completed';
        
        if (prev.lastCompletedDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getDateString(yesterday);
          
          if (prev.lastCompletedDate === yesterdayStr || prev.streakCount === 0) {
            newData.streakCount = prev.streakCount + 1;
          } else if (prev.lastCompletedDate !== today) {
            newData.streakCount = 1;
          }
          
          newData.lastCompletedDate = today;
        }
      } else if (!anyTaskDone) {
        newData.todayStatus = 'pending';
      } else {
        newData.todayStatus = 'pending';
      }
      
      saveStreak(newData);
      return newData;
    });
  }, [checkSangatPentingCompleted, hasAnyTaskCompleted, today, saveStreak]);

  // Add yellow card
  const addYellowCard = useCallback((reason: YellowCard['reason']) => {
    setStreakData(prev => {
      const newData = { ...prev };
      
      const alreadyHasCard = prev.yellowCards.some(card => card.date === today);
      if (!alreadyHasCard) {
        newData.yellowCards = [...prev.yellowCards, { date: today, reason }];
        newData.todayStatus = 'failed';
        
        const recentCards = newData.yellowCards.filter(card => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return card.date >= getDateString(sevenDaysAgo);
        });
        
        if (recentCards.length >= 3) {
          newData.streakCount = 0;
          newData.lastCompletedDate = null;
        }
      }
      
      saveStreak(newData);
      return newData;
    });
  }, [today, saveStreak]);

  // Check for midnight reset
  const checkMidnightReset = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour === 0 && currentMinute === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateString(yesterday);
      
      if (streakData.lastCompletedDate !== yesterdayStr) {
        addYellowCard('no_task_completed');
        return { shouldNotify: true, type: 'yellow_card' as const };
      }
    }
    
    return { shouldNotify: false, type: null };
  }, [streakData.lastCompletedDate, addYellowCard]);

  // Clean up old yellow cards
  const cleanupOldCards = useCallback(() => {
    setStreakData(prev => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = getDateString(thirtyDaysAgo);
      
      const filteredCards = prev.yellowCards.filter(card => card.date >= cutoffDate);
      
      if (filteredCards.length !== prev.yellowCards.length) {
        const newData = { ...prev, yellowCards: filteredCards };
        saveStreak(newData);
        return newData;
      }
      
      return prev;
    });
  }, [saveStreak]);

  // Listen for task updates
  useEffect(() => {
    updateStreakStatus();
  }, [tasks, updateStreakStatus]);

  // Listen for storage updates (for non-authenticated)
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

  // Cleanup on mount
  useEffect(() => {
    cleanupOldCards();
  }, [cleanupOldCards]);

  // Check midnight reset periodically
  useEffect(() => {
    const interval = setInterval(checkMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [checkMidnightReset]);

  const yellowCardsThisWeek = getYellowCardsThisWeek();
  const isStreakAtRisk = yellowCardsThisWeek.length >= 2;
  const shouldResetStreak = yellowCardsThisWeek.length >= 3;

  return {
    streakCount: streakData.streakCount,
    yellowCards: streakData.yellowCards,
    yellowCardsThisWeek,
    todayStatus: streakData.todayStatus,
    isStreakAtRisk,
    shouldResetStreak,
    allSangatPentingDone: checkSangatPentingCompleted(),
    loading,
    updateStreakStatus,
    addYellowCard,
    checkMidnightReset,
    refetch: fetchStreak,
  };
};
