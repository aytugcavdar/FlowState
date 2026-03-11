// ============================================================
// FlowColor Unit Tests — Renk karıştırma testleri
// ============================================================

import { describe, it, expect } from 'vitest';
import { mixColors, isWhite, FLOW_COLORS } from '../../src/flow/FlowColor';

describe('FlowColor', () => {
  // ─── FLOW_COLORS ──────────────────────────────────────────
  describe('FLOW_COLORS', () => {
    it('4 renk tanımlı olmalı', () => {
      expect(FLOW_COLORS).toHaveLength(4);
      expect(FLOW_COLORS).toContain('cyan');
      expect(FLOW_COLORS).toContain('magenta');
      expect(FLOW_COLORS).toContain('yellow');
      expect(FLOW_COLORS).toContain('white');
    });
  });

  // ─── mixColors ────────────────────────────────────────────
  describe('mixColors', () => {
    it('boş dizi null döndürmeli', () => {
      expect(mixColors([])).toBeNull();
    });

    it('tek renk kendisini döndürmeli', () => {
      expect(mixColors(['cyan'])).toBe('cyan');
      expect(mixColors(['magenta'])).toBe('magenta');
    });

    it('aynı renkler karıştırılırsa değişmemeli', () => {
      expect(mixColors(['cyan', 'cyan'])).toBe('cyan');
    });

    it('cyan + magenta = purple', () => {
      expect(mixColors(['cyan', 'magenta'])).toBe('purple');
    });

    it('cyan + yellow = green', () => {
      expect(mixColors(['cyan', 'yellow'])).toBe('green');
    });

    it('magenta + yellow = orange', () => {
      expect(mixColors(['magenta', 'yellow'])).toBe('orange');
    });

    it('üç renk karışımı white', () => {
      expect(mixColors(['cyan', 'magenta', 'yellow'])).toBe('white');
    });
  });

  // ─── isWhite ──────────────────────────────────────────────
  describe('isWhite', () => {
    it('white için true', () => {
      expect(isWhite('white')).toBe(true);
    });

    it('diğer renkler için false', () => {
      expect(isWhite('cyan')).toBe(false);
      expect(isWhite('magenta')).toBe(false);
      expect(isWhite('yellow')).toBe(false);
    });
  });
});
