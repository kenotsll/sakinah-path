import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Priority = "sangat_penting" | "penting" | "rutin";
export type Category = "ibadah" | "akhlak" | "ilmu" | "hijrah";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: Category;
  priority: Priority;
  isCustom?: boolean;
  completedAt?: string | null;
}

const TASKS_STORAGE_KEY = 'istiqamah_tasks';
const LAST_RESET_DATE_KEY = 'istiqamah_last_reset_date';

// Get today's date in YYYY-MM-DD format (local timezone)
const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Check if a date string is from today
const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const taskDate = new Date(dateString).toISOString().split('T')[0];
  return taskDate === getTodayDateString();
};

// Default tasks for new users
const defaultTasks: Omit<Task, 'id'>[] = [
  { title: "Shalat 5 waktu tepat waktu", completed: false, category: "ibadah", priority: "sangat_penting", isCustom: false },
  { title: "Baca Al-Qur'an 1 halaman", completed: false, category: "ibadah", priority: "sangat_penting", isCustom: false },
  { title: "Dzikir pagi & petang", completed: false, category: "ibadah", priority: "penting", isCustom: false },
  { title: "Istighfar 100x", completed: false, category: "ibadah", priority: "penting", isCustom: false },
  { title: "Berbuat baik pada orang tua", completed: false, category: "akhlak", priority: "sangat_penting", isCustom: false },
  { title: "Jauhi ghibah & gosip", completed: false, category: "hijrah", priority: "penting", isCustom: false },
  { title: "Baca hadis 1 hadis", completed: false, category: "ilmu", priority: "rutin", isCustom: false },
];

// Sort: completed tasks go to bottom, incomplete to top, then by priority
const sortTasks = (taskList: Task[]): Task[] => {
  return [...taskList].sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }
    const priorityOrder: Record<Priority, number> = {
      sangat_penting: 0,
      penting: 1,
      rutin: 2,
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

// Reset tasks that were completed on a previous day
const resetTasksForNewDay = (taskList: Task[]): Task[] => {
  return taskList.map(task => {
    // If task is completed but not today, reset it
    if (task.completed && !isToday(task.completedAt)) {
      return { ...task, completed: false, completedAt: null };
    }
    return task;
  });
};

// Local storage fallback for non-authenticated users
const loadLocalTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    const lastResetDate = localStorage.getItem(LAST_RESET_DATE_KEY);
    const today = getTodayDateString();
    
    if (stored) {
      let tasks: Task[] = JSON.parse(stored);
      
      // Check if we need to reset for a new day
      if (lastResetDate !== today) {
        tasks = resetTasksForNewDay(tasks);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        localStorage.setItem(LAST_RESET_DATE_KEY, today);
      }
      
      return tasks;
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  
  localStorage.setItem(LAST_RESET_DATE_KEY, getTodayDateString());
  return defaultTasks.map((t, i) => ({ ...t, id: (i + 1).toString() }));
};

const saveLocalTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(LAST_RESET_DATE_KEY, getTodayDateString());
    window.dispatchEvent(new Event('tasks-updated'));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
};

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Supabase or localStorage
  const fetchTasks = useCallback(async () => {
    if (!user) {
      // Use localStorage for non-authenticated users
      setTasks(sortTasks(loadLocalTasks()));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        let mappedTasks: Task[] = data.map(t => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          category: t.category as Category,
          priority: t.priority as Priority,
          isCustom: t.is_custom,
          completedAt: t.completed_at,
        }));
        
        // Reset tasks completed on previous days
        const tasksToReset = mappedTasks.filter(t => t.completed && !isToday(t.completedAt));
        
        if (tasksToReset.length > 0) {
          // Update database for tasks that need reset
          const resetPromises = tasksToReset.map(t =>
            supabase
              .from('user_tasks')
              .update({ completed: false, completed_at: null })
              .eq('id', t.id)
              .eq('user_id', user.id)
          );
          
          await Promise.all(resetPromises);
          
          // Apply reset to local state
          mappedTasks = resetTasksForNewDay(mappedTasks);
          console.log(`Daily reset: ${tasksToReset.length} tasks reset for new day`);
        }
        
        setTasks(sortTasks(mappedTasks));
      } else {
        // Initialize default tasks for new users
        const insertTasks = defaultTasks.map(t => ({
          user_id: user.id,
          title: t.title,
          completed: t.completed,
          category: t.category,
          priority: t.priority,
          is_custom: t.isCustom || false,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('user_tasks')
          .insert(insertTasks)
          .select();

        if (insertError) throw insertError;

        if (inserted) {
          const mappedTasks: Task[] = inserted.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            category: t.category as Category,
            priority: t.priority as Priority,
            isCustom: t.is_custom,
            completedAt: t.completed_at,
          }));
          setTasks(sortTasks(mappedTasks));
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Fallback to localStorage
      setTasks(sortTasks(loadLocalTasks()));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Listen for updates from other components (localStorage fallback)
  useEffect(() => {
    if (user) return; // Skip for authenticated users

    const handleUpdate = () => {
      setTasks(sortTasks(loadLocalTasks()));
    };

    window.addEventListener('tasks-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tasks-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    // Optimistic update
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, completed: newCompleted, completedAt } : t
      );
      return sortTasks(updated);
    });

    if (!user) {
      // Save to localStorage for non-authenticated users
      const updated = tasks.map(t =>
        t.id === taskId ? { ...t, completed: newCompleted, completedAt } : t
      );
      saveLocalTasks(sortTasks(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({ 
          completed: newCompleted, 
          completed_at: completedAt 
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Dispatch event for streak tracking
      window.dispatchEvent(new Event('tasks-updated'));
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert on error
      fetchTasks();
    }
  }, [tasks, user, fetchTasks]);

  const addTask = useCallback(async (title: string, category: Category, priority: Priority) => {
    if (!title.trim()) return;

    if (!user) {
      // Add to localStorage for non-authenticated users
      const newTask: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        completed: false,
        category,
        priority,
        isCustom: true,
      };
      const updated = sortTasks([...tasks, newTask]);
      setTasks(updated);
      saveLocalTasks(updated);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          priority,
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newTask: Task = {
          id: data.id,
          title: data.title,
          completed: data.completed,
          category: data.category as Category,
          priority: data.priority as Priority,
          isCustom: data.is_custom,
          completedAt: data.completed_at,
        };
        setTasks(prev => sortTasks([...prev, newTask]));
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }, [tasks, user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) {
      const updated = tasks.filter(t => t.id !== taskId);
      setTasks(updated);
      saveLocalTasks(updated);
      return;
    }

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      fetchTasks();
    }
  }, [tasks, user, fetchTasks]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressValue = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return {
    tasks,
    loading,
    toggleTask,
    addTask,
    deleteTask,
    completedCount,
    totalCount: tasks.length,
    progressValue,
    refetch: fetchTasks,
  };
};
