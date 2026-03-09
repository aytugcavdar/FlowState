// ============================================================
// AchievementToast — Başarım açıldığında ekranın altından
// çıkan güzel bir bildirim toast'ı.
// windowCustomEvent 'achievements-unlocked' dinlenir.
// ============================================================

import { useEffect, useState } from 'react';
import { ACHIEVEMENTS_DEF } from '../../features/meta/model/metaStore';
import './AchievementToast.css';

interface ToastItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp: number;
}

export function AchievementToast() {
    const [queue, setQueue] = useState<ToastItem[]>([]);
    const [visible, setVisible] = useState<ToastItem | null>(null);
    const [exiting, setExiting] = useState(false);

    // Dinle: metaStore yeni başarımları dispatch eder
    useEffect(() => {
        const handler = (e: Event) => {
            const { newlyUnlocked } = (e as CustomEvent).detail;
            const items: ToastItem[] = (newlyUnlocked as string[])
                .map(id => ACHIEVEMENTS_DEF.find(a => a.id === id))
                .filter(Boolean)
                .map(def => ({
                    id: def!.id,
                    name: def!.name,
                    description: def!.description,
                    icon: def!.icon,
                    xp: def!.xp,
                }));
            setQueue(q => [...q, ...items]);
        };
        window.addEventListener('achievements-unlocked', handler);
        return () => window.removeEventListener('achievements-unlocked', handler);
    }, []);

    // Sıradaki toast'ı göster
    useEffect(() => {
        if (visible || queue.length === 0) return;
        const next = queue[0];
        setQueue(q => q.slice(1));
        setExiting(false);
        setVisible(next);

        // 2.5 saniye sonra kapat
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => setVisible(null), 400);
        }, 2500);

        return () => clearTimeout(timer);
    }, [queue, visible]);

    const dismiss = () => {
        setExiting(true);
        setTimeout(() => setVisible(null), 400);
    };

    if (!visible) return null;

    return (
        <div className={`achievement-toast glass-panel ${exiting ? 'exiting' : ''}`} role="alert" id="achievement-toast" onClick={dismiss}>
            <div className="toast-icon animate-star">{visible.icon}</div>
            <div className="toast-body">
                <div className="toast-title">🏆 Başarım Açıldı!</div>
                <div className="toast-name">{visible.name}</div>
                <div className="toast-desc">{visible.description}</div>
            </div>
            <div className="toast-xp">+{visible.xp} XP</div>
            <button className="toast-close" aria-label="Kapat" onClick={dismiss}>×</button>
        </div>
    );
}
