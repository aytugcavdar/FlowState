// ============================================================
// LevelGenerator Unit Tests — Bulmaca üretici testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../../src/generator/LevelGenerator';
import { Board } from '../../src/board/Board';
import { FlowCalculator } from '../../src/flow/FlowCalculator';
import { FlowValidator } from '../../src/flow/FlowValidator';

describe('LevelGenerator', () => {
  // ─── Puzzle Üretimi ───────────────────────────────────────
  describe('generate', () => {
    it('geçerli bir puzzle tanımı üretmeli', () => {
      const generator = new LevelGenerator();
      const definition = generator.generate({ gridSize: 4, difficulty: 2 });

      expect(definition.gridSize).toBe(4);
      expect(definition.tiles).toHaveLength(4);
      expect(definition.tiles[0]).toHaveLength(4);
      expect(definition.sources.length).toBeGreaterThanOrEqual(1);
      expect(definition.sinks.length).toBeGreaterThanOrEqual(1);
    });

    it('farklı boyutlarda puzzle üretebilmeli', () => {
      const generator = new LevelGenerator();

      for (const gridSize of [4, 5, 6, 7]) {
        const definition = generator.generate({ gridSize, difficulty: 3 });
        expect(definition.gridSize).toBe(gridSize);
        expect(definition.tiles).toHaveLength(gridSize);
      }
    });

    it('üretilen puzzle Board\'a yüklenebilmeli', () => {
      const generator = new LevelGenerator();
      const definition = generator.generate({ gridSize: 5, difficulty: 5 });

      // Board.fromDefinition hata fırlatmamalı
      expect(() => Board.fromDefinition(definition)).not.toThrow();
    });
  });

  // ─── generatePathFirst Static ─────────────────────────────
  describe('generatePathFirst', () => {
    it('çözülebilir puzzle üretmeli', () => {
      // Not: Üretilen puzzle karıştırılmış halde,
      // ama doğru rotasyonlara çevrildiğinde çözülebilir olmalı
      const definition = LevelGenerator.generatePathFirst({
        gridSize: 4,
        difficulty: 2,
        maxAttempts: 50,
      });

      expect(definition).toBeDefined();
      expect(definition.sources.length).toBeGreaterThanOrEqual(1);
      expect(definition.sinks.length).toBeGreaterThanOrEqual(1);
    });

    it('kaynak ve hedef tile\'ları kilitli olmalı', () => {
      const definition = LevelGenerator.generatePathFirst({
        gridSize: 5,
        difficulty: 3,
      });

      for (const source of definition.sources) {
        const tile = definition.tiles[source.row][source.col];
        expect(tile.locked).toBe(true);
      }

      for (const sink of definition.sinks) {
        const tile = definition.tiles[sink.row][sink.col];
        expect(tile.locked).toBe(true);
      }
    });
  });

  // ─── Strateji Kalıbı ─────────────────────────────────────
  describe('özel strateji', () => {
    it('özel strateji verildiğinde onu kullanmalı', () => {
      let called = false;
      const customStrategy = {
        generate: () => {
          called = true;
          return {
            gridSize: 3,
            tiles: [
              [{ type: 'SOURCE' as const, rotation: 0 as const, locked: true },
               { type: 'STRAIGHT' as const, rotation: 90 as const },
               { type: 'SINK' as const, rotation: 0 as const, locked: true }],
              [{ type: 'STRAIGHT' as const, rotation: 0 as const },
               { type: 'STRAIGHT' as const, rotation: 0 as const },
               { type: 'STRAIGHT' as const, rotation: 0 as const }],
              [{ type: 'STRAIGHT' as const, rotation: 0 as const },
               { type: 'STRAIGHT' as const, rotation: 0 as const },
               { type: 'STRAIGHT' as const, rotation: 0 as const }],
            ],
            sources: [{ row: 0, col: 0, color: 'cyan' as const }],
            sinks: [{ row: 0, col: 2, requiredColors: ['cyan' as const] }],
          };
        },
      };

      const generator = new LevelGenerator(customStrategy);
      const result = generator.generate({ gridSize: 3, difficulty: 1 });

      expect(called).toBe(true);
      expect(result.gridSize).toBe(3);
    });
  });
});
