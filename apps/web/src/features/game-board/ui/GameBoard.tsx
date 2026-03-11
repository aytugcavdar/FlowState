// ============================================================
// GameBoard — Oyun tahtası bileşeni (v2.0)
// Tile ızgarası + akış overlay + ses + animasyonlar.
// Büyük alt bileşenler kendi dosyalarına taşındı:
//   - TileCell.tsx
//   - hooks/useKeyboardNavigation.ts
//   - hooks/useGameTimer.ts
//   - hooks/useGameMode.ts
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../model/gameStore';
import { useThemeStore } from '../model/themeStore';
import { useMetaStore } from '@/features/meta/model/metaStore';
import { TileCell } from './TileCell';
import { FlowOverlay } from './FlowOverlay';
import { WinModal } from './WinModal';
import { useSound } from '@/shared/hooks/useSound';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameMode } from '../hooks/useGameMode';
import { TUTORIAL_LEVELS } from '@flowstate/game-engine';
import './GameBoard.css';

const DIFF_LABEL: Record<number, string> = {
    1: '⬜ Başlangıç', 2: '⬜ Başlangıç', 3: '🟩 Kolay',
    4: '🟩 Kolay', 5: '🟨 Orta', 6: '🟨 Orta',
    7: '🟧 Zor', 8: '🟧 Zor', 9: '🟥 Uzman',
    10: '💀 Acımasız',
};

/** Döndürme animasyonu için son tıklanan pozisyon */
interface ClickedTile {
    row: number;
    col: number;
    timestamp: number;
}

/** Ana oyun tahtası bileşeni */
export function GameBoard() {
    const location = useLocation();
    const isTimeAttack = location.pathname === '/timeattack';
    
    const board = useGameStore(s => s.board);
    const gridSize = useGameStore(s => s.gridSize);
    const flowResult = useGameStore(s => s.flowResult);
    const flowPaths = useGameStore(s => s.flowPaths);
    const status = useGameStore(s => s.status);
    const moveCount = useGameStore(s => s.moveCount);
    const elapsedSeconds = useGameStore(s => s.elapsedSeconds);
    const solved = useGameStore(s => s.solved);
    const rotateTile = useGameStore(s => s.rotateTile);
    const undoMove = useGameStore(s => s.undoMove);
    const useHint = useGameStore(s => s.useHint);
    const tick = useGameStore(s => s.tick);
    const startPractice = useGameStore(s => s.startPractice);
    const startCampaignLevel = useGameStore(s => s.startCampaignLevel);
    const startTutorialLevel = useGameStore(s => s.startTutorialLevel);
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
    const isTutorial = useGameStore(s => s.isTutorial);
    const tutorialStep = useGameStore(s => s.tutorialStep);
    const currentDifficulty = useGameStore(s => s.currentDifficulty);

    const { isDaily } = useGameMode();
    const activeTheme = useThemeStore(s => s.activeTheme);

    const { playRotate, playWin, playClick } = useSound();
    const haptic = useHaptic();
    const [clickedTile, setClickedTile] = useState<ClickedTile | null>(null);
    const [copyDone, setCopyDone] = useState(false);
    const prevSolved = useRef(false);

    // Dynamic grid size
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 700);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Zamanlayıcı
    useGameTimer(status, tick);

    // Kazanma sesi
    useEffect(() => {
        if (solved && !prevSolved.current) {
            playWin();
            haptic.win();
        }
        prevSolved.current = solved;
    }, [solved, playWin, haptic]);

    /** Tile tıklama */
    const handleTileClick = useCallback((row: number, col: number) => {
        playRotate();
        haptic.tapTile();
        setClickedTile({ row, col, timestamp: Date.now() });
        setCursorPos({ row, col });
        rotateTile(row, col);
        setTimeout(() => setClickedTile(null), 300);
    }, [rotateTile, playRotate, haptic]);

    // allTiles: board varsa hesapla, yoksa boş dizi
    const allTiles = board?.getAllTiles() ?? [];

    // Klavye navigasyonu
    const { cursor: keyboardCursor, setCursor: setCursorPos } = useKeyboardNavigation({
        status,
        gridSize,
        allTiles,
        onRotate: handleTileClick,
        puzzleId: currentPuzzleId,
    });

    if (!board) {
        return (
            <div className="game-board-empty glass-panel neon-border" id="game-board-empty">
                <div className="empty-content">
                    <span className="empty-icon">🎯</span>
                    <p className="empty-message">Bir bulmaca seçin veya pratik başlatın</p>
                </div>
            </div>
        );
    }

    /** Süre formatla */
    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    /** İlerleme yüzdesi — kaç akış sink'e ulaştı */
    const sinks = board.getSinks();
    const satisfiedSinks = sinks.filter(sink => {
        const key = `${sink.pos.row},${sink.pos.col}`;
        const flowInfo = flowResult?.tileFlows.get(key);
        if (!flowInfo) return false;
        return sink.requiredColors.every(c => flowInfo.colors.includes(c));
    }).length;
    const progressPercent = sinks.length > 0 ? Math.round((satisfiedSinks / sinks.length) * 100) : 0;

    // Calculate dynamic tile size — boardPadding must match .game-board CSS padding
    const maxBoardWidth = Math.min(windowWidth - 32, 700);
    const gap = 4;
    const boardPadding = windowWidth <= 480 ? 8 : 16;
    const availableWidth = maxBoardWidth - boardPadding * 2;
    const calculatedTileSize = Math.floor((availableWidth - (gridSize - 1) * gap) / gridSize);
    const tileSize = Math.max(26, Math.min(90, calculatedTileSize));

    return (
        <div className="game-board-container animate-fade-in" id="game-board-container">
            {/* ─── iOS Haptic Uyarısı ─────────────────────────────── */}
            {haptic.isIOSWithoutVibrate && (
                <div style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgb(251, 191, 36)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '12px',
                    fontSize: '0.85rem',
                    color: 'rgb(251, 191, 36)',
                    textAlign: 'center',
                }}>
                    ⚠️ iOS cihazlarda titreşim geri bildirimi desteklenmiyor
                </div>
            )}

            {/* ─── İstatistik Çubuğu ─────────────────────────────── */}
            <div className="game-stats glass-panel" id="game-stats">
                <div className="game-stat">
                    <span className="game-stat-icon">⏱</span>
                    <span className="game-stat-value">{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="game-stat">
                    <span className="game-stat-icon">🔄</span>
                    <span className="game-stat-value">{moveCount}</span>
                </div>
                <div className="game-stat progress-stat">
                    <span className="game-stat-icon">💧</span>
                    <div className="progress-ring">
                        <svg width="28" height="28" viewBox="0 0 28 28">
                            <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="3" />
                            <circle
                                cx="14" cy="14" r="11" fill="none"
                                stroke="var(--color-cyan)" strokeWidth="3"
                                strokeDasharray={`${progressPercent * 0.69} 69`}
                                strokeLinecap="round"
                                transform="rotate(-90 14 14)"
                                style={{ transition: 'stroke-dasharray 0.4s ease-out' }}
                            />
                        </svg>
                        <span className="progress-text">{progressPercent}%</span>
                    </div>
                </div>
                <div className="game-stat status-indicator">
                    <span className={`status-dot ${status}`} />
                    <span className="game-stat-value">
                        {status === 'playing' ? 'Oynuyor' :
                            status === 'solved' ? '✨ Çözüldü!' :
                                status === 'idle' ? 'Bekliyor' : status}
                    </span>
                </div>
                {currentDifficulty && (
                    <div className="game-stat" title="Zorluk">
                        <span className="game-stat-value" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {DIFF_LABEL[currentDifficulty] || `Zorluk: ${currentDifficulty}`}
                        </span>
                    </div>
                )}
            </div>

            {/* ─── Eğitim Rehberi ──────────────────────────────────── */}
            {isTutorial && tutorialStep !== null && (
                <div style={{ background: 'rgba(34, 211, 238, 0.15)', border: '1px solid var(--color-cyan)', padding: '12px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-cyan)' }}>{TUTORIAL_LEVELS[tutorialStep].title}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {TUTORIAL_LEVELS[tutorialStep].hint}
                    </p>
                </div>
            )}

            {/* ─── Oyun Tahtası ──────────────────────────────────── */}
            <div className="board-wrapper" style={{ position: 'relative' }}>
                <div
                    className={`game-board glass-panel neon-border ${solved ? 'solved' : ''}`}
                    data-testid="game-board"
                    id="game-board"
                    style={{
                        '--tile-size': `${tileSize}px`,
                        gridTemplateColumns: `repeat(${gridSize}, var(--tile-size))`,
                        gridTemplateRows: `repeat(${gridSize}, var(--tile-size))`,
                    } as React.CSSProperties}
                >
                    {allTiles.map(({ pos, tile }) => {
                        const flowColor = flowResult?.getFlow(pos) ?? null;
                        const justClicked = clickedTile?.row === pos.row && clickedTile?.col === pos.col;
                        const isKeyboardSelected = keyboardCursor?.row === pos.row && keyboardCursor?.col === pos.col;

                        return (
                            <TileCell
                                key={`${pos.row}-${pos.col}`}
                                row={pos.row}
                                col={pos.col}
                                type={tile.type}
                                rotation={tile.rotation}
                                flowColor={flowColor}
                                locked={tile.locked}
                                isHinted={tile.isHinted || false}
                                justClicked={justClicked}
                                isKeyboardSelected={isKeyboardSelected}
                                theme={activeTheme}
                                onClick={() => handleTileClick(pos.row, pos.col)}
                            />
                        );
                    })}
                </div>

                {/* Akış yolu overlay */}
                <FlowOverlay
                    flowPaths={flowPaths}
                    gridSize={gridSize}
                    tileSize={tileSize}
                    gap={gap}
                    boardPadding={boardPadding}
                />
            </div>

            {/* ─── Kontrol Butonları ─────────────────────────────── */}
            <div className="game-controls" id="game-controls">
                {/* Günlük modda tüm kontrol butonları gizlenir */}
                {!isDaily && (
                    <>
                        <button
                            className="btn hint-btn"
                            onClick={() => { playClick(); useHint(); }}
                            disabled={status !== 'playing'}
                            title="İpucu Al"
                        >
                            💡 İpucu
                        </button>
                        <button
                            className="btn"
                            onClick={() => { playClick(); undoMove(); }}
                            disabled={status !== 'playing'}
                            id="btn-undo"
                        >
                            ↩ Geri Al
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                playClick();
                                // Son seçilen zorluğu kullan
                                const lastDifficulty = useMetaStore.getState().lastPracticeDifficulty;
                                startPractice(gridSize, lastDifficulty);
                            }}
                            id="btn-new-puzzle"
                        >
                            🔀 Yeni Bulmaca
                        </button>
                    </>
                )}
            </div>

            {/* ─── Kazanma Modalı ────────────────────────────────── */}
            {/* TimeAttack modunda WinModal gösterme */}
            {!isTimeAttack && <WinModal />}
        </div>
    );
}
