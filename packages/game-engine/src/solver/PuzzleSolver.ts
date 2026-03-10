// ============================================================
// PuzzleSolver — Backtracking (DFS) çözücü
// Bulmacayı çözülüp çözülemeyeceğini doğrular.
// Tile rotasyonlarını tek tek deneyerek çözüm arar.
// LevelGenerator tarafından scramble sonrası doğrulama için kullanılır.
// ============================================================

import type { PuzzleDefinition } from '@flowstate/shared-types';
import { Board } from '../board/Board';
import { FlowCalculator } from '../flow/FlowCalculator';
import { FlowValidator } from '../flow/FlowValidator';

const ROTATIONS = [0, 90, 180, 270] as const;

/**
 * Bir bulmacayı backtracking DFS ile çöz.
 * Unlocked tile'ların rotasyonlarını sırayla deneyerek çözüm arar.
 * @param puzzle Çözülecek bulmaca
 * @param maxDepth Maksimum deneme derinliği (performans sınırı)
 * @returns Çözüm bulunduysa çözülmüş tanım, bulunamadıysa null
 */
export function solvePuzzle(puzzle: PuzzleDefinition, maxDepth = 5000): PuzzleDefinition | null {
  // Unlocked tile pozisyonlarını topla
  const unlocked: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < puzzle.gridSize; r++) {
    for (let c = 0; c < puzzle.gridSize; c++) {
      if (!puzzle.tiles[r][c].locked) {
        unlocked.push({ row: r, col: c });
      }
    }
  }

  // Mevcut tile grid'ini kopyala (mutasyon için)
  const currentTiles: number[] = unlocked.map(({ row, col }) => {
    const rot = puzzle.tiles[row][col].rotation as number;
    return ROTATIONS.indexOf(rot as any) === -1 ? 0 : ROTATIONS.indexOf(rot as any);
  });

  let callCount = 0;

  function buildAndCheck(): boolean {
    // Mevcut rotasyonları bulmacaya uygula
    const tiles = puzzle.tiles.map(row => row.map(t => ({ ...t })));
    for (let i = 0; i < unlocked.length; i++) {
      const { row, col } = unlocked[i];
      tiles[row][col] = { ...tiles[row][col], rotation: ROTATIONS[currentTiles[i]] };
    }
    const def: PuzzleDefinition = { ...puzzle, tiles };
    const board = Board.fromDefinition(def);
    const flowResult = FlowCalculator.calculate(board);
    const validation = FlowValidator.checkWin(board, flowResult);
    return validation.solved;
  }

  function dfs(index: number): PuzzleDefinition | null {
    callCount++;
    if (callCount > maxDepth) return null;

    if (index === unlocked.length) {
      if (buildAndCheck()) {
        // Çözüm: tile'ları oluştur
        const tiles = puzzle.tiles.map(row => row.map(t => ({ ...t })));
        for (let i = 0; i < unlocked.length; i++) {
          const { row, col } = unlocked[i];
          tiles[row][col] = { ...tiles[row][col], rotation: ROTATIONS[currentTiles[i]] };
        }
        return { ...puzzle, tiles };
      }
      return null;
    }

    for (let r = 0; r < 4; r++) {
      currentTiles[index] = r;
      const result = dfs(index + 1);
      if (result) return result;
    }

    return null;
  }

  return dfs(0);
}

/**
 * Verilen bulmacayı çözülüp çözülemeyeceğini hızla kontrol et.
 * Gerçek çözümü dönmez, sadece boolean.
 */
export function isSolvable(puzzle: PuzzleDefinition, maxDepth = 10000): boolean {
  return solvePuzzle(puzzle, maxDepth) !== null;
}
