// ============================================================
// useSound — Ses efektleri hook'u
// Oyun etkileşimleri için Web Audio API tabanlı ses üretimi.
// Gerçek ses dosyaları yerine sentetik sesler kullanılır.
// ============================================================

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';

/** AudioContext singleton — tembel başlatma */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Belirli frekansta kısa bir sinüs tonu çal */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain: number = 0.15,
): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ses çalınamıyorsa sessizce geç
  }
}

/** Ses efektleri hook'u */
export function useSound() {
  const soundEnabled = useSelector((state: RootState) => state.settings.soundEnabled);

  /** Tile döndürme sesi — kısa mekanik klik */
  const playRotate = useCallback(() => {
    if (!soundEnabled) return;
    playTone(800, 0.06, 'square', 0.08);
    setTimeout(() => playTone(1200, 0.04, 'square', 0.06), 30);
  }, [soundEnabled]);

  /** Akış bağlantı sesi — yumuşak bağlantı tonu */
  const playConnect = useCallback(() => {
    if (!soundEnabled) return;
    playTone(523, 0.12, 'sine', 0.1);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 60);
  }, [soundEnabled]);

  /** Kazanma sesi — artan akor */
  const playWin = useCallback(() => {
    if (!soundEnabled) return;
    playTone(523, 0.2, 'sine', 0.15);      // C5
    setTimeout(() => playTone(659, 0.2, 'sine', 0.15), 100);  // E5
    setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 200);  // G5
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.12), 300); // C6
  }, [soundEnabled]);

  /** Hata sesi — düşen ton */
  const playError = useCallback(() => {
    if (!soundEnabled) return;
    playTone(400, 0.1, 'sawtooth', 0.08);
    setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.06), 80);
  }, [soundEnabled]);

  /** Buton tıklama sesi */
  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    playTone(600, 0.04, 'square', 0.05);
  }, [soundEnabled]);

  return { playRotate, playConnect, playWin, playError, playClick };
}
