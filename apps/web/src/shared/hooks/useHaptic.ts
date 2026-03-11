// ============================================================
// useHaptic — Dokunmatik titreşim geri bildirimi
// navigator.vibrate() iOS'ta çalışmaz, Android'de etkindir.
// ============================================================

import { useEffect, useState } from 'react';

/** Titreşim pattern'leri */
const PATTERNS = {
    tap:     15,                // Tile tıklama — kısa, hafif
    success: [30, 20, 60],     // Akış bağlantısı — çift nabız
    win:     [50, 30, 80, 30, 120], // Kazanma — ritimli güçlü
    error:   [100],             // Kilitli tile vb.
};

/** iOS detection */
function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function vibrate(pattern: number | number[]) {
    if (!('vibrate' in navigator)) return;
    try { navigator.vibrate(pattern); } catch { /* sessizce yoksay */ }
}

export function useHaptic() {
    const [showIOSWarning, setShowIOSWarning] = useState(false);

    useEffect(() => {
        // iOS cihazda haptic feedback çalışmıyor uyarısı
        if (isIOS() && !('vibrate' in navigator)) {
            setShowIOSWarning(true);
            // 5 saniye sonra uyarıyı gizle
            const timer = setTimeout(() => setShowIOSWarning(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    return {
        tapTile:  () => vibrate(PATTERNS.tap),
        flowDone: () => vibrate(PATTERNS.success),
        win:      () => vibrate(PATTERNS.win),
        error:    () => vibrate(PATTERNS.error),
        isIOSWithoutVibrate: showIOSWarning,
    };
}
