// ============================================================
// useGameTimer — Oyun içi saniye sayacı
// status 'playing' iken hergün tick çağırır.
// ============================================================

import { useEffect } from 'react';

export function useGameTimer(status: string, tick: () => void) {
    useEffect(() => {
        if (status !== 'playing') return;
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [status, tick]);
}
