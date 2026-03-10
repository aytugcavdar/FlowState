// ============================================================
// useHaptic — Dokunmatik titreşim geri bildirimi
// navigator.vibrate() iOS'ta çalışmaz, Android'de etkindir.
// ============================================================

/** Titreşim pattern'leri */
const PATTERNS = {
    tap:     15,                // Tile tıklama — kısa, hafif
    success: [30, 20, 60],     // Akış bağlantısı — çift nabız
    win:     [50, 30, 80, 30, 120], // Kazanma — ritimli güçlü
    error:   [100],             // Kilitli tile vb.
};

function vibrate(pattern: number | number[]) {
    if (!('vibrate' in navigator)) return;
    try { navigator.vibrate(pattern); } catch { /* sessizce yoksay */ }
}

export function useHaptic() {
    return {
        tapTile:  () => vibrate(PATTERNS.tap),
        flowDone: () => vibrate(PATTERNS.success),
        win:      () => vibrate(PATTERNS.win),
        error:    () => vibrate(PATTERNS.error),
    };
}
