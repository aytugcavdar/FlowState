// ============================================================
// FlowColor — Renk sabitleri ve karıştırma kuralları
// Oyundaki akış renkleri ve birleşim mantığı.
// ============================================================

import type { FlowColor } from '@flowstate/shared-types';

/** Tüm geçerli akış renkleri */
export const FLOW_COLORS: FlowColor[] = ['cyan', 'magenta', 'yellow', 'white'];

/**
 * İki rengi karıştırma kuralları.
 * Gerçek renk karışımı: cyan+magenta=purple, cyan+yellow=green, magenta+yellow=orange
 */
const COLOR_MIX_MAP: Record<string, FlowColor> = {
  // İkili karışımlar — Gerçek renk teorisi
  'cyan+magenta':          'purple',
  'cyan+yellow':           'green',
  'magenta+yellow':        'orange',
  // Üçlü karışım
  'cyan+magenta+yellow':   'white',
  // Karışımlara beyaz eklenmesi
  'cyan+magenta+white':    'white',
  'cyan+white+yellow':     'white',
  'magenta+white+yellow':  'white',
  // İkincil renklerin karışımları
  'cyan+purple':           'white',
  'cyan+green':            'white',
  'cyan+orange':           'white',
  'magenta+purple':        'white',
  'magenta+green':         'white',
  'magenta+orange':        'white',
  'yellow+purple':         'white',
  'yellow+green':          'white',
  'yellow+orange':         'white',
  'green+orange':          'white',
  'green+purple':          'white',
  'orange+purple':         'white',
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
