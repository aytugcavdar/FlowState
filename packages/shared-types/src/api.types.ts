// ============================================================
// FlowState — API Tipleri
// İstemci-sunucu iletişim sözleşmeleri.
// Edge Function'lar ve client service layer bu tipleri paylaşır.
// ============================================================

import type { PuzzleDefinition, FlowColor } from './game.types';
import type { Achievement } from './user.types';

// ─── Puzzle Tamamlama ────────────────────────────────────────

/** Puzzle çözme isteği */
export interface CompletePuzzleRequest {
  puzzleId: string;
  solutionHash: string;       // SHA256(canonical çözüm JSON'ı)
  elapsedSeconds: number;
  moveCount: number;
  hintsUsed: number;
  undosUsed: number;
  moveLog: string;            // Seri hale getirilmiş Command[] (tekrar oynatma için)
  timePressureMode: boolean;
}

/** Puzzle çözme yanıtı — sunucu tarafında hesaplanan ödüller */
export interface CompletePuzzleResponse {
  success: boolean;
  xpEarned: number;
  coinsEarned: number;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
  unlockedAchievements: Achievement[];
  missionUpdates: MissionUpdate[];
  sessionId: string;
}

/** Görev güncelleme bilgisi */
export interface MissionUpdate {
  missionId: string;
  newProgress: number;
  completed: boolean;
}

// ─── Günlük Bulmaca ──────────────────────────────────────────

/** Günlük bulmaca yanıtı */
export interface DailyPuzzleResponse {
  id: string;
  dailyDate: string;          // YYYY-MM-DD
  gridSize: number;
  difficulty: number;
  definition: PuzzleDefinition;
  expiresAt: string;          // ISO zaman damgası
  userSession: {
    status: 'completed' | 'abandoned';
    elapsedSeconds: number;
    rank: number;
  } | null;                   // null = henüz oynanmadı
}

// ─── Görev Talep ─────────────────────────────────────────────

/** Görev ödülü talep isteği */
export interface ClaimMissionRequest {
  missionId: string;
}

/** Görev ödülü talep yanıtı */
export interface ClaimMissionResponse {
  success: boolean;
  coinsEarned: number;
  xpEarned: number;
  newBalance: number;
}

// ─── Çevrimdışı Senkronizasyon ───────────────────────────────

/** Çevrimdışı oturum verisi */
export interface OfflineSession {
  puzzleId: string;
  solutionHash: string;
  elapsedSeconds: number;
  moveCount: number;
  hintsUsed: number;
  completedAt: string;
}

/** Senkronizasyon isteği */
export interface SyncRequest {
  pendingSessions: OfflineSession[];
  lastSyncedAt: string;
}

/** Senkronizasyon yanıtı */
export interface SyncResponse {
  processed: number;
  xpEarned: number;
  coinsEarned: number;
  errors: Array<{ sessionIndex: number; reason: string }>;
}

// ─── Liderlik Tablosu ────────────────────────────────────────

/** Liderlik tablosu girişi */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  elapsedSeconds: number;
  moveCount: number;
  hintsUsed: number;
  completedAt: Date;
  isCurrentUser: boolean;
}

// ─── API Hata ────────────────────────────────────────────────

/** API hata yanıtı formatı */
export interface ApiErrorResponse {
  code: string;
  message: string;
  statusCode: number;
}

// ─── State Tipleri (referans) ────────────────────────────────

import type { TileConfig, FlowPath, GameStatus, BoardSnapshot } from './game.types';

/** Zustand oyun store şeması */
export interface GameStoreState {
  board: TileConfig[][];
  gridSize: number;
  activeFlows: Map<FlowColor, FlowPath>;
  completedFlows: Set<FlowColor>;
  moveCount: number;
  elapsedSeconds: number;
  status: GameStatus;
  hintsRemaining: number;
  undoStack: BoardSnapshot[];
  currentPuzzleId: string | null;
}

/** RTK ilerleme dilimi şeması */
export interface ProgressionState {
  xp: number;
  level: number;
  coins: number;
  streakCurrent: number;
  streakBest: number;
  streakLastDate: string | null;
  puzzlesSolved: number;
  status: 'idle' | 'loading' | 'error';
}
