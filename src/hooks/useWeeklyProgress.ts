import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const WEEKLY_PROGRESS_KEY = 'istiqamah_weekly_progress';

// Get date string in YYYY-MM-DD format
const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get the start of the week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get array of 7 dates for the current week (Mon-Sun)
const getWeekDates = (): string[] => {
  const startOfWeek = getStartOfWeek(new Date());
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(getDateString(d));
  }
  
  return dates;
};

// Get the day index (0 = Monday, 6 = Sunday) for a date
const getDayIndex = (dateString: string): number => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
};

export interface WeeklyProgressData {
  weeklyData: number[];
  totalTasks: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useWeeklyProgress = (): WeeklyProgressData => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyProgress = useCallback(async () => {
    const weekDates = getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[6] + 'T23:59:59.999Z';

    if (!user) {
      // Load from localStorage for non-authenticated users
      try {
        const stored = localStorage.getItem(WEEKLY_PROGRESS_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          // Check if data is from current week
          if (data.weekStart === startDate) {
            setWeeklyData(data.weeklyData);
            setTotalTasks(data.weeklyData.reduce((a: number, b: number) => a + b, 0));
          }
        }
      } catch (e) {
        console.error('Error loading weekly progress:', e);
      }
      setLoading(false);
      return;
    }

    try {
      // Query all tasks that were completed this week
      const { data, error } = await supabase
        .from('user_tasks')
        .select('completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate);

      if (error) throw error;

      // Count completions per day
      const dailyCounts = [0, 0, 0, 0, 0, 0, 0];

      if (data) {
        data.forEach(task => {
          if (task.completed_at) {
            const taskDate = task.completed_at.split('T')[0];
            const dayIndex = getDayIndex(taskDate);
            if (dayIndex >= 0 && dayIndex < 7) {
              dailyCounts[dayIndex]++;
            }
          }
        });
      }

      setWeeklyData(dailyCounts);
      setTotalTasks(dailyCounts.reduce((a, b) => a + b, 0));

      // Also save to localStorage as backup
      localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify({
        weekStart: startDate,
        weeklyData: dailyCounts,
      }));

    } catch (error) {
      console.error('Error fetching weekly progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchWeeklyProgress();
  }, [fetchWeeklyProgress]);

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      // Debounce the refetch
      setTimeout(() => {
        fetchWeeklyProgress();
      }, 500);
    };

    window.addEventListener('tasks-updated', handleTaskUpdate);
    return () => window.removeEventListener('tasks-updated', handleTaskUpdate);
  }, [fetchWeeklyProgress]);

  return {
    weeklyData,
    totalTasks,
    loading,
    refetch: fetchWeeklyProgress,
  };
};
