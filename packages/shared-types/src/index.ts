// ============================================================
// FlowState — Shared Types Barrel Export
// Tüm paylaşılan tipler bu dosyadan dışa aktarılır.
// ============================================================

export type {
  TileType,
  Rotation,
  FlowColor,
  Direction,
  Position,
  TileConfig,
  PuzzleDefinition,
  Solution,
  FlowPath,
  BoardSnapshot,
  GameStatus,
  GameSession,
  GameCommand,
  CampaignLevel,
} from './game.types';

export type {
  UserProfile,
  UserProgression,
  Achievement,
  DailyMission,
  InventoryItem,
  PowerupType,
  ThemeId,
} from './user.types';

export type {
  CompletePuzzleRequest,
  CompletePuzzleResponse,
  MissionUpdate,
  DailyPuzzleResponse,
  ClaimMissionRequest,
  ClaimMissionResponse,
  OfflineSession,
  SyncRequest,
  SyncResponse,
  LeaderboardEntry,
  ApiErrorResponse,
  GameStoreState,
  ProgressionState,
} from './api.types';
