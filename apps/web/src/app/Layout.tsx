// ============================================================
// Layout — Uygulama genel düzeni (v1.5)
// Üst gezinme çubuğu + ana içerik alanı.
// Gelişmiş navigasyon (kampanya, liderlik, başarımlar).
// ============================================================

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useThemeStore } from '../features/game-board/model/themeStore';
import './Layout.css';
import './themes.css';

export function Layout() {
    const location = useLocation();
    const { level, xp, coins, streakCurrent } = useSelector(
        (state: RootState) => state.progression
    );

    /** XP eşik hesaplama */
    const xpForNextLevel = Math.floor(100 * Math.pow(level, 1.5));
    const xpProgress = Math.min(100, (xp / xpForNextLevel) * 100);

    /** Aktif link kontrolü */
    const isActive = (path: string) => location.pathname === path;

    const activeTheme = useThemeStore(s => s.activeTheme);

    const navItems = [
        { path: '/', id: 'nav-home', icon: '🏠', text: 'Ana Sayfa' },
        { path: '/play', id: 'nav-daily', icon: '📅', text: 'Günlük' },
        { path: '/practice', id: 'nav-practice', icon: '🎯', text: 'Pratik' },
        { path: '/campaign', id: 'nav-campaign', icon: '🗺️', text: 'Kampanya' },
        { path: '/leaderboard', id: 'nav-leaderboard', icon: '🏅', text: 'Sıralama' },
        { path: '/achievements', id: 'nav-achievements', icon: '🏆', text: 'Başarımlar' },
        { path: '/stats', id: 'nav-stats', icon: '📊', text: 'İstatistik' }
    ];

    const renderNav = (className: string, id: string) => (
        <nav className={`nav ${className}`} id={id}>
            {navItems.map(item => (
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

                {renderNav('desktop-nav', 'main-nav-desktop')}

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
                        <span className="stat-value coin-value">🪙 {coins}</span>
                    </div>
                    {streakCurrent > 0 && (
                        <div className="stat" id="stat-streak">
                            <span className="stat-label">SERİ</span>
                            <span className="stat-value streak-value">🔥 {streakCurrent}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* ─── Ana İçerik ──────────────────────────────────────── */}
            <main className="main-content animate-fade-in">
                <Outlet />
            </main>

            {/* ─── Mobil Alt Navigasyon (Ayrık Element) ──────────────── */}
            {renderNav('mobile-nav glass-panel', 'main-nav-mobile')}
        </div>
    );
}
