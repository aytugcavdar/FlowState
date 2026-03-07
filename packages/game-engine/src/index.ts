// ============================================================
// FlowState Game Engine — Public API
// Dışarıdan sadece bu dosya üzerinden erişim sağlanır.
// React veya herhangi bir framework bağımlılığı YOKTUR.
// ============================================================

// ─── Board Modülü ───────────────────────────────────────────
export { Position } from './board/Position';
export { Tile } from './board/Tile';
export { Board } from './board/Board';
export type { SourceInfo, SinkInfo } from './board/Board';

// ─── Flow Modülü ────────────────────────────────────────────
export { FlowCalculator } from './flow/FlowCalculator';
export type { FlowResult, TileFlowInfo, CalculatedFlowPath } from './flow/FlowCalculator';
export { FlowValidator } from './flow/FlowValidator';
export type { ValidationResult, SinkStatus } from './flow/FlowValidator';
export { mixColors, isWhite, FLOW_COLORS } from './flow/FlowColor';

// ─── Solver Modülü ──────────────────────────────────────────
export { DifficultyEstimator } from './solver/DifficultyEstimator';

// ─── Generator Modülü ───────────────────────────────────────
export { LevelGenerator } from './generator/LevelGenerator';
export type { GeneratorConfig, GenerationStrategy } from './generator/LevelGenerator';

// ─── Campaign Modülü ─────────────────────────────────────────
export { CAMPAIGN_LEVELS } from './campaign/CampaignConfig';

// ─── Tutorial Modülü ─────────────────────────────────────────
export { TUTORIAL_LEVELS } from './generator/TutorialLevels';
