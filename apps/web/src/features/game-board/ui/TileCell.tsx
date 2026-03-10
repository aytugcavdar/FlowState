// ============================================================
// TileCell — Tek bir oyun tahtası hücresi
// React.memo ile optimize edilmiş, kendi görsel döndürme
// state'ini yönetir.
// ============================================================

import { memo, useEffect, useRef, useState } from 'react';
import { TileIcon } from '@/entities/tile/ui/TileIcon';

export interface TileCellProps {
    row: number;
    col: number;
    type: string;
    rotation: number;
    flowColor: string | null;
    locked: boolean;
    isHinted: boolean;
    justClicked: boolean;
    isKeyboardSelected: boolean;
    theme: string;
    onClick: () => void;
}

export const TileCell = memo(function TileCell({
    row,
    col,
    type,
    rotation,
    flowColor,
    locked,
    isHinted,
    justClicked,
    isKeyboardSelected,
    theme,
    onClick,
}: TileCellProps) {
    const [visualRotation, setVisualRotation] = useState(rotation);
    const prevRotation = useRef(rotation);

    useEffect(() => {
        if (rotation !== prevRotation.current) {
            if ((prevRotation.current === 270 && rotation === 0) || (rotation - prevRotation.current === 90)) {
                setVisualRotation(v => v + 90);
            } else if ((prevRotation.current === 0 && rotation === 270) || (prevRotation.current - rotation === 90)) {
                setVisualRotation(v => v - 90);
            } else {
                setVisualRotation(rotation);
            }
            prevRotation.current = rotation;
        }
    }, [rotation]);

    return (
        <button
            className={`tile-cell ${locked ? 'locked' : ''} ${isHinted ? 'hinted' : ''} ${flowColor ? 'has-flow flow-' + flowColor : ''} ${justClicked ? 'just-clicked' : ''} ${isKeyboardSelected ? 'keyboard-selected' : ''}`}
            onClick={onClick}
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
                theme={theme}
            />
            {locked && <span className="lock-indicator">🔒</span>}
        </button>
    );
}, (prev, next) =>
    prev.type === next.type &&
    prev.rotation === next.rotation &&
    prev.flowColor === next.flowColor &&
    prev.locked === next.locked &&
    prev.isHinted === next.isHinted &&
    prev.justClicked === next.justClicked &&
    prev.isKeyboardSelected === next.isKeyboardSelected &&
    prev.theme === next.theme
);
