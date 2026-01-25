import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const initialTasks: Task[] = [
  { id: "1", title: "Shalat 5 waktu tepat waktu", completed: false },
  { id: "2", title: "Baca Al-Qur'an 1 halaman", completed: false },
  { id: "3", title: "Dzikir pagi & petang", completed: false },
  { id: "4", title: "Istighfar 100x", completed: false },
  { id: "5", title: "Sedekah hari ini", completed: false },
];

interface DailyProgressProps {
  onNavigate?: (tab: string) => void;
}

export const DailyProgress = ({ onNavigate }: DailyProgressProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { t, language } = useLanguage();

  // Auto-sort: completed tasks go to bottom, incomplete to top
  const toggleTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      // Sort: incomplete first, then completed
      return updated.sort((a, b) => Number(a.completed) - Number(b.completed));
    });
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressValue = (completedCount / tasks.length) * 100;

  // Show first 3 tasks (sorted, so incomplete first)
  const visibleTasks = tasks.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="px-5"
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('home.dailyProgress')}
            </CardTitle>
            <span className="text-sm font-semibold text-primary">
              {completedCount}/{tasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressValue} className="h-2" />
          
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {visibleTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-3 py-2 cursor-pointer rounded-lg px-2 transition-all ${
                    task.completed 
                      ? 'task-complete' 
                      : 'task-incomplete'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </motion.div>
                  <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {task.title}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <button 
            className="w-full text-center text-sm font-medium text-primary hover:text-primary-glow transition-colors"
            onClick={() => onNavigate?.("tasks")}
          >
            {language === 'id' ? 'Lihat semua target →' : 'View all goals →'}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
