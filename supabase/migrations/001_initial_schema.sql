-- ============================================================
-- Migration 001: Temel Şema
-- Profiller, bulmacalar ve oyun oturumları.
-- ============================================================

-- UUID üretici uzantısı
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiller ──────────────────────────────────────────────

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Kullanıcı adı tekil indeksi (case-insensitive)
CREATE UNIQUE INDEX idx_profiles_username_lower
  ON public.profiles (LOWER(username));

COMMENT ON TABLE public.profiles IS 'Kullanıcı profilleri — auth.users ile 1:1 ilişki';

-- ─── Bulmacalar ─────────────────────────────────────────────

CREATE TABLE public.puzzles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grid_size SMALLINT NOT NULL CHECK (grid_size BETWEEN 3 AND 12),
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  definition JSONB NOT NULL,        -- PuzzleDefinition JSON
  solution_hash TEXT NOT NULL,       -- SHA256(canonical çözüm)
  is_daily BOOLEAN DEFAULT FALSE,
  daily_date DATE UNIQUE,            -- Günlük bulmaca tarihi (null = normal)
  play_count INTEGER DEFAULT 0,
  avg_solve_time_seconds REAL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Günlük bulmaca hızlı arama indeksi
CREATE INDEX idx_puzzles_daily_date ON public.puzzles (daily_date)
  WHERE is_daily = TRUE;

-- Zorluk bazlı filtreleme indeksi
CREATE INDEX idx_puzzles_difficulty ON public.puzzles (difficulty);

COMMENT ON TABLE public.puzzles IS 'Bulmaca tanımları — definition alanı PuzzleDefinition JSON içerir';

-- ─── Oyun Oturumları (Append-Only) ─────────────────────────

CREATE TABLE public.game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  puzzle_id UUID REFERENCES public.puzzles(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  elapsed_seconds INTEGER DEFAULT 0,
  move_count INTEGER DEFAULT 0,
  hints_used SMALLINT DEFAULT 0,
  undos_used SMALLINT DEFAULT 0,
  solution_hash TEXT,                -- Tamamlanan çözümün hash'i
  move_log JSONB,                    -- Command[] tekrar oynatma verisi
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Aynı kullanıcı aynı puzzle'ı birden fazla tamamlayamaz
  CONSTRAINT uq_user_puzzle_completed
    UNIQUE (user_id, puzzle_id)
    -- Not: Aktif oturumlar bu kısıtlamayı ihlal etmez,
    -- sadece completed oturumlar tekil olmalı
);

-- Kullanıcı oturumları hızlı arama
CREATE INDEX idx_game_sessions_user ON public.game_sessions (user_id, started_at DESC);

-- Leaderboard sorguları için
CREATE INDEX idx_game_sessions_puzzle_completed
  ON public.game_sessions (puzzle_id, elapsed_seconds)
  WHERE status = 'completed';

COMMENT ON TABLE public.game_sessions IS 'Oyun oturumları — append-only pattern, tamamlanan oturumlar değiştirilemez';

-- ─── updated_at Trigger ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
