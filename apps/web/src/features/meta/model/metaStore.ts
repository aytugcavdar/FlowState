import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp: number;
    coins: number;
    category: 'gameplay' | 'progression' | 'secret';
}

export const ACHIEVEMENTS_DEF: AchievementDef[] = [
    { id: 'first_solve', name: 'İlk Çözüm', description: 'İlk bulmacayı çöz', icon: '🎯', xp: 50, coins: 25, category: 'gameplay' },
    { id: 'speed_demon', name: 'Hız Canavarı', description: 'Bir bulmacayı 30 saniyede çöz', icon: '⚡', xp: 100, coins: 50, category: 'gameplay' },
    { id: 'no_hints', name: 'Yardımsız', description: 'İpucu kullanmadan çöz', icon: '🧠', xp: 75, coins: 30, category: 'gameplay' },
    { id: 'perfect_solve', name: 'Mükemmel Çözüm', description: 'Minimum hamleyle çöz', icon: '💎', xp: 150, coins: 75, category: 'gameplay' },
    { id: 'big_board', name: 'Büyük Düşün', description: '7×7 veya üzeri çöz', icon: '🗺️', xp: 100, coins: 50, category: 'gameplay' },
    { id: 'level_5', name: 'Çırak', description: 'Kampanya Seviye 5\'e ulaş', icon: '📗', xp: 100, coins: 50, category: 'progression' },
    { id: 'level_10', name: 'Uzman', description: 'Kampanya Seviye 10\'a ulaş', icon: '📘', xp: 200, coins: 100, category: 'progression' },
    { id: 'puzzles_10', name: 'Bulmaca Avcısı', description: '10 bulmaca çöz', icon: '🏅', xp: 100, coins: 50, category: 'progression' },
    { id: 'puzzles_50', name: 'Bulmaca Uzmanı', description: '50 bulmaca çöz', icon: '🏆', xp: 300, coins: 150, category: 'progression' },
    { id: 'streak_3', name: 'Üç Gün Üst Üste', description: '3 günlük seri yap', icon: '🔥', xp: 75, coins: 30, category: 'progression' },
    { id: 'night_owl', name: 'Gece Kuşu', description: 'Gece yarısından sonra çöz', icon: '🦉', xp: 50, coins: 25, category: 'secret' },
];

export interface MetaStats {
    totalSolved: number;
    perfectSolves: number;
    puzzlesWithoutHints: number;
    fastestSolveSeconds: number;
    highestGridSize: number;
    highestCampaignLevel: number;
    currentStreak: number;
    lastSolveDate: string | null;
}

export interface MetaStoreState {
    unlockedAchievements: string[];
    xp: number;
    stats: MetaStats;

    // Actions
    recordSolve: (params: { seconds: number, usedHints: boolean, isPerfect: boolean, gridSize: number, campaignLevelId?: number }) => void;
    checkAchievements: () => string[]; // Returns newly unlocked achievement IDs
}

const INITIAL_STATS: MetaStats = {
    totalSolved: 0,
    perfectSolves: 0,
    puzzlesWithoutHints: 0,
    fastestSolveSeconds: 9999,
    highestGridSize: 0,
    highestCampaignLevel: 1,
    currentStreak: 0,
    lastSolveDate: null,
};

export const useMetaStore = create<MetaStoreState>()(
    persist(
        (set, get) => ({
            unlockedAchievements: [],
            xp: 0,
            stats: INITIAL_STATS,

            recordSolve: ({ seconds, usedHints, isPerfect, gridSize, campaignLevelId }) => {
                const today = new Date().toDateString();
                set((state) => {
                    const stats = { ...state.stats };
                    
                    stats.totalSolved += 1;
                    if (isPerfect) stats.perfectSolves += 1;
                    if (!usedHints) stats.puzzlesWithoutHints += 1;
                    if (seconds < stats.fastestSolveSeconds) stats.fastestSolveSeconds = seconds;
                    if (gridSize > stats.highestGridSize) stats.highestGridSize = gridSize;
                    if (campaignLevelId && campaignLevelId > stats.highestCampaignLevel) {
                        stats.highestCampaignLevel = campaignLevelId;
                    }

                    // Streak calculation
                    if (stats.lastSolveDate !== today) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        if (stats.lastSolveDate === yesterday.toDateString()) {
                            stats.currentStreak += 1;
                        } else {
                            stats.currentStreak = 1;
                        }
                        stats.lastSolveDate = today;
                    }

                    return { stats };
                });
                
                // Then immediately check for achievements
                get().checkAchievements();
            },

            checkAchievements: () => {
                const { stats, unlockedAchievements } = get();
                const newlyUnlocked: string[] = [];
                let gainedXp = 0;
                let gainedCoins = 0;

                const checkAndUnlock = (id: string, condition: boolean) => {
                    if (condition && !unlockedAchievements.includes(id)) {
                        newlyUnlocked.push(id);
                        const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
                        if (def) {
                            gainedXp += def.xp;
                            gainedCoins += def.coins;
                        }
                    }
                };

                // Evaluate conditions
                checkAndUnlock('first_solve', stats.totalSolved >= 1);
                checkAndUnlock('perfect_solve', stats.perfectSolves >= 1);
                checkAndUnlock('puzzles_10', stats.totalSolved >= 10);
                checkAndUnlock('puzzles_50', stats.totalSolved >= 50);
                checkAndUnlock('speed_demon', stats.fastestSolveSeconds <= 30);
                checkAndUnlock('no_hints', stats.puzzlesWithoutHints >= 1);
                checkAndUnlock('big_board', stats.highestGridSize >= 7);
                checkAndUnlock('level_5', stats.highestCampaignLevel >= 5);
                checkAndUnlock('level_10', stats.highestCampaignLevel >= 10);
                checkAndUnlock('streak_3', stats.currentStreak >= 3);
                
                const hour = new Date().getHours();
                checkAndUnlock('night_owl', hour >= 0 && hour < 4);

                if (newlyUnlocked.length > 0) {
                    set(state => ({
                        unlockedAchievements: [...state.unlockedAchievements, ...newlyUnlocked],
                        xp: state.xp + gainedXp
                    }));

                    // We also need to add coins to gameStore, which we can do by importing it later or dispatching an event
                    // For now, doing it via a custom event or letting gameStore subscribe to metaStore.
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('achievements-unlocked', { 
                            detail: { newlyUnlocked, gainedCoins } 
                        }));
                    }
                }

                return newlyUnlocked;
            }
        }),
        {
            name: 'flowstate-meta-storage',
        }
    )
);
