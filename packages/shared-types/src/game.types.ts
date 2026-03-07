// ============================================================
// FlowState — Oyun Tipleri
// Tüm oyun mantığında kullanılan temel veri yapıları.
// ============================================================

/** Tile türleri — her biri farklı bağlantı portlarına sahip */
export type TileType =
  | 'SOURCE'      // Akış kaynağı — 1 çıkış
  | 'SINK'        // Akış hedefi — tüm renkleri alır
  | 'STRAIGHT'    // Düz boru — karşılıklı iki kenar
  | 'ELBOW'       // Dirsek — 90° dönüş
  | 'T_JUNCTION'  // T-kavşak — 3 kenar
  | 'CROSS'       // Çapraz — 4 kenar
  | 'GATE'        // Kapı — açılıp kapanabilir
  | 'FILTER'      // Filtre — sadece belirli rengi geçirir
  | 'MIXER'       // Karıştırıcı — iki rengi birleştirir
  | 'SPLITTER'    // Ayırıcı — bir akışı ikiye böler
  | 'PORTAL'      // Portal — akışı diğer portala ışınlar
  | 'ONE_WAY';    // Tek Yönlü Valf — akış sadece ok yönünde geçer

/** Tile döndürme açısı (saat yönünde, derece) */
export type Rotation = 0 | 90 | 180 | 270;

/** Akış renkleri
 * Ana Renkler: cyan, magenta, yellow
 * Birincil Karışımlar: purple (cyan+magenta), green (cyan+yellow), orange (magenta+yellow) 
 */
export type FlowColor = 'cyan' | 'magenta' | 'yellow' | 'white' | 'purple' | 'green' | 'orange';

/** Yön — tile'ın hangi kenarında port var */
export type Direction = 'N' | 'E' | 'S' | 'W';

/** Izgara pozisyonu (satır, sütun) */
export interface Position {
  row: number;
  col: number;
}

/** Tek bir tile'ın yapılandırması */
export interface TileConfig {
  type: TileType;
  rotation: Rotation;
  locked?: boolean;        // true = oyuncu döndüremez (source, sink)
  filterColor?: FlowColor; // Sadece FILTER tile'ı için geçerli
  portalId?: number;       // Hangi portal çiftine ait olduğu (örn: 1, 2)
  solutionRotation?: Rotation; // Hint sistemi için doğru rotasyon açısı
  isHinted?: boolean;          // İpucu sistemi tarafından kalıcı olarak kilitlenip boyanan tile
}

/** Bulmaca tanımı — bir puzzle'ı tamamen tanımlar */
export interface PuzzleDefinition {
  gridSize: number;
  tiles: TileConfig[][];   // [satır][sütun]
  sources: Array<Position & { color: FlowColor }>;
  sinks: Array<Position & { requiredColors: FlowColor[] }>;
}

/** Çözüm verisi */
export interface Solution {
  tiles: Rotation[][];     // Her tile'ın final rotasyonu
  flowPaths: FlowPath[];
}

/** Tek bir rengin izlediği yol */
export interface FlowPath {
  color: FlowColor;
  positions: Position[];
}

/** Board'un anlık kopyası (undo stack için) */
export interface BoardSnapshot {
  tiles: TileConfig[][];
  timestamp: number;
}

/** Oyun durumu */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'solved' | 'failed';

/** Oyun oturumu verisi */
export interface GameSession {
  puzzleId: string;
  status: GameStatus;
  elapsedSeconds: number;
  moveCount: number;
  hintsUsed: number;
  undosUsed: number;
  moveLog: GameCommand[];
  startedAt: Date;
  completedAt?: Date;
}

/** Tek bir oyuncu hareketi */
export interface GameCommand {
  type: string;
  position: Position;
  timestamp: number;
  serialized: string;
}

/** Saga Map / Kampanya bölümü konfigürasyonu */
export interface CampaignLevel {
  id: number;              // 1-100 arası bölüm numarası
  gridSize: number;        // Tahta boyutu (5-10 vb.)
  difficulty: number;      // 1-10 arası zorluk (LevelGenerator için)
  pointsReward: number;    // Kazanılacak puan/coin
  unlockedMechanics?: string[]; // Ekranda göstermek için "Mixer eklendi" gibi bilgi
}
