// ============================================================
// HomePage — Ana sayfa (v4 — Yeniden Tasarım)
// Güçlü hero, animasyonlu demo, temiz kart ızgarası,
// yeni kullanıcı için hoşgeldin paneli, mevcut kullanıcı özeti
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../features/game-board/model/gameStore';
import { useMetaStore } from '../features/meta/model/metaStore';
import './HomePage.css';

/** Gece yarısına kalan süreyi hesaplar */
function useDailyCountdown() {
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

/** PWA install prompt hook */
function usePWAInstall() {
    const [prompt, setPrompt] = useState<Event | null>(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => setInstalled(true));
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (!prompt) return;
        (prompt as any).prompt();
        const { outcome } = await (prompt as any).userChoice;
        if (outcome === 'accepted') setInstalled(true);
        setPrompt(null);
    };

    return { canInstall: !!prompt && !installed, install };
}

/** Günlük puzzle bugün tamamlandı mı? */
function useDailyCompleted() {
    const lastDailyCompletedDate = useMetaStore(s => s.lastDailyCompletedDate);
    const today = new Date().toISOString().slice(0, 10);
    return lastDailyCompletedDate === today;
}

/** Animasyonlu mini oyun demosu */
function MiniDemo() {
    const [rots, setRots] = useState({ r01: 0, r11: 90, r12: 0 });
    const [lit, setLit] = useState(false);

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        function cycle() {
            setRots({ r01: 0, r11: 90, r12: 0 });
            setLit(false);
            timers.push(setTimeout(() => setRots(p => ({ ...p, r01: 270 })), 700));
            timers.push(setTimeout(() => setRots(p => ({ ...p, r11: 180 })), 1400));
            timers.push(setTimeout(() => setRots(p => ({ ...p, r12: 270 })), 2100));
            timers.push(setTimeout(() => setLit(true), 2600));
            timers.push(setTimeout(cycle, 4800));
        }
        const t = setTimeout(cycle, 400);
        timers.push(t);
        return () => timers.forEach(clearTimeout);
    }, []);

    const T = 54;

    const Tile = ({ type, rot, flow }: { type: string; rot: number; flow: boolean }) => {
        const c = flow ? '#22d3ee' : 'rgba(148,163,184,0.3)';
        return (
            <div style={{
                width: T, height: T, borderRadius: 8,
                background: flow ? 'rgba(34,211,238,0.08)' : 'rgba(15,22,41,0.6)',
                border: `1px solid ${flow ? 'rgba(34,211,238,0.4)' : 'rgba(34,211,238,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.5s, background 0.5s',
                boxShadow: flow ? '0 0 12px rgba(34,211,238,0.15)' : 'none',
            }}>
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none"
                    style={{ transform: `rotate(${rot}deg)`, transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    {type === 'src' && <>
                        <line x1="24" y1="24" x2="44" y2="24" stroke={c} strokeWidth="5" strokeLinecap="round" />
                        <circle cx="20" cy="24" r="7" fill="none" stroke={c} strokeWidth="3" />
                        <circle cx="20" cy="24" r="3" fill={c} />
                    </>}
                    {type === 'snk' && <>
                        <line x1="4" y1="24" x2="24" y2="24" stroke={c} strokeWidth="5" strokeLinecap="round" />
                        <circle cx="28" cy="24" r="10" fill="none" stroke={c} strokeWidth={flow ? 4 : 2.5} />
                        <circle cx="28" cy="24" r="4" fill={flow ? c : 'none'} stroke={c} strokeWidth="2" />
                    </>}
                    {type === 'elb' && (
                        <path d="M24,2 L24,24 Q24,24 44,24" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                </svg>
            </div>
        );
    };

    const E = <div style={{ width: T, height: T }} />;

    return (
        <div className="mini-demo">
            <div className="mini-demo-label">NASIL OYNANIR?</div>
            <div className="mini-demo-grid" style={{
                gridTemplateColumns: `repeat(3,${T}px)`,
                borderColor: lit ? 'rgba(34,211,238,0.4)' : 'rgba(34,211,238,0.1)',
                boxShadow: lit ? '0 0 32px rgba(34,211,238,0.2), 0 0 64px rgba(34,211,238,0.08)' : 'none',
            }}>
                {E}
                <Tile type="elb" rot={rots.r01} flow={lit} />
                {E}
                <Tile type="src" rot={0} flow={true} />
                <Tile type="elb" rot={rots.r11} flow={lit} />
                <Tile type="elb" rot={rots.r12} flow={lit} />
                {E}
                <Tile type="snk" rot={90} flow={lit} />
                {E}
            </div>
            <div className="mini-demo-status" style={{ color: lit ? 'var(--color-cyan)' : 'var(--text-muted)' }}>
                {lit ? '✓ AKIŞ TAMAMLANDI' : "TİLE'LARI DÖNDÜR · AKIŞI YÖNLENDİR"}
            </div>
        </div>
    );
}

/** Kullanıcı özeti — sadece en az 1 bulmaca çözdüyse göster */
function ProgressPanel() {
    const stats = useMetaStore(s => s.stats);
    const xp = useMetaStore(s => s.xp);
    const unlockedLevel = useMetaStore(s => s.stats.highestCampaignLevel);
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
    const board = useGameStore(s => s.board);
    const status = useGameStore(s => s.status);

    const isCampaignActive = board && status === 'playing' && currentPuzzleId?.startsWith('campaign-');
    const campaignId = isCampaignActive ? parseInt(currentPuzzleId!.split('-')[1]) : null;

    const level = Math.floor(1 + Math.sqrt(xp / 50));
    const xpForNext = Math.pow(level, 2) * 50;
    const xpForCur = Math.pow(level - 1, 2) * 50;
    const xpPct = Math.min(100, Math.round(((xp - xpForCur) / (xpForNext - xpForCur)) * 100));

    if (stats.totalSolved === 0) return null;

    return (
        <div className="progress-panel glass-panel">
            {/* Devam et — yarım kampanya */}
            {isCampaignActive && (
                <Link to="/play" state={{ fromCampaign: true }} className="continue-banner">
                    <span className="continue-icon">▶️</span>
                    <div className="continue-text">
                        <div className="continue-label">DEVAM ET</div>
                        <div className="continue-sub">Kampanya Bölüm {campaignId} — yarım kaldı</div>
                    </div>
                    <span className="continue-arrow">→</span>
                </Link>
            )}

            {/* Özet grid */}
            <div className="progress-stats">
                {[
                    { v: `Sv.${level}`, l: 'Seviye' },
                    { v: stats.totalSolved, l: 'Çözüm' },
                    { v: `🔥 ${stats.currentStreak}`, l: 'Seri' },
                    { v: `${unlockedLevel}/100`, l: 'Kampanya' },
                ].map(s => (
                    <div key={s.l} className="progress-stat-item">
                        <div className="progress-stat-value">{s.v}</div>
                        <div className="progress-stat-label">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* XP bar */}
            <div className="xp-section">
                <div className="xp-labels">
                    <span className="xp-level-label">SEVİYE {level}</span>
                    <span className="xp-count">{xp} / {xpForNext} XP</span>
                </div>
                <div className="xp-bar-track">
                    <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                </div>
            </div>
        </div>
    );
}

/** Yeni kullanıcı için hoşgeldin kartı */
function WelcomeCard({ onStart }: { onStart: () => void }) {
    return (
        <div className="welcome-card glass-panel">
            <div className="welcome-emoji">🌊</div>
            <div className="welcome-text">
                <h2 className="welcome-title">FlowState'e Hoş Geldin!</h2>
                <p className="welcome-desc">Tile'ları döndür, akışları yönlendir, bulmacayı çöz. Eğitimle başla!</p>
            </div>
            <button className="btn btn-primary welcome-btn" onClick={onStart} id="btn-start-tutorial">
                🎓 Eğitime Başla
            </button>
        </div>
    );
}

export function HomePage() {
    const navigate = useNavigate();
    const startTutorialLevel = useGameStore(s => s.startTutorialLevel);
    const { canInstall, install } = usePWAInstall();
    const countdown = useDailyCountdown();

    const stats = useMetaStore(s => s.stats);
    const dailyCompleted = useDailyCompleted();
    const weeklyChallenge = useMetaStore(s => s.weeklyChallenge);
    const isNewUser = stats.totalSolved === 0;

    const handleStartTutorial = (e?: React.MouseEvent) => {
        e?.preventDefault();
        startTutorialLevel(0);
        navigate('/play');
    };

    return (
        <div className="home-page animate-fade-in" id="home-page">

            {/* ─── PWA Install Banner ───────────────────────────── */}
            {canInstall && (
                <div className="pwa-banner glass-panel" id="pwa-install-banner">
                    <span className="pwa-icon">📲</span>
                    <div className="pwa-text">
                        <strong>Ana ekrana ekle</strong>
                        <span>Offline oyna, daha hızlı aç</span>
                    </div>
                    <button className="btn btn-primary pwa-btn" onClick={install} id="btn-pwa-install">
                        Yükle
                    </button>
                </div>
            )}

            {/* ─── Hero ────────────────────────────────────────── */}
            <section className="hero">
                <MiniDemo />
                <div className="hero-text">
                    <h1 className="hero-title" id="hero-title">
                        <span className="hero-icon">⚡</span>
                        FlowState
                    </h1>
                    <p className="hero-subtitle">
                        Tile'ları döndür · Akışları yönlendir · Bulmacayı çöz
                    </p>
                </div>
            </section>

            {/* ─── Yeni kullanıcı hoşgeldin veya ilerleme paneli ─ */}
            {isNewUser ? (
                <WelcomeCard onStart={handleStartTutorial} />
            ) : (
                <ProgressPanel />
            )}

            {/* ─── Haftalık Challenge ───────────────────────────── */}
            {weeklyChallenge && (
                <section className="weekly-challenge glass-panel" style={{
                    borderColor: weeklyChallenge.completed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(250, 204, 21, 0.4)',
                    width: '100%',
                }}>
                    <div className="weekly-header">
                        <span className="weekly-icon">{weeklyChallenge.completed ? '🏆' : '📅'}</span>
                        <div className="weekly-info">
                            <h3 className="weekly-title">Haftalık Challenge</h3>
                            <p className="weekly-desc">7 gün üst üste günlük bulmaca çöz</p>
                        </div>
                        <div className="weekly-count">
                            <div className="weekly-count-val">{weeklyChallenge.progress}/7</div>
                            {weeklyChallenge.completed && (
                                <div className="weekly-done-tag">✓ TAMAMLANDI</div>
                            )}
                        </div>
                    </div>
                    <div className="weekly-bar-track">
                        <div className="weekly-bar-fill" style={{
                            width: `${(weeklyChallenge.progress / 7) * 100}%`,
                            background: weeklyChallenge.completed
                                ? 'linear-gradient(to right, var(--color-green), var(--color-cyan))'
                                : 'linear-gradient(to right, var(--color-yellow), var(--color-magenta))',
                        }} />
                    </div>
                    {weeklyChallenge.completed && (
                        <div className="weekly-reward">
                            🎉 +500 XP ve +250 Jeton kazandın!
                        </div>
                    )}
                </section>
            )}

            {/* ─── Mod Kartları ─────────────────────────────────── */}
            <section className="mode-section" id="mode-cards">
                {/* Günlük Bulmaca — Öne Çıkarılmış */}
                <Link
                    to="/play"
                    className={`mode-card-featured glass-panel neon-border ${dailyCompleted ? 'mode-completed' : ''}`}
                    id="card-daily"
                >
                    <div className="mode-featured-icon">{dailyCompleted ? '🏆' : '📅'}</div>
                    <div className="mode-featured-body">
                        <h2 className="mode-featured-title">
                            Günlük Bulmaca
                            {dailyCompleted && <span className="done-badge">✅ Tamamlandı</span>}
                        </h2>
                        {dailyCompleted ? (
                            <div className="daily-countdown-wrap">
                                <div className="daily-countdown-label">Yeni bulmacaya kalan</div>
                                <div className="daily-countdown">{countdown}</div>
                            </div>
                        ) : (
                            <>
                                <p className="mode-featured-desc">
                                    Her gün değişen sabit puzzle. Herkes aynı bulmacayı çözer!
                                </p>
                                <div className="daily-meta">
                                    <span className="daily-meta-item">🌍 Herkesle aynı bulmaca</span>
                                    <span className="daily-meta-sep">·</span>
                                    <span className="daily-meta-item">⏰ {countdown}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <span className="mode-badge">{dailyCompleted ? 'Bitti' : 'Oyna'}</span>
                </Link>

                {/* 2×3 grid — Diğer modlar */}
                <div className="mode-grid">
                    <a href="#" onClick={handleStartTutorial}
                        className="mode-card glass-panel"
                        style={{ borderColor: 'rgba(250,204,21,0.3)' }}
                        id="card-tutorial"
                    >
                        <div className="mode-icon">🎓</div>
                        <h2 className="mode-title" style={{ color: 'var(--color-yellow)' }}>Nasıl Oynanır?</h2>
                        <p className="mode-desc">Adım adım eğitim</p>
                        <span className="mode-badge" style={{ borderColor: 'var(--color-yellow)', color: 'var(--color-yellow)' }}>Yeni</span>
                    </a>

                    <Link to="/practice" className="mode-card glass-panel" id="card-practice">
                        <div className="mode-icon">🎯</div>
                        <h2 className="mode-title">Pratik Modu</h2>
                        <p className="mode-desc">Sonsuz bulmaca, kendi hızında</p>
                        <span className="mode-badge">Sınırsız</span>
                    </Link>

                    <Link to="/timeattack" className="mode-card glass-panel" id="card-timeattack"
                        style={{ borderColor: 'rgba(232,121,249,0.3)' }}>
                        <div className="mode-icon">⚡</div>
                        <h2 className="mode-title" style={{ color: 'var(--color-magenta)' }}>Hız Modu</h2>
                        <p className="mode-desc">120 saniyede kaç tane?</p>
                        <span className="mode-badge" style={{ borderColor: 'var(--color-magenta)', color: 'var(--color-magenta)' }}>Yeni</span>
                    </Link>

                    <Link to="/campaign" className="mode-card glass-panel" id="card-campaign">
                        <div className="mode-icon">🗺️</div>
                        <h2 className="mode-title">Yolculuk</h2>
                        <p className="mode-desc">100 bölümlük macera</p>
                        <span className="mode-badge">Sv {stats.highestCampaignLevel}/100</span>
                    </Link>

                    <Link to="/leaderboard" className="mode-card glass-panel" id="card-leaderboard"
                        style={{ borderColor: 'rgba(250,204,21,0.3)' }}>
                        <div className="mode-icon">🏅</div>
                        <h2 className="mode-title" style={{ color: 'var(--color-yellow)' }}>Sıralama</h2>
                        <p className="mode-desc">En iyiler arasına gir</p>
                        <span className="mode-badge" style={{ borderColor: 'var(--color-yellow)', color: 'var(--color-yellow)' }}>Top 10</span>
                    </Link>

                    <Link to="/store" className="mode-card glass-panel" id="card-store"
                        style={{ borderColor: 'rgba(250,204,21,0.2)' }}>
                        <div className="mode-icon">🛒</div>
                        <h2 className="mode-title" style={{ color: 'var(--color-yellow)' }}>Mağaza</h2>
                        <p className="mode-desc">Yeni temalar ve ipuçları</p>
                        <span className="mode-badge" style={{ borderColor: 'var(--color-yellow)', color: 'var(--color-yellow)' }}>🪙 Shop</span>
                    </Link>
                </div>
            </section>

        </div>
    );
}
