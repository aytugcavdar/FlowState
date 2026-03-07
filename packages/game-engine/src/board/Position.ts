// ============================================================
// Position — Izgara pozisyonu değer nesnesi
// Board üzerindeki (satır, sütun) koordinatını temsil eder.
// ============================================================

import type { Direction } from '@flowstate/shared-types';

/** Izgara pozisyonu */
export class Position {
  constructor(
    public readonly row: number,
    public readonly col: number,
  ) {}

  /** İki pozisyonun eşitliğini kontrol eder */
  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }

  /** Pozisyonun geçerli bir ızgara koordinatı olup olmadığını kontrol eder */
  isValid(gridSize: number): boolean {
    return (
      this.row >= 0 &&
      this.row < gridSize &&
      this.col >= 0 &&
      this.col < gridSize
    );
  }

  /** Belirtilen yöndeki komşu pozisyonu döndürür */
  neighbor(direction: Direction): Position {
    switch (direction) {
      case 'N': return new Position(this.row - 1, this.col);
      case 'E': return new Position(this.row, this.col + 1);
      case 'S': return new Position(this.row + 1, this.col);
      case 'W': return new Position(this.row, this.col - 1);
    }
  }

  /** Düz dizi indeksine çevirir */
  toIndex(gridSize: number): number {
    return this.row * gridSize + this.col;
  }

  /** Düz dizi indeksinden pozisyon oluşturur */
  static fromIndex(index: number, gridSize: number): Position {
    return new Position(Math.floor(index / gridSize), index % gridSize);
  }

  /** Karşıt yönü döndürür (N↔S, E↔W) */
  static oppositeDirection(dir: Direction): Direction {
    const map: Record<Direction, Direction> = {
      'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E',
    };
    return map[dir];
  }

  toString(): string {
    return `(${this.row}, ${this.col})`;
  }
}
