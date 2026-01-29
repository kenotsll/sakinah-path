import { useState, useEffect, useCallback } from 'react';

export type Priority = "sangat_penting" | "penting" | "rutin";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: "ibadah" | "akhlak" | "ilmu" | "hijrah";
  priority: Priority;
  isCustom?: boolean;
}

const TASKS_STORAGE_KEY = 'istiqamah_tasks';

// All tasks start as incomplete for new users
const defaultTasks: Task[] = [
  { id: "1", title: "Shalat 5 waktu tepat waktu", completed: false, category: "ibadah", priority: "sangat_penting" },
  { id: "2", title: "Baca Al-Qur'an 1 halaman", completed: false, category: "ibadah", priority: "sangat_penting" },
  { id: "3", title: "Dzikir pagi & petang", completed: false, category: "ibadah", priority: "penting" },
  { id: "4", title: "Istighfar 100x", completed: false, category: "ibadah", priority: "penting" },
  { id: "5", title: "Berbuat baik pada orang tua", completed: false, category: "akhlak", priority: "sangat_penting" },
  { id: "6", title: "Jauhi ghibah & gosip", completed: false, category: "hijrah", priority: "penting" },
  { id: "7", title: "Baca hadis 1 hadis", completed: false, category: "ilmu", priority: "rutin" },
];

const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  return defaultTasks;
};

const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    // Dispatch event for other components to sync
    window.dispatchEvent(new Event('tasks-updated'));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
};

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

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => sortTasks(loadTasks()));

  // Listen for updates from other components
  useEffect(() => {
    const handleUpdate = () => {
      setTasks(sortTasks(loadTasks()));
    };

    window.addEventListener('tasks-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tasks-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      const sorted = sortTasks(updated);
      saveTasks(sorted);
      return sorted;
    });
  }, []);

  const addTask = useCallback((title: string, category: Task['category'], priority: Priority) => {
    if (!title.trim()) return;
    
    setTasks(prev => {
      const newTask: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        completed: false,
        category,
        priority,
        isCustom: true,
      };
      const updated = sortTasks([...prev, newTask]);
      saveTasks(updated);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== taskId);
      saveTasks(updated);
      return updated;
    });
  }, []);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressValue = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return {
    tasks,
    toggleTask,
    addTask,
    deleteTask,
    completedCount,
    totalCount: tasks.length,
    progressValue,
  };
};
