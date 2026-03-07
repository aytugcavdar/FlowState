// ============================================================
// Board — Değişmez (immutable) oyun tahtası
// Her işlem yeni bir Board nesnesi döndürür.
// Tile ızgarası, kaynak ve hedef yönetimi.
// ============================================================

import type {
  TileConfig,
  FlowColor,
  Direction,
  PuzzleDefinition,
} from '@flowstate/shared-types';
import { Position } from './Position';
import { Tile } from './Tile';

/** Source tile verisi */
export interface SourceInfo {
  pos: Position;
  color: FlowColor;
}

/** Sink tile verisi */
export interface SinkInfo {
  pos: Position;
  requiredColors: FlowColor[];
}

/** Değişmez oyun tahtası */
export class Board {
  public readonly gridSize: number;
  private readonly tiles: Tile[][];
  private readonly sources: SourceInfo[];
  private readonly sinks: SinkInfo[];

  constructor(config: {
    gridSize: number;
    tiles: Tile[][];
    sources: SourceInfo[];
    sinks: SinkInfo[];
  }) {
    this.gridSize = config.gridSize;
    this.tiles = config.tiles;
    this.sources = config.sources;
    this.sinks = config.sinks;
  }

  // ─── Okuma İşlemleri ──────────────────────────────────────

  /** Belirtilen pozisyondaki tile'ı döndürür */
  getTile(pos: Position): Tile {
    if (!pos.isValid(this.gridSize)) {
      throw new Error(`Geçersiz pozisyon: ${pos}`);
    }
    return this.tiles[pos.row][pos.col];
  }

  /** Tüm tile'ları düz dizi olarak döndürür */
  getAllTiles(): Array<{ pos: Position; tile: Tile }> {
    const result: Array<{ pos: Position; tile: Tile }> = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        result.push({ pos: new Position(row, col), tile: this.tiles[row][col] });
      }
    }
    return result;
  }

  /** Tüm kaynak tile'ları döndürür */
  getSources(): SourceInfo[] {
    return this.sources;
  }

  /** Tüm hedef tile'ları döndürür */
  getSinks(): SinkInfo[] {
    return this.sinks;
  }

  /**
   * Belirtilen pozisyondan bağlı komşuları döndürür.
   * İki tile bağlıdır = birinin portu diğerine bakıyor VE diğerinin de karşı portu açık.
   */
  getConnectedNeighbors(pos: Position): Array<{ pos: Position; direction: Direction }> {
    const tile = this.getTile(pos);
    const openPorts = tile.getOpenPorts();
    const neighbors: Array<{ pos: Position; direction: Direction }> = [];

    for (const dir of openPorts) {
      const neighborPos = pos.neighbor(dir);
      if (!neighborPos.isValid(this.gridSize)) continue;

      const neighborTile = this.getTile(neighborPos);
      const oppositeDir = Position.oppositeDirection(dir);

      // Karşı tile'ın da bu yönde portu açık mı?
      if (neighborTile.hasPort(oppositeDir)) {
        neighbors.push({ pos: neighborPos, direction: dir });
      }
    }

    return neighbors;
  }

  // ─── Yazma İşlemleri (Immutable) ──────────────────────────

  /**
   * Belirtilen pozisyondaki tile'ı 90° döndürür.
   * Yeni bir Board nesnesi döndürür — orijinal değişmez.
   */
  rotateTile(pos: Position): Board {
    const currentTile = this.getTile(pos);
    if (currentTile.locked) return this; // Kilitli tile döndürülemez

    const rotatedTile = currentTile.rotate();

    // Tile ızgarasının derin kopyasını oluştur
    const newTiles = this.tiles.map((row, rowIdx) =>
      row.map((tile, colIdx) =>
        rowIdx === pos.row && colIdx === pos.col ? rotatedTile : tile
      )
    );

    return new Board({
      gridSize: this.gridSize,
      tiles: newTiles,
      sources: this.sources,
      sinks: this.sinks,
    });
  }

  /**
   * İpucu uygula: Çözüme ulaşmamış rastgele bir tile'ı kilitleyerek doğru rotasyonuna getirir.
   */
  applyHint(): { board: Board; applied: boolean } {
    // Bulunabilir ipucu var mı?
    const possibleHints: Array<{ r: number; c: number; tile: Tile }> = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const t = this.tiles[r][c];
        // Kilitli olmayan, hint uygulanmamış ve yanlış açıda olanları bul
        if (!t.locked && !t.isHinted && t.solutionRotation !== undefined && t.rotation !== t.solutionRotation) {
           possibleHints.push({ r, c, tile: t });
        }
      }
    }
    
    if (possibleHints.length === 0) return { board: this, applied: false };
    
    // Rastgele seç
    const target = possibleHints[Math.floor(Math.random() * possibleHints.length)];
    const newTile = target.tile.applyHint();
    
    const newTiles = this.tiles.map((row, rowIdx) =>
      row.map((tile, colIdx) =>
        rowIdx === target.r && colIdx === target.c ? newTile : tile
      )
    );
    
    return {
      board: new Board({
        gridSize: this.gridSize,
        tiles: newTiles,
        sources: this.sources,
        sinks: this.sinks,
      }),
      applied: true
    };
  }

  // ─── Serileştirme ─────────────────────────────────────────

  /** Board'u TileConfig dizisine çevirir */
  toTileConfigs(): TileConfig[][] {
    return this.tiles.map(row =>
      row.map(tile => ({
        type: tile.type,
        rotation: tile.rotation,
        locked: tile.locked || undefined,
        filterColor: tile.filterColor,
        solutionRotation: tile.solutionRotation,
        isHinted: tile.isHinted,
      }))
    );
  }

  /** Board'un anlık durumunu string olarak serileştirir */
  serialize(): string {
    return JSON.stringify(this.toTileConfigs());
  }

  // ─── Fabrika Metotları ────────────────────────────────────

  /** PuzzleDefinition'dan Board oluşturur */
  static fromDefinition(def: PuzzleDefinition): Board {
    const tiles: Tile[][] = def.tiles.map(row =>
      row.map(config => Tile.fromConfig(config))
    );

    const sources: SourceInfo[] = def.sources.map(s => ({
      pos: new Position(s.row, s.col),
      color: s.color,
    }));

    const sinks: SinkInfo[] = def.sinks.map(s => ({
      pos: new Position(s.row, s.col),
      requiredColors: s.requiredColors,
    }));

    return new Board({ gridSize: def.gridSize, tiles, sources, sinks });
  }

  /** Boş bir board oluşturur (test için) */
  static createEmpty(gridSize: number): Board {
    const tiles: Tile[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => new Tile('STRAIGHT', 0))
    );
    return new Board({ gridSize, tiles, sources: [], sinks: [] });
  }
}
