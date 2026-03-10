// ============================================================
// GamePage — Oyun sayfası (v3)
// /play → Günlük bulmaca   /practice → Seçimli pratik modu
// ============================================================

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GameBoard, useGameStore } from '@/features/game-board';
import './GamePage.css';

/** Bugünkü günlük bulmaca daha önce çözüldü mü? */
function useDailyAlreadySolved() {
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
    const status = useGameStore(s => s.status);
    const todayKey = `daily-${new Date().toISOString().slice(0, 10)}`;
    // Bugünün bulmacası zaten çözüldüyse true
    return currentPuzzleId === todayKey && status === 'solved';
}

/** Gece yarısına kalan süre */
function useCountdown() {
    const getRemaining = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    const [time, setTime] = useState(getRemaining);
    useEffect(() => {
        const id = setInterval(() => setTime(getRemaining()), 1000);
        return () => clearInterval(id);
    }, []);
    return time;
}

/** Günlük tamamlandı ekranı */
function DailyCompletedScreen() {
    const countdown = useCountdown();
    return (
        <div className="daily-done-screen glass-panel neon-border" id="daily-done-screen">
            <div style={{ fontSize: '3rem' }}>✅</div>
            <h2 style={{ color: 'var(--color-cyan)', margin: '0.5rem 0' }}>Bugünü Tamamladın!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Yeni bulmaca için geri sayım:
            </p>
            <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--color-magenta)',
                letterSpacing: '0.1em',
            }}>
                {countdown}
            </div>
        </div>
    );
}

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
    const reset = useGameStore(s => s.reset);
    const dailyAlreadySolved = useDailyAlreadySolved();

    // Rota değiştiğinde board'ı sıfırla (daily ↔ practice arası geçiş)
    useEffect(() => {
        reset();
    }, [isPracticeRoute]); // eslint-disable-line react-hooks/exhaustive-deps

    // /play → günlük bulmaca (eğer bugün çözülmediyse), /practice → bekle
    useEffect(() => {
        if (!board && status === 'idle') {
            if (!isPracticeRoute && !dailyAlreadySolved) {
                startDaily();
            }
        }
    }, [board, status, isPracticeRoute, startDaily, dailyAlreadySolved]);

    // Günlük zaten çözüldüyse tamamlandı ekranı göster
    if (!isPracticeRoute && dailyAlreadySolved) {
        return (
            <div className="game-page" id="game-page">
                <div className="game-area">
                    <DailyCompletedScreen />
                </div>
            </div>
        );
    }

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
