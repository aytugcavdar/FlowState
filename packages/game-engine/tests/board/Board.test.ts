// ============================================================
// Board Unit Tests — Değişmez oyun tahtası testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { Board } from '../../src/board/Board';
import { Position } from '../../src/board/Position';
import { Tile } from '../../src/board/Tile';
import type { PuzzleDefinition } from '@flowstate/shared-types';

/** Test için basit 3×3 puzzle tanımı oluşturur */
function create3x3Puzzle(): PuzzleDefinition {
  return {
    gridSize: 3,
    tiles: [
      // Satır 0: Elbow, Straight, Elbow
      [
        { type: 'ELBOW', rotation: 0 },
        { type: 'STRAIGHT', rotation: 90 },
        { type: 'ELBOW', rotation: 90 },
      ],
      // Satır 1: SOURCE → Straight → SINK
      [
        { type: 'SOURCE', rotation: 0, locked: true },
        { type: 'STRAIGHT', rotation: 90 },
        { type: 'SINK', rotation: 0, locked: true },
      ],
      // Satır 2: Elbow, Straight, Elbow
      [
        { type: 'ELBOW', rotation: 270 },
        { type: 'STRAIGHT', rotation: 90 },
        { type: 'ELBOW', rotation: 180 },
      ],
    ],
    sources: [{ row: 1, col: 0, color: 'cyan' }],
    sinks: [{ row: 1, col: 2, requiredColors: ['cyan'] }],
  };
}

describe('Board', () => {
  // ─── fromDefinition ───────────────────────────────────────
  describe('fromDefinition', () => {
    it('PuzzleDefinition\'dan Board oluşturmalı', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      expect(board.gridSize).toBe(3);
    });

    it('kaynakları doğru yüklemeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const sources = board.getSources();
      expect(sources).toHaveLength(1);
      expect(sources[0].color).toBe('cyan');
      expect(sources[0].pos.row).toBe(1);
      expect(sources[0].pos.col).toBe(0);
    });

    it('hedefleri doğru yüklemeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const sinks = board.getSinks();
      expect(sinks).toHaveLength(1);
      expect(sinks[0].requiredColors).toEqual(['cyan']);
    });
  });

  // ─── getTile ──────────────────────────────────────────────
  describe('getTile', () => {
    it('belirtilen pozisyondaki tile\'ı döndürmeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const tile = board.getTile(new Position(1, 0));
      expect(tile.type).toBe('SOURCE');
      expect(tile.locked).toBe(true);
    });

    it('geçersiz pozisyon için hata fırlatmalı', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      expect(() => board.getTile(new Position(5, 0))).toThrow();
    });
  });

  // ─── getAllTiles ───────────────────────────────────────────
  describe('getAllTiles', () => {
    it('tüm tile\'ları düz dizi olarak döndürmeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const tiles = board.getAllTiles();
      expect(tiles).toHaveLength(9); // 3×3
    });
  });

  // ─── rotateTile (Immutable) ───────────────────────────────
  describe('rotateTile', () => {
    it('tile\'ı döndürmeli ve yeni Board döndürmeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const pos = new Position(0, 0); // ELBOW 0°
      const newBoard = board.rotateTile(pos);

      // Yeni board farklı referans olmalı
      expect(newBoard).not.toBe(board);

      // Yeni board'daki tile döndürülmüş olmalı
      expect(newBoard.getTile(pos).rotation).toBe(90);

      // Orijinal board değişmemiş olmalı
      expect(board.getTile(pos).rotation).toBe(0);
    });

    it('kilitli tile döndürülememeli — aynı Board dönmeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const sourcePos = new Position(1, 0); // SOURCE (kilitli)
      const result = board.rotateTile(sourcePos);

      expect(result).toBe(board); // Aynı referans
    });

    it('diğer tile\'lar etkilenmemeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const pos = new Position(0, 0);
      const newBoard = board.rotateTile(pos);

      // Döndürülmeyen tile değişmemeli
      const otherTile = newBoard.getTile(new Position(0, 1));
      expect(otherTile.rotation).toBe(90); // STRAIGHT 90° olarak kalmalı
    });
  });

  // ─── getConnectedNeighbors ────────────────────────────────
  describe('getConnectedNeighbors', () => {
    it('bağlı komşuları bulmalı', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      // SOURCE (1,0) E portuna sahip
      // STRAIGHT (1,1) 90° → E,W portlarına sahip
      // Bağlantı: SOURCE.E ↔ STRAIGHT.W
      const neighbors = board.getConnectedNeighbors(new Position(1, 0));
      expect(neighbors.length).toBeGreaterThanOrEqual(1);
      
      const eastNeighbor = neighbors.find(n => n.direction === 'E');
      expect(eastNeighbor).toBeDefined();
      expect(eastNeighbor!.pos.row).toBe(1);
      expect(eastNeighbor!.pos.col).toBe(1);
    });

    it('ızgara kenarında geçersiz komşu döndürmemeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      // (0,0) köşede — N ve W yönlerinde komşu yok
      const neighbors = board.getConnectedNeighbors(new Position(0, 0));
      const outOfBounds = neighbors.filter(
        n => !n.pos.isValid(board.gridSize)
      );
      expect(outOfBounds).toHaveLength(0);
    });
  });

  // ─── createEmpty ──────────────────────────────────────────
  describe('createEmpty', () => {
    it('boş board oluşturmalı', () => {
      const board = Board.createEmpty(4);
      expect(board.gridSize).toBe(4);
      expect(board.getSources()).toHaveLength(0);
      expect(board.getSinks()).toHaveLength(0);
      expect(board.getAllTiles()).toHaveLength(16); // 4×4
    });
  });

  // ─── Serileştirme ─────────────────────────────────────────
  describe('serialize / toTileConfigs', () => {
    it('board\'u TileConfig dizisine çevirmeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const configs = board.toTileConfigs();
      expect(configs).toHaveLength(3);
      expect(configs[0]).toHaveLength(3);
      expect(configs[1][0].type).toBe('SOURCE');
    });

    it('serialize JSON string döndürmeli', () => {
      const board = Board.fromDefinition(create3x3Puzzle());
      const json = board.serialize();
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});
