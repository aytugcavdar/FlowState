// ============================================================
// Redux Store — Uygulama düzeyinde state yönetimi
// Oyun durumu (game state) Zustand'da, uygulama durumu burada.
// ============================================================

import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';


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
    settings: settingsSlice.reducer,
  },
});

// Dışa aktarımlar

export const { setTheme, toggleSound } = settingsSlice.actions;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
