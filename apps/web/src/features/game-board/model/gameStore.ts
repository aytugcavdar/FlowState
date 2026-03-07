// ============================================================
// gameStore — Zustand oyun state yönetimi
// Board, akışlar, zamanlayıcı, undo stack burada yaşar.
// Sık güncellenen "sıcak yol" durumu — RTK'dan ayrı tutuluyor.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PuzzleDefinition, GameStatus } from '@flowstate/shared-types';
import { useMetaStore } from '../../meta/model/metaStore';
import {
  Board,
  Position,
  FlowCalculator,
  FlowValidator,
  LevelGenerator,
  CAMPAIGN_LEVELS,
  TUTORIAL_LEVELS,
  type FlowResult,
  type CalculatedFlowPath,
} from '@flowstate/game-engine';

// ─── Seeded RNG (günlük bulmaca için) ───────────────────────
/** Basit fakat yeterli mulberry32 PRNG */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 0xFFFFFFFF;
  };
}

/** Bugünün tarihinden deterministik bir sayı üretir */
function getTodaysSeed(): number {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Oyun store durumu */
interface GameState {
  // ─── Veri ───────────────────────────────────────────────
  board: Board | null;
  gridSize: number;
  flowResult: FlowResult | null;
  flowPaths: CalculatedFlowPath[];
  solved: boolean;
  status: GameStatus;
  moveCount: number;
  elapsedSeconds: number;
  hintsUsedInPuzzle: number;
  undoStack: string[];         // Board serileştirilmiş halleri
  currentPuzzleId: string | null;
  
  // ─── Tutorial ───────────────────────────────────────────
  isTutorial: boolean;
  tutorialStep: number | null;

  // ─── Eylemler ───────────────────────────────────────────
  /** Yeni bir puzzle başlat */
  startPuzzle: (definition: PuzzleDefinition, puzzleId?: string) => void;
  /** Rastgele pratik puzzle üret */
  startPractice: (gridSize: number, difficulty: number) => void;
  /** Bugünün sabit günlük bulmacasını başlat */
  startDaily: () => void;
  /** Özel kampanya bölümü başlat */
  startCampaignLevel: (levelId: number) => void;
  /** Eğitim bölümü başlat */
  startTutorialLevel: (stepIndex: number) => void;
  /** Tile'ı döndür ve akışı yeniden hesapla */
  rotateTile: (row: number, col: number) => void;
  /** İpucu Satın Al / Uygula */
  useHint: () => void;
  /** Son hamleyi geri al */
  undoMove: () => void;
  /** Zamanlayıcı tick — saniye artır */
  tick: () => void;
  /** Oyunu sıfırla */
  reset: () => void;
  
  // ─── Ekonomi & İlerleme ─────────────────────────────────
  coins: number;
  addCoins: (amount: number) => void;
  unlockedLevel: number; // Saga Map'teki açık olan en yüksek seviye
}


export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ─── Başlangıç Durumu ─────────────────────────────────
      board: null,
      gridSize: 5,
      flowResult: null,
      flowPaths: [],
      solved: false,
      status: 'idle',
      moveCount: 0,
      elapsedSeconds: 0,
      hintsUsedInPuzzle: 0,
      undoStack: [],
      currentPuzzleId: null,
      isTutorial: false,
      tutorialStep: null,
      coins: 100, // Baslangic hediyesi veya localStorage'dan yuklenebilir
      addCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins + amount) })),
      unlockedLevel: 1, // Baslangicta kilidi acik seviye

      // ─── Puzzle Başlat ────────────────────────────────────
      startPuzzle: (definition, puzzleId) => {
        const board = Board.fromDefinition(definition);
        const flowResult = FlowCalculator.calculate(board);
        const validation = FlowValidator.checkWin(board, flowResult);

        set({
          board,
          gridSize: definition.gridSize,
          flowResult,
          flowPaths: flowResult.flowPaths,
          solved: validation.solved,
          status: validation.solved ? 'solved' : 'playing',
          moveCount: 0,
          elapsedSeconds: 0,
          hintsUsedInPuzzle: 0,
          undoStack: [],
          currentPuzzleId: puzzleId ?? null,
          isTutorial: false,     // Normal puzzle'da kapat
          tutorialStep: null,
        });
      },

      // ─── Pratik Başlat ────────────────────────────────────
      startPractice: (gridSize, difficulty) => {
        const generator = new LevelGenerator();
        const definition = generator.generate({ gridSize, difficulty });
        get().startPuzzle(definition, `practice-${Date.now()}`);
      },

      // ─── Günlük Bulmaca Başlat ──────────────────────────────
      startDaily: () => {
        const seed = getTodaysSeed();
        const rng = mulberry32(seed);
        // Seeded bir LevelGenerator yapamadığımız için,
        // seed'den türetilmiş sabit gridSize/difficulty kullanıyoruz.
        const gridSize = 6 + (seed % 3); // 6, 7 ya da 8
        const difficulty = 4 + Math.floor(rng() * 4); // 4-7 arası
        const generator = new LevelGenerator();
        const definition = generator.generate({ gridSize, difficulty, maxAttempts: 500 });
        const todayKey = `daily-${new Date().toISOString().slice(0, 10)}`;
        get().startPuzzle(definition, todayKey);
      },

      // ─── Kampanya Bölümü Başlat ─────────────────────────────
      startCampaignLevel: (levelId) => {
        const levelConfig = CAMPAIGN_LEVELS.find(l => l.id === levelId);
        if (!levelConfig) return;
        
        // Kampanya bölümü her zaman aynı seed (seed = levelId) ile üretilebilir
        // Veya şimdilik rastgele üretelim (gerçekte CampaignGenerator ile sabit üretilir)
        const generator = new LevelGenerator();
        const definition = generator.generate({ 
           gridSize: levelConfig.gridSize, 
           difficulty: levelConfig.difficulty 
        });
        
        get().startPuzzle(definition, `campaign-${levelId}`);
      },

      // ─── Eğitim Bölümü Başlat ───────────────────────────────
      startTutorialLevel: (stepIndex) => {
        const tutorial = TUTORIAL_LEVELS[stepIndex];
        if (!tutorial) return;

        // Önce normal puzzle gibi yükle
        get().startPuzzle(tutorial.definition, tutorial.id);

        // Sonra tutorial bayraklarını aç (startPuzzle varsayılan olarak kapattığı için üzerine yazıyoruz)
        set({
          isTutorial: true,
          tutorialStep: stepIndex
        });
      },

      // ─── Tile Döndür ──────────────────────────────────────
      rotateTile: (row, col) => {
        const { board, status } = get();
        if (!board || status !== 'playing') return;

        // Undo stack'e mevcut durumu kaydet
        const snapshot = board.serialize();
        const pos = new Position(row, col);
        const newBoard = board.rotateTile(pos);

        // Board değişmediyse (kilitli tile) çık
        if (newBoard === board) return;

        // Akışı yeniden hesapla
        const flowResult = FlowCalculator.calculate(newBoard);
        const validation = FlowValidator.checkWin(newBoard, flowResult);

        set(state => {
          const isNewlySolved = !state.solved && validation.solved;
          
          let newUnlockedLevel = state.unlockedLevel;
          let newCoins = state.coins;

          if (isNewlySolved) {
            newCoins += 50; // Standart odul
            
            // Eger bu bir kampanya leveliyse ve son level cozulduyse, sonrakini ac
            let campaignLvlId: number | undefined;
            if (state.currentPuzzleId?.startsWith('campaign-')) {
               campaignLvlId = parseInt(state.currentPuzzleId.split('-')[1]);
               if (campaignLvlId === state.unlockedLevel) {
                   newUnlockedLevel = Math.min(100, state.unlockedLevel + 1);
                   // Ekstra kampanya puani/coin
                   const levelConfig = CAMPAIGN_LEVELS.find(l => l.id === campaignLvlId);
                   if (levelConfig) {
                       newCoins += levelConfig.pointsReward;
                   }
               }
            }

            // Meta Store'a kaydet (Achievement)
            // setTimeout to avoid reacting inline if needed, but synchronous is fine
            setTimeout(() => {
                useMetaStore.getState().recordSolve({
                    seconds: state.elapsedSeconds,
                    usedHints: state.hintsUsedInPuzzle > 0,
                    isPerfect: false,
                    gridSize: state.gridSize,
                    campaignLevelId: campaignLvlId
                });
            }, 0);
          }

          return {
            board: newBoard,
            flowResult,
            flowPaths: flowResult.flowPaths,
            solved: validation.solved,
            status: validation.solved ? 'solved' : state.status,
            moveCount: state.moveCount + 1,
            undoStack: [...state.undoStack.slice(-49), snapshot], // Max 50
            coins: newCoins,
            unlockedLevel: newUnlockedLevel
          };
        });
      },

      // ─── İpucu Kullan ──────────────────────────────────────
      useHint: () => {
        const { board, status, coins } = get();
        if (!board || status !== 'playing') return;

        // Hint ucreti 25 coin olsun
        const HINT_COST = 25;
        if (coins < HINT_COST) return; // Yeterli coin yok

        const { board: newBoard, applied } = board.applyHint();
        if (!applied) return; // Uygulanacak ipucu kalmadi

        const flowResult = FlowCalculator.calculate(newBoard);
        const validation = FlowValidator.checkWin(newBoard, flowResult);

        set((state) => ({
          board: newBoard,
          flowResult,
          flowPaths: flowResult.flowPaths,
          solved: validation.solved,
          status: validation.solved ? 'solved' : state.status,
          coins: state.coins - HINT_COST,
          hintsUsedInPuzzle: state.hintsUsedInPuzzle + 1,
        }));
      },

      // ─── Geri Al ──────────────────────────────────────────
      undoMove: () => {
        const { undoStack, board: currentBoard, status } = get();
        if (undoStack.length === 0 || status !== 'playing' || !currentBoard) return;

        // Son snapshot'u al ve board'u geri yükle
        const newStack = [...undoStack];
        const snapshot = newStack.pop()!; // en son kaydedilen durum

        try {
          const restoredTileConfigs = JSON.parse(snapshot) as import('@flowstate/shared-types').TileConfig[][];
          // Mevcut board'un definition'unu al, sadece tile'ları değiştir
          const def: import('@flowstate/shared-types').PuzzleDefinition = {
            gridSize: currentBoard.gridSize,
            tiles: restoredTileConfigs,
            sources: currentBoard.getSources().map(s => ({ row: s.pos.row, col: s.pos.col, color: s.color })),
            sinks: currentBoard.getSinks().map(s => ({ row: s.pos.row, col: s.pos.col, requiredColors: s.requiredColors })),
          };
          const restoredBoard = Board.fromDefinition(def);
          const flowResult = FlowCalculator.calculate(restoredBoard);
          const validation = FlowValidator.checkWin(restoredBoard, flowResult);

          set(state => ({
            board: restoredBoard,
            flowResult,
            flowPaths: flowResult.flowPaths,
            solved: validation.solved,
            status: validation.solved ? 'solved' : 'playing',
            moveCount: Math.max(0, state.moveCount - 1),
            undoStack: newStack,
          }));
        } catch {
          // Geri yükleme başarısız — sadece stack'i temizle
          set({ undoStack: newStack });
        }
      },

      // ─── Zamanlayıcı ──────────────────────────────────────
      tick: () => {
        const { status } = get();
        if (status !== 'playing') return;
        set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
      },

      // ─── Sıfırla ──────────────────────────────────────────
      reset: () => {
        set({
          board: null,
          flowResult: null,
          flowPaths: [],
          solved: false,
          status: 'idle',
          moveCount: 0,
          elapsedSeconds: 0,
          hintsUsedInPuzzle: 0,
          undoStack: [],
          currentPuzzleId: null,
        });
      },
    }),
    {
      name: 'flowstate-game-storage',
      partialize: (state) => ({ 
        coins: state.coins, 
        unlockedLevel: state.unlockedLevel 
      }),
    }
  )
);
