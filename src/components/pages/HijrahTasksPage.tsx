import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, Calendar, X, Edit3, AlertTriangle, Star, Flag } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WeeklyLineChart } from "@/components/WeeklyLineChart";
import { useTasks, Task, Priority } from "@/hooks/useTasks";

const categoryColors = {
  ibadah: { bg: "bg-primary-soft", text: "text-primary" },
  akhlak: { bg: "bg-hope", text: "text-hope-foreground" },
  ilmu: { bg: "bg-secondary", text: "text-secondary-foreground" },
  hijrah: { bg: "bg-spiritual-soft", text: "text-spiritual" },
};

const categoryLabels = {
  ibadah: "Ibadah",
  akhlak: "Akhlak",
  ilmu: "Ilmu",
  hijrah: "Hijrah",
};

const priorityLabels: Record<Priority, { label: string; icon: React.ReactNode; color: string }> = {
  sangat_penting: { label: "Sangat Penting", icon: <AlertTriangle className="h-3 w-3" />, color: "text-destructive" },
  penting: { label: "Penting", icon: <Star className="h-3 w-3" />, color: "text-primary" },
  rutin: { label: "Rutin", icon: <Flag className="h-3 w-3" />, color: "text-muted-foreground" },
};

interface HijrahTasksPageProps {
  onOpenReflection?: () => void;
}

export const HijrahTasksPage = ({ onOpenReflection }: HijrahTasksPageProps) => {
  const { language } = useLanguage();
  const { tasks, toggleTask, addTask, deleteTask, completedCount, totalCount, progressValue } = useTasks();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Task["category"]>("ibadah");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("penting");
  const addFormRef = useRef<HTMLDivElement>(null);

  // Scroll to add form when it opens
  useEffect(() => {
    if (isAddingTask && addFormRef.current) {
      setTimeout(() => {
        addFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isAddingTask]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle, newTaskCategory, newTaskPriority);
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const filteredTasks = activeFilter === "all"
    ? tasks
    : tasks.filter(task => task.category === activeFilter);

  // Weekly progress starts at 0 for new users, updates based on real activity
  const weeklyData = [0, 0, 0, 0, 0, 0, Math.round(progressValue)];

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 pt-12 pb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Target Hijrah</h1>
            <p className="text-sm text-muted-foreground">Catat perjalanan perbaikan dirimu</p>
          </div>
          <Button variant="spiritual" size="icon" onClick={() => setIsAddingTask(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Weekly Progress Line Chart - Same as Profile */}
        <WeeklyLineChart data={weeklyData} />
      </motion.div>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-4"
      >
        <Card variant="spiritual">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {language === 'id' ? 'Hari Ini' : 'Today'}
                </span>
              </div>
              <span className="text-lg font-bold text-primary">{completedCount}/{totalCount}</span>
            </div>
            <Progress value={progressValue} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressValue >= 80 ? "Masya Allah, luar biasa! 🌟" :
               progressValue >= 50 ? "Bagus, terus semangat! 💪" :
               "Ayo, kamu pasti bisa! 🤲"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Task Form */}
      <AnimatePresence>
        {isAddingTask && (
          <motion.div
            ref={addFormRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 mb-4"
          >
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {language === 'id' ? 'Tambah Target Baru' : 'Add New Goal'}
                  </h3>
                  <Button variant="ghost" size="iconSm" onClick={() => setIsAddingTask(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder={language === 'id' ? "Contoh: Shalat tahajud setiap malam" : "Example: Pray tahajud every night"}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="mb-3"
                  autoFocus
                />
                
                {/* Priority Selection */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'id' ? 'Prioritas:' : 'Priority:'}
                  </p>
                  <div className="flex gap-2">
                    {(Object.keys(priorityLabels) as Priority[]).map((priority) => (
                      <Button
                        key={priority}
                        variant={newTaskPriority === priority ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewTaskPriority(priority)}
                        className="flex items-center gap-1"
                      >
                        <span className={priorityLabels[priority].color}>
                          {priorityLabels[priority].icon}
                        </span>
                        {priorityLabels[priority].label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'id' ? 'Kategori:' : 'Category:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <Button
                        key={key}
                        variant={newTaskCategory === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewTaskCategory(key as Task["category"])}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddingTask(false)}>
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </Button>
                  <Button variant="spiritual" className="flex-1" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    {language === 'id' ? 'Tambah' : 'Add'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mb-4"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
          >
            {language === 'id' ? 'Semua' : 'All'}
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={activeFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Task List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5"
      >
        <div className="space-y-2">
          <AnimatePresence>
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                layout
              >
                <Card
                  variant="default"
                  className={`transition-all ${task.completed ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <span 
                        className={`text-sm cursor-pointer block ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] flex items-center gap-0.5 ${priorityLabels[task.priority].color}`}>
                          {priorityLabels[task.priority].icon}
                          {priorityLabels[task.priority].label}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColors[task.category].bg} ${categoryColors[task.category].text}`}>
                      {categoryLabels[task.category]}
                    </span>
                    {task.isCustom && (
                      <Button 
                        variant="ghost" 
                        size="iconSm" 
                        onClick={() => deleteTask(task.id)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reflection CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-5 mt-6"
      >
        <Card 
          variant="hope" 
          className="cursor-pointer hover:shadow-glow transition-all"
          onClick={onOpenReflection}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-hope flex items-center justify-center text-2xl">
              📝
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                {language === 'id' ? 'Refleksi Diri' : 'Self Reflection'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'id' ? 'Tulis perasaan dan pelajaran hari ini' : 'Write your feelings and lessons today'}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4 mr-1" />
              {language === 'id' ? 'Tulis' : 'Write'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
