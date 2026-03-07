// ============================================================
// Tile — Tile modeli ve bağlantı port hesaplamaları
// Her tile'ın rotasyonuna göre açık portlarını belirler.
// ============================================================

import type { TileType, Rotation, Direction, FlowColor } from '@flowstate/shared-types';

/**
 * Her tile tipinin 0° rotasyondaki açık portları.
 * Rotasyon uygulandığında bu portlar saat yönünde döner.
 */
const TILE_CONNECTIONS: Record<TileType, Direction[]> = {
  SOURCE:     ['E'],           // Tek çıkış — sağa
  SINK:       ['W'],           // Tek giriş — soldan
  STRAIGHT:   ['N', 'S'],      // Üst ve alt
  ELBOW:      ['N', 'E'],      // Üst ve sağ (90° dönüş)
  T_JUNCTION: ['N', 'E', 'S'], // Üst, sağ, alt
  CROSS:      ['N', 'E', 'S', 'W'], // Dört yön
  GATE:       ['N', 'S'],      // Düz gibi ama durumu var
  FILTER:     ['N', 'S'],      // Düz gibi ama renk filtreler
  MIXER:      ['W', 'E', 'S'], // İki giriş (sol, sağ), bir çıkış (alt)
  SPLITTER:   ['N', 'E', 'W'], // Bir giriş (üst), iki çıkış (sağ, sol)
  PORTAL:     ['N', 'E', 'S', 'W'], // Dört yönden de akış alabilir
  ONE_WAY:    ['N', 'S'],      // Düz boru gibi (S=Giriş, N=Çıkış varsayımı)
};

/** Yön rotasyonu tablosu — her 90° saat yönünde döner */
const ROTATION_MAP: Record<Direction, Direction> = {
  'N': 'E', 'E': 'S', 'S': 'W', 'W': 'N',
};

/**
 * Bir yönü belirtilen derece kadar saat yönünde döndürür.
 * Örnek: 'N' + 90° = 'E', 'N' + 180° = 'S'
 */
function rotateDirection(dir: Direction, rotation: Rotation): Direction {
  let current = dir;
  const steps = rotation / 90;
  for (let i = 0; i < steps; i++) {
    current = ROTATION_MAP[current];
  }
  return current;
}

/** Tile modeli — tip, rotasyon ve port hesaplamaları */
export class Tile {
  constructor(
    public readonly type: TileType,
    public readonly rotation: Rotation = 0,
    public readonly locked: boolean = false,
    public readonly filterColor?: FlowColor,
    public readonly gateOpen: boolean = true,
    public readonly solutionRotation?: Rotation,
    public readonly isHinted: boolean = false,
    public readonly portalId?: number,
  ) {}

  /**
   * Bu tile'ın mevcut rotasyonundaki açık portlarını döndürür.
   * Örnek: ELBOW 90° → ['E', 'S'] (normalde ['N', 'E'])
   */
  getOpenPorts(): Direction[] {
    const basePorts = TILE_CONNECTIONS[this.type];
    return basePorts.map(dir => rotateDirection(dir, this.rotation));
  }

  /**
   * Belirtilen yönde açık bir portu olup olmadığını kontrol eder.
   */
  hasPort(direction: Direction): boolean {
    return this.getOpenPorts().includes(direction);
  }

  /**
   * Tile'ı 90° saat yönünde döndürür. Yeni bir Tile nesnesi döndürür.
   * Kilitli tile'lar döndürülemez.
   */
  rotate(): Tile {
    if (this.locked) return this;
    const newRotation = ((this.rotation + 90) % 360) as Rotation;
    return new Tile(this.type, newRotation, this.locked, this.filterColor, this.gateOpen, this.solutionRotation, this.isHinted, this.portalId);
  }

  /** Sabit bir açıya kurmak ve kilitlemek için özel fonksiyon (Hint sistemi) */
  applyHint(): Tile {
    if (this.solutionRotation === undefined) return this;
    return new Tile(this.type, this.solutionRotation, true, this.filterColor, this.gateOpen, this.solutionRotation, true, this.portalId);
  }

  /** Source olup olmadığını kontrol eder */
  isSource(): boolean {
    return this.type === 'SOURCE';
  }

  /** Sink olup olmadığını kontrol eder */
  isSink(): boolean {
    return this.type === 'SINK';
  }

  /** Akış geçirebilir olup olmadığını kontrol eder */
  canPassFlow(color?: FlowColor): boolean {
    // Kapalı kapı akış geçirmez
    if (this.type === 'GATE' && !this.gateOpen) return false;
    // Filtre sadece belirli rengi geçirir
    if (this.type === 'FILTER' && color && this.filterColor && color !== this.filterColor) {
      return false;
    }
    return true;
  }

  /** Serileştirme */
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      rotation: this.rotation,
      locked: this.locked,
      filterColor: this.filterColor,
      gateOpen: this.gateOpen,
      solutionRotation: this.solutionRotation,
      isHinted: this.isHinted,
      portalId: this.portalId,
    });
  }

  /** Tile yapılandırmasından oluşturur */
  static fromConfig(config: { type: TileType; rotation: Rotation; locked?: boolean; filterColor?: FlowColor; solutionRotation?: Rotation; isHinted?: boolean; portalId?: number }): Tile {
    return new Tile(
      config.type,
      config.rotation,
      config.locked ?? (config.type === 'SOURCE' || config.type === 'SINK'),
      config.filterColor,
      true,
      config.solutionRotation,
      config.isHinted ?? false,
      config.portalId
    );
  }
}
