// ============================================================
// LeaderboardPage — Liderlik tablosu sayfası
// Günlük bulmacadaki en iyi çözüm süreleri.
// ============================================================

import { useState } from 'react';
import './LeaderboardPage.css';

/** Demo liderlik verileri */
const DEMO_DATA = [
    { rank: 1, username: 'ZaferUsta', time: 18, moves: 12, avatar: '🏆' },
    { rank: 2, username: 'AkışAvcısı', time: 23, moves: 14, avatar: '⚡' },
    { rank: 3, username: 'BulmacaGuru', time: 27, moves: 15, avatar: '🧠' },
    { rank: 4, username: 'NeonOyuncu', time: 31, moves: 18, avatar: '💎' },
    { rank: 5, username: 'GridMaster', time: 35, moves: 16, avatar: '🎯' },
    { rank: 6, username: 'TileKral', time: 38, moves: 20, avatar: '👑' },
    { rank: 7, username: 'FlowMaster', time: 42, moves: 22, avatar: '🌊' },
    { rank: 8, username: 'SenSin', time: null, moves: null, avatar: '🎮', isYou: true },
];

type TabType = 'today' | 'all-time';

export function LeaderboardPage() {
    const [tab, setTab] = useState<TabType>('today');

    return (
        <div className="leaderboard-page animate-fade-in" id="leaderboard-page">
            <div className="leaderboard-header">
                <h1>🏅 Liderlik Tablosu</h1>
                <p className="leaderboard-subtitle">Günlük bulmacadaki en hızlı çözücüler</p>
            </div>

            {/* Tab seçici */}
            <div className="leaderboard-tabs" id="leaderboard-tabs">
                <button
                    className={`tab-btn ${tab === 'today' ? 'active' : ''}`}
                    onClick={() => setTab('today')}
                    id="tab-today"
                >
                    📅 Bugün
                </button>
                <button
                    className={`tab-btn ${tab === 'all-time' ? 'active' : ''}`}
                    onClick={() => setTab('all-time')}
                    id="tab-alltime"
                >
                    🏆 Tüm Zamanlar
                </button>
            </div>

            {/* Podyum — ilk 3 */}
            <div className="podium" id="podium">
                {DEMO_DATA.slice(0, 3).map(player => (
                    <div
                        key={player.rank}
                        className={`podium-slot podium-${player.rank}`}
                        id={`podium-${player.rank}`}
                    >
                        <span className="podium-avatar">{player.avatar}</span>
                        <span className="podium-name">{player.username}</span>
                        <span className="podium-time">{player.time}s</span>
                        <span className="podium-rank">#{player.rank}</span>
                    </div>
                ))}
            </div>

            {/* Tablo */}
            <div className="leaderboard-table glass-panel neon-border" id="leaderboard-table">
                <div className="table-header">
                    <span className="th-rank">#</span>
                    <span className="th-name">Oyuncu</span>
                    <span className="th-time">Süre</span>
                    <span className="th-moves">Hamle</span>
                </div>
                {DEMO_DATA.map(player => (
                    <div
                        key={player.rank}
                        className={`table-row ${player.isYou ? 'is-you' : ''}`}
                        id={`row-${player.rank}`}
                    >
                        <span className="td-rank">
                            {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                        </span>
                        <span className="td-name">
                            <span className="td-avatar">{player.avatar}</span>
                            {player.username}
                            {player.isYou && <span className="you-badge">Sen</span>}
                        </span>
                        <span className="td-time">
                            {player.time ? `${player.time}s` : '—'}
                        </span>
                        <span className="td-moves">
                            {player.moves ?? '—'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
