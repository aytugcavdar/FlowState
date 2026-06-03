// ============================================================
// WinModal — Bulmacayı çözünce gösterilen başarım modali
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGameStore } from '../model/gameStore';
import { useGameMode } from '../hooks/useGameMode';
import { useMetaStore } from '@/features/meta/model/metaStore';
import { CAMPAIGN_LEVELS } from '@flowstate/game-engine';
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
    
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
    const startCampaignLevel = useGameStore(s => s.startCampaignLevel);
    const unlockedLevel = useGameStore(s => s.unlockedLevel);

    const { isDaily, isCampaign, isPractice } = useGameMode();
    const isPracticeRoute = location.pathname === '/practice';

    // Modal açıkken body scroll'u engelle
    useEffect(() => {
        if (solved) {
            document.body.style.overflow = 'hidden';
            
            // Re-calculate local coinsEarned for the toast
            // The state var isn't stable inside useEffect without deps.
            window.dispatchEvent(new CustomEvent('show-reward', { 
              detail: { text: '+50 🪙 Kazandın!' }
            }));
            
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#22d3ee', '#facc15', '#e879f9', '#4ade80']
                });
            }, 300);

            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [solved]);

    if (!solved) return null;

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = mins > 0 ? `${mins}d ${secs}s` : `${secs}s`;

    const coinsEarned = isCampaign ? (CAMPAIGN_LEVELS.find(l => l.id === parseInt(currentPuzzleId?.split('-')[1] ?? '0'))?.pointsReward ?? 50) : 50;

    const handleNext = () => {
        if (isPracticeRoute || isPractice) {
            // Son seçilen zorluğu kullan
            const lastDifficulty = useMetaStore.getState().lastPracticeDifficulty;
            startPractice(gridSize, lastDifficulty);
        } else if (isDaily) {
            startDaily();
        } else if (isCampaign && currentPuzzleId?.startsWith('campaign-')) {
            const currentId = parseInt(currentPuzzleId.split('-')[1]);
            const nextId = currentId + 1;
            const nextLevel = CAMPAIGN_LEVELS.find(l => l.id === nextId);
            if (nextLevel && nextId <= unlockedLevel) {
                startCampaignLevel(nextId);
            } else if (!nextLevel) {
                // Kampanya bitti
                reset();
                navigate('/campaign');
            } else {
                // Sonraki level henüz kilitli — kampanya sayfasına git
                reset();
                navigate('/campaign');
            }
        } else {
            reset();
            navigate('/');
        }
    };

    const handleHome = () => {
        reset();
        navigate('/');
    };

    const generateShare = () => {
        const dow = new Date().getDay();
        const idx = dow === 0 ? 6 : dow - 1;
        const emojis = ['😊', '🎯', '⚡', '💪', '🔥', '🧠', '💀'];
        const names = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
        const stars = '⭐'.repeat(lastStars) + '☆'.repeat(3 - lastStars);
        const m = Math.floor(elapsedSeconds / 60), s = elapsedSeconds % 60;
        const t = m > 0 ? `${m}d ${s}s` : `${s}s`;
        return [`FlowState ${emojis[idx]} ${names[idx]}`, `${dateStr}`, `${stars} ${t} · ${moveCount} hamle`, `https://aytugcavdar.github.io/FlowState/`].join('\n');
    };

    const handleShare = async () => {
        const txt = generateShare();
        try {
            if (navigator.share) await navigator.share({ title: 'FlowState', text: txt });
            else { await navigator.clipboard.writeText(txt); alert('Panoya kopyalandı!'); }
        } catch {}
    };

    return (
        <div className="win-modal-overlay" id="win-modal">
            <div className="win-modal-card glass-panel animate-pop">
                {lastStars >= 2 && (
                    <div className="confetti-container" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                        {Array.from({ length: 20 }, (_, i) => (
                            <div key={i} className="confetti-piece" style={{
                                left: `${5 + Math.random() * 90}%`,
                                animation: `confetti ${1 + Math.random()}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                background: ['var(--color-cyan)', 'var(--color-yellow)', 'var(--color-magenta)'][Math.floor(Math.random() * 3)],
                                width: '10px', height: '10px', position: 'absolute', top: '50%'
                            }} />
                        ))}
                    </div>
                )}
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
                        <span className="win-stat-value">🪙 {coinsEarned}</span>
                        <span className="win-stat-label">Kazanıldı</span>
                    </div>
                </div>

                {isCampaign && currentPuzzleId && (() => {
                    const currentId = parseInt(currentPuzzleId.split('-')[1]);
                    return currentId >= 100 ? (
                        <div style={{ color: 'var(--color-magenta)', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                            🎊 Tüm 100 bölümü tamamladın!
                        </div>
                    ) : null;
                })()}

                <div className="win-actions">
                    <button className="btn btn-primary" onClick={handleNext} id="win-next">
                        {isCampaign ? '🗺️ Sonraki Bölüm' : '🎯 Yeni Bulmaca'}
                    </button>
                    {isDaily && (
                        <button className="btn btn-primary" onClick={handleShare} style={{ background: 'var(--color-magenta)', width: '100%' }}>
                            📤 Sonucu Paylaş
                        </button>
                    )}
                    <button className="btn" onClick={handleHome} id="win-home">
                        🏠 Ana Sayfa
                    </button>
                </div>
            </div>
        </div>
    );
}
