// ============================================================
// FlowOverlay — Akış yayılım görsel katmanı
// Board üzerinde akan renk animasyonlarını SVG ile çizer.
// ============================================================

import { useMemo } from 'react';
import type { CalculatedFlowPath } from '@flowstate/game-engine';

interface FlowOverlayProps {
    flowPaths: CalculatedFlowPath[];
    gridSize: number;
    tileSize: number;
    gap: number;
}

/** Akış rengine göre CSS renk değeri */
function flowColorToCSS(color: string): string {
    switch (color) {
        case 'cyan': return '#22d3ee';
        case 'magenta': return '#e879f9';
        case 'yellow': return '#facc15';
        case 'white': return '#f1f5f9';
        default: return '#94a3b8';
    }
}

/** Glow filtre rengi */
function flowColorToGlow(color: string): string {
    switch (color) {
        case 'cyan': return '0 0 8px rgba(34,211,238,0.6)';
        case 'magenta': return '0 0 8px rgba(232,121,249,0.6)';
        case 'yellow': return '0 0 8px rgba(250,204,21,0.6)';
        case 'white': return '0 0 8px rgba(241,245,249,0.6)';
        default: return 'none';
    }
}

export function FlowOverlay({ flowPaths, gridSize, tileSize, gap }: FlowOverlayProps) {
    /** Toplam boyut hesapla */
    const totalSize = gridSize * tileSize + (gridSize - 1) * gap + 32; // +32 padding

    /** Akış yollarını SVG path'e çevir */
    const paths = useMemo(() => {
        return flowPaths.map((fp, pathIdx) => {
            if (!fp.edges || fp.edges.length === 0) return null;

            // Kesin bağlantılar üzerinden (edges) ayrı dalları bağımsız çizgilerle çiz
            const pathStr = fp.edges.map(edge => {
                const pt1 = {
                    x: 16 + edge.from.col * (tileSize + gap) + tileSize / 2,
                    y: 16 + edge.from.row * (tileSize + gap) + tileSize / 2,
                };
                const pt2 = {
                    x: 16 + edge.to.col * (tileSize + gap) + tileSize / 2,
                    y: 16 + edge.to.row * (tileSize + gap) + tileSize / 2,
                };
                return `M ${pt1.x} ${pt1.y} L ${pt2.x} ${pt2.y}`;
            }).join(' ');

            const color = flowColorToCSS(fp.color);

            return (
                <g key={`flow-${pathIdx}`}>
                    {/* Dış Glow Titreşim Katmanı */}
                    <path
                        d={pathStr}
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.5"
                        style={{
                            animation: `electricPulse 1.5s ease-in-out infinite alternate`,
                            filter: `drop-shadow(${flowColorToGlow(fp.color)})`,
                        }}
                    />
                    {/* Ana elektrik akış çizgisi — Kesik kesik enerjik akan hat */}
                    <path
                        d={pathStr}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                        strokeDasharray="8 12"
                        style={{
                            animation: `flowElectricity 0.4s linear infinite`,
                            filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color})`,
                            animationDelay: `${pathIdx * 50}ms`,
                        }}
                    />
                    {/* Akan Lazer Kıvılcım Efekti */}
                    <circle r="4" fill="#fff" opacity="1" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
                        <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={pathStr}
                        />
                    </circle>
                </g>
            );
        }).filter(Boolean);
    }, [flowPaths, tileSize, gap]);

    if (paths.length === 0) return null;

    return (
        <svg
            className="flow-overlay"
            width={totalSize}
            height={totalSize}
            viewBox={`0 0 ${totalSize} ${totalSize}`}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 10,
            }}
        >
            <defs>
                <style>{`
          @keyframes flowElectricity {
            from { stroke-dashoffset: 20; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes electricPulse {
            from { opacity: 0.3; filter: drop-shadow(0 0 4px rgba(255,255,255,0.4)); }
            to { opacity: 0.8; filter: drop-shadow(0 0 12px rgba(255,255,255,0.8)); }
          }
        `}</style>
            </defs>
            {paths}
        </svg>
    );
}
