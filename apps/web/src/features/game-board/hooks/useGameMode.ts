// ============================================================
// useGameMode — Mevcut bulmaca modunu tespit eden hook
// ============================================================

import { useGameStore } from '../model/gameStore';

export interface GameMode {
    isDaily: boolean;
    isCampaign: boolean;
    isPractice: boolean;
    isTutorial: boolean;
}

export function useGameMode(): GameMode {
    const id = useGameStore(s => s.currentPuzzleId);
    return {
        isDaily: id?.startsWith('daily-') ?? false,
        isCampaign: id?.startsWith('campaign-') ?? false,
        isPractice: id?.startsWith('practice-') ?? false,
        isTutorial: id?.startsWith('tutorial-') ?? false,
    };
}
