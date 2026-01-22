import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit3, Trash2, Calendar, X, Save, BookOpen } from "lucide-react";
import { useState } from "react";

interface Reflection {
  id: string;
  content: string;
  date: string;
  timestamp: number;
}

const MAX_CHARS = 500;

export const ReflectionPage = () => {
  const [reflections, setReflections] = useState<Reflection[]>([
    {
      id: "1",
      content: "Hari ini aku merasa lebih dekat dengan Allah setelah shalat tahajud. Semoga istiqamah.",
      date: "21 Jan 2026",
      timestamp: Date.now() - 86400000,
    },
    {
      id: "2",
      content: "Berhasil menahan diri dari berkata kasar hari ini. Alhamdulillah, ini kemajuan kecil tapi bermakna.",
      date: "20 Jan 2026",
      timestamp: Date.now() - 172800000,
    },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");

  const handleAdd = () => {
    if (newContent.trim()) {
      const now = new Date();
      const newReflection: Reflection = {
        id: Date.now().toString(),
        content: newContent.trim(),
        date: now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        timestamp: now.getTime(),
      };
      setReflections([newReflection, ...reflections]);
      setNewContent("");
      setIsAdding(false);
    }
  };

  const handleEdit = (id: string, content: string) => {
    setReflections(reflections.map(r => 
      r.id === id ? { ...r, content } : r
    ));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setReflections(reflections.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-hope flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-hope-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catatan Refleksi</h1>
            <p className="text-sm text-muted-foreground">Tulis perasaan & pelajaran harianmu</p>
          </div>
        </div>
      </motion.div>

      {/* Add New Reflection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <AnimatePresence>
          {isAdding ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card variant="elevated">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <Button variant="ghost" size="iconSm" onClick={() => setIsAdding(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Apa yang kamu rasakan atau pelajari hari ini?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value.slice(0, MAX_CHARS))}
                    className="min-h-[120px] resize-none mb-3"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${newContent.length >= MAX_CHARS ? "text-destructive" : "text-muted-foreground"}`}>
                      {newContent.length}/{MAX_CHARS} karakter
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                        Batal
                      </Button>
                      <Button variant="spiritual" size="sm" onClick={handleAdd} disabled={!newContent.trim()}>
                        <Save className="h-4 w-4 mr-1" />
                        Simpan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="outline"
                className="w-full h-16 border-dashed border-2"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Tambah Catatan Baru
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Reflections List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">Catatan Sebelumnya</h2>
        <div className="space-y-3">
          <AnimatePresence>
            {reflections.map((reflection, index) => (
              <motion.div
                key={reflection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="default">
                  <CardContent className="p-4">
                    {editingId === reflection.id ? (
                      <EditReflectionForm
                        content={reflection.content}
                        onSave={(content) => handleEdit(reflection.id, content)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {reflection.date}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => {
                                setEditingId(reflection.id);
                                setNewContent(reflection.content);
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => handleDelete(reflection.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {reflection.content}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {reflections.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm text-muted-foreground">
                Belum ada catatan refleksi. Mulai menulis sekarang!
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Motivational Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mt-6"
      >
        <Card variant="hope">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-foreground italic">
              "Muhasabah diri adalah cermin untuk melihat kekurangan."
            </p>
            <p className="text-xs text-primary mt-1">— Umar bin Khattab RA</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

interface EditReflectionFormProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const EditReflectionForm = ({ content, onSave, onCancel }: EditReflectionFormProps) => {
  const [editContent, setEditContent] = useState(content);

  return (
    <div>
      <Textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value.slice(0, MAX_CHARS))}
        className="min-h-[100px] resize-none mb-3"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${editContent.length >= MAX_CHARS ? "text-destructive" : "text-muted-foreground"}`}>
          {editContent.length}/{MAX_CHARS}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="spiritual" size="sm" onClick={() => onSave(editContent)} disabled={!editContent.trim()}>
            <Save className="h-4 w-4 mr-1" />
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};