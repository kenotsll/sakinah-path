import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, TrendingUp, AlertTriangle, Star, Flag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTasks, Priority } from "@/hooks/useTasks";

const priorityLabels: Record<Priority, { icon: React.ReactNode; color: string }> = {
  sangat_penting: { icon: <AlertTriangle className="h-3 w-3" />, color: "text-destructive" },
  penting: { icon: <Star className="h-3 w-3" />, color: "text-primary" },
  rutin: { icon: <Flag className="h-3 w-3" />, color: "text-muted-foreground" },
};

interface DailyProgressProps {
  onNavigate?: (tab: string) => void;
}

export const DailyProgress = ({ onNavigate }: DailyProgressProps) => {
  const { tasks, toggleTask, completedCount, totalCount, progressValue } = useTasks();
  const { t, language } = useLanguage();

  // Filter and show only top 3 "Sangat Penting" tasks first, then fill with others
  const getTopTasks = () => {
    const sangatPenting = tasks.filter(t => t.priority === "sangat_penting" && !t.completed);
    const others = tasks.filter(t => t.priority !== "sangat_penting" && !t.completed);
    const completed = tasks.filter(t => t.completed);
    
    // Combine and take first 3
    return [...sangatPenting, ...others, ...completed].slice(0, 3);
  };

  const visibleTasks = getTopTasks();

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
              {completedCount}/{totalCount}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress Bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
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
                  className={`relative flex flex-col gap-1 py-2 cursor-pointer rounded-lg px-3 transition-all overflow-hidden ${
                    task.completed 
                      ? 'task-complete' 
                      : 'task-incomplete'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center gap-3">
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
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      {!task.completed && (
                        <span className={`ml-2 ${priorityLabels[task.priority].color}`}>
                          {priorityLabels[task.priority].icon}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Individual Task Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary/60 to-primary"
                      initial={{ width: task.completed ? "100%" : "0%" }}
                      animate={{ width: task.completed ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
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
