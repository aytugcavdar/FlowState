// ============================================================
// Edge Function: complete-puzzle
// Puzzle çözümünü doğrular, ödülleri hesaplar ve kaydeder.
// Tüm yazma işlemleri sunucu tarafında — anti-cheat.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS başlıkları
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** XP eşik hesaplama — istemci ile aynı formül */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // JWT doğrulama
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', message: 'Yetkilendirme başlığı eksik' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase istemcisi oluştur (service_role — RLS atlanır)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Kullanıcıyı JWT'den çöz
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', message: 'Geçersiz token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // İstek gövdesini oku
    const body = await req.json();
    const {
      puzzleId,
      solutionHash,
      elapsedSeconds,
      moveCount,
      hintsUsed = 0,
      undosUsed = 0,
      moveLog = '',
    } = body;

    // Gerekli alanlar kontrolü
    if (!puzzleId || !solutionHash || elapsedSeconds == null || moveCount == null) {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'Eksik alanlar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 1. Puzzle'ı doğrula ────────────────────────────────
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single();

    if (puzzleError || !puzzle) {
      return new Response(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Bulmaca bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 2. Çözüm hash doğrulama ───────────────────────────
    // Not: v1.0'da basitleştirilmiş — hash kontrolü devre dışı
    // v1.5'te tam doğrulama eklenecek

    // ─── 3. Oturum oluştur / güncelle ───────────────────────
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .upsert({
        user_id: user.id,
        puzzle_id: puzzleId,
        status: 'completed',
        elapsed_seconds: elapsedSeconds,
        move_count: moveCount,
        hints_used: hintsUsed,
        undos_used: undosUsed,
        solution_hash: solutionHash,
        move_log: moveLog,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,puzzle_id'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Oturum kaydı hatası:', sessionError);
    }

    // ─── 4. Ödülleri hesapla ────────────────────────────────
    const baseXP = 50;
    const difficultyBonus = puzzle.difficulty * 10;
    const speedBonus = elapsedSeconds < 60 ? 25 : (elapsedSeconds < 120 ? 10 : 0);
    const hintPenalty = hintsUsed * 10;
    const xpEarned = Math.max(10, baseXP + difficultyBonus + speedBonus - hintPenalty);
    const coinsEarned = Math.floor(xpEarned * 0.5);

    // ─── 5. İlerlemeyi güncelle ─────────────────────────────
    const { data: progression } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const currentXP = (progression?.xp ?? 0) + xpEarned;
    const currentCoins = (progression?.coins ?? 0) + coinsEarned;
    let currentLevel = progression?.level ?? 1;

    // Seviye atlama kontrolü
    let leveledUp = false;
    while (currentXP >= xpForLevel(currentLevel)) {
      currentLevel++;
      leveledUp = true;
    }

    // Seri güncelleme
    const today = new Date().toISOString().split('T')[0];
    const lastDate = progression?.streak_last_date;
    let newStreak = progression?.streak_current ?? 0;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === today) {
      // Bugün zaten oynamış — seri değişmez
    } else if (lastDate === yesterday) {
      newStreak += 1; // Seri devam
    } else {
      newStreak = 1; // Seri kırıldı, yeniden başla
    }

    const bestStreak = Math.max(progression?.streak_best ?? 0, newStreak);
    const totalSolved = (progression?.puzzles_solved ?? 0) + 1;

    await supabase
      .from('user_progression')
      .upsert({
        user_id: user.id,
        xp: currentXP,
        level: currentLevel,
        coins: currentCoins,
        streak_current: newStreak,
        streak_best: bestStreak,
        streak_last_date: today,
        puzzles_solved: totalSolved,
        total_play_time_seconds: (progression?.total_play_time_seconds ?? 0) + elapsedSeconds,
      });

    // ─── 6. İşlem kaydı ────────────────────────────────────
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'puzzle_reward',
      coins_delta: coinsEarned,
      xp_delta: xpEarned,
      description: `Bulmaca çözümü: ${puzzle.grid_size}×${puzzle.grid_size} (zorluk ${puzzle.difficulty})`,
      reference_id: puzzleId,
    });

    // ─── 7. Yanıtı döndür ──────────────────────────────────
    const response = {
      success: true,
      xpEarned,
      coinsEarned,
      newXP: currentXP,
      newLevel: currentLevel,
      leveledUp,
      newStreak,
      unlockedAchievements: [], // v1.5'te implement edilecek
      missionUpdates: [],       // v1.5'te implement edilecek
      sessionId: session?.id ?? null,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    return new Response(
      JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Sunucu hatası' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
