import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send, CheckCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Bagaimana cara memulai konsultasi?",
    answer: "Pilih ustadz/ustadzah yang tersedia, pilih topik konsultasi yang sesuai dengan masalah Anda, lalu klik tombol 'Hubungi via WhatsApp'. Pesan akan otomatis terformat dengan topik yang dipilih."
  },
  {
    question: "Apakah identitas saya terjaga?",
    answer: "Ya, 100% anonim. Anda bisa menggunakan nama samaran saat berkonsultasi. Kami tidak menyimpan data pribadi Anda."
  },
  {
    question: "Berapa biaya konsultasi?",
    answer: "Konsultasi melalui aplikasi Istiqamah sepenuhnya gratis. Ustadz/ustadzah kami mengabdikan diri untuk membantu umat."
  },
  {
    question: "Bagaimana cara menambah target hijrah?",
    answer: "Di halaman 'Target Hijrah', klik tombol + di pojok kanan atas. Masukkan nama target dan pilih kategori yang sesuai."
  },
  {
    question: "Bagaimana cara menemukan masjid terdekat?",
    answer: "Buka halaman 'Masjid', aplikasi akan meminta izin lokasi. Setelah diizinkan, daftar masjid terdekat akan muncul dengan tombol navigasi ke Google Maps."
  },
  {
    question: "Video tidak bisa diputar?",
    answer: "Video akan terbuka di aplikasi YouTube. Pastikan aplikasi YouTube terinstall di perangkat Anda."
  },
];

interface FAQPageProps {
  onBack: () => void;
}

export const FAQPage = ({ onBack }: FAQPageProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (name.trim() && email.trim() && message.trim()) {
      // In a real app, this would send to a backend
      console.log("Feedback submitted:", { name, email, message });
      setIsSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      
      // Reset after 3 seconds
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bantuan & FAQ</h1>
            <p className="text-sm text-muted-foreground">Pertanyaan umum dan feedback</p>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Pertanyaan Umum</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`} className="border-none">
              <Card variant="default">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-sm font-medium text-foreground text-left">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      {/* Feedback Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Kirim Feedback</h2>
        <Card variant="elevated">
          <CardContent className="p-4">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="h-16 w-16 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Terima Kasih!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Feedback Anda telah terkirim. Kami akan menindaklanjuti segera.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Nama
                    </label>
                    <Input
                      placeholder="Masukkan nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Pesan
                    </label>
                    <Textarea
                      placeholder="Tuliskan feedback, saran, atau pertanyaan Anda..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
                <Button
                  variant="spiritual"
                  className="w-full mt-4"
                  onClick={handleSubmit}
                  disabled={!name.trim() || !email.trim() || !message.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Feedback
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mt-6"
      >
        <Card variant="hope">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-foreground mb-1">
              Butuh bantuan lebih lanjut?
            </p>
            <p className="text-xs text-muted-foreground">
              Email: support@istiqamah.app
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};