// ============================================================
// Position Unit Tests — Izgara pozisyonu testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { Position } from '../../src/board/Position';

describe('Position', () => {
  // ─── Eşitlik Kontrolü ────────────────────────────────────
  describe('equals', () => {
    it('aynı koordinatlar eşit olmalı', () => {
      const a = new Position(2, 3);
      const b = new Position(2, 3);
      expect(a.equals(b)).toBe(true);
    });

    it('farklı satır eşit olmamalı', () => {
      const a = new Position(1, 3);
      const b = new Position(2, 3);
      expect(a.equals(b)).toBe(false);
    });

    it('farklı sütun eşit olmamalı', () => {
      const a = new Position(2, 1);
      const b = new Position(2, 3);
      expect(a.equals(b)).toBe(false);
    });
  });

  // ─── Geçerlilik Kontrolü ─────────────────────────────────
  describe('isValid', () => {
    it('(0,0) 5×5 ızgarada geçerli', () => {
      expect(new Position(0, 0).isValid(5)).toBe(true);
    });

    it('(4,4) 5×5 ızgarada geçerli', () => {
      expect(new Position(4, 4).isValid(5)).toBe(true);
    });

    it('negatif satır geçersiz', () => {
      expect(new Position(-1, 0).isValid(5)).toBe(false);
    });

    it('ızgara dışı sütun geçersiz', () => {
      expect(new Position(0, 5).isValid(5)).toBe(false);
    });

    it('her iki koordinat da ızgara dışı geçersiz', () => {
      expect(new Position(5, 5).isValid(5)).toBe(false);
    });
  });

  // ─── Komşu Hesaplama ─────────────────────────────────────
  describe('neighbor', () => {
    const center = new Position(2, 2);

    it('kuzey komşu: satır -1', () => {
      const n = center.neighbor('N');
      expect(n.row).toBe(1);
      expect(n.col).toBe(2);
    });

    it('doğu komşu: sütun +1', () => {
      const n = center.neighbor('E');
      expect(n.row).toBe(2);
      expect(n.col).toBe(3);
    });

    it('güney komşu: satır +1', () => {
      const n = center.neighbor('S');
      expect(n.row).toBe(3);
      expect(n.col).toBe(2);
    });

    it('batı komşu: sütun -1', () => {
      const n = center.neighbor('W');
      expect(n.row).toBe(2);
      expect(n.col).toBe(1);
    });
  });

  // ─── Karşıt Yön ──────────────────────────────────────────
  describe('oppositeDirection', () => {
    it('N ↔ S', () => {
      expect(Position.oppositeDirection('N')).toBe('S');
      expect(Position.oppositeDirection('S')).toBe('N');
    });

    it('E ↔ W', () => {
      expect(Position.oppositeDirection('E')).toBe('W');
      expect(Position.oppositeDirection('W')).toBe('E');
    });
  });

  // ─── İndeks Dönüşümü ─────────────────────────────────────
  describe('toIndex / fromIndex', () => {
    it('(0,0) → index 0', () => {
      expect(new Position(0, 0).toIndex(5)).toBe(0);
    });

    it('(2,3) → index 13 (5×5 ızgara)', () => {
      expect(new Position(2, 3).toIndex(5)).toBe(13);
    });

    it('index 13 → (2,3) (5×5 ızgara)', () => {
      const pos = Position.fromIndex(13, 5);
      expect(pos.row).toBe(2);
      expect(pos.col).toBe(3);
    });

    it('gidiş-dönüş tutarlı olmalı', () => {
      const original = new Position(3, 4);
      const index = original.toIndex(7);
      const restored = Position.fromIndex(index, 7);
      expect(restored.equals(original)).toBe(true);
    });
  });

  // ─── toString ─────────────────────────────────────────────
  describe('toString', () => {
    it('okunabilir format', () => {
      expect(new Position(1, 2).toString()).toBe('(1, 2)');
    });
  });
});
