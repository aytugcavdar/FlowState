-- ============================================================
-- Migration 003: Ekonomi Sistemi
-- İşlemler (append-only) ve envanter.
-- ============================================================

-- ─── İşlemler (Append-Only Ledger) ──────────────────────────

CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'puzzle_reward',        -- Puzzle çözme ödülü
    'mission_reward',       -- Görev ödülü
    'achievement_reward',   -- Başarım ödülü
    'streak_bonus',         -- Seri bonusu
    'level_up_bonus',       -- Seviye atlama bonusu
    'purchase',             -- Mağaza satın alımı
    'daily_bonus',          -- Günlük giriş bonusu
    'admin_grant'           -- Admin tarafından verilen
  )),
  coins_delta INTEGER DEFAULT 0 NOT NULL, -- Pozitif: kazanç, Negatif: harcama
  xp_delta INTEGER DEFAULT 0 NOT NULL,
  description TEXT,
  reference_id TEXT,  -- İlişkili kayıt (puzzle_id, mission_id, vb.)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bu tablo SADECE INSERT yapılır, UPDATE/DELETE yasak
-- (RLS ile enforce edilecek)

CREATE INDEX idx_transactions_user
  ON public.transactions (user_id, created_at DESC);

CREATE INDEX idx_transactions_type
  ON public.transactions (type, created_at DESC);

COMMENT ON TABLE public.transactions IS 'Ekonomi işlem defteri — append-only, düzenleme yasak';

-- ─── Envanter ───────────────────────────────────────────────

CREATE TABLE public.inventory (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('theme', 'powerup')),
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity >= 0),
  acquired_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX idx_inventory_user
  ON public.inventory (user_id);

COMMENT ON TABLE public.inventory IS 'Kullanıcı envanteri — temalar ve güçlendirmeler';
