import { useEffect } from 'react';

interface FloatingRewardProps {
  text: string;
  onDone: () => void;
}

export function FloatingReward({ text, onDone }: FloatingRewardProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '2rem',
      fontWeight: 'bold',
      color: 'var(--color-yellow)',
      textShadow: '0 0 20px var(--color-yellow-glow), 0 0 10px #000',
      zIndex: 9999,
      pointerEvents: 'none',
      animation: 'floatUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
    }}>
      {text}
    </div>
  );
}
