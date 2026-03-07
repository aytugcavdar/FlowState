// ============================================================
// Tile Unit Tests — Tile modeli ve bağlantı port testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { Tile } from '../../src/board/Tile';

describe('Tile', () => {
  // ─── getOpenPorts — 0° Rotasyon ───────────────────────────
  describe('getOpenPorts (0° rotasyon)', () => {
    it('SOURCE: tek çıkış portu (E)', () => {
      const tile = new Tile('SOURCE', 0);
      expect(tile.getOpenPorts()).toEqual(['E']);
    });

    it('SINK: tek giriş portu (W)', () => {
      const tile = new Tile('SINK', 0);
      expect(tile.getOpenPorts()).toEqual(['W']);
    });

    it('STRAIGHT: karşılıklı portlar (N, S)', () => {
      const tile = new Tile('STRAIGHT', 0);
      expect(tile.getOpenPorts()).toEqual(['N', 'S']);
    });

    it('ELBOW: 90° dönüş portları (N, E)', () => {
      const tile = new Tile('ELBOW', 0);
      expect(tile.getOpenPorts()).toEqual(['N', 'E']);
    });

    it('T_JUNCTION: üç yönlü portlar (N, E, S)', () => {
      const tile = new Tile('T_JUNCTION', 0);
      expect(tile.getOpenPorts()).toEqual(['N', 'E', 'S']);
    });

    it('CROSS: dört yönlü portlar (N, E, S, W)', () => {
      const tile = new Tile('CROSS', 0);
      expect(tile.getOpenPorts()).toEqual(['N', 'E', 'S', 'W']);
    });
  });

  // ─── getOpenPorts — Rotasyonlu ────────────────────────────
  describe('getOpenPorts (rotasyonlu)', () => {
    it('STRAIGHT 90°: portlar E-W olmalı', () => {
      const tile = new Tile('STRAIGHT', 90);
      expect(tile.getOpenPorts()).toEqual(['E', 'W']);
    });

    it('ELBOW 90°: portlar E-S olmalı', () => {
      const tile = new Tile('ELBOW', 90);
      expect(tile.getOpenPorts()).toEqual(['E', 'S']);
    });

    it('ELBOW 180°: portlar S-W olmalı', () => {
      const tile = new Tile('ELBOW', 180);
      expect(tile.getOpenPorts()).toEqual(['S', 'W']);
    });

    it('ELBOW 270°: portlar W-N olmalı', () => {
      const tile = new Tile('ELBOW', 270);
      expect(tile.getOpenPorts()).toEqual(['W', 'N']);
    });

    it('SOURCE 90°: tek port S olmalı', () => {
      const tile = new Tile('SOURCE', 90);
      expect(tile.getOpenPorts()).toEqual(['S']);
    });

    it('SOURCE 180°: tek port W olmalı', () => {
      const tile = new Tile('SOURCE', 180);
      expect(tile.getOpenPorts()).toEqual(['W']);
    });
  });

  // ─── hasPort ──────────────────────────────────────────────
  describe('hasPort', () => {
    it('STRAIGHT 0° N portuna sahip', () => {
      const tile = new Tile('STRAIGHT', 0);
      expect(tile.hasPort('N')).toBe(true);
      expect(tile.hasPort('S')).toBe(true);
    });

    it('STRAIGHT 0° E portuna sahip değil', () => {
      const tile = new Tile('STRAIGHT', 0);
      expect(tile.hasPort('E')).toBe(false);
      expect(tile.hasPort('W')).toBe(false);
    });
  });

  // ─── rotate ───────────────────────────────────────────────
  describe('rotate', () => {
    it('0° → 90° döndürme', () => {
      const tile = new Tile('STRAIGHT', 0);
      const rotated = tile.rotate();
      expect(rotated.rotation).toBe(90);
    });

    it('270° → 0° döndürme (wraparound)', () => {
      const tile = new Tile('ELBOW', 270);
      const rotated = tile.rotate();
      expect(rotated.rotation).toBe(0);
    });

    it('döndürme yeni Tile nesnesi döndürmeli', () => {
      const tile = new Tile('STRAIGHT', 0);
      const rotated = tile.rotate();
      expect(rotated).not.toBe(tile);
      expect(tile.rotation).toBe(0); // Orijinal değişmemeli
    });

    it('kilitli tile döndürülememeli', () => {
      const tile = new Tile('SOURCE', 0, true);
      const result = tile.rotate();
      expect(result).toBe(tile); // Aynı referans
      expect(result.rotation).toBe(0);
    });
  });

  // ─── Yardımcı Metotlar ────────────────────────────────────
  describe('yardımcı metotlar', () => {
    it('isSource: SOURCE için true', () => {
      expect(new Tile('SOURCE').isSource()).toBe(true);
      expect(new Tile('STRAIGHT').isSource()).toBe(false);
    });

    it('isSink: SINK için true', () => {
      expect(new Tile('SINK').isSink()).toBe(true);
      expect(new Tile('ELBOW').isSink()).toBe(false);
    });

    it('canPassFlow: normal tile akış geçirebilir', () => {
      expect(new Tile('STRAIGHT').canPassFlow()).toBe(true);
    });

    it('canPassFlow: kapalı kapı akış geçiremez', () => {
      const gate = new Tile('GATE', 0, false, undefined, false);
      expect(gate.canPassFlow()).toBe(false);
    });

    it('canPassFlow: filtre doğru rengi geçirir', () => {
      const filter = new Tile('FILTER', 0, false, 'cyan');
      expect(filter.canPassFlow('cyan')).toBe(true);
    });

    it('canPassFlow: filtre yanlış rengi geçirmez', () => {
      const filter = new Tile('FILTER', 0, false, 'cyan');
      expect(filter.canPassFlow('magenta')).toBe(false);
    });
  });

  // ─── fromConfig ───────────────────────────────────────────
  describe('fromConfig', () => {
    it('TileConfig objesinden Tile oluşturmalı', () => {
      const tile = Tile.fromConfig({ type: 'ELBOW', rotation: 90 });
      expect(tile.type).toBe('ELBOW');
      expect(tile.rotation).toBe(90);
      expect(tile.locked).toBe(false);
    });

    it('SOURCE otomatik kilitlenmeli', () => {
      const tile = Tile.fromConfig({ type: 'SOURCE', rotation: 0 });
      expect(tile.locked).toBe(true);
    });

    it('SINK otomatik kilitlenmeli', () => {
      const tile = Tile.fromConfig({ type: 'SINK', rotation: 0 });
      expect(tile.locked).toBe(true);
    });
  });
});
