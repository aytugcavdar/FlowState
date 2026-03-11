// ============================================================
// StatsPage — Oyuncu İstatistikleri
// metaStore verilerini görsel olarak gösterir.
// ============================================================

import { useMetaStore } from '../features/meta/model/metaStore';
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

/** Gelişim grafiği bileşeni */
function ProgressChart({ dailyProgress }: { dailyProgress: Record<string, number> }) {
    // Son 14 günü göster
    const days: { date: string; count: number; label: string }[] = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        const dayLabel = date.toLocaleDateString('tr-TR', { weekday: 'short' });
        days.push({
            date: dateStr,
            count: dailyProgress[dateStr] || 0,
            label: dayLabel,
        });
    }

    const maxCount = Math.max(...days.map(d => d.count), 1);

    return (
        <div className="progress-chart glass-panel">
            <h3 className="chart-title">📈 Son 14 Gün</h3>
            <div className="chart-bars">
                {days.map(day => (
                    <div key={day.date} className="chart-bar-wrapper">
                        <div className="chart-bar-container">
                            <div
                                className="chart-bar"
                                style={{
                                    height: `${(day.count / maxCount) * 100}%`,
                                    minHeight: day.count > 0 ? '4px' : '0',
                                }}
                                title={`${day.date}: ${day.count} çözüm`}
                            />
                        </div>
                        <span className="chart-label">{day.label}</span>
                        {day.count > 0 && <span className="chart-count">{day.count}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatsPage() {
    const stats = useMetaStore(s => s.stats);
    const xp = useMetaStore(s => s.xp);
    const coins = useMetaStore(s => s.coins); // ← metaStore'dan al
    const unlockedAchievements = useMetaStore(s => s.unlockedAchievements);

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
                    value={(() => {
                        const records = stats.records || {};
                        const bestTimes = Object.values(records).map(r => r.bestTimeSec);
                        const absoluteBest = bestTimes.length > 0 ? Math.min(...bestTimes) : 9999;
                        return formatTime(absoluteBest);
                    })()}
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

            {/* ─── Gelişim Grafiği ───────────────────────────── */}
            {stats.totalSolved > 0 && stats.dailyProgress && Object.keys(stats.dailyProgress).length > 0 && (
                <ProgressChart dailyProgress={stats.dailyProgress} />
            )}

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
