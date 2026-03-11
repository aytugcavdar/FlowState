// ============================================================
// CampaignPage — Yolculuk v3: 6 Tema Dünyası
// 100 bölüm → 6 dünyaya bölünmüş, her biri kendi temasıyla.
// ============================================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_LEVELS } from '@flowstate/game-engine';
import { useGameStore } from '../features/game-board/model/gameStore';
import { useSound } from '@/shared/hooks/useSound';
import './CampaignPage.css';

// ─── Dünya Tanımları ─────────────────────────────────────────
const WORLDS = [
    { id: 1, name: 'Neon Şehir', icon: '🌆', range: [1, 15], theme: 'cyan', desc: 'Temel mekanikler' },
    { id: 2, name: 'Çöl Kaynağı', icon: '🏜️', range: [16, 30], theme: 'yellow', desc: 'Kavşaklar & yönler' },
    { id: 3, name: 'Dalga Fabrikası', icon: '🌊', range: [31, 45], theme: 'blue', desc: 'Karıştırıcılar' },
    { id: 4, name: 'Orman Labirenti', icon: '🌿', range: [46, 60], theme: 'green', desc: 'Kapılar & filtreler' },
    { id: 5, name: 'Kristal Mağara', icon: '🔮', range: [61, 80], theme: 'magenta', desc: 'Portal sistemi' },
    { id: 6, name: 'Uzay İstasyonu', icon: '🚀', range: [81, 100], theme: 'white', desc: 'Tüm mekanikler' },
] as const;

const DIFF_LABEL: Record<number, string> = {
    1: '⬜ Başlangıç', 2: '⬜ Başlangıç', 3: '🟩 Kolay',
    4: '🟩 Kolay', 5: '🟨 Orta', 6: '🟨 Orta',
    7: '🟧 Zor', 8: '🟧 Zor', 9: '🟥 Uzman',
    10: '💀 Acımasız',
};

export function CampaignPage() {
    const navigate = useNavigate();
    const { playClick } = useSound();
    const unlockedLevel = useGameStore(s => s.unlockedLevel);
    const startCampaignLevel = useGameStore(s => s.startCampaignLevel);

    const currentWorldRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        currentWorldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleNodeClick = (levelId: number) => {
        if (levelId > unlockedLevel) return;
        playClick();
        startCampaignLevel(levelId);
        // Kampanya modunu belirtmek için state ile navigate
        navigate('/play', { state: { fromCampaign: true } });
    };

    const totalCompleted = unlockedLevel - 1;

    return (
        <div className="campaign-page animate-fade-in" id="campaign-page">
            {/* ─── Header ─── */}
            <div className="campaign-header glass-panel">
                <h1>🗺️ Yolculuk</h1>
                <p className="campaign-subtitle">100 bölümlük epik macera</p>
                <div className="campaign-global-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${totalCompleted}%` }}
                        />
                    </div>
                    <span>{totalCompleted} / 100 tamamlandı</span>
                </div>
            </div>

            {/* ─── Dünyalar ─── */}
            <div className="worlds-list">
                {WORLDS.map(world => {
                    const [min, max] = world.range;
                    const levelsInWorld = CAMPAIGN_LEVELS.filter(l => l.id >= min && l.id <= max);
                    const completedInWorld = levelsInWorld.filter(l => l.id < unlockedLevel).length;
                    const totalInWorld = levelsInWorld.length;
                    const worldFraction = completedInWorld / totalInWorld;
                    const isWorldLocked = unlockedLevel < min;
                    const isCurrentWorld = unlockedLevel >= min && unlockedLevel <= max;
                    const isWorldDone = unlockedLevel > max;

                    return (
                        <div
                            key={world.id}
                            className={`world-section ${world.theme} ${isWorldLocked ? 'world-locked' : ''} ${isCurrentWorld ? 'world-active' : ''}`}
                            ref={isCurrentWorld ? currentWorldRef : undefined}
                        >
                            {/* Dünya Başlığı */}
                            <div className="world-header">
                                <span className="world-icon">{world.icon}</span>
                                <div className="world-info">
                                    <div className="world-name">
                                        {world.name}
                                        {isWorldDone && <span className="world-badge">✅ Tamamlandı</span>}
                                        {isCurrentWorld && <span className="world-badge active">▶ Devam Ediyor</span>}
                                        {isWorldLocked && <span className="world-badge locked">🔒 Kilitli</span>}
                                    </div>
                                    <div className="world-desc">{world.desc} · Bölüm {min}–{max}</div>
                                </div>
                                <div className="world-fraction">{completedInWorld}/{totalInWorld}</div>
                            </div>

                            {/* Dünya İlerleme Barı */}
                            <div className="world-progress-bar">
                                <div className="world-progress-fill" style={{ width: `${worldFraction * 100}%` }} />
                            </div>

                            {/* Bölüm Düğümleri */}
                            {!isWorldLocked && (
                                <div className="level-grid">
                                    {levelsInWorld.map(level => {
                                        const isUnlocked = level.id <= unlockedLevel;
                                        const isCurrent = level.id === unlockedLevel;
                                        const isLocked = level.id > unlockedLevel;
                                        const diff = DIFF_LABEL[level.difficulty] ?? '🟨 Orta';

                                        return (
                                            <button
                                                key={level.id}
                                                className={`level-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
                                                onClick={() => handleNodeClick(level.id)}
                                                disabled={isLocked}
                                                title={`Bölüm ${level.id} · ${diff}`}
                                            >
                                                {isLocked ? '🔒' : (
                                                    <>
                                                        <span className="level-num">{level.id}</span>
                                                        {isCurrent && <span className="current-pulse" />}
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
