import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, Calendar, TrendingUp, X, Edit3, BookOpen } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: "ibadah" | "akhlak" | "ilmu" | "hijrah";
  isCustom?: boolean;
}

const initialTasks: Task[] = [
  { id: "1", title: "Shalat 5 waktu tepat waktu", completed: true, category: "ibadah" },
  { id: "2", title: "Baca Al-Qur'an 1 halaman", completed: true, category: "ibadah" },
  { id: "3", title: "Dzikir pagi & petang", completed: false, category: "ibadah" },
  { id: "4", title: "Istighfar 100x", completed: false, category: "ibadah" },
  { id: "5", title: "Berbuat baik pada orang tua", completed: false, category: "akhlak" },
  { id: "6", title: "Jauhi ghibah & gosip", completed: true, category: "hijrah" },
  { id: "7", title: "Baca hadis 1 hadis", completed: false, category: "ilmu" },
];

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

interface HijrahTasksPageProps {
  onOpenReflection?: () => void;
}

export const HijrahTasksPage = ({ onOpenReflection }: HijrahTasksPageProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Task["category"]>("ibadah");

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

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        category: newTaskCategory,
        isCustom: true,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  const filteredTasks = activeFilter === "all"
    ? tasks
    : tasks.filter(task => task.category === activeFilter);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressValue = (completedCount / tasks.length) * 100;

  const weeklyProgress = [
    { day: "Sen", value: 80 },
    { day: "Sel", value: 100 },
    { day: "Rab", value: 60 },
    { day: "Kam", value: 90 },
    { day: "Jum", value: 100 },
    { day: "Sab", value: 40 },
    { day: "Min", value: progressValue },
  ];

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

        {/* Weekly Progress */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Progress Mingguan</span>
            </div>
            <div className="flex justify-between gap-1">
              {weeklyProgress.map((day, index) => (
                <div key={day.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="h-20 w-full bg-muted rounded-lg relative overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${day.value}%` }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                      className="absolute bottom-0 left-0 right-0 rounded-lg gradient-hero"
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${index === 6 ? "text-primary" : "text-muted-foreground"}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                <span className="text-sm font-semibold text-foreground">Hari Ini</span>
              </div>
              <span className="text-lg font-bold text-primary">{completedCount}/{tasks.length}</span>
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 mb-4"
          >
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Tambah Target Baru</h3>
                  <Button variant="ghost" size="iconSm" onClick={() => setIsAddingTask(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Contoh: Shalat tahajud setiap malam"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="mb-3"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2 mb-3">
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
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddingTask(false)}>
                    Batal
                  </Button>
                  <Button variant="spiritual" className="flex-1" onClick={addTask} disabled={!newTaskTitle.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
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
            Semua
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
                    <span 
                      className={`flex-1 text-sm cursor-pointer ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.title}
                    </span>
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
              <h3 className="text-sm font-semibold text-foreground">Refleksi Diri</h3>
              <p className="text-xs text-muted-foreground">Tulis perasaan dan pelajaran hari ini</p>
            </div>
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4 mr-1" />
              Tulis
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};