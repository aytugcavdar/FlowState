// ============================================================
// GamePage — Oyun sayfası (v2)
// Config paneli yok — otomatik progresif zorluk.
// ============================================================

import { useEffect, useRef } from 'react';
import { GameBoard, useGameStore } from '@/features/game-board';
import './GamePage.css';

/** Çözülen puzzle sayısına göre progresif zorluk */
function getProgressiveConfig(solvedCount: number): { gridSize: number; difficulty: number } {
    // User requested starting at 10x10 natively
    return { gridSize: 10, difficulty: Math.min(10, 5 + Math.floor(solvedCount / 4)) };
}

export function GamePage() {
    const status = useGameStore(s => s.status);
    const startPractice = useGameStore(s => s.startPractice);
    const board = useGameStore(s => s.board);
    const solvedCountRef = useRef(0);

    // Sayfa açılınca otomatik puzzle başlat (sadece board yoksa ve idle isek)
    useEffect(() => {
        // Eğer zaten bir puzzle varsa (örneğin CampaignPage'den navigate ile geldiysek) hiçbir şey yapma.
        if (status === 'idle' && !board) {
            const { gridSize, difficulty } = getProgressiveConfig(solvedCountRef.current);
            startPractice(gridSize, difficulty);
        }
    }, [status, board, startPractice]);

    // Puzzle çözüldüğünde sonraki seviyeye geç
    useEffect(() => {
        if (status === 'solved') {
            solvedCountRef.current += 1;
        }
    }, [status]);

    return (
        <div className="game-page" id="game-page">
            <div className="game-area">
                <GameBoard />
            </div>
        </div>
    );
}
