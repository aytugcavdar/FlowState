// ============================================================
// DifficultyEstimator — Zorluk seviyesi hesaplayıcı
// Bulmaca özelliklerinden 1–10 arası zorluk puanı üretir.
// ============================================================

import type { TileType, PuzzleDefinition } from '@flowstate/shared-types';
import { Board } from '../board/Board';
import { FlowCalculator } from '../flow/FlowCalculator';

/** Zorluk faktörlerinin ağırlıkları */
const WEIGHTS = {
  gridSize: 0.30,           // Izgara büyüklüğü — %30
  tileComplexity: 0.25,     // Tile türü karmaşıklığı — %25
  pathLength: 0.20,         // Çözüm yolu uzunluğu — %20
  deadEndCount: 0.15,       // Çıkmaz sayısı — %15
  uniqueness: 0.10,         // Çözüm tekliği sıkılığı — %10
} as const;

/** Her tile türünün karmaşıklık puanı (0–1) */
const TILE_COMPLEXITY: Record<TileType, number> = {
  SOURCE: 0,
  SINK: 0,
  STRAIGHT: 0.1,
  ELBOW: 0.2,
  T_JUNCTION: 0.4,
  CROSS: 0.5,
  GATE: 0.6,
  FILTER: 0.7,
  MIXER: 0.9,
  SPLITTER: 0.8,
  PORTAL: 0.8,
  ONE_WAY: 0.6,
};

/**
 * Zorluk seviyesi tahmincisi.
 * Dönüş değeri: 1 (çok kolay) – 10 (uzman).
 */
export class DifficultyEstimator {
  /**
   * PuzzleDefinition'dan zorluk puanı hesaplar.
   */
  static estimate(definition: PuzzleDefinition): number {
    const gridScore = DifficultyEstimator.scoreGridSize(definition.gridSize);
    const tileScore = DifficultyEstimator.scoreTileComplexity(definition);
    const pathScore = DifficultyEstimator.scorePathLength(definition);
    const deadEndScore = DifficultyEstimator.scoreDeadEnds(definition);
    const uniqueScore = 0.5; // v1.0'da sabit — solver yazılınca dinamik olacak

    const raw =
      gridScore * WEIGHTS.gridSize +
      tileScore * WEIGHTS.tileComplexity +
      pathScore * WEIGHTS.pathLength +
      deadEndScore * WEIGHTS.deadEndCount +
      uniqueScore * WEIGHTS.uniqueness;

    // 0–1 aralığını 1–10'a dönüştür
    return Math.max(1, Math.min(10, Math.round(raw * 9 + 1)));
  }

  /** Izgara büyüklüğü puanı (4×4=0.0, 9×9=1.0) */
  private static scoreGridSize(gridSize: number): number {
    return Math.max(0, Math.min(1, (gridSize - 4) / 5));
  }

  /** Tile türlerinin ortalama karmaşıklık puanı */
  private static scoreTileComplexity(def: PuzzleDefinition): number {
    let totalComplexity = 0;
    let count = 0;

    for (const row of def.tiles) {
      for (const tile of row) {
        totalComplexity += TILE_COMPLEXITY[tile.type];
        count++;
      }
    }

    return count > 0 ? totalComplexity / count : 0;
  }

  /** Çözüm yolu uzunluğu puanı (board'daki bağlantı yoğunluğuna dayalı) */
  private static scorePathLength(def: PuzzleDefinition): number {
    try {
      const board = Board.fromDefinition(def);
      const result = FlowCalculator.calculate(board);
      const totalPathLength = result.flowPaths.reduce(
        (sum, path) => sum + path.positions.length, 0
      );
      const maxPossible = def.gridSize * def.gridSize;
      return Math.min(1, totalPathLength / maxPossible);
    } catch {
      return 0.5; // Hesaplanamıyorsa orta değer
    }
  }

  /** Çıkmaz sayısı puanı */
  private static scoreDeadEnds(def: PuzzleDefinition): number {
    // Basit heuristik: source/sink olmayan, az bağlantılı tile oranı
    let deadEndLikeTiles = 0;
    let total = 0;

    for (const row of def.tiles) {
      for (const tile of row) {
        if (tile.type !== 'SOURCE' && tile.type !== 'SINK') {
          total++;
          if (tile.type === 'STRAIGHT' || tile.type === 'ELBOW') {
            deadEndLikeTiles++;
          }
        }
      }
    }

    return total > 0 ? deadEndLikeTiles / total : 0;
  }
}
