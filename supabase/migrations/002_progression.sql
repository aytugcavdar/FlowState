-- ============================================================
-- Migration 002: İlerleme Sistemi
-- Kullanıcı ilerlemesi, başarımlar ve günlük görevler.
-- ============================================================

-- ─── Kullanıcı İlerlemesi ───────────────────────────────────

CREATE TABLE public.user_progression (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  xp INTEGER DEFAULT 0 NOT NULL CHECK (xp >= 0),
  level SMALLINT DEFAULT 1 NOT NULL CHECK (level >= 1),
  coins INTEGER DEFAULT 0 NOT NULL CHECK (coins >= 0),
  streak_current SMALLINT DEFAULT 0 NOT NULL,
  streak_best SMALLINT DEFAULT 0 NOT NULL,
  streak_last_date DATE,              -- Son seri günü
  puzzles_solved INTEGER DEFAULT 0 NOT NULL,
  total_play_time_seconds INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER on_user_progression_updated
  BEFORE UPDATE ON public.user_progression
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.user_progression IS 'Kullanıcı ilerleme durumu — XP, seviye, coin, seri';

-- ─── Başarımlar ─────────────────────────────────────────────

CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,                 -- 'first_solve', 'speed_demon' gibi
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0 NOT NULL,
  coin_reward INTEGER DEFAULT 0 NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gameplay', 'progression', 'social', 'secret')),
  sort_order SMALLINT DEFAULT 0
);

COMMENT ON TABLE public.achievements IS 'Başarım tanımları — sabit veri, seed ile yüklenir';

-- ─── Kullanıcı Başarımları ──────────────────────────────────

CREATE TABLE public.user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES public.achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user
  ON public.user_achievements (user_id, unlocked_at DESC);

-- ─── Günlük Görev Şablonları ────────────────────────────────

CREATE TABLE public.mission_templates (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  target INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('solve', 'speed', 'streak', 'misc'))
);

COMMENT ON TABLE public.mission_templates IS 'Görev şablonları — havuz olarak kullanılır';

-- ─── Kullanıcı Günlük Görevleri ─────────────────────────────

CREATE TABLE public.user_missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT REFERENCES public.mission_templates(id) NOT NULL,
  mission_date DATE NOT NULL,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 3),
  progress INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  claimed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Kullanıcı başına günde 3 görev
  CONSTRAINT uq_user_mission_slot
    UNIQUE (user_id, mission_date, slot)
);

CREATE INDEX idx_user_missions_active
  ON public.user_missions (user_id, mission_date)
  WHERE claimed = FALSE;
