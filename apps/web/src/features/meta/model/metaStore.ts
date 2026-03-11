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
    { id: 'level_5', name: 'Çırak', description: 'Yolculuk Bölüm 5\'e ulaş', icon: '📗', xp: 100, coins: 50, category: 'progression' },
    { id: 'level_10', name: 'Uzman', description: 'Yolculuk Bölüm 10\'a ulaş', icon: '📘', xp: 200, coins: 100, category: 'progression' },
    { id: 'puzzles_10', name: 'Bulmaca Avcısı', description: '10 bulmaca çöz', icon: '🏅', xp: 100, coins: 50, category: 'progression' },
    { id: 'puzzles_50', name: 'Bulmaca Uzmanı', description: '50 bulmaca çöz', icon: '🏆', xp: 300, coins: 150, category: 'progression' },
    { id: 'streak_3', name: 'Üç Gün Üst Üste', description: '3 günlük seri yap', icon: '🔥', xp: 75, coins: 30, category: 'progression' },
    { id: 'night_owl', name: 'Gece Kuşu', description: 'Gece yarısından sonra çöz', icon: '🦉', xp: 50, coins: 25, category: 'secret' },
];

export interface MetaStats {
    totalSolved: number;
    perfectSolves: number; // Mükemmel çözüm (sıfır geri alma vb. eklenebilir)
    puzzlesWithoutHints: number;
    highestGridSize: number;
    highestCampaignLevel: number;
    currentStreak: number;
    lastSolveDate: string | null;

    // Rekorlar: [mode: string] -> { bestTimeSec: number, bestMoves: number }
    // mode formatı: "daily", "practice-5x5", "practice-7x7" vs.
    records: Record<string, { bestTimeSec: number; bestMoves: number }>;
    
    // Gelişim grafiği: son 30 günün çözüm sayıları
    // Format: { "2026-03-11": 5, "2026-03-12": 3, ... }
    dailyProgress: Record<string, number>;
}

export interface MetaStoreState {
    unlockedAchievements: string[];
    xp: number;
    coins: number; // ← Coins artık burada (tek kaynak)
    stats: MetaStats;
    /** Günlük bulmacayı son tamamlama tarihi (YYYY-MM-DD) */
    lastDailyCompletedDate: string | null;
    /** Pratik modda son seçilen zorluk seviyesi */
    lastPracticeDifficulty: number;
    /** Haftalık challenge durumu */
    weeklyChallenge: {
        weekId: string; // "2026-W11" formatında
        progress: number; // 0-7 arası tamamlanan gün sayısı
        completed: boolean;
    } | null;

    // Actions
    addCoins: (amount: number) => void;
    spendCoins: (amount: number) => void;
    recordSolve: (params: { seconds: number, moves: number, usedHints: boolean, isPerfect: boolean, gridSize: number, campaignLevelId?: number, isDaily?: boolean }) => {
        isNewRecordTime: boolean;
        isNewRecordMoves: boolean;
        bestTimeSec: number;
        bestMoves: number;
    };
    checkAchievements: () => string[];
    markDailyCompleted: () => void;
    setLastPracticeDifficulty: (difficulty: number) => void;
    updateWeeklyChallenge: () => void;
}

const INITIAL_STATS: MetaStats = {
    totalSolved: 0,
    perfectSolves: 0,
    puzzlesWithoutHints: 0,
    highestGridSize: 0,
    highestCampaignLevel: 1,
    currentStreak: 0,
    lastSolveDate: null,
    records: {},
    dailyProgress: {},
};

/** Haftanın ID'sini hesapla (ISO 8601 hafta numarası) */
function getWeekId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

export const useMetaStore = create<MetaStoreState>()(
    persist(
        (set, get) => ({
        unlockedAchievements: [],
            xp: 0,
            coins: 100, // Başlangıç hediyesi
            stats: INITIAL_STATS,
            lastDailyCompletedDate: null,
            lastPracticeDifficulty: 3, // Varsayılan zorluk
            weeklyChallenge: null,

            addCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins + amount) })),
            spendCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins - amount) })),
            
            setLastPracticeDifficulty: (difficulty) => set({ lastPracticeDifficulty: difficulty }),

            updateWeeklyChallenge: () => {
                const currentWeekId = getWeekId();
                const today = new Date().toISOString().slice(0, 10);
                
                set((state) => {
                    const challenge = state.weeklyChallenge;
                    
                    // Yeni hafta başladıysa sıfırla
                    if (!challenge || challenge.weekId !== currentWeekId) {
                        return {
                            weeklyChallenge: {
                                weekId: currentWeekId,
                                progress: 1, // Bugün tamamlandı
                                completed: false,
                            }
                        };
                    }
                    
                    // Bugün zaten sayıldıysa (aynı gün birden fazla günlük tamamlama), artırma
                    if (state.lastDailyCompletedDate === today && challenge.progress > 0) {
                        return {}; // Değişiklik yok
                    }
                    
                    // Aynı haftadaysa progress artır
                    const newProgress = Math.min(7, challenge.progress + 1);
                    const isCompleted = newProgress >= 7;
                    
                    // 7 gün tamamlandıysa ödül ver
                    if (isCompleted && !challenge.completed) {
                        return {
                            weeklyChallenge: {
                                ...challenge,
                                progress: newProgress,
                                completed: true,
                            },
                            xp: state.xp + 500,
                            coins: state.coins + 250,
                        };
                    }
                    
                    return {
                        weeklyChallenge: {
                            ...challenge,
                            progress: newProgress,
                        }
                    };
                });
            },

            markDailyCompleted: () => {
                const today = new Date().toISOString().slice(0, 10);
                set({ lastDailyCompletedDate: today });
                // Günlük tamamlandığında haftalık challenge'ı güncelle
                get().updateWeeklyChallenge();
            },

            recordSolve: ({ seconds, moves, usedHints, isPerfect, gridSize, campaignLevelId, isDaily }) => {
                const today = new Date().toDateString();
                const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
                let result = { isNewRecordTime: false, isNewRecordMoves: false, bestTimeSec: seconds, bestMoves: moves };

                set((state) => {
                    const stats = { ...state.stats };
                    
                    stats.totalSolved += 1;
                    if (isPerfect) stats.perfectSolves += 1;
                    if (!usedHints) stats.puzzlesWithoutHints += 1;
                    if (gridSize > stats.highestGridSize) stats.highestGridSize = gridSize;
                    if (campaignLevelId && campaignLevelId > stats.highestCampaignLevel) {
                        stats.highestCampaignLevel = campaignLevelId;
                    }

                    // Günlük gelişim grafiği güncelle
                    if (!stats.dailyProgress) stats.dailyProgress = {};
                    stats.dailyProgress[todayISO] = (stats.dailyProgress[todayISO] || 0) + 1;
                    
                    // Son 30 günü tut, eskilerini sil
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const cutoffDate = thirtyDaysAgo.toISOString().slice(0, 10);
                    Object.keys(stats.dailyProgress).forEach(date => {
                        if (date < cutoffDate) delete stats.dailyProgress[date];
                    });

                    // Rekor hesaplama
                    const modeKey = isDaily ? 'daily' : (campaignLevelId ? `campaign-${campaignLevelId}` : `practice-${gridSize}x${gridSize}`);
                    if (!stats.records) stats.records = {};
                    
                    const prevRecord = stats.records[modeKey];
                    let newBestTime = seconds;
                    let newBestMoves = moves;

                    if (!prevRecord) {
                        result.isNewRecordTime = true;
                        result.isNewRecordMoves = true;
                        stats.records[modeKey] = { bestTimeSec: seconds, bestMoves: moves };
                    } else {
                        if (seconds < prevRecord.bestTimeSec) {
                            newBestTime = seconds;
                            result.isNewRecordTime = true;
                        } else {
                            newBestTime = prevRecord.bestTimeSec;
                        }

                        if (moves < prevRecord.bestMoves) {
                            newBestMoves = moves;
                            result.isNewRecordMoves = true;
                        } else {
                            newBestMoves = prevRecord.bestMoves;
                        }
                        
                        stats.records[modeKey] = { bestTimeSec: newBestTime, bestMoves: newBestMoves };
                    }
                    
                    result.bestTimeSec = newBestTime;
                    result.bestMoves = newBestMoves;

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

                return result;
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
                
                // Find the absolute fastest time across all records
                let absoluteBestTime = 9999;
                for (const modeKey in stats.records) {
                    const time = stats.records[modeKey].bestTimeSec;
                    if (time < absoluteBestTime) absoluteBestTime = time;
                }

                checkAndUnlock('first_solve', stats.totalSolved >= 1);
                checkAndUnlock('perfect_solve', stats.perfectSolves >= 1);
                checkAndUnlock('puzzles_10', stats.totalSolved >= 10);
                checkAndUnlock('puzzles_50', stats.totalSolved >= 50);
                checkAndUnlock('speed_demon', absoluteBestTime <= 30);
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
                        xp: state.xp + gainedXp,
                        coins: state.coins + gainedCoins, // Coins artık metaStore'da
                    }));

                    // Başarım kutlama eventi
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('achievements-unlocked', { 
                            detail: { achievements: newlyUnlocked, gainedXp, gainedCoins } 
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
