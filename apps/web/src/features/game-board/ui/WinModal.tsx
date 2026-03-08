// ============================================================
// WinModal — Bulmacayı çözünce gösterilen başarım modali
// ============================================================

import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../model/gameStore';
import './WinModal.css';

export function WinModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const { moveCount, elapsedSeconds, solved, startPractice,
        gridSize, startDaily, currentPuzzleId, reset, lastStars } = useGameStore(s => ({
            moveCount: s.moveCount,
            elapsedSeconds: s.elapsedSeconds,
            solved: s.solved,
            startPractice: s.startPractice,
            gridSize: s.gridSize,
            startDaily: s.startDaily,
            currentPuzzleId: s.currentPuzzleId,
            reset: s.reset,
            lastStars: s.lastStars,
        }));

    if (!solved) return null;

    const isDaily = currentPuzzleId?.startsWith('daily-');
    const isCampaign = currentPuzzleId?.startsWith('campaign-');
    const isPractice = currentPuzzleId?.startsWith('practice-');
    const isPracticeRoute = location.pathname === '/practice';

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = mins > 0 ? `${mins}d ${secs}s` : `${secs}s`;

    const handleNext = () => {
        if (isPracticeRoute || isPractice) {
            startPractice(gridSize, 5);
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
