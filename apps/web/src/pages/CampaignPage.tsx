// ============================================================
// CampaignPage — Saga Map (Kampanya Haritası) v2
// 100 bölümlük yılan gibi kıvrılan node-tabanlı harita.
// ============================================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_LEVELS } from '@flowstate/game-engine';
import { useGameStore } from '../features/game-board/model/gameStore';
import { useSound } from '@/shared/hooks/useSound';
import './CampaignPage.css';

export function CampaignPage() {
    const navigate = useNavigate();
    const { playClick } = useSound();

    // store state
    const unlockedLevel = useGameStore(s => s.unlockedLevel);
    const startCampaignLevel = useGameStore(s => s.startCampaignLevel);

    const mapRef = useRef<HTMLDivElement>(null);

    // Otomatik olarak açık olan en yüksek seviyeye kaydır
    useEffect(() => {
        if (mapRef.current) {
            const activeNode = mapRef.current.querySelector('.level-node.current');
            if (activeNode) {
                activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, []);

    const handleNodeClick = (levelId: number) => {
        if (levelId > unlockedLevel) return; // Kilitli
        playClick();
        startCampaignLevel(levelId);
        navigate('/play');
    };

    return (
        <div className="campaign-page animate-fade-in" id="campaign-page">
            <div className="campaign-header glass-panel">
                <h1>🗺️ Kampanya (Saga Map)</h1>
                <p className="campaign-subtitle">
                    100 bölüm. Kaydırarak ilerlemeni gör ve oynamak için bir bölüme tıkla.
                </p>
                <div className="campaign-progress">
                    Mevcut Seviye: <strong>{unlockedLevel}</strong> / 100
                </div>
            </div>

            <div className="saga-map-container" ref={mapRef}>
                {/* Yılan kıvrımı için SVG çizgisini arkaya dizebiliriz ya da CSS path kullanabiliriz. 
                    Burada basit CSS sinüs dalgası yaklaşımı kullanıyoruz. */}
                <div className="saga-path">
                    {/* Render levels from 100 down to 1 so the start is at the bottom */}
                    {[...CAMPAIGN_LEVELS].reverse().map((level, index) => {
                        const isUnlocked = level.id <= unlockedLevel;
                        const isCurrent = level.id === unlockedLevel;
                        const isLocked = level.id > unlockedLevel;

                        // Sinüs dalgası simülasyonu için sağ-sol ofseti hesapla
                        // level.id kullanıyoruz ki sıralama tersten olsa bile pozisyon sabit kalsın
                        const offsetBase = Math.sin(level.id * 0.4) * 120; // -120px to 120px

                        return (
                            <div
                                key={level.id}
                                className="saga-node-wrapper"
                                style={{ transform: `translateX(${offsetBase}px)` }}
                            >
                                {/* Bağlantı Çizgisi (İlk node hariç) */}
                                {level.id < 100 && (
                                    <svg className="node-connector" width="200" height="80">
                                        <line
                                            x1="100"
                                            y1="0"
                                            x2={100 + (Math.sin((level.id + 1) * 0.4) * 120 - offsetBase)}
                                            y2="-80"
                                            stroke={isUnlocked ? 'var(--color-cyan)' : 'var(--border-color)'}
                                            strokeWidth="4"
                                            strokeDasharray={isLocked ? '5,5' : 'none'}
                                        />
                                    </svg>
                                )}

                                <button
                                    className={`level-node 
                                        ${isUnlocked ? 'unlocked' : 'locked'} 
                                        ${isCurrent ? 'current' : ''}`
                                    }
                                    onClick={() => handleNodeClick(level.id)}
                                    disabled={isLocked}
                                    title={`Seviye ${level.id} - ${level.unlockedMechanics?.join(', ') || 'Normal'}`}
                                >
                                    {isLocked ? '🔒' : level.id}
                                    {isCurrent && <span className="current-indicator" />}
                                </button>

                                {level.unlockedMechanics && (
                                    <div className="mechanic-tooltip glass-panel">
                                        ✨ {level.unlockedMechanics[0]}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
