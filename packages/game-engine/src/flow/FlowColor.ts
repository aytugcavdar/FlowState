// ============================================================
// FlowColor — Renk sabitleri ve karıştırma kuralları
// Oyundaki akış renkleri ve birleşim mantığı.
// ============================================================

import type { FlowColor } from '@flowstate/shared-types';

/** Tüm geçerli akış renkleri */
export const FLOW_COLORS: FlowColor[] = ['cyan', 'magenta', 'yellow', 'white'];

/**
 * İki rengi karıştırma kuralları.
 * MVP'de tüm ikili karışımlar beyaz üretir.
 * v2.0'da kısmi karışım (cyan+magenta=blue vb.) eklenecek.
 */
const COLOR_MIX_MAP: Record<string, FlowColor> = {
  'cyan+magenta': 'white',
  'cyan+yellow': 'white',
  'magenta+yellow': 'white',
  'cyan+magenta+yellow': 'white',
};

/**
 * İki veya daha fazla rengi karıştırır.
 * Aynı renkler karıştırılırsa değişiklik olmaz.
 * @returns Karışım sonucu renk veya null (geçersiz karışım)
 */
export function mixColors(colors: FlowColor[]): FlowColor | null {
  if (colors.length === 0) return null;
  if (colors.length === 1) return colors[0];

  // Tekil renkleri çıkar ve sırala
  const unique = [...new Set(colors)].sort();
  if (unique.length === 1) return unique[0];

  const key = unique.join('+');
  return COLOR_MIX_MAP[key] ?? null;
}

/**
 * Renk zaten beyaz mı kontrol eder.
 * Beyaz = tüm renkler birleşti = potansiyel kazanma durumu.
 */
export function isWhite(color: FlowColor): boolean {
  return color === 'white';
}
