// ============================================================
// TimeAttackPage — ⚡ Hız Modu
// 120 saniye içinde çözülebilen kadar puzzle çözülür.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { GameBoard } from '@/features/game-board/ui/GameBoard';
import { useGameStore } from '@/features/game-board/model/gameStore';
import { useSound } from '@/shared/hooks/useSound';
import './TimeAttackPage.css';

export function TimeAttackPage() {
    const [timeLeft, setTimeLeft] = useState(120);
    const [score, setScore] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    const startPractice = useGameStore(s => s.startPractice);
    const solved = useGameStore(s => s.solved);
    const reset = useGameStore(s => s.reset);
    const currentPuzzleId = useGameStore(s => s.currentPuzzleId);

    const [processedPuzzleId, setProcessedPuzzleId] = useState<string | null>(null);

    const { playWin, playClick } = useSound();

    // Zamanlayıcı (Saf functional update)
    useEffect(() => {
        if (!isPlaying || isGameOver) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, isGameOver]);

    // Zamanlayıcı bitişini dinleyen side-effect
    useEffect(() => {
        if (timeLeft <= 0 && isPlaying) {
            setIsGameOver(true);
            setIsPlaying(false);
            setTimeLeft(0);
        }
    }, [timeLeft, isPlaying]);

    // Puzzle çözüldüğünde yeni puzzle ver
    useEffect(() => {
        if (solved && isPlaying && currentPuzzleId && currentPuzzleId !== processedPuzzleId) {
            setProcessedPuzzleId(currentPuzzleId);
            playWin();

            // Sadece skoru artır (fonksiyonel update SAF OLMALIDIR)
            setScore(prev => prev + 1);

            // Side-effect: setTimeout çağrısı fonksiyonel updatenin dışında kalmalı.
            // Skoru prevScore + 1 olarak kendimiz de hesaplayabiliriz.
            const newScore = score + 1;
            const diff = Math.min(6, 2 + Math.floor(newScore / 3));

            setTimeout(() => {
                startPractice(5, diff);
            }, 600); // Küçük bir gecikme (animasyon görülmesi için)
        }
    }, [solved, isPlaying, currentPuzzleId, processedPuzzleId, playWin, startPractice, score]);

    // Oyunu terk ederken temizle
    useEffect(() => {
        return () => reset();
    }, [reset]);

    const startGame = useCallback(() => {
        playClick();
        setScore(0);
        setTimeLeft(120);
        setProcessedPuzzleId(null);
        setIsGameOver(false);
        setIsPlaying(true);
        startPractice(5, 2); // İlk puzzle
    }, [playClick, startPractice]);

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="time-attack-page animate-fade-in" id="time-attack-page">
            <div className="time-attack-header glass-panel">
                <div className="ta-stat">
                    <span className="ta-label">SKOR</span>
                    <span className="ta-value score">{score}</span>
                </div>

                <div className="ta-stat">
                    <span className="ta-label">SÜRE</span>
                    <span className={`ta-value time ${timeLeft <= 10 ? 'pulsing-red' : ''}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {!isPlaying && !isGameOver && (
                <div className="ta-overlay glass-panel">
                    <h1>⚡ Hız Modu</h1>
                    <p>120 saniye içinde maksimum sayıda bulmacayı çöz!</p>
                    <button className="btn btn-primary" onClick={startGame}>
                        Başla
                    </button>
                </div>
            )}

            {isGameOver && (
                <div className="ta-overlay glass-panel animate-pop">
                    <h1>Süre Doldu! ⏱️</h1>
                    <p>Toplam Çözülen: <strong style={{ color: 'var(--color-yellow)', fontSize: '1.5rem' }}>{score}</strong></p>
                    <button className="btn btn-primary" onClick={startGame}>
                        Tekrar Oyna
                    </button>
                    {/* WinModal çıkmaması için GameBoard mount edilmeyecek veya CSS ile gizlenecek */}
                </div>
            )}

            {/* Sadece oynanırken board'u göster, aksi halde WinModal vb tetiklenebilir */}
            {isPlaying && (
                <div className="ta-board-container">
                    <GameBoard />
                    {/* Hile: WinModal css'ini overriding ile gizleyebiliriz veya WinModal isTimeAttack prop'ı alabilir. 
                        Şimdilik TimeAttackPage css'inden .win-modal-overlay { display: none !important; } yapacağız */}
                </div>
            )}
        </div>
    );
}
