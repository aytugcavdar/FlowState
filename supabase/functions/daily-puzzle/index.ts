// ============================================================
// Edge Function: daily-puzzle
// Bugünkü günlük bulmacayı döndürür.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Bugünkü tarihi al
    const today = new Date().toISOString().split('T')[0];

    // Günlük bulmacayı sorgula
    const { data: puzzle, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('is_daily', true)
      .eq('daily_date', today)
      .single();

    if (error || !puzzle) {
      return new Response(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Bugünkü günlük bulmaca bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Kullanıcının bu puzzle'daki oturumunu kontrol et (varsa)
    let userSession = null;
    const authHeader = req.headers.get('Authorization');

    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();

      if (user) {
        const { data: session } = await supabase
          .from('game_sessions')
          .select('status, elapsed_seconds')
          .eq('user_id', user.id)
          .eq('puzzle_id', puzzle.id)
          .single();

        if (session) {
          // Sıralama hesapla
          const { count } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('puzzle_id', puzzle.id)
            .eq('status', 'completed')
            .lt('elapsed_seconds', session.elapsed_seconds);

          userSession = {
            status: session.status,
            elapsedSeconds: session.elapsed_seconds,
            rank: (count ?? 0) + 1,
          };
        }
      }
    }

    // Yarın gece yarısına kadar geçerli
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const response = {
      id: puzzle.id,
      dailyDate: puzzle.daily_date,
      gridSize: puzzle.grid_size,
      difficulty: puzzle.difficulty,
      definition: puzzle.definition,
      expiresAt: tomorrow.toISOString(),
      userSession,
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
