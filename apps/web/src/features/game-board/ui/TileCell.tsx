// ============================================================
// TileCell — Tek bir oyun tahtası hücresi
// React.memo ile optimize edilmiş, kendi görsel döndürme
// state'ini yönetir.
// ─── YENİ: Swipe gesture desteği eklendi ───
// ============================================================

import { memo, useEffect, useRef, useState } from 'react';
import { TileIcon } from '@/entities/tile/ui/TileIcon';
import type { FlowColor } from '@flowstate/shared-types';

export interface TileCellProps {
    row: number;
    col: number;
    type: string;
    rotation: number;
    flowColor: string | null;
    filterColor?: FlowColor | null;
    locked: boolean;
    isHinted: boolean;
    justClicked: boolean;
    isKeyboardSelected: boolean;
    theme: string;
    isSinkSatisfied?: boolean;
    mixerState?: string;
    openPorts?: string[];
    requiredColors?: FlowColor[];
    onClick: () => void;
}

export const TileCell = memo(function TileCell({
    row,
    col,
    type,
    rotation,
    flowColor,
    filterColor,
    locked,
    isHinted,
    justClicked,
    isKeyboardSelected,
    theme,
    isSinkSatisfied,
    mixerState,
    openPorts,
    requiredColors,
    onClick,
}: TileCellProps) {
    const [visualRotation, setVisualRotation] = useState(rotation);
    const [hovered, setHovered] = useState(false);
    const prevRotation = useRef(rotation);
    
    // ─── Swipe Gesture State ───
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const touchStartTime = useRef<number>(0);

    useEffect(() => {
        if (rotation !== prevRotation.current) {
            const prev = prevRotation.current;
            const curr = rotation;
            // Her zaman en kısa yönü bul (clockwise vs counter)
            let diff = curr - prev;
            // Wrap around: 0→270 = -90 (counter), 270→0 = +90 (clockwise)
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            setVisualRotation(v => v + diff);
            prevRotation.current = rotation;
        }
    }, [rotation]);

    // ─── Swipe Gesture Handlers ───
    const handleTouchStart = (e: React.TouchEvent) => {
        if (locked) return;
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (locked) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const deltaY = touch.clientY - touchStartY.current;
        const deltaTime = Date.now() - touchStartTime.current;
        
        // Swipe detection: minimum 50px movement, max 300ms duration
        const minSwipeDistance = 50;
        const maxSwipeTime = 300;
        
        if (deltaTime > maxSwipeTime) {
            // Too slow, treat as tap
            return;
        }
        
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Horizontal or vertical swipe?
        if (absX > minSwipeDistance || absY > minSwipeDistance) {
            // Prevent default tap behavior
            e.preventDefault();
            
            // Trigger rotation
            onClick();
        }
    };

    return (
        <button
            className={`tile-cell ${locked ? 'locked' : ''} ${isHinted ? 'hinted' : ''} ${flowColor ? 'has-flow flow-' + flowColor : ''} ${justClicked ? 'just-clicked' : ''} ${isKeyboardSelected ? 'keyboard-selected' : ''} ${isSinkSatisfied ? 'sink-satisfied' : ''} ${mixerState === 'waiting' ? 'mixer-waiting' : ''} ${mixerState === 'active' ? 'mixer-active' : ''}`}
            onClick={onClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={locked}
            data-testid={`tile-${row}-${col}`}
            data-rotation={rotation}
            aria-label={`${type} tile, pozisyon ${row},${col}`}
            id={`tile-${row}-${col}`}
            style={{
                '--r': `${visualRotation}deg`,
                '--r-prev': `${prevRotation.current}deg`,
            } as React.CSSProperties}
        >
            <TileIcon
                type={type as any}
                flowColor={flowColor as any}
                filterColor={filterColor}
                requiredColors={requiredColors}
                theme={theme}
            />
            {locked && <span className="lock-indicator">🔒</span>}
            {hovered && !locked && (openPorts?.length ?? 0) > 0 && (
                <div className="port-indicators" aria-hidden="true">
                    {openPorts!.includes('N') && <div className="port-dot port-N" />}
                    {openPorts!.includes('E') && <div className="port-dot port-E" />}
                    {openPorts!.includes('S') && <div className="port-dot port-S" />}
                    {openPorts!.includes('W') && <div className="port-dot port-W" />}
                </div>
            )}
        </button>
    );
}, (prev, next) =>
    prev.type === next.type &&
    prev.rotation === next.rotation &&
    prev.flowColor === next.flowColor &&
    prev.filterColor === next.filterColor &&
    prev.locked === next.locked &&
    prev.isHinted === next.isHinted &&
    prev.justClicked === next.justClicked &&
    prev.isKeyboardSelected === next.isKeyboardSelected &&
    prev.theme === next.theme &&
    prev.isSinkSatisfied === next.isSinkSatisfied &&
    prev.mixerState === next.mixerState &&
    (prev.openPorts?.join('') ?? '') === (next.openPorts?.join('') ?? '') &&
    (prev.requiredColors?.join('') ?? '') === (next.requiredColors?.join('') ?? '')
);
