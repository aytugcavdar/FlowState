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

/** Üretim yapılandırması */
export interface GeneratorConfig {
  gridSize: number;
  difficulty: number;
  maxAttempts?: number;
  allowedTileTypes?: TileType[];
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
    // Zorluk 5'ten büyükse %50 ihtimalle veya 10'dan büyükse her zaman multi-color üret
    const useMulti = config.difficulty >= 10 || (config.difficulty >= 5 && Math.random() > 0.5);
    
    if (useMulti) {
       const multiResult = LevelGenerator.generateMultiColorWalk(config);
       if (multiResult) return multiResult;
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
  static generateRandomWalk(config: GeneratorConfig): PuzzleDefinition {
    const { gridSize, difficulty } = config;
    const maxAttempts = config.maxAttempts ?? 200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = LevelGenerator.tryGenerateWalk(gridSize, difficulty);
      if (!puzzle) continue;

      // Doğrulama
      const board = Board.fromDefinition(puzzle);
      const flowResult = FlowCalculator.calculate(board);
      const validation = FlowValidator.checkWin(board, flowResult);

      if (validation.solved) {
        // Enjekte et: Portal ve One-Way
        const advancedPuzzle = LevelGenerator.injectMechanics(puzzle, flowResult, difficulty);
        return LevelGenerator.scrambleRotations(advancedPuzzle);
      }
    }

    // Fallback
    return LevelGenerator.scrambleRotations(LevelGenerator.createFallbackPuzzle(gridSize));
  }

  /** İki kaynaklı (MIXER) bulmaca oluşturur */
  static generateMultiColorWalk(config: GeneratorConfig): PuzzleDefinition | null {
    const { gridSize, difficulty } = config;
    const maxAttempts = config.maxAttempts ?? 200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = LevelGenerator.tryGenerateMultiColorWalk(gridSize, difficulty);
      if (!puzzle) continue;

      const board = Board.fromDefinition(puzzle);
      const flowResult = FlowCalculator.calculate(board);
      const validation = FlowValidator.checkWin(board, flowResult);

      if (validation.solved) {
        const advancedPuzzle = LevelGenerator.injectMechanics(puzzle, flowResult, difficulty);
        return LevelGenerator.scrambleRotations(advancedPuzzle);
      }
    }
    return null;
  }

  /** Tek bir deneme — rastgele yürüyüşle puzzle oluşturur */
  private static tryGenerateWalk(gridSize: number, difficulty: number): PuzzleDefinition | null {
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

    // Hedef minimum mesafe
    const minPathLength = Math.max(gridSize, Math.floor(gridSize * 1.2));
    // Zorluk ile yol karmaşıklığı
    const maxPathLength = gridSize * gridSize - 2;
    const targetLength = Math.min(maxPathLength, minPathLength + Math.floor(difficulty * 1.5));

    let steps = 0;
    const maxSteps = gridSize * gridSize * 3;

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
              gridSize, path, portMap, sourcePos, sinkPos, difficulty
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
  private static tryGenerateMultiColorWalk(gridSize: number, difficulty: number): PuzzleDefinition | null {
    // 1. Önce standart bir yol oluştur (Source A -> Sink)
    const baseWalk = this.tryGenerateWalkPathOnly(gridSize, difficulty);
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
               gridSize, fullPath, portMap, sourceA, sourceB, mixerPos, sinkPos
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
  private static tryGenerateWalkPathOnly(gridSize: number, difficulty: number) {
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

      const minPathLength = Math.max(gridSize, Math.floor(gridSize * 1.2));
      const maxPathLength = gridSize * gridSize - 2;
      const targetLength = Math.min(maxPathLength, minPathLength + Math.floor(difficulty * 1.5));

      let steps = 0;
      while (steps < gridSize * gridSize * 3) {
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
          // Yol dışı — dekoratif dolgu tile
          let fillTypes: TileType[] = ['STRAIGHT', 'ELBOW'];
          if (difficulty >= 3 && difficulty < 6) fillTypes.push('T_JUNCTION');
          if (difficulty >= 6) fillTypes.push('T_JUNCTION', 'CROSS', 'MIXER');
          tileRow.push({ type: randomItem(fillTypes), rotation: randomRotation() });
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
    portMap: Map<string, Dir[]>,
    sourceA: { row: number; col: number },
    sourceB: { row: number; col: number },
    mixerPos: { row: number; col: number },
    sinkPos: { row: number; col: number },
  ): PuzzleDefinition {
    // 2 farklı renk seçelim
    const colorA = 'cyan';
    const colorB = 'magenta';
    const mixedColor = 'purple'; // cyan + magenta

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
          // MIXER ports are W, E, S (base rotation 0 means IN:W, E; OUT:S)
          // To deduce rotation precisely requires knowing which ports are IN vs OUT.
          // For now, let random rotation scramble handle finding the correct rotation during play,
          // but we MUST provide a valid MIXER.
          // T_JUNCTION has 3 ports. MIXER has 3 ports.
          const { rotation } = tileForPorts(ports);
          tileRow.push({ type: 'MIXER', rotation });
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
   * İleri Seviye Mekanikleri (Portal, One-Way) Enjekte Eder
   * Çözülmüş, pürüzsüz puzzle yolunu okur ve zorluğa göre değişiklikler yapar.
   */
  private static injectMechanics(puzzle: PuzzleDefinition, flowInfo: import('../flow/FlowCalculator').FlowResult, difficulty: number): PuzzleDefinition {
    if (difficulty < 3) return puzzle; // Kolay levellara ekleme
    
    const newTiles = JSON.parse(JSON.stringify(puzzle.tiles)) as TileConfig[][];

    // Her akış renginin yolunu bul
    for (const pathObj of flowInfo.flowPaths) {
         if (pathObj.edges.length < 5) continue;
         
         // Yolun sıralı noktalarını çıkart
         const edges = pathObj.edges;
         
         // 1. ONE_WAY Ekleme (difficulty >= 3)
         if (difficulty >= 3 && Math.random() > 0.3) {
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
                             newTiles[curr.row][curr.col].type = 'ONE_WAY';
                             // Rotation ayarlama (S=Giriş varsayımı ile)
                             // Eger North'tan geliyorsa (prev.row < curr.row) -> Rotation 180 (S'i North'a bakıt)
                             // Eger South'tan geliyorsa (prev.row > curr.row) -> Rotation 0 (S South'ta)
                             // Eger West'ten geliyorsa (prev.col < curr.col) -> Rotation 90 (S West'te)
                             // Eger East'ten geliyorsa (prev.col > curr.col) -> Rotation 270 (S East'te)
                             let requiredRot: Rotation = 0;
                             if (prev.row < curr.row) requiredRot = 180;
                             if (prev.col < curr.col) requiredRot = 90;
                             if (prev.col > curr.col) requiredRot = 270;
                             
                             newTiles[curr.row][curr.col].rotation = requiredRot;
                             newTiles[curr.row][curr.col].solutionRotation = requiredRot;
                             break; // Bir renkte 1 tane one-way yeterli
                         }
                     }
                 }
             }
         }
         
         // 2. PORTAL Ekleme (difficulty >= 7)
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
                 newTiles[portal1Pos.row][portal1Pos.col] = { type: 'PORTAL', rotation: 0, portalId: 1, solutionRotation: 0 };
                 newTiles[portal2Pos.row][portal2Pos.col] = { type: 'PORTAL', rotation: 0, portalId: 1, solutionRotation: 0 };
                 
                 // Aradaki tilelari decorative filler yap
                 for (let k = i + 1; k < j; k++) {
                     const midPos = edges[k].to;
                     if (newTiles[midPos.row][midPos.col].type !== 'MIXER') { // Baska ozel seyleri bozmayalim
                         newTiles[midPos.row][midPos.col] = { 
                             type: Math.random() > 0.5 ? 'STRAIGHT' : 'ELBOW', 
                             rotation: Math.random() > 0.5 ? 90 : 0 
                         };
                     }
                 }
             }
         }
    }

    return { ...puzzle, tiles: newTiles };
  }

  /** Rotasyonları karıştır — puzzle haline getir */
  private static scrambleRotations(puzzle: PuzzleDefinition): PuzzleDefinition {
    const scrambledTiles = puzzle.tiles.map(row =>
      row.map(tile => {
        if (tile.locked) return { ...tile, solutionRotation: tile.rotation };
        return { ...tile, solutionRotation: tile.rotation, rotation: randomRotation() };
      })
    );
    return { ...puzzle, tiles: scrambledTiles };
  }

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
