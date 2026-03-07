// ============================================================
// AchievementsPage — Başarım vitrin sayfası
// Tüm başarımlar ve açılma durumları.
// ============================================================

import { useMetaStore, ACHIEVEMENTS_DEF } from '../features/meta/model/metaStore';
import './AchievementsPage.css';

export function AchievementsPage() {
    const unlockedAchievements = useMetaStore((state) => state.unlockedAchievements);
    const xp = useMetaStore((state) => state.xp);

    const totalUnlocked = unlockedAchievements.length;
    const totalXP = xp;

    const mappedAchievements = ACHIEVEMENTS_DEF.map((def) => ({
        ...def,
        unlocked: unlockedAchievements.includes(def.id)
    }));

    return (
        <div className="achievements-page animate-fade-in" id="achievements-page">
            <div className="achievements-header">
                <h1>🏆 Başarımlar</h1>
                <p className="achievements-subtitle">
                    {totalUnlocked}/{ACHIEVEMENTS_DEF.length} açıldı · {totalXP} XP kazanıldı
                </p>
            </div>

            {/* İlerleme çubuğu */}
            <div className="achievement-progress-bar">
                <div
                    className="achievement-progress-fill"
                    style={{ width: `${(totalUnlocked / ACHIEVEMENTS_DEF.length) * 100}%` }}
                />
            </div>

            {/* Başarım ızgarası */}
            <div className="achievements-grid" id="achievements-grid">
                {mappedAchievements.map(a => (
                    <div
                        key={a.id}
                        className={`achievement-card glass-panel ${a.unlocked ? 'unlocked' : 'locked'} ${a.category === 'secret' && !a.unlocked ? 'secret' : ''}`}
                        id={`achievement-${a.id}`}
                    >
                        <span className="achievement-icon">{a.unlocked || a.category !== 'secret' ? a.icon : '❓'}</span>
                        <div className="achievement-info">
                            <h3 className="achievement-name">
                                {a.unlocked || a.category !== 'secret' ? a.name : '???'}
                            </h3>
                            <p className="achievement-desc">
                                {a.unlocked || a.category !== 'secret' ? a.description : 'Bu başarımı keşfet'}
                            </p>
                        </div>
                        <div className="achievement-reward">
                            <span className="reward-xp">+{a.xp} XP</span>
                            <span className="reward-coins">🪙 {a.coins}</span>
                        </div>
                        {a.unlocked && <span className="achievement-check">✅</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
