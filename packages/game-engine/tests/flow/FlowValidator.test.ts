// ============================================================
// FlowValidator Unit Tests — Kazanma koşulu testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { FlowValidator } from '../../src/flow/FlowValidator';
import { Board } from '../../src/board/Board';
import type { PuzzleDefinition } from '@flowstate/shared-types';

/** Çözülmüş puzzle — akış SOURCE'dan SINK'e ulaşıyor */
function createSolvedPuzzle(): PuzzleDefinition {
  return {
    gridSize: 3,
    tiles: [
      [
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
      ],
      [
        { type: 'SOURCE', rotation: 0, locked: true },
        { type: 'STRAIGHT', rotation: 90 },
        { type: 'SINK', rotation: 0, locked: true },
      ],
      [
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
      ],
    ],
    sources: [{ row: 1, col: 0, color: 'cyan' }],
    sinks: [{ row: 1, col: 2, requiredColors: ['cyan'] }],
  };
}

/** Çözülmemiş puzzle — akış SINK'e ulaşmıyor */
function createUnsolvedPuzzle(): PuzzleDefinition {
  return {
    gridSize: 3,
    tiles: [
      [
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
      ],
      [
        { type: 'SOURCE', rotation: 0, locked: true },
        { type: 'STRAIGHT', rotation: 0 }, // N-S yönünde — yol kesik!
        { type: 'SINK', rotation: 0, locked: true },
      ],
      [
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
      ],
    ],
    sources: [{ row: 1, col: 0, color: 'cyan' }],
    sinks: [{ row: 1, col: 2, requiredColors: ['cyan'] }],
  };
}

describe('FlowValidator', () => {
  // ─── Çözülmüş Puzzle ─────────────────────────────────────
  describe('checkWin — çözülmüş', () => {
    it('tüm sink\'ler tatmin olunca solved=true', () => {
      const board = Board.fromDefinition(createSolvedPuzzle());
      const result = FlowValidator.checkWin(board);

      expect(result.solved).toBe(true);
      expect(result.satisfiedCount).toBe(1);
      expect(result.totalSinks).toBe(1);
    });

    it('sinkStatuses doğru yapıda olmalı', () => {
      const board = Board.fromDefinition(createSolvedPuzzle());
      const result = FlowValidator.checkWin(board);

      expect(result.sinkStatuses).toHaveLength(1);
      expect(result.sinkStatuses[0].satisfied).toBe(true);
      expect(result.sinkStatuses[0].requiredColors).toEqual(['cyan']);
      expect(result.sinkStatuses[0].receivedColors).toContain('cyan');
    });
  });

  // ─── Çözülmemiş Puzzle ────────────────────────────────────
  describe('checkWin — çözülmemiş', () => {
    it('sink tatmin olmayınca solved=false', () => {
      const board = Board.fromDefinition(createUnsolvedPuzzle());
      const result = FlowValidator.checkWin(board);

      expect(result.solved).toBe(false);
      expect(result.satisfiedCount).toBe(0);
    });

    it('sink gerekli rengi almadığında satisfied=false', () => {
      const board = Board.fromDefinition(createUnsolvedPuzzle());
      const result = FlowValidator.checkWin(board);

      const sinkStatus = result.sinkStatuses[0];
      expect(sinkStatus.satisfied).toBe(false);
    });
  });

  // ─── Boş Board ────────────────────────────────────────────
  describe('checkWin — boş board', () => {
    it('sink yoksa solved=false', () => {
      const board = Board.createEmpty(3);
      const result = FlowValidator.checkWin(board);

      expect(result.solved).toBe(false);
      expect(result.totalSinks).toBe(0);
    });
  });
});
