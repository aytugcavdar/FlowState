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

const PRESETS = [
    { label: 'Başlangıç', grid: 5, difficulty: 2, color: '#22c55e', icon: '🌱' },
    { label: 'Orta', grid: 7, difficulty: 5, color: '#eab308', icon: '⚔️' },
    { label: 'Zor', grid: 9, difficulty: 8, color: '#f97316', icon: '🔥' },
    { label: 'Uzman', grid: 10, difficulty: 10, color: '#ec4899', icon: '💀' }
] as const;

/** Pratik modu seçim paneli */
function PracticeSetup({ onStart }: { onStart: (gridSize: number, difficulty: number) => void }) {
    const lastPracticeDifficulty = useMetaStore(s => s.lastPracticeDifficulty);
    const setLastPracticeDifficulty = useMetaStore(s => s.setLastPracticeDifficulty);
    const stats = useMetaStore(s => s.stats);
    
    const [mode, setMode] = useState<'preset' | 'custom'>('preset');
    const [gridSize, setGridSize] = useState(7);
    const [difficulty, setDifficulty] = useState(lastPracticeDifficulty || 5);

    const handleStartCustom = () => {
        setLastPracticeDifficulty(difficulty);
        onStart(gridSize, difficulty);
    };

    const handleStartPreset = (p: typeof PRESETS[number]) => {
        setLastPracticeDifficulty(p.difficulty);
        onStart(p.grid, p.difficulty);
    };

    return (
        <div className="practice-setup glass-panel neon-border" id="practice-setup">
            <h2>🎯 Pratik Modu</h2>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                <button 
                  className={`btn ${mode === 'preset' ? 'btn-primary' : ''}`} 
                  onClick={() => setMode('preset')}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: mode === 'preset' ? 'var(--color-cyan)' : 'transparent', border: 'none' }}
                >
                    Hazır Şablonlar
                </button>
                <button 
                  className={`btn ${mode === 'custom' ? 'btn-primary' : ''}`} 
                  onClick={() => setMode('custom')}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: mode === 'custom' ? 'var(--color-cyan)' : 'transparent', border: 'none' }}
                >
                    Özel Ayar
                </button>
            </div>

            {mode === 'preset' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {PRESETS.map((p, i) => {
                        const pbKey = `practice-${p.grid}x${p.grid}`;
                        const pb = stats.records[pbKey]?.bestTimeSec;
                        
                        return (
                            <button
                                key={i}
                                className="mode-card glass-panel"
                                style={{ borderColor: pb ? p.color : 'rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', background: 'var(--bg-secondary)' }}
                                onClick={() => handleStartPreset(p)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span style={{ fontSize: '1.3rem' }}>{p.icon}</span>
                                    <span style={{ fontSize: '0.75rem', color: p.color, fontWeight: 600 }}>{p.grid}x{p.grid}</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.label}</h3>
                                {pb ? (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En Hızlı: <strong style={{color: p.color}}>{pb}s</strong></div>
                                ) : (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oynanmadı</div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {mode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
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
                        style={{ marginTop: '1.5rem', width: '100%' }}
                        onClick={handleStartCustom}
                        id="btn-start-practice"
                    >
                        ▶ Özel Oyunu Başlat
                    </button>
                </div>
            )}
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
