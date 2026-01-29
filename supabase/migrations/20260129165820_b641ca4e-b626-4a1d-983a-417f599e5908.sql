-- Table for user tasks (hijrah targets)
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'ibadah',
  priority TEXT NOT NULL DEFAULT 'penting',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user streak data
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  yellow_card_dates DATE[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tasbih sessions
CREATE TABLE public.user_tasbih_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dzikir_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 33,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Quran bookmarks
CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surah_number INTEGER NOT NULL,
  surah_name TEXT NOT NULL,
  surah_arabic TEXT,
  ayah_number INTEGER NOT NULL,
  ayah_text TEXT NOT NULL,
  translation TEXT,
  show_on_carousel BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number, ayah_number)
);

-- Enable RLS on all tables
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasbih_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tasks
CREATE POLICY "Users can view their own tasks" ON public.user_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.user_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.user_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.user_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streak" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streak" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_tasbih_sessions
CREATE POLICY "Users can view their own tasbih" ON public.user_tasbih_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasbih" ON public.user_tasbih_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasbih" ON public.user_tasbih_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasbih" ON public.user_tasbih_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_bookmarks
CREATE POLICY "Users can view their own bookmarks" ON public.user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" ON public.user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON public.user_bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON public.user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_tasks
CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on user_streaks
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();