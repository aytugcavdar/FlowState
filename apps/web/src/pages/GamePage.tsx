// ============================================================
// GamePage — Oyun sayfası (v3)
// /play → Günlük bulmaca   /practice → Seçimli pratik modu
// ============================================================

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GameBoard, useGameStore } from '@/features/game-board';
import './GamePage.css';

/** Pratik modu seçim paneli */
function PracticeSetup({ onStart }: { onStart: (gridSize: number, difficulty: number) => void }) {
    const [gridSize, setGridSize] = useState(7);
    const [difficulty, setDifficulty] = useState(4);

    return (
        <div className="practice-setup glass-panel neon-border" id="practice-setup">
            <h2>🎯 Pratik Modu</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Izgara boyutu ve zorluk seviyesini seç.
            </p>

            <label className="setup-label">Izgara Boyutu: <strong>{gridSize}×{gridSize}</strong></label>
            <input
                type="range" min={4} max={10} value={gridSize}
                onChange={e => setGridSize(Number(e.target.value))}
                className="setup-slider"
                id="slider-grid"
            />

            <label className="setup-label" style={{ marginTop: '1rem' }}>
                Zorluk: <strong>{'⭐'.repeat(Math.min(difficulty, 5))}{difficulty > 5 ? '+' : ''} ({difficulty}/10)</strong>
            </label>
            <input
                type="range" min={1} max={10} value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="setup-slider"
                id="slider-difficulty"
            />

            <button
                className="btn btn-primary"
                style={{ marginTop: '2rem', width: '100%' }}
                onClick={() => onStart(gridSize, difficulty)}
                id="btn-start-practice"
            >
                ▶ Oyna
            </button>
        </div>
    );
}

export function GamePage() {
    const location = useLocation();
    const isPracticeRoute = location.pathname === '/practice';

    const status = useGameStore(s => s.status);
    const startPractice = useGameStore(s => s.startPractice);
    const startDaily = useGameStore(s => s.startDaily);
    const board = useGameStore(s => s.board);

    // /play → günlük bulmaca, /practice → kullanıcı seçene kadar bekle
    useEffect(() => {
        if (!board && status === 'idle') {
            if (!isPracticeRoute) {
                startDaily();
            }
        }
    }, [board, status, isPracticeRoute, startDaily]);

    // Pratik modunda board yoksa seçim paneli göster
    if (isPracticeRoute && !board) {
        return (
            <div className="game-page" id="game-page">
                <div className="game-area">
                    <PracticeSetup onStart={startPractice} />
                </div>
            </div>
        );
    }

    return (
        <div className="game-page" id="game-page">
            <div className="game-area">
                <GameBoard />
            </div>
        </div>
    );
}

