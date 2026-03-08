// ============================================================
// HomePage — Ana sayfa (v3)
// Streak banner, istatistik özeti, günlük durum + PWA install
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore, ThemeId } from '../features/game-board/model/themeStore';
import { useGameStore } from '../features/game-board/model/gameStore';
import { useMetaStore } from '../features/meta/model/metaStore';
import './HomePage.css';

/** Gece yarısına kalan süreyi hesaplar — her saniye güncellenir */
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

/** Gerçek global günlük oyun sayacı — countapi.xyz ücretsiz servis */
function usePlayCount() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // '20260308'
        const key = `flowstate-daily-${today}`;
        const namespace = 'flowstate-game';

        // Önce hit at (sayacı artır + değeri al)
        fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`)
            .then(r => r.json())
            .then(data => setCount(data.value ?? null))
            .catch(() => setCount(null)); // Offline → gösterme
    }, []);

    return count;
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
    // gameStore persist'ten okunan currentPuzzleId ile karşılaştır
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
    const status = useGameStore(s => s.status);
    const todayKey = `daily-${new Date().toISOString().slice(0, 10)}`;
    return currentPuzzleId === todayKey && status === 'solved';
}

export function HomePage() {
    const { activeTheme, setTheme } = useThemeStore();
    const navigate = useNavigate();
    const startTutorialLevel = useGameStore(s => s.startTutorialLevel);
    const { canInstall, install } = usePWAInstall();
    const countdown = useDailyCountdown();
    const playCount = usePlayCount();

    // Meta stats
    const stats = useMetaStore(s => s.stats);
    const xp = useMetaStore(s => s.xp);
    const dailyCompleted = useDailyCompleted();

    const themes: { id: ThemeId; name: string; icon: string }[] = [
        { id: 'theme-cyberpunk', name: 'Cyberpunk', icon: '⚡' },
        { id: 'theme-plumber', name: 'Tesisatçı', icon: '🔧' },
        { id: 'theme-laser', name: 'Lazer', icon: '✨' },
    ];

    const handleStartTutorial = (e: React.MouseEvent) => {
        e.preventDefault();
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
                <h1 className="hero-title" id="hero-title">
                    <span className="hero-icon">⚡</span>
                    FlowState
                </h1>
                <p className="hero-subtitle">
                    Tile'ları döndür · Akışları yönlendir · Bulmacayı çöz
                </p>
            </section>

            {/* ─── Kullanıcı Özet Kartı ────────────────────────── */}
            {stats.totalSolved > 0 && (
                <section className="user-summary glass-panel neon-border" id="user-summary">
                    <div className="summary-item">
                        <span className="summary-value">🔥 {stats.currentStreak}</span>
                        <span className="summary-label">Günlük Seri</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item">
                        <span className="summary-value">{stats.totalSolved}</span>
                        <span className="summary-label">Çözüm</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item">
                        <span className="summary-value">⭐ {xp}</span>
                        <span className="summary-label">XP</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-item">
                        <span className="summary-value">
                            {stats.fastestSolveSeconds < 9999
                                ? `${stats.fastestSolveSeconds}s`
                                : '—'}
                        </span>
                        <span className="summary-label">En Hızlı</span>
                    </div>
                </section>
            )}

            {/* ─── Mod Kartları ─────────────────────────────────── */}
            <section className="mode-cards stagger-children" id="mode-cards">
                {/* Günlük Bulmaca — Öne Çıkarılmış */}
                <Link
                    to="/play"
                    className={`mode-card mode-card-featured glass-panel neon-border ${dailyCompleted ? 'mode-completed' : ''}`}
                    id="card-daily"
                >
                    <div className="mode-icon">📅</div>
                    <div className="mode-card-body">
                        <h2 className="mode-title">
                            Günlük Bulmaca
                            {dailyCompleted && <span className="done-badge">✅ Tamamlandı</span>}
                        </h2>
                        <p className="mode-desc">
                            Her gün değişen sabit puzzle. Herkes aynı bulmacayı çözer!
                        </p>
                        <div className="daily-meta">
                            {playCount !== null && (
                                <span className="daily-meta-item">👥 {playCount.toLocaleString('tr-TR')} oynadı</span>
                            )}
                            {playCount !== null && <span className="daily-meta-sep">·</span>}
                            <span className="daily-meta-item">⏰ {countdown}</span>
                        </div>
                    </div>
                    <span className="badge">{dailyCompleted ? 'Bitti' : 'Oyna'}</span>
                </Link>

                <div className="mode-row">
                    <a href="#" onClick={handleStartTutorial}
                        className="mode-card glass-panel"
                        style={{ borderColor: 'rgba(250,204,21,0.3)' }}
                        id="card-tutorial"
                    >
                        <div className="mode-icon">🎓</div>
                        <h2 className="mode-title" style={{ color: 'var(--color-yellow)' }}>Nasıl Oynanır?</h2>
                        <p className="mode-desc">Adım adım eğitim</p>
                        <span className="badge" style={{ borderColor: 'var(--color-yellow)', color: 'var(--color-yellow)' }}>Yeni</span>
                    </a>

                    <Link to="/practice" className="mode-card glass-panel" id="card-practice">
                        <div className="mode-icon">🎯</div>
                        <h2 className="mode-title">Pratik Modu</h2>
                        <p className="mode-desc">Sonsuz bulmaca, kend hızında</p>
                        <span className="badge">Sınırsız</span>
                    </Link>

                    <Link to="/campaign" className="mode-card glass-panel" id="card-campaign">
                        <div className="mode-icon">🗺️</div>
                        <h2 className="mode-title">Yolculuk</h2>
                        <p className="mode-desc">100 bölümlük yolculuk</p>
                        <span className="badge">
                            Sv {stats.highestCampaignLevel}/100
                        </span>
                    </Link>
                </div>
            </section>

            {/* ─── Tema Seçimi ──────────────────────────────────── */}
            <section className="theme-selector glass-panel" id="theme-selector">
                <h2 className="section-title">🎨 Tema</h2>
                <div className="theme-buttons">
                    {themes.map(t => (
                        <button
                            key={t.id}
                            className={`theme-btn ${activeTheme === t.id ? 'active' : ''}`}
                            onClick={() => setTheme(t.id)}
                            id={`theme-${t.id}`}
                        >
                            <span>{t.icon}</span>
                            <span>{t.name}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
