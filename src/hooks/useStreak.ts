import { useState, useEffect, useCallback } from 'react';
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

const loadStreakData = (): StreakData => {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading streak data:', e);
  }
  return {
    streakCount: 0,
    lastCompletedDate: null,
    yellowCards: [],
    todayStatus: 'pending',
  };
};

const saveStreakData = (data: StreakData) => {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('streak-updated'));
  } catch (e) {
    console.error('Error saving streak data:', e);
  }
};

export const useStreak = () => {
  const [streakData, setStreakData] = useState<StreakData>(loadStreakData);
  const { tasks } = useTasks();

  // Get today's date string
  const today = getDateString();

  // Check if all "sangat_penting" tasks are completed
  const checkSangatPentingCompleted = useCallback((): boolean => {
    const sangatPentingTasks = tasks.filter(t => t.priority === 'sangat_penting');
    if (sangatPentingTasks.length === 0) return true; // No sangat_penting tasks = auto pass
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
      
      // Determine today's status
      if (allSangatPentingDone && anyTaskDone) {
        newData.todayStatus = 'completed';
        
        // If this is a new completion (not already counted)
        if (prev.lastCompletedDate !== today) {
          // Check if yesterday was completed (for streak continuity)
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getDateString(yesterday);
          
          if (prev.lastCompletedDate === yesterdayStr || prev.streakCount === 0) {
            newData.streakCount = prev.streakCount + 1;
          } else if (prev.lastCompletedDate !== today) {
            // Gap in streak - but completed today so start fresh at 1
            newData.streakCount = 1;
          }
          
          newData.lastCompletedDate = today;
        }
      } else if (!anyTaskDone) {
        newData.todayStatus = 'pending';
      } else {
        // Some tasks done but not all sangat_penting
        newData.todayStatus = 'pending';
      }
      
      saveStreakData(newData);
      return newData;
    });
  }, [checkSangatPentingCompleted, hasAnyTaskCompleted, today]);

  // Add yellow card (called at midnight check)
  const addYellowCard = useCallback((reason: YellowCard['reason']) => {
    setStreakData(prev => {
      const newData = { ...prev };
      
      // Check if already has yellow card for today
      const alreadyHasCard = prev.yellowCards.some(card => card.date === today);
      if (!alreadyHasCard) {
        newData.yellowCards = [...prev.yellowCards, { date: today, reason }];
        newData.todayStatus = 'failed';
        
        // Check if 3 yellow cards in last 7 days
        const recentCards = newData.yellowCards.filter(card => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return card.date >= getDateString(sevenDaysAgo);
        });
        
        if (recentCards.length >= 3) {
          // Reset streak
          newData.streakCount = 0;
          newData.lastCompletedDate = null;
        }
      }
      
      saveStreakData(newData);
      return newData;
    });
  }, [today]);

  // Check for midnight reset
  const checkMidnightReset = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // At exactly 00:00, check yesterday's status
    if (currentHour === 0 && currentMinute === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateString(yesterday);
      
      // Check if yesterday was NOT completed
      if (streakData.lastCompletedDate !== yesterdayStr) {
        // No sangat_penting completed yesterday
        addYellowCard('no_task_completed');
        return { shouldNotify: true, type: 'yellow_card' as const };
      }
    }
    
    return { shouldNotify: false, type: null };
  }, [streakData.lastCompletedDate, addYellowCard]);

  // Clean up old yellow cards (older than 30 days)
  const cleanupOldCards = useCallback(() => {
    setStreakData(prev => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = getDateString(thirtyDaysAgo);
      
      const filteredCards = prev.yellowCards.filter(card => card.date >= cutoffDate);
      
      if (filteredCards.length !== prev.yellowCards.length) {
        const newData = { ...prev, yellowCards: filteredCards };
        saveStreakData(newData);
        return newData;
      }
      
      return prev;
    });
  }, []);

  // Listen for task updates
  useEffect(() => {
    updateStreakStatus();
  }, [tasks, updateStreakStatus]);

  // Listen for storage updates from other tabs
  useEffect(() => {
    const handleUpdate = () => {
      setStreakData(loadStreakData());
    };

    window.addEventListener('streak-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('streak-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Cleanup on mount
  useEffect(() => {
    cleanupOldCards();
  }, [cleanupOldCards]);

  // Check midnight reset periodically
  useEffect(() => {
    const interval = setInterval(checkMidnightReset, 60000); // Check every minute
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
    updateStreakStatus,
    addYellowCard,
    checkMidnightReset,
  };
};
