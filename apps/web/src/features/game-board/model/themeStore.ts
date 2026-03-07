import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'theme-cyberpunk' | 'theme-plumber' | 'theme-laser';

export interface ThemeStoreState {
    activeTheme: ThemeId;
    unlockedThemes: ThemeId[];
    
    setTheme: (theme: ThemeId) => void;
    unlockTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeStoreState>()(
    persist(
        (set) => ({
            activeTheme: 'theme-cyberpunk',
            unlockedThemes: ['theme-cyberpunk', 'theme-plumber', 'theme-laser'],
            
            setTheme: (theme) => set({ activeTheme: theme }),
            
            unlockTheme: (theme) => set((state) => {
                if (!state.unlockedThemes.includes(theme)) {
                    return { unlockedThemes: [...state.unlockedThemes, theme] };
                }
                return state;
            }),
        }),
        {
            name: 'flowstate-theme-storage',
        }
    )
);
