// ============================================================
// useKeyboardNavigation — Ok tuşları / WASD ile tahta imleci
// ============================================================

import { useCallback, useEffect, useState } from 'react';

interface TileEntry {
    pos: { row: number; col: number };
    tile: { locked: boolean };
}

interface Options {
    status: string;
    gridSize: number;
    allTiles: TileEntry[];
    onRotate: (row: number, col: number) => void;
    puzzleId: string | null;
}

export function useKeyboardNavigation({ status, gridSize, allTiles, onRotate, puzzleId }: Options) {
    const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null);

    // Yeni bulmacada imleci sıfırla
    useEffect(() => {
        setCursor(null);
    }, [puzzleId]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'Enter'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();

        if (!cursor) {
            const center = Math.floor(gridSize / 2);
            setCursor({ row: center, col: center });
            return;
        }

        const { row, col } = cursor;

        if (e.key === 'ArrowUp' || e.key === 'w') {
            setCursor({ row: Math.max(0, row - 1), col });
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            setCursor({ row: Math.min(gridSize - 1, row + 1), col });
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
            setCursor({ row, col: Math.max(0, col - 1) });
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            setCursor({ row, col: Math.min(gridSize - 1, col + 1) });
        } else if (e.key === ' ' || e.key === 'Enter') {
            const tileData = allTiles.find(t => t.pos.row === row && t.pos.col === col)?.tile;
            if (tileData && !tileData.locked) {
                onRotate(row, col);
            }
        }
    }, [cursor, gridSize, allTiles, onRotate]);

    useEffect(() => {
        if (status !== 'playing') return;
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, handleKeyDown]);

    return { cursor, setCursor };
}
