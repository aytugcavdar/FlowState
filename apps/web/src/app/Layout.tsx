// ============================================================
// Layout — Uygulama genel düzeni (v1.5)
// Üst gezinme çubuğu + ana içerik alanı.
// Gelişmiş navigasyon (kampanya, liderlik, başarımlar).
// ============================================================

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMetaStore } from '../features/meta/model/metaStore';
import { useThemeStore } from '../features/game-board/model/themeStore';
import { AchievementToast } from '../shared/ui/AchievementToast';
import { FloatingReward } from '../shared/ui/FloatingReward';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSound } from './store';
import type { RootState } from './store';
import './Layout.css';
import './themes.css';

export function Layout() {
    const location = useLocation();
    const xp = useMetaStore(s => s.xp);
    const coins = useMetaStore(s => s.coins);
    const streakCurrent = useMetaStore(s => s.stats.currentStreak);

    const dispatch = useDispatch();
    const soundEnabled = useSelector((s: RootState) => s.settings.soundEnabled);

    const [displayCoins, setDisplayCoins] = useState(coins);
    const [coinAnim, setCoinAnim] = useState(false);

    useEffect(() => {
        if (coins !== displayCoins) {
            setCoinAnim(true);
            const diff = coins - displayCoins;
            const steps = Math.min(Math.abs(diff), 20);
            const stepVal = diff / steps;
            let current = displayCoins;
            const interval = setInterval(() => {
                current += stepVal;
                setDisplayCoins(Math.round(current));
                if (Math.abs(current - coins) < 1) {
                    setDisplayCoins(coins);
                    clearInterval(interval);
                    setTimeout(() => setCoinAnim(false), 300);
                }
            }, 50);
            return () => clearInterval(interval);
        }
    }, [coins, displayCoins]);

    /** Level ve XP eşik hesaplama */
    const level = Math.floor(1 + Math.sqrt(xp / 50));
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 50;
    const xpForNextLevel = Math.pow(level, 2) * 50;
    const xpProgress = Math.min(100, ((xp - currentLevelBaseXP) / (xpForNextLevel - currentLevelBaseXP)) * 100);

    // Floating Reward handler
    const [rewardText, setRewardText] = useState<string | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            setRewardText((e as CustomEvent).detail.text);
        };
        window.addEventListener('show-reward', handler);
        return () => window.removeEventListener('show-reward', handler);
    }, []);

    // Streak animation
    const [prevStreak, setPrevStreak] = useState(streakCurrent);
    const [streakAnim, setStreakAnim] = useState(false);

    useEffect(() => {
        if (streakCurrent > prevStreak) {
            setStreakAnim(true);
            setTimeout(() => setStreakAnim(false), 800);
            setPrevStreak(streakCurrent);
        }
    }, [streakCurrent, prevStreak]);

    /** Aktif link kontrolü */
    const isActive = (path: string) => {
        // Kampanya modundan /play'e gidildiyse, sadece /campaign aktif olmalı
        const fromCampaign = (location.state as any)?.fromCampaign === true;
        if (fromCampaign && location.pathname === '/play') {
            return path === '/campaign';
        }
        return location.pathname === path;
    };

    const activeTheme = useThemeStore(s => s.activeTheme);

    const desktopNavItems = [
        { path: '/', id: 'nav-home', icon: '🏠', text: 'Ana Sayfa' },
        { path: '/play', id: 'nav-daily', icon: '📅', text: 'Günlük' },
        { path: '/practice', id: 'nav-practice', icon: '🎯', text: 'Pratik' },
        { path: '/timeattack', id: 'nav-timeattack', icon: '⚡', text: 'Hız Modu' },
        { path: '/campaign', id: 'nav-campaign', icon: '🗺️', text: 'Yolculuk' },
        { path: '/leaderboard', id: 'nav-leaderboard', icon: '🏅', text: 'Sıralama' },
        { path: '/achievements', id: 'nav-achievements', icon: '🏆', text: 'Başarımlar' },
        { path: '/stats', id: 'nav-stats', icon: '📊', text: 'İstatistik' },
    ];

    // Mobil alt barında yalnızca en sık kullanılan 5 öge
    const mobileNavItems = [
        { path: '/', id: 'mnav-home', icon: '🏠', text: 'Ana Sayfa' },
        { path: '/play', id: 'mnav-daily', icon: '📅', text: 'Günlük' },
        { path: '/practice', id: 'mnav-practice', icon: '🎯', text: 'Pratik' },
        { path: '/campaign', id: 'mnav-campaign', icon: '🗺️', text: 'Yolculuk' },
        { path: '/stats', id: 'mnav-stats', icon: '📊', text: 'İstatistik' },
    ];

    const renderNav = (className: string, id: string, items: typeof desktopNavItems) => (
        <nav className={`nav ${className}`} id={id}>
            {items.map(item => (
                <Link key={item.path} to={item.path} className={`nav-link ${isActive(item.path) ? 'active' : ''}`} id={item.id}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.text}</span>
                </Link>
            ))}
        </nav>
    );

    return (
        <div className={`layout ${activeTheme}`}>
            {/* ─── Üst Gezinme Çubuğu ─────────────────────────────── */}
            <header className="header glass-panel">
                <Link to="/" className="logo" id="logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">FlowState</span>
                </Link>

                {renderNav('desktop-nav', 'main-nav-desktop', desktopNavItems)}

                {/* ─── İlerleme Göstergeleri ─────────────────────────── */}
                <div className="stats-bar" id="stats-bar">
                    <div className="stat" id="stat-level">
                        <span className="stat-label">SEVİYE</span>
                        <span className="stat-value">{level}</span>
                    </div>
                    <div className="stat xp-stat" id="stat-xp">
                        <span className="stat-label">XP</span>
                        <div className="xp-bar">
                            <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
                        </div>
                        <span className="stat-value stat-xp-text" data-testid="xp-value">{xp}</span>
                    </div>
                    <div className="stat" id="stat-coins">
                        <span className="stat-label">COIN</span>
                        <span className="stat-value coin-value" style={{ transform: coinAnim ? 'scale(1.2)' : 'scale(1)', transition: 'transform .2s' }}>🪙 {displayCoins}</span>
                    </div>
                    {streakCurrent > 0 && (
                        <div className="stat" id="stat-streak">
                            <span className="stat-label">SERİ</span>
                            <span className="stat-value streak-value" style={{ animation: streakAnim ? 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'none' }}>🔥 {streakCurrent}</span>
                        </div>
                    )}
                    <button
                        id="sound-toggle"
                        onClick={() => dispatch(toggleSound())}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            opacity: soundEnabled ? 1 : 0.4,
                            transition: 'opacity var(--transition-fast)',
                            padding: '4px',
                            color: 'var(--text-primary)',
                        }}
                        title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
                        aria-label="Ses Toggle"
                    >
                        {soundEnabled ? '🔊' : '🔇'}
                    </button>
                </div>
            </header>

            {/* ─── Ana İçerik ──────────────────────────────────────── */}
            <main className="main-content animate-fade-in">
                <Outlet />
            </main>

            {/* ─── Başarım Toast ───────────────────────────────────── */}
            <AchievementToast />

            {/* Floating Reward */}
            {rewardText && <FloatingReward text={rewardText} onDone={() => setRewardText(null)} />}

            {/* ─── Mobil Alt Navigasyon ────────────────────────────── */}
            {renderNav('mobile-nav glass-panel', 'main-nav-mobile', mobileNavItems)}
        </div>
    );
}
