// ============================================================
// GamePage — Oyun sayfası (v4)
// /play → Günlük bulmaca   /practice → Seçimli pratik modu
// ============================================================

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GameBoard, useGameStore } from '@/features/game-board';
import { useMetaStore } from '@/features/meta/model/metaStore';
import './GamePage.css';

/** Gece yarısına kalan süre */
function useCountdown() {
    const getRemaining = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
        return {
            h: Math.floor(diff / 3600),
            m: Math.floor((diff % 3600) / 60),
            s: diff % 60,
        };
    };
    const [time, setTime] = useState(getRemaining);
    useEffect(() => {
        const id = setInterval(() => setTime(getRemaining()), 1000);
        return () => clearInterval(id);
    }, []);
    return time;
}

/** Premium günlük tamamlandı ekranı */
function DailyCompletedScreen() {
    const { h, m, s } = useCountdown();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stats = useMetaStore(st => st.stats);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '2rem 1rem',
            width: '100%',
            maxWidth: '420px',
            margin: '0 auto',
        }}>
            {/* Trophy */}
            <div style={{ fontSize: '4rem', lineHeight: 1, filter: 'drop-shadow(0 0 24px rgba(250,204,21,0.6))' }}>
                🏆
            </div>

            <div style={{ textAlign: 'center' }}>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.4rem',
                    color: 'var(--color-yellow)',
                    margin: 0,
                    letterSpacing: '0.05em',
                }}>
                    BUGÜNÜ TAMAMLADIN!
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
                    Yarın seni yeni bir meydan okuma bekliyor.
                </p>
            </div>

            {/* Stats row */}
            {stats.totalSolved > 0 && (
                <div className="glass-panel" style={{
                    display: 'flex',
                    gap: '1.5rem',
                    padding: '1rem 2rem',
                    borderRadius: 'var(--radius-md)',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-cyan)', fontWeight: 900 }}>
                            🔥 {stats.currentStreak}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Günlük Seri</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-cyan)', fontWeight: 900 }}>
                            {stats.totalSolved}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Toplam</div>
                    </div>
                </div>
            )}

            {/* Countdown */}
            <div className="glass-panel neon-border" style={{
                padding: '1.25rem 2rem',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                width: '100%',
            }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Yeni bulmacaya kalan
                </div>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: 'var(--color-magenta)',
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 0 12px rgba(232,121,249,0.5))',
                }}>
                    {pad(h)}:{pad(m)}:{pad(s)}
                </div>
            </div>
        </div>
    );
}

/** Pratik modu seçim paneli */
function PracticeSetup({ onStart }: { onStart: (gridSize: number, difficulty: number) => void }) {
    const [gridSize, setGridSize] = useState(7);
    const [difficulty, setDifficulty] = useState(5);

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
    // Kampanya sayfasından mı gelindi?
    const fromCampaign = (location.state as any)?.fromCampaign === true;

    const status = useGameStore(s => s.status);
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
    const startPractice = useGameStore(s => s.startPractice);
    const startDaily = useGameStore(s => s.startDaily);
    const board = useGameStore(s => s.board);
    const reset = useGameStore(s => s.reset);

    // Persisted daily completion — survives reset()
    const lastDailyCompletedDate = useMetaStore(s => s.lastDailyCompletedDate);
    const markDailyCompleted = useMetaStore(s => s.markDailyCompleted);

    const today = new Date().toISOString().slice(0, 10);
    const dailyAlreadySolved = lastDailyCompletedDate === today;

    // Kampanya modu kontrolü
    const isCampaignMode = currentPuzzleId?.startsWith('campaign-') || fromCampaign;

    // Günlük çözülünce metaStore'a kaydet
    useEffect(() => {
        if (status === 'solved' && currentPuzzleId === `daily-${today}` && !dailyAlreadySolved) {
            markDailyCompleted();
        }
    }, [status, currentPuzzleId, today, dailyAlreadySolved, markDailyCompleted]);

    // Rota değiştiğinde board'ı sıfırla (daily ↔ practice arası geçiş)
    // Kampanya modundaysa reset yapma
    useEffect(() => {
        if (!isCampaignMode) {
            reset();
        }
    }, [isPracticeRoute]); // eslint-disable-line react-hooks/exhaustive-deps

    // /play → günlük bulmaca (bugün çözülmediyse)
    // Kampanya modundaysa günlük başlatma
    useEffect(() => {
        if (!board && status === 'idle' && !isCampaignMode) {
            if (!isPracticeRoute && !dailyAlreadySolved) {
                startDaily();
            }
        }
    }, [board, status, isPracticeRoute, startDaily, dailyAlreadySolved, isCampaignMode]);

    // Günlük zaten tamamlandıysa VE campaign/practice değilse, kazanma ekranı kapatıldıktan sonra tamamlandı ekranı göster
    const isCampaignOrPractice = currentPuzzleId?.startsWith('campaign-') || currentPuzzleId?.startsWith('practice-');
    // Board varsa ve campaign/practice ise, günlük tamamlama ekranını gösterme
    const shouldShowDailyCompleted = !isPracticeRoute && dailyAlreadySolved && !isCampaignOrPractice && status !== 'playing' && status !== 'solved' && !board;
    if (shouldShowDailyCompleted) {
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
