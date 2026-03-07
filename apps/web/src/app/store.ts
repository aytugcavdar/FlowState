// ============================================================
// Redux Store — Uygulama düzeyinde state yönetimi
// Oyun durumu (game state) Zustand'da, uygulama durumu burada.
// ============================================================

import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ─── Progression Slice (İlerleme) ───────────────────────────

interface ProgressionState {
  xp: number;
  level: number;
  coins: number;
  streakCurrent: number;
  streakBest: number;
  puzzlesSolved: number;
}

const initialProgression: ProgressionState = {
  xp: 0,
  level: 1,
  coins: 0,
  streakCurrent: 0,
  streakBest: 0,
  puzzlesSolved: 0,
};

/** XP eşik hesaplama: XP_for_level(n) = 100 × n^1.5 */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

const progressionSlice = createSlice({
  name: 'progression',
  initialState: initialProgression,
  reducers: {
    /** XP ekle ve gerekirse seviye atla */
    addXP(state, action: PayloadAction<number>) {
      state.xp += action.payload;
      // Seviye atlama kontrolü
      while (state.xp >= xpForLevel(state.level)) {
        state.level++;
        // Seviye atlama bonusu
        state.coins += state.level * 10;
      }
    },
    /** Coin ekle */
    addCoins(state, action: PayloadAction<number>) {
      state.coins += action.payload;
    },
    /** Coin harca */
    spendCoins(state, action: PayloadAction<number>) {
      state.coins = Math.max(0, state.coins - action.payload);
    },
    /** Puzzle çözümünü kaydet */
    recordSolve(state) {
      state.puzzlesSolved++;
    },
    /** Seri güncelle */
    updateStreak(state, action: PayloadAction<{ current: number; best: number }>) {
      state.streakCurrent = action.payload.current;
      state.streakBest = Math.max(state.streakBest, action.payload.best);
    },
  },
});

// ─── Settings Slice (Ayarlar) ───────────────────────────────

interface SettingsState {
  theme: string;
  soundEnabled: boolean;
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    theme: 'cyberpunk',
    soundEnabled: true,
  } as SettingsState,
  reducers: {
    setTheme(state, action: PayloadAction<string>) {
      state.theme = action.payload;
    },
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
    },
  },
});

// ─── Store ──────────────────────────────────────────────────

export const store = configureStore({
  reducer: {
    progression: progressionSlice.reducer,
    settings: settingsSlice.reducer,
  },
});

// Dışa aktarımlar
export const { addXP, addCoins, spendCoins, recordSolve, updateStreak } = progressionSlice.actions;
export const { setTheme, toggleSound } = settingsSlice.actions;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
