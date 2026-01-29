import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface FeedbackFormProps {
  userEmail?: string;
}

export const FeedbackForm = ({ userEmail }: FeedbackFormProps) => {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error(language === 'id' ? 'Pesan tidak boleh kosong' : 'Message cannot be empty');
      return;
    }

    // Validate message length
    if (message.length > 1000) {
      toast.error(language === 'id' ? 'Pesan terlalu panjang (maks 1000 karakter)' : 'Message too long (max 1000 characters)');
      return;
    }

    setSending(true);

    try {
      // Create mailto link with pre-filled content
      const subject = encodeURIComponent(`[Istiqamah Feedback] dari ${name || 'Pengguna'}`);
      const body = encodeURIComponent(
        `Nama: ${name || 'Tidak disebutkan'}\n` +
        `Email: ${email || 'Tidak disebutkan'}\n\n` +
        `Pesan:\n${message}\n\n` +
        `---\nDikirim dari Aplikasi Istiqamah`
      );
      
      const mailtoLink = `mailto:skenote0@gmail.com?subject=${subject}&body=${body}`;
      
      // Open email client
      window.location.href = mailtoLink;

      // Mark as sent after a short delay
      setTimeout(() => {
        setSending(false);
        setSent(true);
        setMessage("");
        setName("");
        toast.success(
          language === 'id' 
            ? 'Email client terbuka. Silakan kirim pesan Anda!' 
            : 'Email client opened. Please send your message!'
        );
        
        // Reset sent state after 3 seconds
        setTimeout(() => setSent(false), 3000);
      }, 500);
    } catch (error) {
      setSending(false);
      toast.error(
        language === 'id' 
          ? 'Gagal membuka email client' 
          : 'Failed to open email client'
      );
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">
            {language === 'id' ? 'Kirim Masukan' : 'Send Feedback'}
          </h3>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <CheckCircle className="h-12 w-12 text-primary mb-3" />
            <p className="text-sm font-medium text-foreground">
              {language === 'id' ? 'Terima kasih!' : 'Thank you!'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'id' 
                ? 'Masukan Anda sangat berarti bagi kami' 
                : 'Your feedback means a lot to us'}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder={language === 'id' ? 'Nama (opsional)' : 'Name (optional)'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border text-sm"
                maxLength={100}
              />
              <Input
                type="email"
                placeholder="Email (opsional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-sm"
                maxLength={255}
              />
            </div>
            
            <Textarea
              placeholder={
                language === 'id' 
                  ? 'Tulis saran, kritik, atau masukan Anda di sini...' 
                  : 'Write your suggestions, feedback, or ideas here...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-input border-border min-h-[80px] text-sm resize-none"
              maxLength={1000}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {message.length}/1000
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={sending || !message.trim()}
                className="gradient-hero text-primary-foreground"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    {language === 'id' ? 'Mengirim...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    {language === 'id' ? 'Kirim' : 'Send'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
