import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const dailyTasks: Task[] = [
  { id: "1", title: "Shalat 5 waktu tepat waktu", completed: true },
  { id: "2", title: "Baca Al-Qur'an 1 halaman", completed: true },
  { id: "3", title: "Dzikir pagi & petang", completed: false },
  { id: "4", title: "Istighfar 100x", completed: false },
  { id: "5", title: "Sedekah hari ini", completed: false },
];

export const DailyProgress = () => {
  const completedCount = dailyTasks.filter(t => t.completed).length;
  const progressValue = (completedCount / dailyTasks.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="px-5"
    >
      <Card variant="spiritual">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progress Hari Ini
            </CardTitle>
            <span className="text-sm font-semibold text-primary">
              {completedCount}/{dailyTasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressValue} className="h-2" />
          
          <div className="space-y-2">
            {dailyTasks.slice(0, 3).map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 py-2"
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {task.title}
                </span>
              </motion.div>
            ))}
          </div>
          
          <button className="w-full text-center text-sm font-medium text-primary hover:text-primary-glow transition-colors">
            Lihat semua target →
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
