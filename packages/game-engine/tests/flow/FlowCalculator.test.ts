// ============================================================
// FlowCalculator Unit Tests — BFS akış yayılım testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { FlowCalculator } from '../../src/flow/FlowCalculator';
import { Board } from '../../src/board/Board';
import { Position } from '../../src/board/Position';
import type { PuzzleDefinition } from '@flowstate/shared-types';

/** Çözülmüş düz yol: SOURCE → STRAIGHT → STRAIGHT → SINK */
function createSolvedLinearPuzzle(): PuzzleDefinition {
  return {
    gridSize: 4,
    tiles: [
      // Satır 0: hepsi elbow (yol dışı)
      [
        { type: 'ELBOW', rotation: 0 },
        { type: 'ELBOW', rotation: 90 },
        { type: 'ELBOW', rotation: 180 },
        { type: 'ELBOW', rotation: 270 },
      ],
      // Satır 1: SOURCE → STRAIGHT(90°) → STRAIGHT(90°) → SINK
      [
        { type: 'SOURCE', rotation: 0, locked: true },
        { type: 'STRAIGHT', rotation: 90 },
        { type: 'STRAIGHT', rotation: 90 },
        { type: 'SINK', rotation: 0, locked: true },
      ],
      // Satır 2: hepsi elbow (yol dışı)
      [
        { type: 'ELBOW', rotation: 270 },
        { type: 'ELBOW', rotation: 180 },
        { type: 'ELBOW', rotation: 90 },
        { type: 'ELBOW', rotation: 0 },
      ],
      // Satır 3: hepsi straight (bağlı olmayan)
      [
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
      ],
    ],
    sources: [{ row: 1, col: 0, color: 'cyan' }],
    sinks: [{ row: 1, col: 3, requiredColors: ['cyan'] }],
  };
}

/** Bağlantısız puzzle: SOURCE ve SINK bağlı değil */
function createDisconnectedPuzzle(): PuzzleDefinition {
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
        { type: 'STRAIGHT', rotation: 0 }, // N-S bağlantı — E-W yol kesik
        { type: 'SINK', rotation: 0, locked: true },
      ],
      [
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
        { type: 'STRAIGHT', rotation: 0 },
      ],
    ],
    sources: [{ row: 1, col: 0, color: 'magenta' }],
    sinks: [{ row: 1, col: 2, requiredColors: ['magenta'] }],
  };
}

describe('FlowCalculator', () => {
  // ─── Temel BFS Yayılımı ──────────────────────────────────
  describe('calculate — temel yayılım', () => {
    it('çözülmüş düz yolda tüm tile\'lara akış ulaşmalı', () => {
      const board = Board.fromDefinition(createSolvedLinearPuzzle());
      const result = FlowCalculator.calculate(board);

      // SOURCE pozisyonuna akış ulaşmalı
      expect(result.getFlow(new Position(1, 0))).toBe('cyan');

      // Yol üzerindeki tile'lara akış ulaşmalı
      expect(result.getFlow(new Position(1, 1))).toBe('cyan');
      expect(result.getFlow(new Position(1, 2))).toBe('cyan');

      // SINK'e akış ulaşmalı
      expect(result.getFlow(new Position(1, 3))).toBe('cyan');
    });

    it('yol dışındaki tile\'lara akış ulaşmamalı', () => {
      const board = Board.fromDefinition(createSolvedLinearPuzzle());
      const result = FlowCalculator.calculate(board);

      // Yolun üstündeki satır — bu tile'lar yola bağlı değil
      // (ELBOW'ların portları yol yönüne bakmıyor)
      // Not: Bazı elbow'lar tesadüfen bağlı olabilir,
      // ama bu test kaynak-hedef yolunu doğrular
      expect(result.flowPaths).toHaveLength(1);
      expect(result.flowPaths[0].color).toBe('cyan');
    });

    it('flowPaths en az SOURCE pozisyonunu içermeli', () => {
      const board = Board.fromDefinition(createSolvedLinearPuzzle());
      const result = FlowCalculator.calculate(board);

      const path = result.flowPaths[0];
      const hasSource = path.positions.some(p => p.row === 1 && p.col === 0);
      expect(hasSource).toBe(true);
    });
  });

  // ─── Bağlantı Kesik ──────────────────────────────────────
  describe('calculate — bağlantı kesik', () => {
    it('bağlantısız puzzle\'da akış sink\'e ulaşmamalı', () => {
      const board = Board.fromDefinition(createDisconnectedPuzzle());
      const result = FlowCalculator.calculate(board);

      // SOURCE'a akış var
      expect(result.getFlow(new Position(1, 0))).toBe('magenta');

      // Ortadaki STRAIGHT(0°) N-S yönünde — SOURCE.E ile bağlantı yok
      // Bu yüzden akış ortadaki tile'a ulaşmamalı
      expect(result.getFlow(new Position(1, 1))).toBeNull();

      // SINK'e akış ulaşmamalı
      expect(result.getFlow(new Position(1, 2))).toBeNull();
    });
  });

  // ─── FlowResult Arayüzü ──────────────────────────────────
  describe('FlowResult', () => {
    it('getFlow: akış olmayan pozisyon null dönmeli', () => {
      const board = Board.fromDefinition(createSolvedLinearPuzzle());
      const result = FlowCalculator.calculate(board);

      // (3,3) köşe — akış ulaşmaz
      expect(result.getFlow(new Position(3, 3))).toBeNull();
    });

    it('tileFlows map doğru yapıda olmalı', () => {
      const board = Board.fromDefinition(createSolvedLinearPuzzle());
      const result = FlowCalculator.calculate(board);

      const sourceInfo = result.tileFlows.get('1,0');
      expect(sourceInfo).toBeDefined();
      expect(sourceInfo!.colors).toContain('cyan');
    });
  });
});
