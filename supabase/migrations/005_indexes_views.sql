-- ============================================================
-- Migration 005: İndeksler ve Materialized View
-- Liderlik tablosu için materialized view + ek indeksler.
-- ============================================================

-- ─── Günlük Liderlik Tablosu (Materialized View) ───────────

CREATE MATERIALIZED VIEW public.daily_leaderboard AS
SELECT
  gs.puzzle_id,
  p.daily_date,
  gs.user_id,
  pr.username,
  pr.avatar_url,
  gs.elapsed_seconds,
  gs.move_count,
  gs.hints_used,
  gs.completed_at,
  RANK() OVER (
    PARTITION BY gs.puzzle_id
    ORDER BY gs.elapsed_seconds ASC, gs.move_count ASC
  ) AS rank
FROM public.game_sessions gs
JOIN public.puzzles p ON p.id = gs.puzzle_id
JOIN public.profiles pr ON pr.id = gs.user_id
WHERE gs.status = 'completed'
  AND p.is_daily = TRUE
ORDER BY p.daily_date DESC, rank ASC;

-- Hızlı arama indeksi
CREATE UNIQUE INDEX idx_daily_leaderboard_pk
  ON public.daily_leaderboard (puzzle_id, user_id);

CREATE INDEX idx_daily_leaderboard_date
  ON public.daily_leaderboard (daily_date DESC, rank ASC);

-- Materialized view'ı yenileme fonksiyonu
CREATE OR REPLACE FUNCTION public.refresh_daily_leaderboard()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON MATERIALIZED VIEW public.daily_leaderboard
  IS 'Günlük liderlik tablosu — her puzzle tamamlandığında yenilenir';

-- ─── Ek Performans İndeksleri ───────────────────────────────

-- Profil arama (login, kullanıcı bilgisi)
CREATE INDEX IF NOT EXISTS idx_profiles_created
  ON public.profiles (created_at DESC);

-- Aktif oturumlar (kullanıcının devam eden oyunları)
CREATE INDEX IF NOT EXISTS idx_game_sessions_active
  ON public.game_sessions (user_id, status)
  WHERE status = 'active';

-- İlerleme seviye bazlı (ör. seviyeye göre sıralama)
CREATE INDEX IF NOT EXISTS idx_progression_level
  ON public.user_progression (level DESC, xp DESC);
