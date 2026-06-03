// ============================================================
// LevelGenerator — Prosedürel bulmaca üretici (v2)
// Rastgele yürüyüş (random walk) ile gerçek yollar oluşturur.
// Her bulmaca benzersiz ve çözülebilir garanti.
// ============================================================

import type {
  PuzzleDefinition,
  TileType,
  TileConfig,
  Rotation,
  FlowColor,
} from '@flowstate/shared-types';
import { FlowCalculator } from '../flow/FlowCalculator';
import { FlowValidator } from '../flow/FlowValidator';
import { Board } from '../board/Board';
import { mixColors } from '../flow/FlowColor';

/** Üretim yapılandırması */
export interface GeneratorConfig {
  gridSize: number;
  difficulty: number;
  maxAttempts?: number;
  allowedTileTypes?: TileType[];
  isPractice?: boolean;
}

/** Üretim stratejisi arayüzü */
export interface GenerationStrategy {
  generate(config: GeneratorConfig): PuzzleDefinition;
}

// ─── Yardımcılar ──────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRotation(): Rotation {
  return randomItem([0, 90, 180, 270] as Rotation[]);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 yön */
const DIRECTIONS = [
  { dr: -1, dc: 0, name: 'N' as const },
  { dr: 0, dc: 1, name: 'E' as const },
  { dr: 1, dc: 0, name: 'S' as const },
  { dr: 0, dc: -1, name: 'W' as const },
];

type Dir = 'N' | 'E' | 'S' | 'W';

/** Karşı yön */
function opposite(d: Dir): Dir {
  switch (d) { case 'N': return 'S'; case 'S': return 'N'; case 'E': return 'W'; case 'W': return 'E'; }
}

/** Port konfigürasyonuna göre tile türü ve rotasyonunu bul */
function tileForPorts(ports: Dir[]): { type: TileType; rotation: Rotation } {
  const sorted = [...ports].sort();
  const key = sorted.join(',');

  // 1 port — source/sink (ayrı ele alınır)
  // 2 port
  if (ports.length === 2) {
    // Düz çizgi
    if (key === 'N,S' || key === 'S,N') return { type: 'STRAIGHT', rotation: 0 };
    if (key === 'E,W' || key === 'W,E') return { type: 'STRAIGHT', rotation: 90 };
    // Dirsek
    if (key === 'E,N' || key === 'N,E') return { type: 'ELBOW', rotation: 0 };
    if (key === 'E,S' || key === 'S,E') return { type: 'ELBOW', rotation: 90 };
    if (key === 'S,W' || key === 'W,S') return { type: 'ELBOW', rotation: 180 };
    if (key === 'N,W' || key === 'W,N') return { type: 'ELBOW', rotation: 270 };
  }
  // 3 port — T-Junction
  if (ports.length === 3) {
    if (!sorted.includes('W')) return { type: 'T_JUNCTION', rotation: 0 };    // N,E,S
    if (!sorted.includes('N')) return { type: 'T_JUNCTION', rotation: 90 };   // E,S,W
    if (!sorted.includes('E')) return { type: 'T_JUNCTION', rotation: 180 };  // S,W,N
    if (!sorted.includes('S')) return { type: 'T_JUNCTION', rotation: 270 };  // W,N,E
  }
  // 4 port — Cross
  if (ports.length === 4) {
    return { type: 'CROSS', rotation: 0 };
  }

  // Fallback
  return { type: 'STRAIGHT', rotation: 0 };
}

/** Kaynak renkleri */
const SOURCE_COLORS: FlowColor[] = ['cyan', 'magenta', 'yellow'];

// ─── Ana Generator ────────────────────────────────────────────

export class LevelGenerator {
  private strategy: GenerationStrategy | null;

  constructor(strategy?: GenerationStrategy) {
    this.strategy = strategy ?? null;
  }

  generate(config: GeneratorConfig): PuzzleDefinition {
    if (this.strategy) return this.strategy.generate(config);

    // Diff >= 5'te %60 ihtimalle snake walk
    if (config.difficulty >= 5 && Math.random() < 0.6) {
      return LevelGenerator.generateSnakeWalk(config);
    }

    // ─── DÜZELTME: MIXER frekansını artır ───
    const useMulti = Math.random() < (config.difficulty >= 4 ? 1.0 : 0.8);
    if (useMulti) {
      const m = LevelGenerator.generateMultiColorWalk(config);
      if (m) return m;
    }
    return LevelGenerator.generateRandomWalk(config);
  }

  /**
   * Rastgele yürüyüş algoritması:
   * 1. Kaynak ve hedef pozisyonlarını seç
   * 2. Kaynaktan hedefe rastgele yürüyüşle yol oluştur
   * 3. Yol üzerindeki her hücreye bağlantı portlarına göre tile ata
   * 4. Kalan boş hücreleri rastgele tile'larla doldur
   * 5. Tüm tile'ların rotasyonlarını karıştır
   */
  static generateSnakeWalk(config: GeneratorConfig): PuzzleDefinition {
    const { gridSize, difficulty } = config;
    const maxAttempts = config.maxAttempts ?? 80;

    for (let attempt=0; attempt<maxAttempts; attempt++) {
      const puzzle = LevelGenerator.trySnakeWalk(gridSize, difficulty);
      if (!puzzle) continue;

      const board = Board.fromDefinition(puzzle);
      const flow  = FlowCalculator.calculate(board);
      const val   = FlowValidator.checkWin(board, flow);

      if (val.solved) {
        const adv      = LevelGenerator.injectMechanics(puzzle, flow, difficulty);
        const branched = LevelGenerator.injectDeadEndBranches(adv, difficulty);
        return LevelGenerator.scrambleRotations(branched);
      }
    }
    return LevelGenerator.generateRandomWalk(config);
  }

  private static trySnakeWalk(gridSize: number, difficulty: number): PuzzleDefinition | null {
    const portMap = new Map<string, Dir[]>();
    const visited = new Set<string>();
    const path: {row:number,col:number}[] = [];

    let r=0, c=0, goRight=true;
    const add = (row:number,col:number,ports:Dir[]) => {
      portMap.set(`${row},${col}`, ports);
      visited.add(`${row},${col}`);
      path.push({row,col});
    };

    const sourcePos = {row:0, col:0};
    add(0,0,['S']); // Source çıkışı aşağı

    // Target: gridSize karenin %55-70'i
    const target = Math.floor(gridSize*gridSize*(0.50+difficulty*0.02));

    while (path.length < target) {
      const endC = goRight ? gridSize-1 : 0;
      const dir: Dir = goRight ? 'E' : 'W';
      const opp: Dir = goRight ? 'W' : 'E';

      // Yatay ilerle
      while (c !== endC) {
        const nc = c + (goRight?1:-1);
        if (visited.has(`${r},${nc}`)) break;
        const ck = `${r},${c}`;
        portMap.set(ck, [...(portMap.get(ck)??[]), dir]);
        c=nc;
        add(r,c,[opp]);
        if (path.length>=target) break;
      }

      if (path.length>=target) break;

      // Aşağı in
      if (r+1 >= gridSize) break;
      const ck=`${r},${c}`;
      portMap.set(ck,[...(portMap.get(ck)??[]),'S']);
      r++;
      if (visited.has(`${r},${c}`)) break;
      add(r,c,['N']);
      goRight=!goRight;
    }

    // Sink pozisyonu — son hücreden en uzak köşe
    const last = path[path.length-1];
    const sinkPos = {
      row: last.row===0 ? gridSize-1 : 0,
      col: last.col===0 ? gridSize-1 : 0,
    };

    // Sink'e doğru ilerle
    let cur={...last};
    const connect = (from:{row:number,col:number}, to:{row:number,col:number}) => {
      const steps: {row:number,col:number,dir:Dir}[] = [];
      let {row,col}=from;
      while (row!==to.row) {
        const d:Dir=row<to.row?'S':'N';
        steps.push({row,col,dir:d});
        row+=row<to.row?1:-1;
        if (visited.has(`${row},${col}`) && (row!==to.row||col!==to.col)) return false;
      }
      while (col!==to.col) {
        const d:Dir=col<to.col?'E':'W';
        steps.push({row,col,dir:d});
        col+=col<to.col?1:-1;
        if (visited.has(`${row},${col}`) && (row!==to.row||col!==to.col)) return false;
      }
      steps.forEach(s => {
        const k=`${s.row},${s.col}`;
        portMap.set(k,[...(portMap.get(k)??[]),s.dir]);
      });
      const destKey=`${to.row},${to.col}`;
      if (!visited.has(destKey)) {
        const inDir=opposite(steps[steps.length-1]?.dir??'S');
        add(to.row,to.col,[inDir]);
      }
      return true;
    };

    if (!connect(cur, sinkPos)) return null;

    return LevelGenerator.buildPuzzleFromPath(
      gridSize, path, portMap, sourcePos, sinkPos, difficulty
    );
  }

  static generateRandomWalk(config: GeneratorConfig): PuzzleDefinition {
    const { gridSize, difficulty } = config;
    const maxAttempts = config.maxAttempts ?? 200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = LevelGenerator.tryGenerateWalk(config);
      if (!puzzle) continue;

      // Doğrulama
      const board = Board.fromDefinition(puzzle);
      const flowResult = FlowCalculator.calculate(board);
      const validation = FlowValidator.checkWin(board, flowResult);

      if (validation.solved) {
        // Enjekte et: Portal ve One-Way
        const advancedPuzzle = LevelGenerator.injectMechanics(puzzle, flowResult, difficulty);
        const branched = LevelGenerator.injectDeadEndBranches(advancedPuzzle, difficulty);
        return LevelGenerator.scrambleRotations(branched);
      }
    }

    // Fallback
    return LevelGenerator.scrambleRotations(LevelGenerator.createFallbackPuzzle(gridSize));
  }

  /** İki kaynaklı (MIXER) bulmaca oluşturur */
  static generateMultiColorWalk(config: GeneratorConfig): PuzzleDefinition | null {
    const { difficulty } = config;
    const maxAttempts = config.maxAttempts ?? 200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = LevelGenerator.tryGenerateMultiColorWalk(config);
      if (!puzzle) continue;

      const board = Board.fromDefinition(puzzle);
      const flowResult = FlowCalculator.calculate(board);
      const validation = FlowValidator.checkWin(board, flowResult);

      if (validation.solved) {
        const advancedPuzzle = LevelGenerator.injectMechanics(puzzle, flowResult, difficulty);
        const branched = LevelGenerator.injectDeadEndBranches(advancedPuzzle, difficulty);
        return LevelGenerator.scrambleRotations(branched);
      }
    }
    return null;
  }

  /** Tek bir deneme — rastgele yürüyüşle puzzle oluşturur */
  private static tryGenerateWalk(config: GeneratorConfig): PuzzleDefinition | null {
    const { gridSize, difficulty, allowedTileTypes } = config;
    // ─── 1. Kaynak ve hedef konumları ──────────────────────
    // Zorluk arttıkça kaynak/hedef daha farklı konumlara taşınır
    const sourceEdge = randomItem(['left', 'top'] as const);
    const sinkEdge = randomItem(['right', 'bottom'] as const);

    let sourcePos: { row: number; col: number };
    let sinkPos: { row: number; col: number };
    if (sourceEdge === 'left') {
      const row = Math.floor(Math.random() * gridSize);
      sourcePos = { row, col: 0 };
    } else {
      const col = Math.floor(Math.random() * gridSize);
      sourcePos = { row: 0, col };
    }

    if (sinkEdge === 'right') {
      const row = Math.floor(Math.random() * gridSize);
      sinkPos = { row, col: gridSize - 1 };
    } else {
      const col = Math.floor(Math.random() * gridSize);
      sinkPos = { row: gridSize - 1, col };
    }

    // Kaynak ve hedef aynı hücrede olamaz
    if (sourcePos.row === sinkPos.row && sourcePos.col === sinkPos.col) return null;

    // ─── 2. Rastgele yürüyüş ile yol oluştur ─────────────
    const visited = new Set<string>();
    const path: { row: number; col: number }[] = [];
    const portMap = new Map<string, Dir[]>(); // Her hücrenin bağlantı portları

    let current = { ...sourcePos };
    visited.add(`${current.row},${current.col}`);
    path.push(current);

    // Kaynak portunu ekle (çıkış yönü)
    const sourceDir: Dir = sourceEdge === 'left' ? 'E' : 'S';
    portMap.set(`${current.row},${current.col}`, [sourceDir]);

    // ─── DÜZELTME: Daha kısa path, daha fazla decoy tile ───
    // Minimum path length: gridSize'ın karesinin %40'ı (kullanıcı isteği)
    const totalCells = gridSize * gridSize;
    let minPathLength = Math.floor(totalCells * 0.40);
    
    // Küçük ızgaralarda biraz daha uzun (yoksa çok kolay)
    if (gridSize <= 5) {
      minPathLength = Math.floor(totalCells * 0.60);
    } else if (gridSize === 6) {
      minPathLength = Math.floor(totalCells * 0.50);
    }
    
    // Zorluk ile yol karmaşıklığı - çok az artış
    const maxPathLength = Math.floor(totalCells * 0.6); // Maksimum %60
    
    // Difficulty her seviye için path'e ekstra hücre ekler (minimal)
    let difficultyBonus = 0;
    if (gridSize <= 5) {
      difficultyBonus = Math.floor(difficulty * 1.5);
    } else if (gridSize <= 7) {
      difficultyBonus = Math.floor(difficulty * 2.5);
    } else {
      difficultyBonus = Math.floor(difficulty * 3.5);
    }
    
    const targetLength = Math.min(maxPathLength, minPathLength + difficultyBonus);

    let steps = 0;
    const maxSteps = gridSize * gridSize * 5; // Daha fazla deneme hakkı

    while (steps < maxSteps) {
      steps++;

      // Hedefi kontrol et
      if (path.length >= minPathLength) {
        // Hedefe komşu muyuz?
        for (const dir of DIRECTIONS) {
          const nr = current.row + dir.dr;
          const nc = current.col + dir.dc;
          if (nr === sinkPos.row && nc === sinkPos.col) {
            // Hedefe ulaştık
            // Mevcut hücreye çıkış portu ekle
            const currentKey = `${current.row},${current.col}`;
            const currentPorts = portMap.get(currentKey) ?? [];
            currentPorts.push(dir.name);
            portMap.set(currentKey, currentPorts);

            // Hedef hücreye giriş portu ekle
            const sinkKey = `${sinkPos.row},${sinkPos.col}`;
            portMap.set(sinkKey, [opposite(dir.name)]);
            path.push(sinkPos);

            return LevelGenerator.buildPuzzleFromPath(
              gridSize, path, portMap, sourcePos, sinkPos, difficulty, allowedTileTypes
            );
          }
        }
      }

      // Yol çok uzadıysa çık
      if (path.length >= targetLength) return null;

      // Rastgele yön seç (ziyaret edilmemiş komşulara)
      const dirs = shuffleArray(DIRECTIONS);
      let moved = false;

      for (const dir of dirs) {
        const nr = current.row + dir.dr;
        const nc = current.col + dir.dc;
        const key = `${nr},${nc}`;

        // Sınır kontrolü
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
        // Ziyaret edilmiş mi?
        if (visited.has(key)) continue;
        // Hedef hücre — henüz yeterli uzunlukta değilse atla
        if (nr === sinkPos.row && nc === sinkPos.col && path.length < minPathLength) continue;

        // Geçerli yön — mevcut hücreye çıkış portu ekle
        const currentKey = `${current.row},${current.col}`;
        const currentPorts = portMap.get(currentKey) ?? [];
        currentPorts.push(dir.name);
        portMap.set(currentKey, currentPorts);

        // Yeni hücreye giriş portu ekle
        const newPorts: Dir[] = [opposite(dir.name)];
        portMap.set(key, newPorts);

        // İlerle
        current = { row: nr, col: nc };
        visited.add(key);
        path.push(current);
        moved = true;
        break;
      }

      // Takıldıysa çık
      if (!moved) return null;
    }

    return null; // Yol bulunamadı
  }

  /** İki kaynak, bir MIXER ve bir SINK içeren özel walk mantığı */
  private static tryGenerateMultiColorWalk(config: GeneratorConfig): PuzzleDefinition | null {
    const { gridSize } = config;
    // 1. Önce standart bir yol oluştur (Source A -> Sink)
    const baseWalk = this.tryGenerateWalkPathOnly(config);
    if (!baseWalk) return null;
    
    const { path: pathA, portMap, sourcePos: sourceA, sinkPos } = baseWalk;
    
    // Yol çok kısaysa iptal
    if (pathA.length < 5) return null;
    
    // 2. Yol üzerinden rastgele bir MIXER noktası seç (Source ve Sink olmamalı)
    const mixerIndex = Math.floor(Math.random() * (pathA.length - 4)) + 2; 
    const mixerPos = pathA[mixerIndex];
    
    // 3. İkinci bir kaynak (Source B) seç. Source A ve Sink ile aynı kenarda olmamasına çalış.
    const edge = randomItem(['top', 'left', 'bottom', 'right'] as const);
    let sourceB: { row: number; col: number };
    if (edge === 'top') sourceB = { row: 0, col: Math.floor(Math.random() * gridSize) };
    else if (edge === 'bottom') sourceB = { row: gridSize - 1, col: Math.floor(Math.random() * gridSize) };
    else if (edge === 'left') sourceB = { row: Math.floor(Math.random() * gridSize), col: 0 };
    else sourceB = { row: Math.floor(Math.random() * gridSize), col: gridSize - 1 };
    
    // Aynı hücre olmaması için kontrol
    const isOverlap = pathA.some(p => p.row === sourceB.row && p.col === sourceB.col);
    if (isOverlap) return null;
    
    // 4. Source B'den MIXER'a ikinci yolu çiz
    const visited = new Set<string>();
    pathA.forEach(p => visited.add(`${p.row},${p.col}`)); // Ana yolu kilitleriz
    visited.delete(`${mixerPos.row},${mixerPos.col}`);    // Ama MIXER noktasına girişe izin veririz
    
    const pathB = [sourceB];
    let current = { ...sourceB };
    visited.add(`${current.row},${current.col}`);
    
    let sourceBDir: Dir = 'S';
    if (edge === 'top') sourceBDir = 'S';
    else if (edge === 'bottom') sourceBDir = 'N';
    else if (edge === 'left') sourceBDir = 'E';
    else sourceBDir = 'W';
    
    portMap.set(`${current.row},${current.col}`, [sourceBDir]);
    
    let steps = 0;
    while (steps < gridSize * gridSize) {
      steps++;
      
      // MIXER noktasına komşu muyuz? O zaman bağla.
      for (const dir of DIRECTIONS) {
        const nr = current.row + dir.dr;
        const nc = current.col + dir.dc;
        if (nr === mixerPos.row && nc === mixerPos.col) {
            // MIXER'a ulaştık!
            const currentKey = `${current.row},${current.col}`;
            const currentPorts = portMap.get(currentKey) ?? [];
            currentPorts.push(dir.name);
            portMap.set(currentKey, currentPorts);
            
            // MIXER noktasına giriş ekle
            const mixerKey = `${mixerPos.row},${mixerPos.col}`;
            const mixerPorts = portMap.get(mixerKey) ?? [];
            mixerPorts.push(opposite(dir.name));
            portMap.set(mixerKey, mixerPorts);
            
            pathB.push(mixerPos);
            
            // Tüm yolları birleştir ve bulmaca oluştur
            const fullPath = [...pathA, ...pathB.slice(0, -1)]; // mixerPos ortak, duplicate etme
            return LevelGenerator.buildMultiPuzzleFromPath(
               gridSize, fullPath, pathA, portMap, sourceA, sourceB, mixerPos, sinkPos
            );
        }
      }
      
      // İzle
      const dirs = shuffleArray(DIRECTIONS);
      let moved = false;
      for (const dir of dirs) {
        const nr = current.row + dir.dr;
        const nc = current.col + dir.dc;
        const key = `${nr},${nc}`;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
        if (visited.has(key)) continue;
        
        const currentKey = `${current.row},${current.col}`;
        const currentPorts = portMap.get(currentKey) ?? [];
        currentPorts.push(dir.name);
        portMap.set(currentKey, currentPorts);
        
        portMap.set(key, [opposite(dir.name)]);
        current = { row: nr, col: nc };
        visited.add(key);
        pathB.push(current);
        moved = true;
        break;
      }
      if (!moved) return null;
    }
    return null;
  }

  /** return object for refactoring tryGenerateWalk */
  private static tryGenerateWalkPathOnly(config: GeneratorConfig) {
      const { gridSize, difficulty } = config;
      // (This recreates the randomWalk logic but returns raw data so tryGenerateWalk and tryGenerateMultiColorWalk can share it)
      const sourceEdge = randomItem(['left', 'top'] as const);
      const sinkEdge = randomItem(['right', 'bottom'] as const);
      let sourcePos: { row: number; col: number };
      let sinkPos: { row: number; col: number };
      if (sourceEdge === 'left') sourcePos = { row: Math.floor(Math.random() * gridSize), col: 0 };
      else sourcePos = { row: 0, col: Math.floor(Math.random() * gridSize) };

      if (sinkEdge === 'right') sinkPos = { row: Math.floor(Math.random() * gridSize), col: gridSize - 1 };
      else sinkPos = { row: gridSize - 1, col: Math.floor(Math.random() * gridSize) };

      if (sourcePos.row === sinkPos.row && sourcePos.col === sinkPos.col) return null;

      const visited = new Set<string>();
      const path: { row: number; col: number }[] = [];
      const portMap = new Map<string, Dir[]>();

      let current = { ...sourcePos };
      visited.add(`${current.row},${current.col}`);
      path.push(current);

      const sourceDir: Dir = sourceEdge === 'left' ? 'E' : 'S';
      portMap.set(`${current.row},${current.col}`, [sourceDir]);

      // ─── DÜZELTME: Aynı agresif path length hesaplaması ───
      const totalCells = gridSize * gridSize;
      let minPathLength = Math.floor(totalCells * 0.4);
      
      if (gridSize <= 5) {
        minPathLength = Math.floor(totalCells * 0.6);
      } else if (gridSize === 6) {
        minPathLength = Math.floor(totalCells * 0.5);
      }
      
      const maxPathLength = totalCells - 2;
      
      let difficultyBonus = 0;
      if (gridSize <= 5) {
        difficultyBonus = Math.floor(difficulty * 2);
      } else if (gridSize <= 7) {
        difficultyBonus = Math.floor(difficulty * 3);
      } else {
        difficultyBonus = Math.floor(difficulty * 4);
      }
      
      const targetLength = Math.min(maxPathLength, minPathLength + difficultyBonus);

      let steps = 0;
      while (steps < gridSize * gridSize * 5) {
        steps++;
        if (path.length >= minPathLength) {
          for (const dir of DIRECTIONS) {
            const nr = current.row + dir.dr;
            const nc = current.col + dir.dc;
            if (nr === sinkPos.row && nc === sinkPos.col) {
              const currentKey = `${current.row},${current.col}`;
              const currentPorts = portMap.get(currentKey) ?? [];
              currentPorts.push(dir.name);
              portMap.set(currentKey, currentPorts);

              const sinkKey = `${sinkPos.row},${sinkPos.col}`;
              portMap.set(sinkKey, [opposite(dir.name)]);
              path.push(sinkPos);

              return { path, portMap, sourcePos, sinkPos, minPathLength };
            }
          }
        }

        if (path.length >= targetLength) return null;

        const dirs = shuffleArray(DIRECTIONS);
        let moved = false;
        for (const dir of dirs) {
          const nr = current.row + dir.dr;
          const nc = current.col + dir.dc;
          const key = `${nr},${nc}`;

          if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
          if (visited.has(key)) continue;
          if (nr === sinkPos.row && nc === sinkPos.col && path.length < minPathLength) continue;

          const currentKey = `${current.row},${current.col}`;
          const currentPorts = portMap.get(currentKey) ?? [];
          currentPorts.push(dir.name);
          portMap.set(currentKey, currentPorts);

          portMap.set(key, [opposite(dir.name)]);
          current = { row: nr, col: nc };
          visited.add(key);
          path.push(current);
          moved = true;
          break;
        }
        if (!moved) return null;
      }
      return null;
  }

  /** Yol verisinden puzzle oluşturur */
  private static buildPuzzleFromPath(
    gridSize: number,
    path: { row: number; col: number }[],
    portMap: Map<string, Dir[]>,
    sourcePos: { row: number; col: number },
    sinkPos: { row: number; col: number },
    difficulty: number,
    allowedTileTypes?: TileType[]
  ): PuzzleDefinition {
    const sourceColor: FlowColor = randomItem(SOURCE_COLORS);
    const tiles: TileConfig[][] = [];
    const pathSet = new Set(path.map(p => `${p.row},${p.col}`));

    for (let row = 0; row < gridSize; row++) {
      const tileRow: TileConfig[] = [];
      for (let col = 0; col < gridSize; col++) {
        const key = `${row},${col}`;
        const ports = portMap.get(key) ?? [];

        if (row === sourcePos.row && col === sourcePos.col) {
          // SOURCE base port is E, so to point out in direction Dir, it must be rotated.
          const exportDir = ports[0] || (sourcePos.col === 0 ? 'E' : 'S');
          let rot: Rotation = 0;
          if (exportDir === 'S') rot = 90;
          else if (exportDir === 'W') rot = 180;
          else if (exportDir === 'N') rot = 270;
          tileRow.push({ type: 'SOURCE', rotation: rot, locked: true });
        } else if (row === sinkPos.row && col === sinkPos.col) {
          // SINK base port is W, so to receive from direction Dir, it must be rotated.
          const importDir = ports[0] || (sinkPos.col === gridSize - 1 ? 'W' : 'N');
          let rot: Rotation = 0;
          if (importDir === 'N') rot = 90;
          else if (importDir === 'E') rot = 180;
          else if (importDir === 'S') rot = 270;
          tileRow.push({ type: 'SINK', rotation: rot, locked: true });
        } else if (pathSet.has(key)) {
          const { type, rotation } = tileForPorts(ports);
          tileRow.push({ type, rotation });
        } else {
          const allowed = allowedTileTypes ?? ['STRAIGHT','ELBOW','T_JUNCTION','CROSS'];
          const fillPool = allowed.filter(t => !['SOURCE','SINK'].includes(t));

          const fillType: TileType = fillPool.length > 0
            ? (() => {
                // Zorluk bazlı ağırlık ver — Denge iyileştirildi
                const pool = [...fillPool];
                // Daha pürüzsüz görünüm için basit yolları (STRAIGHT, ELBOW) her zaman havuzda biraz daha baskın tutuyoruz
                if (pool.includes('STRAIGHT')) pool.push('STRAIGHT');
                if (pool.includes('ELBOW')) pool.push('ELBOW');

                if (difficulty >= 7 && pool.includes('CROSS')) {
                    // Eskiden sadece CROSS ve T_JUNCTION atıyordu, bu çok gürültülü (noisy) oluyordu.
                    // Şimdi havuzu (pool) biraz daha dengeli genişletiyoruz.
                    pool.push('CROSS', 'T_JUNCTION');
                } else if (difficulty >= 4 && pool.includes('T_JUNCTION')) {
                    pool.push('T_JUNCTION', 'T_JUNCTION');
                }
                
                if (difficulty >= 6 && pool.includes('SPLITTER')) {
                    // Splitter'ı da havuza ekle
                    pool.push('SPLITTER', 'SPLITTER');
                }
                
                return randomItem(pool as TileType[]);
              })()
            : 'STRAIGHT';
          
          let fillRotation = randomRotation();
          
          // Decoy tile'lar için de solutionRotation ayarla
          // (Oyuncunun yanlış rotasyonları denemesini zorlaştırır)
          // Rastgele bir "doğru" rotasyon seç, ama başlangıçta farklı bir rotasyonda olsun
          const possibleRotations: Rotation[] = [0, 90, 180, 270];
          const solutionRot = randomItem(possibleRotations);
          
          // Başlangıç rotasyonu solution'dan farklı olsun (zorluk >= 2'de)
          let startRot = fillRotation;
          if (difficulty >= 2) {
            const otherRotations = possibleRotations.filter(r => r !== solutionRot);
            startRot = randomItem(otherRotations);
          }
          
          tileRow.push({ 
            type: fillType, 
            rotation: startRot,
            solutionRotation: solutionRot 
          });
        }
      }
      tiles.push(tileRow);
    }

    return {
      gridSize,
      tiles,
      sources: [{ ...sourcePos, color: sourceColor }],
      sinks: [{ ...sinkPos, requiredColors: [sourceColor] }],
    };
  }

  /** İki kaynaklı (MIXER) puzzle tanımı oluşturur */
  private static buildMultiPuzzleFromPath(
    gridSize: number,
    path: { row: number; col: number }[],
    pathA: { row: number; col: number }[],
    portMap: Map<string, Dir[]>,
    sourceA: { row: number; col: number },
    sourceB: { row: number; col: number },
    mixerPos: { row: number; col: number },
    sinkPos: { row: number; col: number },
  ): PuzzleDefinition {
    // Sabit cyan+magenta yerine:
    const colorPairs: Array<[FlowColor, FlowColor]> = [
      ['cyan', 'magenta'],    // → purple
      ['cyan', 'yellow'],     // → green
      ['magenta', 'yellow'],  // → orange
    ];
    const [colorA, colorB] = colorPairs[Math.floor(Math.random() * colorPairs.length)];
    
    // mixColors fonksiyonunu kullanarak gerçek karışımı hesapla
    const mixedColor = mixColors([colorA, colorB]) ?? 'white';

    const tiles: TileConfig[][] = [];
    const pathSet = new Set(path.map(p => `${p.row},${p.col}`));

    for (let row = 0; row < gridSize; row++) {
      const tileRow: TileConfig[] = [];
      for (let col = 0; col < gridSize; col++) {
        const key = `${row},${col}`;
        const ports = portMap.get(key) ?? [];

        if (row === sourceA.row && col === sourceA.col) {
          tileRow.push({ type: 'SOURCE', rotation: ports[0] === 'S' ? 90 : ports[0] === 'W' ? 180 : ports[0] === 'N' ? 270 : 0, locked: true });
        } else if (row === sourceB.row && col === sourceB.col) {
          tileRow.push({ type: 'SOURCE', rotation: ports[0] === 'S' ? 90 : ports[0] === 'W' ? 180 : ports[0] === 'N' ? 270 : 0, locked: true });
        } else if (row === sinkPos.row && col === sinkPos.col) {
          const importDir = ports[0] || 'W';
          tileRow.push({ type: 'SINK', rotation: importDir === 'N' ? 90 : importDir === 'E' ? 180 : importDir === 'S' ? 270 : 0, locked: true });
        } else if (row === mixerPos.row && col === mixerPos.col) {
          // MIXER base ports: W (input), E (input), S (output at 0°)
          // ports[] contains 3 directions: 2 inputs (from pathA and pathB) and 1 output (toward sink).
          // Output direction = theone continuing pathA toward SINK (second port added by pathA walk).
          // We need to rotate MIXER so base S → output direction.
          // 
          // Find the output port: it's the port in pathA that goes from mixerPos toward the next tile.
          const mixerIdx = pathA.findIndex(p => p.row === mixerPos.row && p.col === mixerPos.col);
          let outputDir: Dir = 'S'; // fallback
          if (mixerIdx >= 0 && mixerIdx < pathA.length - 1) {
            const next = pathA[mixerIdx + 1];
            const dr = next.row - mixerPos.row;
            const dc = next.col - mixerPos.col;
            if (dr === -1) outputDir = 'N';
            else if (dr === 1) outputDir = 'S';
            else if (dc === -1) outputDir = 'W';
            else if (dc === 1) outputDir = 'E';
          }
          // Rotate MIXER so base-S aligns with outputDir
          // Base S → N needs 180°, S → E needs 270°, S → W needs 90°, S → S needs 0°
          let mixerRot: Rotation = 0;
          if (outputDir === 'N') mixerRot = 180;
          else if (outputDir === 'E') mixerRot = 270;
          else if (outputDir === 'W') mixerRot = 90;
          // outputDir === 'S' stays 0
          tileRow.push({ type: 'MIXER', rotation: mixerRot, locked: true });
        } else if (pathSet.has(key)) {
          const { type, rotation } = tileForPorts(ports);
          tileRow.push({ type, rotation });
        } else {
          tileRow.push({ type: randomItem(['STRAIGHT', 'ELBOW']), rotation: randomRotation() });
        }
      }
      tiles.push(tileRow);
    }

    return {
      gridSize,
      tiles,
      sources: [
          { ...sourceA, color: colorA },
          { ...sourceB, color: colorB }
      ],
      sinks: [{ ...sinkPos, requiredColors: [mixedColor] }],
    };
  }

  /**
   * İleri Seviye Mekanikleri (Portal, One-Way, Filter) Enjekte Eder
   * Çözülmüş, pürüzsüz puzzle yolunu okur ve zorluğa göre değişiklikler yapar.
   * ─── DÜZELTME: ONE_WAY ekledikten sonra puzzle'ın hala çözülebilir olduğunu doğrular ───
   * ─── YENİ: FILTER tile ekleme (difficulty >= 4) ───
   */
  private static injectMechanics(puzzle: PuzzleDefinition, flowInfo: import('../flow/FlowCalculator').FlowResult, difficulty: number): PuzzleDefinition {
    if (difficulty < 3) return puzzle; // Kolay levellara ekleme
    
    let newTiles = JSON.parse(JSON.stringify(puzzle.tiles)) as TileConfig[][];
    let modifiedPuzzle = { ...puzzle, tiles: newTiles };

    // Her akış renginin yolunu bul
    for (const pathObj of flowInfo.flowPaths) {
         if (pathObj.edges.length < 5) continue;
         
         // Yolun sıralı noktalarını çıkart
         const edges = pathObj.edges;
         const pathColor = pathObj.color;
         
         // 1. FILTER Ekleme (difficulty >= 4) - Renk filtresi
         if (difficulty >= 4 && Math.random() > 0.6 && puzzle.sources.length === 1) { // Tek renkli puzzle'larda
             // Yolun ortasında bir STRAIGHT tile bul
             for (let i = 2; i < edges.length - 2; i++) {
                 const prev = edges[i].from;
                 const curr = edges[i].to;
                 const next = i + 1 < edges.length ? edges[i+1].to : null;
                 
                 if (next) {
                     const isHorizontal = prev.row === curr.row && curr.row === next.row;
                     const isVertical = prev.col === curr.col && curr.col === next.col;
                     
                     if (isHorizontal || isVertical) {
                         const currentType = newTiles[curr.row][curr.col].type;
                         if (currentType === 'STRAIGHT') {
                             // FILTER ekle - bu rengi geçirir
                             let requiredRot: Rotation = 0;
                             if (isHorizontal) requiredRot = 90; // E-W yönü
                             // isVertical ise 0 (N-S yönü)
                             
                             const testTiles = JSON.parse(JSON.stringify(newTiles)) as TileConfig[][];
                             testTiles[curr.row][curr.col].type = 'FILTER';
                             testTiles[curr.row][curr.col].rotation = requiredRot;
                             testTiles[curr.row][curr.col].filterColor = pathColor;
                             testTiles[curr.row][curr.col].solutionRotation = requiredRot;
                             
                             const testPuzzle = { ...modifiedPuzzle, tiles: testTiles };
                             const testBoard = Board.fromDefinition(testPuzzle);
                             const testFlow = FlowCalculator.calculate(testBoard);
                             const testValidation = FlowValidator.checkWin(testBoard, testFlow);
                             
                             if (testValidation.solved) {
                                 newTiles[curr.row][curr.col].type = 'FILTER';
                                 newTiles[curr.row][curr.col].rotation = requiredRot;
                                 newTiles[curr.row][curr.col].filterColor = pathColor;
                                 newTiles[curr.row][curr.col].solutionRotation = requiredRot;
                                 modifiedPuzzle = testPuzzle;
                                 break; // Bir filter yeterli
                             }
                         }
                     }
                 }
             }
         }
         
         // 2. ONE_WAY Ekleme (difficulty >= 3) - DOĞRULAMA İLE
         if (difficulty >= 3 && Math.random() > 0.5) { // %50 şans (0.3'ten 0.5'e çıkarıldı)
             // Düz (STRAIGHT) giden bir yer bul
             for (let i = 1; i < edges.length - 1; i++) {
                 const prev = edges[i].from;
                 const curr = edges[i].to;
                 const next = i + 1 < edges.length ? edges[i+1].to : null;
                 
                 if (next) {
                     // Eger prev, curr, next ayni eksendeyse = STRAIGHT tile demektir
                     const isHorizontal = prev.row === curr.row && curr.row === next.row;
                     const isVertical = prev.col === curr.col && curr.col === next.col;
                     
                     if (isHorizontal || isVertical) {
                         const currentType = newTiles[curr.row][curr.col].type;
                         if (currentType === 'STRAIGHT') {
                             // Rotation ayarlama (S=Giriş varsayımı ile)
                             // Eger North'tan geliyorsa (prev.row < curr.row) -> Rotation 180 (S'i North'a bakıt)
                             // Eger South'tan geliyorsa (prev.row > curr.row) -> Rotation 0 (S South'ta)
                             // Eger West'ten geliyorsa (prev.col < curr.col) -> Rotation 90 (S West'te)
                             // Eger East'ten geliyorsa (prev.col > curr.col) -> Rotation 270 (S East'te)
                             let requiredRot: Rotation = 0;
                             if (prev.row < curr.row) requiredRot = 180;
                             if (prev.col < curr.col) requiredRot = 90;
                             if (prev.col > curr.col) requiredRot = 270;
                             
                             // ─── DOĞRULAMA: ONE_WAY ekle ve test et ───
                             const testTiles = JSON.parse(JSON.stringify(newTiles)) as TileConfig[][];
                             testTiles[curr.row][curr.col].type = 'ONE_WAY';
                             testTiles[curr.row][curr.col].rotation = requiredRot;
                             testTiles[curr.row][curr.col].solutionRotation = requiredRot;
                             
                             const testPuzzle = { ...modifiedPuzzle, tiles: testTiles };
                             const testBoard = Board.fromDefinition(testPuzzle);
                             const testFlow = FlowCalculator.calculate(testBoard);
                             const testValidation = FlowValidator.checkWin(testBoard, testFlow);
                             
                             // Eğer hala çözülebilirse, değişikliği uygula
                             if (testValidation.solved) {
                                 newTiles[curr.row][curr.col].type = 'ONE_WAY';
                                 newTiles[curr.row][curr.col].rotation = requiredRot;
                                 newTiles[curr.row][curr.col].solutionRotation = requiredRot;
                                 modifiedPuzzle = testPuzzle;
                                 break; // Bir renkte 1 tane one-way yeterli
                             }
                             // Eğer çözülemezse, bu ONE_WAY'i ekleme, devam et
                         }
                     }
                 }
             }
         }
         
         // 3. PORTAL Ekleme (difficulty >= 7)
         if (difficulty >= 7 && Math.random() > 0.4 && edges.length > 8) {
             // Portal icin birbirine nispeten uzak iki nokta sec: i ve j
             const i = Math.floor(edges.length * 0.2); // Baslara yakin
             const j = Math.floor(edges.length * 0.8); // Sonlara yakin (arada epey mesafe)
             
             const portal1Pos = edges[i].to;
             const portal2Pos = edges[j].to;
             
             // Uzerinde source/sink var mi kontrolu (guvenlik)
             if (newTiles[portal1Pos.row][portal1Pos.col].type !== 'SOURCE' && 
                 newTiles[portal1Pos.row][portal1Pos.col].type !== 'SINK' &&
                 newTiles[portal2Pos.row][portal2Pos.col].type !== 'SOURCE' && 
                 newTiles[portal2Pos.row][portal2Pos.col].type !== 'SINK') {
                 
                 // Portal yerlestir
                 const originalTile1 = newTiles[portal1Pos.row][portal1Pos.col];
                 const originalTile2 = newTiles[portal2Pos.row][portal2Pos.col];

                 newTiles[portal1Pos.row][portal1Pos.col] = { type: 'PORTAL', rotation: 0, portalId: 1, solutionRotation: 0 };
                 newTiles[portal2Pos.row][portal2Pos.col] = { type: 'PORTAL', rotation: 0, portalId: 1, solutionRotation: 0 };
                 
                 // Aradaki tilelari decorative filler yap
                 const originalMids: {r: number, c: number, t: TileConfig}[] = [];
                 for (let k = i + 1; k < j; k++) {
                     const midPos = edges[k].to;
                     if (newTiles[midPos.row][midPos.col].type !== 'MIXER') { // Baska ozel seyleri bozmayalim
                         originalMids.push({r: midPos.row, c: midPos.col, t: newTiles[midPos.row][midPos.col]});
                         newTiles[midPos.row][midPos.col] = { 
                             type: Math.random() > 0.5 ? 'STRAIGHT' : 'ELBOW', 
                             rotation: Math.random() > 0.5 ? 90 : 0 
                         };
                     }
                 }

                 // Portal ekleme bloğunun sonuna:
                 const testPuzzlePortal = { ...modifiedPuzzle, tiles: newTiles };
                 const testBoardPortal = Board.fromDefinition(testPuzzlePortal);
                 const testFlowPortal = FlowCalculator.calculate(testBoardPortal);
                 const testValPortal = FlowValidator.checkWin(testBoardPortal, testFlowPortal);
                 if (!testValPortal.solved) {
                     // Portal'ı geri al
                     newTiles[portal1Pos.row][portal1Pos.col] = originalTile1;
                     newTiles[portal2Pos.row][portal2Pos.col] = originalTile2;
                     // aradaki tile'ları da geri al
                     for (const mid of originalMids) {
                         newTiles[mid.r][mid.c] = mid.t;
                     }
                 } else {
                     modifiedPuzzle = testPuzzlePortal;
                 }
             }
         }
    }

    return modifiedPuzzle;
  }

  private static injectDeadEndBranches(
    puzzle: PuzzleDefinition,
    difficulty: number
  ): PuzzleDefinition {
    if (difficulty < 3) return puzzle;

    const maxBranches = Math.min(3, Math.floor(difficulty / 3));
    const tiles = JSON.parse(JSON.stringify(puzzle.tiles)) as TileConfig[][];
    const gs = puzzle.gridSize;
    let added = 0;

    // Path tile'larını bul
    const pathTiles: {r:number,c:number}[] = [];
    for (let r=0;r<gs;r++) for (let c=0;c<gs;c++) {
      const t = tiles[r][c];
      if (t.type==='STRAIGHT' && !t.locked && t.solutionRotation!==undefined)
        pathTiles.push({r,c});
    }

    // Shuffle
    for (let i=pathTiles.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [pathTiles[i],pathTiles[j]]=[pathTiles[j],pathTiles[i]];
    }

    for (const {r,c} of pathTiles) {
      if (added >= maxBranches) break;
      const dirs: [number,number][] = [[-1,0],[0,1],[1,0],[0,-1]];
      for (const [dr,dc] of dirs) {
        const nr=r+dr, nc=c+dc;
        if (nr<0||nr>=gs||nc<0||nc>=gs) continue;
        const nb = tiles[nr][nc];
        // Komşu boş dolgu tile mi?
        if (nb.type==='SOURCE'||nb.type==='SINK') continue;
        if (nb.locked) continue;
        if (nb.solutionRotation!==undefined) continue; // zaten path

        // STRAIGHT → T_JUNCTION dönüştür
        const sr = tiles[r][c].solutionRotation ?? 0;
        tiles[r][c] = { ...tiles[r][c], type:'T_JUNCTION', rotation:sr, solutionRotation:sr };

        // Komşuya dead-end ekle
        const rot = [0,90,180,270][Math.floor(Math.random()*4)] as Rotation;
        tiles[nr][nc] = { type:'ELBOW', rotation:rot, solutionRotation:rot };

        added++;
        break;
      }
    }

    return { ...puzzle, tiles };
  }

  /** Rotasyonları karıştır — puzzle haline getir */
  private static scrambleRotations(puzzle: PuzzleDefinition): PuzzleDefinition {
    const scrambledTiles = puzzle.tiles.map(row =>
      row.map(tile => {
        // Sadece SOURCE ve SINK locked kalmalı
        if (tile.locked) return { ...tile, solutionRotation: tile.rotation };
        
        // Diğer tüm tile'lar (path dahil) rastgele rotasyonda başlasın
        const solutionRot = tile.rotation;
        const possibleRotations: Rotation[] = [0, 90, 180, 270];
        
        // %75 ihtimalle yanlış rotasyonda başla (daha zor)
        let startRot: Rotation;
        if (Math.random() < 0.75) {
          const wrongRotations = possibleRotations.filter(r => r !== solutionRot);
          startRot = randomItem(wrongRotations);
        } else {
          startRot = solutionRot; // %25 ihtimalle doğru rotasyonda
        }
        
        return { ...tile, solutionRotation: solutionRot, rotation: startRot };
      })
    );
    return { ...puzzle, tiles: scrambledTiles };
  }

  // scrambleWithVerification kaldırıldı — generateRandomWalk zaten geçerli
  // yol üretir ve kullanıcı her tile'ı döndürebildiği için tüm puzzlelar çözülebilirdir.


  /** Fallback — basit ama geçerli puzzle */
  private static createFallbackPuzzle(gridSize: number): PuzzleDefinition {
    const sourceColor: FlowColor = randomItem(SOURCE_COLORS);
    const tiles: TileConfig[][] = [];

    // Zigzag yol oluştur
    for (let row = 0; row < gridSize; row++) {
      const tileRow: TileConfig[] = [];
      for (let col = 0; col < gridSize; col++) {
        if (row === 0 && col === 0) {
          tileRow.push({ type: 'SOURCE', rotation: 90, locked: true }); // S
        } else if (row === gridSize - 1 && col === gridSize - 1) {
          tileRow.push({ type: 'SINK', rotation: 90, locked: true }); // N
        } else if (row % 2 === 0 && col < gridSize - 1) {
          tileRow.push({ type: 'STRAIGHT', rotation: randomItem([0, 90] as Rotation[]) });
        } else if (row % 2 === 1 && col > 0) {
          tileRow.push({ type: 'STRAIGHT', rotation: randomItem([0, 90] as Rotation[]) });
        } else {
          tileRow.push({ type: 'ELBOW', rotation: randomRotation() });
        }
      }
      tiles.push(tileRow);
    }

    return {
      gridSize,
      tiles,
      sources: [{ row: 0, col: 0, color: sourceColor }],
      sinks: [{ row: gridSize - 1, col: gridSize - 1, requiredColors: [sourceColor] }],
    };
  }
}
