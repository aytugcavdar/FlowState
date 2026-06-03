import { useState, useEffect, useCallback } from 'react';
import { GameBoard } from '@/features/game-board/ui/GameBoard';
import { useGameStore } from '@/features/game-board/model/gameStore';
import { useMetaStore } from '@/features/meta/model/metaStore';
import { useSound } from '@/shared/hooks/useSound';
import './TimeAttackPage.css';

type Variant = 'blitz' | 'classic' | 'endurance';

type VariantConfig = { label: string, icon: string, desc: string, time: number, color: string };

const VARIANTS: Record<Variant, VariantConfig> = {
  blitz:     { label: 'Blitz',     icon: '⚡', desc: '60 saniye · küçük puzzle', time: 60,  color: 'var(--color-cyan)' },
  classic:   { label: 'Klasik',    icon: '🎯', desc: '120 saniye · standart',   time: 120, color: 'var(--color-magenta)' },
  endurance: { label: 'Dayanıklılık', icon: '🔥', desc: 'Her çözümde +15 saniye', time: 45,  color: 'var(--color-yellow)' },
};

function calcScore(difficulty: number, seconds: number): number {
  const base = difficulty * 10;
  const speedBonus = Math.max(0, 30 - seconds) * 2;
  return base + speedBonus;
}

export function TimeAttackPage() {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bestScore, setBestScore] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('ta-best') ?? '{}'); } catch { return {}; }
  });
  const [lastPuzzleStart, setLastPuzzleStart] = useState(Date.now());
  const [processedId, setProcessedId] = useState<string | null>(null);

  const startPractice = useGameStore(s => s.startPractice);
  const solved = useGameStore(s => s.solved);
  const reset = useGameStore(s => s.reset);
  const currentPuzzleId = useGameStore(s => s.currentPuzzleId);
  const currentDifficulty = useGameStore(s => s.currentDifficulty);
  const { playWin, playClick } = useSound();

  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (timeLeft <= 0 && isPlaying) { setIsGameOver(true); setIsPlaying(false); }
  }, [timeLeft, isPlaying]);

  useEffect(() => {
    if (solved && isPlaying && currentPuzzleId && currentPuzzleId !== processedId) {
      setProcessedId(currentPuzzleId);
      playWin();
      const elapsed = Math.round((Date.now() - lastPuzzleStart) / 1000);
      const earned = calcScore(currentDifficulty ?? 3, elapsed);
      setScore(p => {
        const next = p + earned;
        const diff = Math.min(8, 2 + Math.floor(next / 50));
        const gridSize = variant === 'blitz' ? 4 : 5;
        if (variant === 'endurance') setTimeLeft(t => Math.min(120, t + 15));
        setTimeout(() => {
          startPractice(gridSize, diff);
          setLastPuzzleStart(Date.now());
        }, 300);
        return next;
      });
    }
  }, [solved, isPlaying, currentPuzzleId, processedId, lastPuzzleStart, currentDifficulty, variant, playWin, startPractice]);

  useEffect(() => {
    if (isGameOver && variant) {
      setBestScore(prev => {
        const updated = { ...prev, [variant]: Math.max(score, prev[variant] ?? 0) };
        localStorage.setItem('ta-best', JSON.stringify(updated));
        return updated;
      });
      useMetaStore.getState().addCoins(Math.floor(score / 10));
    }
  }, [isGameOver, variant, score]);

  useEffect(() => () => reset(), [reset]);

  const startGame = useCallback((v: Variant) => {
    playClick();
    setVariant(v);
    setScore(0);
    setTimeLeft(VARIANTS[v].time);
    setProcessedId(null);
    setIsGameOver(false);
    setIsPlaying(true);
    setLastPuzzleStart(Date.now());
    startPractice(v === 'blitz' ? 4 : 5, 2);
  }, [playClick, startPractice]);

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const cfg = variant ? VARIANTS[variant] : null;

  // Variant seçim ekranı
  if (!variant || (!isPlaying && !isGameOver)) {
    return (
      <div className="time-attack-page animate-fade-in" id="time-attack-page">
        <div className="ta-overlay glass-panel">
          <h1>⚡ Hız Modu</h1>
          <p>Mod seç ve başla</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px', marginTop: '2rem' }}>
          {(Object.entries(VARIANTS) as [Variant, VariantConfig][]).map(([key, v]) => (
            <button key={key} onClick={() => startGame(key)} style={{
              display:'flex', alignItems:'center', gap:'16px', padding:'1.1rem 1.25rem',
              border:`1px solid ${v.color}40`, borderRadius:'1rem', cursor:'pointer',
              background:'rgba(15, 23, 42, 0.6)', color:'var(--text-primary)', textAlign:'left', width:'100%',
              backdropFilter: 'blur(12px)', transition: 'all 0.2s ease-in-out'
            }}>
              <span style={{ fontSize: '2rem' }}>{v.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: v.color }}>{v.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{v.desc}</div>
              </div>
              {bestScore[key] ? <div style={{ fontSize: '0.8rem', opacity: 0.8, textAlign: 'right' }}>Best:<br/>{bestScore[key]}</div> : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="time-attack-page animate-fade-in" id="time-attack-page">
      <div className="time-attack-header glass-panel">
        <div className="ta-stat">
          <span className="ta-label">SKOR</span>
          <span className="ta-value score">{score}</span>
          {bestScore[variant!] ? <div style={{ fontSize:'0.7rem', opacity: 0.8 }}>Best: {bestScore[variant!]}</div> : null}
        </div>
        <div className="ta-stat">
          <span className="ta-label">{cfg?.label?.toUpperCase()}</span>
          <span className={`ta-value time ${timeLeft <= 10 ? 'pulsing-red' : ''}`}>{fmt(timeLeft)}</span>
        </div>
      </div>

      {isGameOver && (
        <div className="ta-overlay glass-panel animate-pop">
          <h1>Süre Doldu! ⏱️</h1>
          <p>Toplam Skor: <strong style={{ color: 'var(--color-cyan)', fontSize: '1.5rem' }}>{score}</strong></p>

          {score > 0 && score === bestScore[variant!] && (
            <div style={{ color: 'var(--color-yellow)', fontWeight: 'bold', margin: '1rem 0' }}>🏆 Yeni Rekor!</div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>+{Math.floor(score/10)} 🪙 kazandın</div>

          <button className="btn btn-primary" onClick={() => startGame(variant!)}>Tekrar Oyna</button>
          <button className="btn" onClick={() => { reset(); setVariant(null); setIsGameOver(false); }}>Mod Seç</button>
        </div>
      )}

      {isPlaying && <div className="ta-board-container"><GameBoard /></div>}
    </div>
  );
}
