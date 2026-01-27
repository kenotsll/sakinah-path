import { useState, useEffect } from 'react';

interface HijriDate {
  day: number;
  month: number;
  monthName: string;
  monthNameAr: string;
  year: number;
  formattedDate: string;
}

interface IslamicEvent {
  date: string; // Format: "DD-MM" (Hijri)
  name: string;
  nameEn: string;
  type: 'major' | 'sunnah' | 'fasting';
}

// Islamic calendar events (Hijri dates)
export const islamicEvents: IslamicEvent[] = [
  { date: "01-01", name: "Tahun Baru Islam", nameEn: "Islamic New Year", type: "major" },
  { date: "10-01", name: "Hari Asyura", nameEn: "Day of Ashura", type: "sunnah" },
  { date: "12-03", name: "Maulid Nabi Muhammad ﷺ", nameEn: "Prophet's Birthday", type: "major" },
  { date: "27-07", name: "Isra Mi'raj", nameEn: "Isra Mi'raj", type: "major" },
  { date: "15-08", name: "Nisfu Sya'ban", nameEn: "Mid-Sha'ban", type: "sunnah" },
  { date: "01-09", name: "Awal Ramadhan", nameEn: "Start of Ramadan", type: "major" },
  { date: "17-09", name: "Nuzulul Qur'an", nameEn: "Quran Revelation", type: "major" },
  { date: "21-09", name: "Lailatul Qadr (Perkiraan)", nameEn: "Night of Power (Est.)", type: "major" },
  { date: "01-10", name: "Idul Fitri", nameEn: "Eid al-Fitr", type: "major" },
  { date: "09-12", name: "Hari Arafah", nameEn: "Day of Arafah", type: "sunnah" },
  { date: "10-12", name: "Idul Adha", nameEn: "Eid al-Adha", type: "major" },
  { date: "11-12", name: "Hari Tasyrik 1", nameEn: "Tashreeq Day 1", type: "sunnah" },
  { date: "12-12", name: "Hari Tasyrik 2", nameEn: "Tashreeq Day 2", type: "sunnah" },
  { date: "13-12", name: "Hari Tasyrik 3", nameEn: "Tashreeq Day 3", type: "sunnah" },
];

// Sunnah fasting days
export const sunnahFastingDays = {
  monday: { name: "Puasa Senin", nameEn: "Monday Fasting" },
  thursday: { name: "Puasa Kamis", nameEn: "Thursday Fasting" },
  ayyamulBidh: { name: "Puasa Ayyamul Bidh (13, 14, 15)", nameEn: "Ayyamul Bidh (13, 14, 15)" },
};

const hijriMonthNames = [
  { ar: "محرم", id: "Muharram" },
  { ar: "صفر", id: "Safar" },
  { ar: "ربيع الأول", id: "Rabiul Awal" },
  { ar: "ربيع الثاني", id: "Rabiul Akhir" },
  { ar: "جمادى الأولى", id: "Jumadil Awal" },
  { ar: "جمادى الآخرة", id: "Jumadil Akhir" },
  { ar: "رجب", id: "Rajab" },
  { ar: "شعبان", id: "Sya'ban" },
  { ar: "رمضان", id: "Ramadhan" },
  { ar: "شوال", id: "Syawal" },
  { ar: "ذو القعدة", id: "Dzulqa'dah" },
  { ar: "ذو الحجة", id: "Dzulhijjah" },
];

// Convert Gregorian to Hijri using calculation
function gregorianToHijri(date: Date): HijriDate {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth();
  const gregorianDay = date.getDate();

  // Julian Day Number calculation
  let jd = Math.floor((1461 * (gregorianYear + 4800 + Math.floor((gregorianMonth - 14) / 12))) / 4) +
           Math.floor((367 * (gregorianMonth - 2 - 12 * Math.floor((gregorianMonth - 14) / 12))) / 12) -
           Math.floor((3 * Math.floor((gregorianYear + 4900 + Math.floor((gregorianMonth - 14) / 12)) / 100)) / 4) +
           gregorianDay - 32075;

  // Hijri calculation from Julian Day
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
            Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  const monthData = hijriMonthNames[month - 1] || { ar: "", id: "" };

  return {
    day,
    month,
    monthName: monthData.id,
    monthNameAr: monthData.ar,
    year,
    formattedDate: `${day} ${monthData.id} ${year} H`,
  };
}

export function useHijriDate() {
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [todayEvents, setTodayEvents] = useState<IslamicEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<IslamicEvent[]>([]);

  useEffect(() => {
    const today = new Date();
    const hijri = gregorianToHijri(today);
    setHijriDate(hijri);

    // Check today's events
    const todayKey = `${hijri.day.toString().padStart(2, '0')}-${hijri.month.toString().padStart(2, '0')}`;
    const eventsToday = islamicEvents.filter(e => e.date === todayKey);
    setTodayEvents(eventsToday);

    // Get upcoming events (next 30 days in Hijri)
    const upcoming: IslamicEvent[] = [];
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      const futureHijri = gregorianToHijri(futureDate);
      const futureKey = `${futureHijri.day.toString().padStart(2, '0')}-${futureHijri.month.toString().padStart(2, '0')}`;
      const event = islamicEvents.find(e => e.date === futureKey);
      if (event && !upcoming.find(u => u.date === event.date)) {
        upcoming.push(event);
      }
    }
    setUpcomingEvents(upcoming.slice(0, 5));
  }, []);

  // Check if today is a sunnah fasting day
  const isSunnahFastingDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isMonday = dayOfWeek === 1;
    const isThursday = dayOfWeek === 4;
    const isAyyamulBidh = hijriDate && [13, 14, 15].includes(hijriDate.day);
    
    return { isMonday, isThursday, isAyyamulBidh };
  };

  return {
    hijriDate,
    todayEvents,
    upcomingEvents,
    isSunnahFastingDay,
    islamicEvents,
  };
}
