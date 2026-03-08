// ============================================================
// StatsPage — Oyuncu İstatistikleri
// metaStore verilerini görsel olarak gösterir.
// ============================================================

import { useMetaStore } from '../features/meta/model/metaStore';
import { useGameStore } from '../features/game-board/model/gameStore';
import './StatsPage.css';

function formatTime(seconds: number): string {
    if (seconds >= 9999) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}d ${s}s` : `${s}s`;
}

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    sub?: string;
    highlight?: boolean;
}

function StatCard({ icon, label, value, sub, highlight }: StatCardProps) {
    return (
        <div className={`stat-card glass-panel ${highlight ? 'stat-highlight' : ''}`}>
            <span className="stat-card-icon">{icon}</span>
            <div className="stat-card-body">
                <span className="stat-card-value">{value}</span>
                <span className="stat-card-label">{label}</span>
                {sub && <span className="stat-card-sub">{sub}</span>}
            </div>
        </div>
    );
}

export function StatsPage() {
    const stats = useMetaStore(s => s.stats);
    const xp = useMetaStore(s => s.xp);
    const unlockedAchievements = useMetaStore(s => s.unlockedAchievements);
    const coins = useGameStore(s => s.coins);

    const hintFreeRate = stats.totalSolved > 0
        ? Math.round((stats.puzzlesWithoutHints / stats.totalSolved) * 100)
        : 0;

    return (
        <div className="stats-page animate-fade-in" id="stats-page">
            <div className="stats-header">
                <h1>📊 İstatistikler</h1>
                <p className="stats-subtitle">Tüm zamanların oyun verileri</p>
            </div>

            {/* ─── Özet Bant ─────────────────────────────── */}
            <div className="stats-ribbon glass-panel">
                <div className="ribbon-item">
                    <span className="ribbon-value">{xp}</span>
                    <span className="ribbon-label">XP</span>
                </div>
                <div className="ribbon-divider" />
                <div className="ribbon-item">
                    <span className="ribbon-value">🪙 {coins}</span>
                    <span className="ribbon-label">Jeton</span>
                </div>
                <div className="ribbon-divider" />
                <div className="ribbon-item">
                    <span className="ribbon-value">{unlockedAchievements.length}</span>
                    <span className="ribbon-label">Başarım</span>
                </div>
                <div className="ribbon-divider" />
                <div className="ribbon-item">
                    <span className="ribbon-value">🔥 {stats.currentStreak}</span>
                    <span className="ribbon-label">Günlük Seri</span>
                </div>
            </div>

            {/* ─── Kartlar ───────────────────────────────── */}
            <div className="stats-grid" id="stats-grid">
                <StatCard
                    icon="🎯"
                    label="Toplam Çözüm"
                    value={stats.totalSolved}
                    highlight={stats.totalSolved > 0}
                />
                <StatCard
                    icon="⚡"
                    label="En Hızlı Çözüm"
                    value={formatTime(stats.fastestSolveSeconds)}
                    sub="kişisel rekorum"
                />
                <StatCard
                    icon="💎"
                    label="Mükemmel Çözüm"
                    value={stats.perfectSolves}
                    sub="minimum hamle"
                />
                <StatCard
                    icon="🧠"
                    label="İpuçsuz Çözüm"
                    value={`${stats.puzzlesWithoutHints}`}
                    sub={`%${hintFreeRate} başarı`}
                />
                <StatCard
                    icon="🗺️"
                    label="En Büyük Izgara"
                    value={stats.highestGridSize > 0 ? `${stats.highestGridSize}×${stats.highestGridSize}` : '—'}
                />
                <StatCard
                    icon="📗"
                    label="Yolculuk İlerlemesi"
                    value={`Seviye ${stats.highestCampaignLevel}`}
                    sub="en yüksek ulaşılan"
                />
            </div>

            {/* ─── Boş Durum ─────────────────────────────── */}
            {stats.totalSolved === 0 && (
                <div className="stats-empty glass-panel">
                    <span style={{ fontSize: '3rem' }}>🎮</span>
                    <p>Henüz bir bulmaca çözülmedi.<br />Oynamaya başla, veriler burada birikecek!</p>
                </div>
            )}
        </div>
    );
}
