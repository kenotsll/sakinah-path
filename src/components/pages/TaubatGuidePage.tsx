import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, BookOpen, CheckCircle, Check, Footprints } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const steps = [
  {
    number: 1,
    title: "Menghentikan Dosa",
    description: "Berhenti sepenuhnya dari perbuatan dosa yang dilakukan",
    icon: "🛑",
    detail: "Langkah pertama yang harus dilakukan adalah benar-benar menghentikan dosa tersebut. Tidak boleh masih melakukannya sementara memohon ampunan. Allah SWT berfirman: 'Dan janganlah kamu mendekati perbuatan-perbuatan keji, baik yang tampak maupun yang tersembunyi.' (QS. Al-An'am: 151)",
    dalil: "QS. Al-An'am: 151"
  },
  {
    number: 2,
    title: "Menyesal dengan Sungguh-sungguh",
    description: "Merasakan penyesalan yang mendalam atas dosa yang diperbuat",
    icon: "💔",
    detail: "Penyesalan adalah inti dari taubat. Rasulullah SAW bersabda: 'Penyesalan itu adalah taubat.' (HR. Ibnu Majah). Penyesalan yang dimaksud adalah menyesal karena Allah, bukan karena takut manusia atau rugi duniawi.",
    dalil: "HR. Ibnu Majah"
  },
  {
    number: 3,
    title: "Bertekad Tidak Mengulangi",
    description: "Berazam kuat untuk tidak kembali pada dosa tersebut",
    icon: "✊",
    detail: "Tekad yang kuat untuk tidak mengulangi dosa adalah syarat diterimanya taubat. Jika seseorang bertaubat dengan niat akan mengulanginya lagi, maka taubatnya tidak sah. Ini membutuhkan mujahadah (perjuangan melawan hawa nafsu).",
    dalil: "Imam An-Nawawi, Riyadhus Shalihin"
  },
  {
    number: 4,
    title: "Mengembalikan Hak (jika ada)",
    description: "Jika dosa terkait hak orang lain, kembalikan haknya atau minta maaf",
    icon: "🤝",
    detail: "Jika dosa melibatkan hak orang lain, seperti mengambil harta atau menyakiti perasaan, maka wajib mengembalikan hak tersebut atau meminta maaf. Rasulullah SAW bersabda: 'Barangsiapa yang pernah menzalimi saudaranya, hendaklah ia meminta kehalalan darinya sebelum datang hari yang tidak ada dinar dan dirham.' (HR. Bukhari)",
    dalil: "HR. Bukhari"
  },
];

const prayers = [
  {
    id: 1,
    title: "Sayyidul Istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    latin: "Allahumma anta rabbi, laa ilaaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastatha'tu. A'uudzu bika min syarri maa shana'tu, abuu'u laka bi ni'matika 'alayya wa abuu'u bi dzanbi, faghfirli fa innahu laa yaghfiru dz-dzunuuba illa anta.",
    translation: "Ya Allah, Engkau adalah Tuhanku, tidak ada Tuhan yang berhak disembah kecuali Engkau. Engkau menciptakanku dan aku adalah hamba-Mu. Aku berada di atas perjanjian dan janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan yang kuperbuat. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku, karena sesungguhnya tidak ada yang mengampuni dosa kecuali Engkau.",
    source: "HR. Bukhari",
    keutamaan: "Barangsiapa membacanya di pagi hari dengan yakin, lalu meninggal pada hari itu, maka ia termasuk penghuni surga."
  },
  {
    id: 2,
    title: "Istighfar Sederhana",
    arabic: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ",
    latin: "Astaghfirullahal 'azhiim",
    translation: "Aku memohon ampunan kepada Allah Yang Maha Agung",
    source: "HR. Muslim",
    keutamaan: "Doa yang ringan di lidah namun berat di timbangan. Dianjurkan membaca 100 kali setiap hari."
  },
  {
    id: 3,
    title: "Doa Nabi Adam AS",
    arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    latin: "Rabbana zhalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal khaasirin",
    translation: "Ya Tuhan kami, kami telah menzalimi diri kami sendiri, dan jika Engkau tidak mengampuni kami dan memberi rahmat kepada kami, niscaya kami termasuk orang-orang yang rugi.",
    source: "QS. Al-A'raf: 23",
    keutamaan: "Doa pertama permohonan ampun dalam sejarah manusia, diucapkan oleh Nabi Adam AS dan Hawa setelah memakan buah terlarang."
  },
  {
    id: 4,
    title: "Doa Nabi Yunus AS",
    arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
    latin: "Laa ilaaha illa anta subhaanaka inni kuntu minazh-zhaalimin",
    translation: "Tidak ada Tuhan selain Engkau, Maha Suci Engkau, sesungguhnya aku termasuk orang-orang yang zalim.",
    source: "QS. Al-Anbiya: 87",
    keutamaan: "Tidak seorang Muslim pun yang berdoa dengan doa ini dalam suatu perkara melainkan Allah akan mengabulkannya."
  },
  {
    id: 5,
    title: "Istighfar Lengkap",
    arabic: "أَسْتَغْفِرُ اللهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    latin: "Astaghfirullahal ladzi laa ilaaha illa huwal hayyul qayyuum wa atuubu ilaih",
    translation: "Aku memohon ampunan kepada Allah, yang tidak ada Tuhan selain Dia, Yang Maha Hidup lagi Maha Berdiri Sendiri, dan aku bertaubat kepada-Nya.",
    source: "HR. Abu Daud & Tirmidzi",
    keutamaan: "Barangsiapa membacanya, maka dosanya diampuni meski ia lari dari medan perang."
  },
];

interface TaubatJourneyPageProps {
  onBack: () => void;
}

const TaubatJourneyPage = ({ onBack }: TaubatJourneyPageProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const journeySteps = [
    {
      title: "Persiapan Hati",
      description: "Luangkan waktu sejenak untuk menenangkan diri dan fokus",
      content: "Carilah tempat yang tenang. Bersihkan hati dari segala kesibukan dunia. Hadirkan Allah dalam hatimu. Ingatlah bahwa Allah Maha Pengampun dan selalu menunggu hamba-Nya kembali.",
      action: "Tarik nafas dalam-dalam, tenangkan pikiran"
    },
    {
      title: "Berwudhu",
      description: "Bersihkan diri dengan wudhu yang sempurna",
      content: "Wudhu adalah pembersihan lahir yang menyimbolkan pembersihan batin. Lakukanlah dengan khusyuk, hayati setiap basuhan sebagai pembersihan dari dosa.",
      action: "Ambil wudhu dengan tenang dan khusyuk"
    },
    {
      title: "Shalat Taubat",
      description: "Lakukan shalat sunnah 2 rakaat",
      content: "Niat: Shalat sunnah taubat 2 rakaat karena Allah Ta'ala. Baca surat apapun yang kamu hafal. Lakukan dengan khusyuk, bayangkan sedang bermunajat langsung kepada Allah.",
      action: "Shalat 2 rakaat dengan khusyuk"
    },
    {
      title: "Beristighfar",
      description: "Mohon ampunan dengan sepenuh hati",
      content: "Setelah salam, duduklah dengan tenang. Bacalah istighfar minimal 100 kali: 'Astaghfirullahal 'azhim'. Rasakan setiap kalimat dengan kesadaran penuh.",
      action: "Baca istighfar 100 kali"
    },
    {
      title: "Berdoa dengan Khusyuk",
      description: "Panjatkan doa taubat dengan air mata",
      content: "Angkat tanganmu, berdoalah dengan bahasa hatimu. Akui dosamu, sebutkan penyesalanmu, dan mohon ampunan dengan sepenuh hati. Tidak perlu malu menangis di hadapan Allah.",
      action: "Berdoa dengan sepenuh hati"
    },
    {
      title: "Berjanji & Berkomitmen",
      description: "Tekad untuk tidak mengulangi",
      content: "Dengan Allah sebagai saksi, bertekadlah untuk tidak mengulangi dosa tersebut. Buatlah rencana konkret untuk menghindari pemicu dosa. Ingat, Allah melihat kesungguhan hatimu.",
      action: "Ucapkan janji dalam hatimu"
    },
  ];

  const handleComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const handleNext = () => {
    handleComplete();
    if (currentStep < journeySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-4"
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Perjalanan Taubat</h1>
        <p className="text-sm text-muted-foreground">Ikuti langkah-langkah berikut dengan khusyuk</p>
      </motion.div>

      {/* Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          {journeySteps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  completedSteps.includes(index)
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary-soft text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {completedSteps.includes(index) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < journeySteps.length - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-6 mx-1 transition-all ${
                    completedSteps.includes(index) ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Current Step Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="elevated" className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-primary bg-primary-soft px-3 py-1 rounded-full">
                    Langkah {currentStep + 1} dari {journeySteps.length}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {journeySteps[currentStep].title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {journeySteps[currentStep].description}
                </p>
                <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {journeySteps[currentStep].content}
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-primary-soft rounded-lg">
                  <Footprints className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-sm font-medium text-primary">
                    {journeySteps[currentStep].action}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>
          {currentStep === journeySteps.length - 1 ? (
            <Button
              variant="spiritual"
              onClick={() => {
                handleComplete();
                onBack();
              }}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Selesai
            </Button>
          ) : (
            <Button variant="spiritual" onClick={handleNext} className="flex-1">
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Progress Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mt-6"
      >
        <Card variant="hope">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">🤲</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                {completedSteps.length} dari {journeySteps.length} langkah selesai
              </h3>
              <p className="text-xs text-muted-foreground">
                Teruslah berusaha, Allah mencintai hamba yang bertaubat
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export const TaubatGuidePage = () => {
  const [currentPrayerIndex, setCurrentPrayerIndex] = useState(0);
  const [understoodSteps, setUnderstoodSteps] = useState<number[]>([]);
  const [showJourney, setShowJourney] = useState(false);

  const handleNextPrayer = () => {
    if (currentPrayerIndex < prayers.length - 1) {
      setCurrentPrayerIndex(currentPrayerIndex + 1);
    }
  };

  const handlePrevPrayer = () => {
    if (currentPrayerIndex > 0) {
      setCurrentPrayerIndex(currentPrayerIndex - 1);
    }
  };

  const toggleUnderstood = (stepNumber: number) => {
    if (understoodSteps.includes(stepNumber)) {
      setUnderstoodSteps(understoodSteps.filter(s => s !== stepNumber));
    } else {
      setUnderstoodSteps([...understoodSteps, stepNumber]);
    }
  };

  if (showJourney) {
    return <TaubatJourneyPage onBack={() => setShowJourney(false)} />;
  }

  return (
    <div className="min-h-screen pb-32 gradient-calm">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="gradient-hero px-5 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-card/20 backdrop-blur-sm mb-4">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">
              Panduan Taubat
            </h1>
            <p className="text-sm text-primary-foreground/80 max-w-xs mx-auto">
              Langkah-langkah menuju ampunan Allah dengan penuh harapan
            </p>
          </motion.div>
        </div>
        <div className="h-6 bg-gradient-to-b from-primary/20 to-transparent" />
      </motion.div>

      {/* Dalil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 -mt-2"
      >
        <Card variant="elevated">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-arabic text-lg text-foreground text-right leading-relaxed mb-2">
                  وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  "Barangsiapa yang mengerjakan kejahatan dan menganiaya dirinya, kemudian ia mohon ampun kepada Allah, niscaya ia mendapati Allah Maha Pengampun lagi Maha Penyayang."
                </p>
                <p className="text-xs text-primary font-medium">QS. An-Nisa: 110</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Syarat Taubat - Interactive Accordion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Syarat Taubat Nasuha</h2>
          <span className="text-xs text-primary font-medium">
            {understoodSteps.length}/{steps.length} dipahami
          </span>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <AccordionItem value={`step-${step.number}`} className="border-none">
                <Card variant="default" className={`transition-all ${understoodSteps.includes(step.number) ? "border-primary/50 bg-primary-soft/30" : ""}`}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center text-2xl flex-shrink-0">
                        {step.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                            Langkah {step.number}
                          </span>
                          {understoodSteps.includes(step.number) && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pl-15 space-y-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        {step.detail}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-primary font-medium">
                        <BookOpen className="h-3 w-3" />
                        {step.dalil}
                      </div>
                      <Button
                        variant={understoodSteps.includes(step.number) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleUnderstood(step.number)}
                        className="mt-2"
                      >
                        {understoodSteps.includes(step.number) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Sudah Dipahami
                          </>
                        ) : (
                          "Tandai Sudah Dipahami"
                        )}
                      </Button>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>

      {/* Doa Taubat - Pagination */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-5 mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Doa Taubat</h2>
          <span className="text-xs text-muted-foreground">
            {currentPrayerIndex + 1} / {prayers.length}
          </span>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPrayerIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="spiritual">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold text-foreground mb-4">
                  {prayers[currentPrayerIndex].title}
                </h3>
                <p className="font-arabic text-xl text-foreground text-right leading-loose mb-4">
                  {prayers[currentPrayerIndex].arabic}
                </p>
                <p className="text-sm text-primary italic mb-2">
                  {prayers[currentPrayerIndex].latin}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {prayers[currentPrayerIndex].translation}
                </p>
                <div className="bg-primary-soft/50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">Keutamaan:</span> {prayers[currentPrayerIndex].keutamaan}
                  </p>
                </div>
                <p className="text-xs text-primary font-medium text-right">
                  {prayers[currentPrayerIndex].source}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPrayer}
            disabled={currentPrayerIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>
          <div className="flex gap-1">
            {prayers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPrayerIndex(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentPrayerIndex ? "bg-primary w-4" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPrayer}
            disabled={currentPrayerIndex === prayers.length - 1}
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-5 mt-6"
      >
        <Button variant="spiritual" size="lg" className="w-full" onClick={() => setShowJourney(true)}>
          <CheckCircle className="h-5 w-5" />
          Mulai Perjalanan Taubat
        </Button>
      </motion.div>
    </div>
  );
};