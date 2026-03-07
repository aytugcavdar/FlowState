-- ============================================================
-- Migration 004: Row Level Security (RLS) Politikaları
-- Tüm kullanıcıya açık tablolarda RLS aktif.
-- ============================================================

-- ─── RLS Etkinleştirme ──────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ───────────────────────────────────────────────

-- Herkes profil okuyabilir (leaderboard için)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Kullanıcı sadece kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Kayıt olunca profil oluşturulabilir
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Puzzles ────────────────────────────────────────────────

-- Herkes bulmacaları okuyabilir
CREATE POLICY "puzzles_select_all" ON public.puzzles
  FOR SELECT USING (true);

-- Sadece service_role bulmaca ekleyebilir (Edge Function ile)
-- Normal kullanıcılar INSERT yapamaz

-- ─── Game Sessions ──────────────────────────────────────────

-- Kullanıcı sadece kendi oturumlarını okuyabilir
CREATE POLICY "sessions_select_own" ON public.game_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcı oturum oluşturabilir (sadece kendisi için)
CREATE POLICY "sessions_insert_own" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Güncelleme yok — tamamlama Edge Function üzerinden yapılır
-- Bu append-only pattern'ı zorlar

-- ─── User Progression ───────────────────────────────────────

-- Kullanıcı sadece kendi ilerlemesini okuyabilir
CREATE POLICY "progression_select_own" ON public.user_progression
  FOR SELECT USING (auth.uid() = user_id);

-- Güncelleme sadece Edge Function (service_role) üzerinden

-- ─── Achievements ───────────────────────────────────────────

-- Herkes başarım listesini okuyabilir
CREATE POLICY "achievements_select_all" ON public.achievements
  FOR SELECT USING (true);

-- ─── User Achievements ─────────────────────────────────────

-- Kullanıcı sadece kendi başarımlarını okuyabilir
CREATE POLICY "user_achievements_select_own" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- ─── User Missions ──────────────────────────────────────────

-- Kullanıcı sadece kendi görevlerini okuyabilir
CREATE POLICY "user_missions_select_own" ON public.user_missions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Transactions ───────────────────────────────────────────

-- Kullanıcı sadece kendi işlemlerini okuyabilir
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Güncelleme ve silme yok — append-only

-- ─── Inventory ──────────────────────────────────────────────

-- Kullanıcı sadece kendi envanterini okuyabilir
CREATE POLICY "inventory_select_own" ON public.inventory
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Mission Templates ─────────────────────────────────────

-- Herkes şablonları okuyabilir
CREATE POLICY "mission_templates_select_all" ON public.mission_templates
  FOR SELECT USING (true);
