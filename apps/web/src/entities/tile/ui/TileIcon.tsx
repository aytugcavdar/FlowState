// ============================================================
// TileIcon — Premium tile SVG ikonları (v2)
// Her tile'ın bağlantı kanallarını ve akış durumunu gösterir.
// Temalara göre dinamik şekiller çizer.
// ============================================================

import type { TileType, FlowColor } from '@flowstate/shared-types';

interface TileIconProps {
    type: TileType;
    flowColor?: FlowColor | null;
    size?: number;
    theme?: string;
}

/** Akış rengine karşılık gelen CSS renk değeri */
function getColorValue(color: FlowColor | null | undefined, theme: string): string {
    switch (color) {
        case 'cyan': return theme === 'theme-plumber' ? '#3b82f6' : (theme === 'theme-laser' ? '#00ffcc' : '#22d3ee');
        case 'magenta': return theme === 'theme-plumber' ? '#ef4444' : (theme === 'theme-laser' ? '#ff00ff' : '#e879f9');
        case 'yellow': return theme === 'theme-plumber' ? '#eab308' : (theme === 'theme-laser' ? '#ffff00' : '#facc15');
        case 'purple': return theme === 'theme-plumber' ? '#8b5cf6' : (theme === 'theme-laser' ? '#bf00ff' : '#a855f7');
        case 'green': return theme === 'theme-plumber' ? '#22c55e' : (theme === 'theme-laser' ? '#00ff00' : '#4ade80');
        case 'orange': return theme === 'theme-plumber' ? '#f97316' : (theme === 'theme-laser' ? '#ff8800' : '#fb923c');
        case 'white': return '#f1f5f9';
        default: return 'rgba(148, 163, 184, 0.35)';
    }
}

/** Glow rengi */
function getGlowFilter(color: FlowColor | null | undefined, theme: string): string | undefined {
    if (!color) return undefined;
    if (theme === 'theme-laser') {
        switch (color) {
            case 'cyan': return 'drop-shadow(0 0 8px rgba(0, 255, 204, 0.8))';
            case 'magenta': return 'drop-shadow(0 0 8px rgba(255, 0, 255, 0.8))';
            case 'yellow': return 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))';
            default: return 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))';
        }
    }
    switch (color) {
        case 'cyan': return 'drop-shadow(0 0 4px rgba(34,211,238,0.6))';
        case 'magenta': return 'drop-shadow(0 0 4px rgba(232,121,249,0.6))';
        case 'yellow': return 'drop-shadow(0 0 4px rgba(250,204,21,0.6))';
        case 'white': return 'drop-shadow(0 0 4px rgba(241,245,249,0.6))';
        default: return undefined;
    }
}

export function TileIcon({ type, flowColor, size = 48, theme = 'theme-cyberpunk' }: TileIconProps) {
    const color = getColorValue(flowColor, theme);
    const pipeWidth = flowColor ? 5 : 3.5;
    const hasFlow = !!flowColor;
    const filter = getGlowFilter(flowColor, theme);

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="tile-icon"
            style={{ filter }}
        >
            {/* Arka plan */}
            <rect x="2" y="2" width="44" height="44" rx={theme === 'theme-laser' ? 0 : (theme === 'theme-plumber' ? 4 : 6)} fill="rgba(15, 22, 41, 0.1)" />

            {/* Port bağlantı noktacıkları (sadece cyberpunk ve plumber) */}
            {theme !== 'theme-laser' && renderEndpoints(type, color, hasFlow)}

            {/* Ana çizgiler / borular / prizmalar */}
            {renderShapes(type, color, pipeWidth, hasFlow, theme)}
        </svg>
    );
}

/** Bağlantı uç noktaları */
function renderEndpoints(type: TileType, color: string, active: boolean) {
    if (type === 'SOURCE' || type === 'SINK') return null;

    const ports = getPortDirections(type);
    const size = active ? 5 : 3;

    return (
        <>
            {ports.includes('N') && <rect x={24 - size / 2} y={0} width={size} height={3} rx={1} fill={color} opacity={0.6} />}
            {ports.includes('E') && <rect x={45} y={24 - size / 2} width={3} height={size} rx={1} fill={color} opacity={0.6} />}
            {ports.includes('S') && <rect x={24 - size / 2} y={45} width={size} height={3} rx={1} fill={color} opacity={0.6} />}
            {ports.includes('W') && <rect x={0} y={24 - size / 2} width={3} height={size} rx={1} fill={color} opacity={0.6} />}
        </>
    );
}

function getPortDirections(type: TileType): string[] {
    switch (type) {
        case 'SOURCE': return ['E'];
        case 'SINK': return ['W'];
        case 'STRAIGHT': return ['N', 'S'];
        case 'ELBOW': return ['N', 'E'];
        case 'T_JUNCTION': return ['N', 'E', 'S'];
        case 'CROSS': return ['N', 'E', 'S', 'W'];
        case 'GATE': return ['N', 'S'];
        case 'FILTER': return ['N', 'S'];
        case 'MIXER': return ['W', 'E', 'S'];
        case 'SPLITTER': return ['N', 'E', 'W'];
        default: return [];
    }
}

/** Dinamik şekiller */
function renderShapes(type: TileType, color: string, sw: number, active: boolean, theme: string) {
    const opacity = active ? 1 : 0.7;
    const isLaser = theme === 'theme-laser';
    const isPlumber = theme === 'theme-plumber';

    // Kalınlık ayarlamaları
    const actualSw = isPlumber ? sw + 2 : (isLaser ? 2 : sw);
    const cap = isLaser ? 'butt' : 'round';

    // Laser için köşe aynaları
    const renderLaserMirror = () => (
        <line x1="16" y1="32" x2="32" y2="16" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
    );

    // Plumber için eklemler
    const renderPlumberJoint = (cx: number, cy: number) => isPlumber && (
        <circle cx={cx} cy={cy} r={actualSw * 1.2} fill="#333" stroke={color} strokeWidth={2} opacity={0.8} />
    );

    switch (type) {
        case 'SOURCE':
            return (
                <g opacity={opacity}>
                    <line x1="24" y1="24" x2="44" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {isLaser ? (
                        <polygon points="12,12 24,24 12,36" fill="rgba(255,255,255,0.9)" />
                    ) : (
                        <>
                            <polygon points="38,19 46,24 38,29" fill={color} />
                            <circle cx="20" cy="24" r="7" fill={isPlumber ? "#222" : "none"} stroke={color} strokeWidth={actualSw * 0.7} />
                            <circle cx="20" cy="24" r="3" fill={color} />
                            {renderPlumberJoint(40, 24)}
                        </>
                    )}
                </g>
            );

        case 'SINK':
            return (
                <g opacity={opacity}>
                    <line x1="4" y1="24" x2="24" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {isLaser ? (
                        <rect x="24" y="16" width="8" height="16" fill="rgba(255,255,255,0.9)" />
                    ) : (
                        <>
                            <circle cx="28" cy="24" r="10" fill="none" stroke={color} strokeWidth={actualSw * 0.6} />
                            <circle cx="28" cy="24" r="5" fill="none" stroke={color} strokeWidth={actualSw * 0.5} />
                            <circle cx="28" cy="24" r="2" fill={color} />
                            {renderPlumberJoint(8, 24)}
                        </>
                    )}
                </g>
            );

        case 'STRAIGHT':
            return (
                <g opacity={opacity}>
                    <line x1="24" y1="2" x2="24" y2="46" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {!isLaser && !isPlumber && <line x1="24" y1="18" x2="24" y2="30" stroke={color} strokeWidth={actualSw + 2} strokeLinecap={cap} opacity={0.3} />}
                    {isPlumber && (
                        <>
                            <line x1="18" y1="24" x2="30" y2="24" stroke={color} strokeWidth={3} />
                            <line x1="18" y1="12" x2="30" y2="12" stroke={color} strokeWidth={3} opacity={0.5} />
                            <line x1="18" y1="36" x2="30" y2="36" stroke={color} strokeWidth={3} opacity={0.5} />
                        </>
                    )}
                </g>
            );

        case 'ELBOW':
            return (
                <g opacity={opacity}>
                    {isLaser ? (
                        <>
                            <line x1="24" y1="2" x2="24" y2="24" stroke={color} strokeWidth={actualSw} />
                            <line x1="24" y1="24" x2="46" y2="24" stroke={color} strokeWidth={actualSw} />
                            {renderLaserMirror()}
                        </>
                    ) : (
                        <>
                            <path d="M24,2 L24,24 Q24,24 44,24" fill="none" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} strokeLinejoin="round" />
                            <circle cx="24" cy="24" r={actualSw * 0.6} fill={color} opacity={0.5} />
                            {renderPlumberJoint(24, 24)}
                        </>
                    )}
                </g>
            );

        case 'T_JUNCTION':
            return (
                <g opacity={opacity}>
                    <line x1="24" y1="2" x2="24" y2="46" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    <line x1="24" y1="24" x2="46" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {isLaser ? (
                        <polygon points="20,20 28,24 20,28" fill="rgba(255,255,255,0.7)" />
                    ) : (
                        <circle cx="24" cy="24" r={actualSw * 0.8} fill={color} opacity={isPlumber ? 1 : 0.4} />
                    )}
                </g>
            );

        case 'CROSS':
            return (
                <g opacity={opacity}>
                    <line x1="24" y1="2" x2="24" y2="46" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    <line x1="2" y1="24" x2="46" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {isLaser ? (
                        <circle cx="24" cy="24" r="4" fill="rgba(255,255,255,0.9)" />
                    ) : (
                        <rect x={24 - actualSw} y={24 - actualSw} width={actualSw * 2} height={actualSw * 2} rx={isPlumber ? 0 : 2} fill={color} opacity={isPlumber ? 1 : 0.3} />
                    )}
                </g>
            );

        case 'MIXER':
            return (
                <g opacity={opacity}>
                    <line x1="2" y1="24" x2="24" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    <line x1="46" y1="24" x2="24" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    <line x1="24" y1="24" x2="24" y2="46" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {isLaser ? (
                        <polygon points="16,24 32,24 24,36" fill="rgba(255,255,255,0.8)" />
                    ) : (
                        <>
                            <circle cx="24" cy="24" r="7" fill="none" stroke={color} strokeWidth={actualSw * 0.6} />
                            <path d="M20,21 L28,27 M28,21 L20,27" stroke={color} strokeWidth={actualSw * 0.4} />
                            {renderPlumberJoint(24, 24)}
                        </>
                    )}
                </g>
            );

        case 'PORTAL':
            return (
                <g opacity={opacity}>
                    <line x1="24" y1="2" x2="24" y2="10" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} opacity={0.5} />
                    <line x1="24" y1="38" x2="24" y2="46" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} opacity={0.5} />
                    <line x1="2" y1="24" x2="10" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} opacity={0.5} />
                    <line x1="38" y1="24" x2="46" y2="24" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} opacity={0.5} />
                    {isLaser ? (
                        <circle cx="24" cy="24" r="8" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeDasharray="4 4">
                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
                        </circle>
                    ) : (
                        <>
                            <circle cx="24" cy="24" r="10" fill="none" stroke={color} strokeWidth={actualSw * 0.5} strokeDasharray="6 6">
                                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="24" cy="24" r="4" fill={color} opacity={0.8} />
                        </>
                    )}
                </g>
            );

        case 'ONE_WAY':
            return (
                <g opacity={opacity}>
                    <line x1="24" y1="2" x2="24" y2="46" stroke={color} strokeWidth={actualSw} strokeLinecap={cap} />
                    {isLaser ? (
                        <polygon points="18,24 30,24 24,10" fill="rgba(255,255,255,0.9)" />
                    ) : (
                        <>
                            <polygon points="16,26 32,26 24,12" fill={isPlumber ? color : 'none'} stroke={color} strokeWidth={isPlumber ? 0 : 2} />
                            {isPlumber && renderPlumberJoint(24, 26)}
                        </>
                    )}
                </g>
            );

        default:
            return (
                <g opacity={opacity}>
                    <circle cx="24" cy="24" r="4" fill={color} />
                </g>
            );
    }
}
