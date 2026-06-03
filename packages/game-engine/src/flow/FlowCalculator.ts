// ============================================================
// FlowCalculator — BFS akış yayılım motoru
// Her kaynak tile'dan başlayarak bağlı tile'lar üzerinden
// akışı yayar. Board her değiştiğinde yeniden hesaplanır.
// ============================================================

import type { FlowColor, Direction } from '@flowstate/shared-types';
import { Board } from '../board/Board';
import { Position } from '../board/Position';
import { mixColors } from './FlowColor';

function rotateDir(dir: Direction, rotation: number): Direction {
  const map: Record<Direction, Direction> = { 'N': 'E', 'E': 'S', 'S': 'W', 'W': 'N' };
  let current = dir;
  for (let i = 0; i < rotation / 90; i++) current = map[current];
  return current;
}

/** Tek bir tile'daki akış bilgisi */
export interface TileFlowInfo {
  /** Bu tile'a ulaşan renk(ler) */
  colors: FlowColor[];
  /** Akışın geldiği yön */
  fromDirection: Direction | null;
}

/** Tek bir rengin izlediği yol */
export interface CalculatedFlowPath {
  color: FlowColor;
  positions: Position[];
  edges: { from: Position; to: Position }[];
}

/** FlowCalculator çıktısı */
export interface FlowResult {
  /** Tile pozisyonuna göre akış bilgisi (anahtar: "satır,sütun") */
  tileFlows: Map<string, TileFlowInfo>;
  /** Hesaplanan tüm akış yolları */
  flowPaths: CalculatedFlowPath[];
  /** Belirli bir pozisyondaki akış rengini döndürür */
  getFlow(pos: Position): FlowColor | null;
}

/**
 * BFS tabanlı akış hesaplayıcı.
 *
 * Algoritma:
 * 1. Her kaynak (SOURCE) tile'dan başla
 * 2. BFS ile bağlı tile'ları katman katman ziyaret et
 * 3. GATE (kapalı), FILTER (yanlış renk), ızgara kenarı → dur
 * 4. Sonucu FlowResult olarak döndür
 *
 * Performans hedefi: 9×9 board < 8ms
 */
export class FlowCalculator {
  /**
   * Board üzerindeki tüm akışları hesaplar.
   * Board'u değiştirmez (salt okunur).
   */
  static calculate(board: Board): FlowResult {
    const tileFlows = new Map<string, TileFlowInfo>();
    const flowPaths: CalculatedFlowPath[] = [];

    // edgeKey -> { from, to, color }
    const allEdges = new Map<string, { from: Position; to: Position; color: FlowColor }>();
    
    // Kuyruk tabanlı BFS — tüm kaynakları aynı anda başlat
    const queue: Array<{ pos: Position; color: FlowColor; fromPos: Position | null; fromDir: Direction | null }> = [];

    for (const source of board.getSources()) {
      queue.push({ pos: source.pos, color: source.color, fromPos: null, fromDir: null });
    }

    let head = 0;
    while (head < queue.length) {
      const { pos, color, fromPos, fromDir } = queue[head++];
      const key = `${pos.row},${pos.col}`;

      const tile = board.getTile(pos);
      if (!tile.canPassFlow(color)) continue;

      // ONE_WAY check: Only allow flow if it enters from the designated INPUT port (S at 0°)
      if (tile.type === 'ONE_WAY') {
        const inDir = rotateDir('S', tile.rotation);
        // If fromDir is null, it started here (it's a source? Source can't be one way but just in case)
        if (fromDir && fromDir !== inDir) continue;
      }

      let info = tileFlows.get(key);
      let isNewColor = false;
      let colorsAtTile = [color];

      if (!info) {
        info = { colors: [color], fromDirection: fromDir };
        tileFlows.set(key, info);
        isNewColor = true;
      } else {
        if (!info.colors.includes(color)) {
          info.colors.push(color);
          isNewColor = true;
        }
        colorsAtTile = [...info.colors];
      }

      // Edge kaydı
      if (fromPos) {
         const edgeKey = fromPos.row < pos.row || (fromPos.row === pos.row && fromPos.col < pos.col)
          ? `${fromPos.row},${fromPos.col}-${pos.row},${pos.col}`
          : `${pos.row},${pos.col}-${fromPos.row},${fromPos.col}`;
         
         // Sadece bu edge daha önce işlenmediyse VEYA color değiştiyse
         if (!allEdges.has(edgeKey)) {
             allEdges.set(edgeKey, { from: fromPos, to: pos, color });
         }
      }

      if (isNewColor) {
        let outColor = color;
        let shouldPropagate = true;

        // ─── Karıştırma mantığı (MIXER) ───────────────────
        if (tile.type === 'MIXER') {
           if (colorsAtTile.length >= 2) {
              // Gerçek renk karışımını hesapla
              const mixed = mixColors(colorsAtTile);
              outColor = mixed ?? 'white'; // Fallback to white if mix fails
              // İlk rengin propagasyonunu zaten yaptık, şimdi karışmış rengi yeniden ilet
              shouldPropagate = true;
           } else {
              // Henüz tek renk var, ilerisi ilk renk ile dolduruldu; bekle
              shouldPropagate = true;
           }
        }
        // CROSS tile'lar renk karıştırmaz, sadece geldiği yöne devam eder

        // Portal Teleportation
        if (tile.type === 'PORTAL') {
           const allTiles = board.getAllTiles();
           const pairedPortal = allTiles.find(t =>
               t.tile.type === 'PORTAL' &&
               t.tile.portalId === tile.portalId &&
               (t.pos.row !== pos.row || t.pos.col !== pos.col)
           );

           if (pairedPortal) {
               const edgeKey = `portal:${pos.row},${pos.col}-${pairedPortal.pos.row},${pairedPortal.pos.col}`;
               if (!allEdges.has(edgeKey)) {
                   allEdges.set(edgeKey, { from: pos, to: pairedPortal.pos, color: outColor });
               }

               queue.push({
                   pos: pairedPortal.pos,
                   color: outColor,
                   fromPos: pos,
                   fromDir: null,
               });
           }
        }

        if (shouldPropagate) {
          const neighbors = board.getConnectedNeighbors(pos);
          for (const { pos: neighborPos, direction } of neighbors) {
            if (fromPos && neighborPos.row === fromPos.row && neighborPos.col === fromPos.col) continue;

            // CROSS tile
            if (tile.type === 'CROSS' && fromDir) {
              const expectedOutDir = fromDir === 'N' ? 'S' : fromDir === 'S' ? 'N' : fromDir === 'E' ? 'W' : 'E';
              if (direction !== expectedOutDir) continue;
            }

            // ONE_WAY tile
            if (tile.type === 'ONE_WAY' && fromDir) {
              // fromDir is absolute relative to board. We need to check relative to tile rot.
              // ONE_WAY: ['N', 'S']. Let's assume input is S, output is N at rot 0.
              const absIn = rotateDir('S', tile.rotation);
              if (fromDir !== absIn) continue; // Flow can only enter from 'S' port
            }

            // SPLITTER tile
            if (tile.type === 'SPLITTER' && fromDir) {
              // SPLITTER: ['N', 'E', 'W']. Base (input) is N.
              const absInputPort = rotateDir('N', tile.rotation);
              if (fromDir !== absInputPort) {
                // Tried to enter from arms, block it!
                continue;
              }
              // If entered from base, it naturally goes to remaining open ports via getConnectedNeighbors.
            }

            queue.push({
              pos: neighborPos,
              color: outColor,
              fromPos: pos,
              fromDir: direction === 'N' ? 'S' : direction === 'S' ? 'N' : direction === 'E' ? 'W' : 'E',
            });
          }
        }
      }
    }

    // Gruplayarak flowPaths oluştur
    const colorGroups = new Map<FlowColor, { from: Position; to: Position }[]>();
    for (const edge of allEdges.values()) {
        if (!colorGroups.has(edge.color)) colorGroups.set(edge.color, []);
        colorGroups.get(edge.color)!.push({ from: edge.from, to: edge.to });
    }

    for (const [color, edges] of colorGroups.entries()) {
        const uniquePositions = new Map<string, Position>();
        for (const edge of edges) {
           uniquePositions.set(`${edge.from.row},${edge.from.col}`, edge.from);
           uniquePositions.set(`${edge.to.row},${edge.to.col}`, edge.to);
        }

        flowPaths.push({
           color,
           positions: Array.from(uniquePositions.values()),
           edges
        });
    }

    return {
      tileFlows,
      flowPaths,
      getFlow(pos: Position): FlowColor | null {
        const key = `${pos.row},${pos.col}`;
        const info = tileFlows.get(key);
        if (!info) return null;
        
        // MIXER tile'lar karişimi çizer. 
        // CROSS gibi diger tile'lar iki renk iceriyorsa görsel amacli en son rengi veya ozel bir renk cizebilir.
        // Aslinda UI'in bu bilgiyi daha iyi islemesi icin getFlow tek render dondurur.
        // MIXER disinda mixColors cagirmayalim ki CROSS tile mor çikmasin, en son giren renk ciksin.
        const tile = board.getTile(pos);
        if (info.colors.length > 1 && tile.type === 'MIXER') {
          const mixed = mixColors(info.colors);
          return mixed ?? info.colors[info.colors.length - 1];
        }
        return info.colors[info.colors.length - 1] ?? null;
      },
    };
  }
}
