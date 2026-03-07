// ============================================================
// FlowState — Kullanıcı Tipleri
// Profil, ilerleme, başarımlar ve envanter veri yapıları.
// ============================================================

/** Kullanıcı profili */
export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/** Kullanıcı ilerleme durumu */
export interface UserProgression {
  userId: string;
  xp: number;
  level: number;
  coins: number;
  streakCurrent: number;
  streakBest: number;
  streakLastDate: string | null; // YYYY-MM-DD formatı
  puzzlesSolved: number;
  updatedAt: Date;
}

/** Başarım tanımı */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  unlockedAt?: Date; // Kullanıcı açtıysa tarih
}

/** Günlük görev */
export interface DailyMission {
  id: string;
  missionDate: string;
  slot: 1 | 2 | 3;
  templateId: string;
  description: string;
  target: number;
  rewardCoins: number;
  rewardXP: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/** Envanter öğesi (tema veya güçlendirme) */
export interface InventoryItem {
  itemId: string;
  itemType: 'theme' | 'powerup';
  quantity: number;
  acquiredAt: Date;
}

/** Güçlendirme türleri */
export type PowerupType = 'hint' | 'undo_plus' | 'time_freeze' | 'reveal';

/** Tema tanımlayıcıları */
export type ThemeId =
  | 'cyberpunk'    // Varsayılan
  | 'matrix'
  | 'neon'
  | 'retro'
  | 'frostbyte'   // Kış etkinliği ödülü
  | 'sakura'      // Bahar etkinliği ödülü
  | 'solar'       // Yaz etkinliği ödülü
  | 'glitch';     // Sonbahar etkinliği ödülü
