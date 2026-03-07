-- ============================================================
-- Seed Verileri — Geliştirme ortamı için örnek veri
-- ============================================================

-- ─── Başarımlar ─────────────────────────────────────────────

INSERT INTO public.achievements (id, name, description, icon, xp_reward, coin_reward, category, sort_order)
VALUES
  -- Oyun başarımları
  ('first_solve',    'İlk Çözüm',          'İlk bulmacayı çöz',                '🎯', 50,  25,  'gameplay', 1),
  ('speed_demon',    'Hız Canavarı',        'Bir bulmacayı 30 saniyede çöz',    '⚡', 100, 50,  'gameplay', 2),
  ('no_hints',       'Yardımsız',           'İpucu kullanmadan çöz',            '🧠', 75,  30,  'gameplay', 3),
  ('perfect_solve',  'Mükemmel Çözüm',      'Minimum hamleyle çöz',             '💎', 150, 75,  'gameplay', 4),
  ('big_board',      'Büyük Düşün',         '7×7 veya üzeri bir bulmacayı çöz', '🗺️', 100, 50, 'gameplay', 5),

  -- İlerleme başarımları
  ('level_5',        'Çırak',               'Seviye 5''e ulaş',                 '📗', 100, 50,  'progression', 10),
  ('level_10',       'Uzman',               'Seviye 10''a ulaş',                '📘', 200, 100, 'progression', 11),
  ('level_25',       'Usta',                'Seviye 25''e ulaş',                '📙', 500, 250, 'progression', 12),
  ('puzzles_10',     'Bulmaca Avcısı',      '10 bulmaca çöz',                   '🏅', 100, 50,  'progression', 13),
  ('puzzles_50',     'Bulmaca Uzmanı',      '50 bulmaca çöz',                   '🏆', 300, 150, 'progression', 14),
  ('puzzles_100',    'Bulmaca Efsanesi',    '100 bulmaca çöz',                  '👑', 500, 250, 'progression', 15),

  -- Seri başarımları
  ('streak_3',       'Üç Gün Üste',         '3 günlük seri yap',               '🔥', 75,  30,  'progression', 20),
  ('streak_7',       'Haftalık Seri',        '7 günlük seri yap',               '🔥', 150, 75,  'progression', 21),
  ('streak_30',      'Aylık Seri',           '30 günlük seri yap',              '🔥', 500, 250, 'progression', 22),

  -- Gizli başarımlar
  ('night_owl',      'Gece Kuşu',           'Gece yarısından sonra çöz',        '🦉', 50,  25,  'secret', 30),
  ('early_bird',     'Erken Kalkan',         'Sabah 6''dan önce çöz',           '🐦', 50,  25,  'secret', 31);

-- ─── Görev Şablonları ───────────────────────────────────────

INSERT INTO public.mission_templates (id, description, target, reward_coins, reward_xp, category)
VALUES
  ('solve_1',        'Bugün 1 bulmaca çöz',           1, 20,  30,  'solve'),
  ('solve_3',        'Bugün 3 bulmaca çöz',           3, 50,  75,  'solve'),
  ('solve_5',        'Bugün 5 bulmaca çöz',           5, 100, 150, 'solve'),
  ('speed_60',       '60 saniyede bir bulmaca çöz',   1, 40,  60,  'speed'),
  ('speed_45',       '45 saniyede bir bulmaca çöz',   1, 60,  90,  'speed'),
  ('no_hint_solve',  'İpucu kullanmadan 1 çöz',       1, 30,  45,  'misc'),
  ('daily_complete', 'Günlük bulmacayı tamamla',       1, 50,  75,  'solve');

-- ─── Örnek Bulmacalar ───────────────────────────────────────

INSERT INTO public.puzzles (id, grid_size, difficulty, definition, solution_hash, is_daily, daily_date)
VALUES
  -- Bugünkü günlük bulmaca (basit 4×4)
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    4, 2,
    '{
      "gridSize": 4,
      "tiles": [
        [{"type":"ELBOW","rotation":0},{"type":"STRAIGHT","rotation":90},{"type":"STRAIGHT","rotation":90},{"type":"ELBOW","rotation":90}],
        [{"type":"SOURCE","rotation":0,"locked":true},{"type":"STRAIGHT","rotation":90},{"type":"STRAIGHT","rotation":90},{"type":"SINK","rotation":0,"locked":true}],
        [{"type":"ELBOW","rotation":270},{"type":"STRAIGHT","rotation":90},{"type":"STRAIGHT","rotation":90},{"type":"ELBOW","rotation":180}],
        [{"type":"STRAIGHT","rotation":0},{"type":"ELBOW","rotation":0},{"type":"ELBOW","rotation":90},{"type":"STRAIGHT","rotation":0}]
      ],
      "sources": [{"row":1,"col":0,"color":"cyan"}],
      "sinks": [{"row":1,"col":3,"requiredColors":["cyan"]}]
    }'::JSONB,
    'sha256_placeholder_daily_001',
    TRUE,
    CURRENT_DATE
  ),
  -- Pratik bulmaca 5×5
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    5, 5,
    '{
      "gridSize": 5,
      "tiles": [
        [{"type":"ELBOW","rotation":0},{"type":"STRAIGHT","rotation":0},{"type":"ELBOW","rotation":90},{"type":"STRAIGHT","rotation":0},{"type":"ELBOW","rotation":90}],
        [{"type":"STRAIGHT","rotation":0},{"type":"T_JUNCTION","rotation":0},{"type":"STRAIGHT","rotation":90},{"type":"T_JUNCTION","rotation":180},{"type":"STRAIGHT","rotation":0}],
        [{"type":"SOURCE","rotation":0,"locked":true},{"type":"STRAIGHT","rotation":90},{"type":"CROSS","rotation":0},{"type":"STRAIGHT","rotation":90},{"type":"SINK","rotation":0,"locked":true}],
        [{"type":"STRAIGHT","rotation":0},{"type":"T_JUNCTION","rotation":270},{"type":"STRAIGHT","rotation":90},{"type":"T_JUNCTION","rotation":90},{"type":"STRAIGHT","rotation":0}],
        [{"type":"ELBOW","rotation":270},{"type":"STRAIGHT","rotation":0},{"type":"ELBOW","rotation":180},{"type":"STRAIGHT","rotation":0},{"type":"ELBOW","rotation":180}]
      ],
      "sources": [{"row":2,"col":0,"color":"magenta"}],
      "sinks": [{"row":2,"col":4,"requiredColors":["magenta"]}]
    }'::JSONB,
    'sha256_placeholder_practice_002',
    FALSE,
    NULL
  );
