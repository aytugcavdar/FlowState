// ============================================================
// WinModal — Bulmacayı çözünce gösterilen başarım modali
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../model/gameStore';
import { useGameMode } from '../hooks/useGameMode';
import { useMetaStore } from '@/features/meta/model/metaStore';
import './WinModal.css';

export function WinModal() {
    const navigate = useNavigate();
    const location = useLocation();

    const moveCount = useGameStore(s => s.moveCount);
    const elapsedSeconds = useGameStore(s => s.elapsedSeconds);
    const solved = useGameStore(s => s.solved);
    const startPractice = useGameStore(s => s.startPractice);
    const gridSize = useGameStore(s => s.gridSize);
    const startDaily = useGameStore(s => s.startDaily);
    const reset = useGameStore(s => s.reset);
    const lastStars = useGameStore(s => s.lastStars);

    const { isDaily, isCampaign, isPractice } = useGameMode();
    const isPracticeRoute = location.pathname === '/practice';

    // Modal açıkken body scroll'u engelle
    useEffect(() => {
        if (solved) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [solved]);

    if (!solved) return null;

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = mins > 0 ? `${mins}d ${secs}s` : `${secs}s`;

    const handleNext = () => {
        if (isPracticeRoute || isPractice) {
            // Son seçilen zorluğu kullan
            const lastDifficulty = useMetaStore.getState().lastPracticeDifficulty;
            startPractice(gridSize, lastDifficulty);
        } else if (isDaily) {
            startDaily();
        } else {
            reset();
            navigate('/');
        }
    };

    const handleHome = () => {
        reset();
        navigate('/');
    };

    return (
        <div className="win-modal-overlay" id="win-modal">
            <div className="win-modal-card glass-panel animate-pop">
                <div className="win-confetti-emoji">🎉</div>
                <h1 className="win-title">Tebrikler!</h1>
                <p className="win-subtitle">Bulmacayı çözdün</p>

                {/* ─── Star Rating ─── */}
                <div className="win-stars" aria-label={`${lastStars} yıldız`}>
                    {[1, 2, 3].map(n => (
                        <span
                            key={n}
                            className={`win-star ${n <= lastStars ? 'earned' : 'empty'}`}
                            style={{ animationDelay: `${n * 180}ms` }}
                        >
                            ⭐
                        </span>
                    ))}
                </div>

                <div className="win-stats">
                    <div className="win-stat">
                        <span className="win-stat-value">{timeStr}</span>
                        <span className="win-stat-label">Süre</span>
                    </div>
                    <div className="win-stat-divider" />
                    <div className="win-stat">
                        <span className="win-stat-value">{moveCount}</span>
                        <span className="win-stat-label">Hamle</span>
                    </div>
                    <div className="win-stat-divider" />
                    <div className="win-stat">
                        <span className="win-stat-value">🪙 50</span>
                        <span className="win-stat-label">Kazanıldı</span>
                    </div>
                </div>

                <div className="win-actions">
                    <button className="btn btn-primary" onClick={handleNext} id="win-next">
                        {isCampaign ? '🗺️ Sonraki Bölüm' : '🎯 Yeni Bulmaca'}
                    </button>
                    <button className="btn" onClick={handleHome} id="win-home">
                        🏠 Ana Sayfa
                    </button>
                </div>
            </div>
        </div>
    );
}
