import { useMemo } from 'react';
import type { CalculatedFlowPath } from '@flowstate/game-engine';

interface FlowOverlayProps {
  flowPaths: CalculatedFlowPath[];
  gridSize: number;
  tileSize: number;
  gap: number;
  boardPadding?: number;
}

function colorCSS(c:string):string {
  const m:Record<string,string>={
    cyan:'#22d3ee',magenta:'#e879f9',yellow:'#facc15',
    white:'#f1f5f9',purple:'#a855f7',green:'#4ade80',orange:'#fb923c',
  };
  return m[c]??'#94a3b8';
}

export function FlowOverlay({flowPaths,gridSize,tileSize,gap,boardPadding=16}:FlowOverlayProps){
  const total = gridSize*tileSize+(gridSize-1)*gap+boardPadding*2;

  const elements = useMemo(()=>{
    return flowPaths.flatMap((fp,pi)=>{
      if(!fp.edges?.length) return [];
      const col = colorCSS(fp.color);
      const px=(pos:{row:number,col:number})=>boardPadding+pos.col*(tileSize+gap)+tileSize/2;
      const py=(pos:{row:number,col:number})=>boardPadding+pos.row*(tileSize+gap)+tileSize/2;
      const full=fp.edges.map(e=>`M${px(e.from)}${py(e.from)}L${px(e.to)}${py(e.to)}`).join(' ');

      return [
        // Glow
        <path key={`g${pi}`} d={full} fill="none" stroke={col}
          strokeWidth="5" strokeLinecap="round" opacity="0.35"
          style={{animation:`fglow 1.8s ease-in-out ${pi*0.2}s infinite alternate`}}/>,
        // Dash
        <path key={`d${pi}`} d={full} fill="none" stroke="#fff"
          strokeWidth="2" strokeLinecap="round" opacity="0.65"
          strokeDasharray="5 9"
          style={{animation:`fdash 0.5s ${pi*0.05}s linear infinite`,
            filter:`drop-shadow(0 0 3px ${col})`}}/>,
        // Per-edge sparkles
        ...fp.edges.map((e,ei)=>{
          const ep=`M${px(e.from)}${py(e.from)}L${px(e.to)}${py(e.to)}`;
          const dur=(0.45+ei*0.05).toFixed(2);
          const beg=((pi*0.08+ei*0.03)%1).toFixed(2);
          return (
            <circle key={`s${pi}${ei}`} r="3" fill="#fff" opacity="0.9"
              style={{filter:`drop-shadow(0 0 4px ${col})`}}>
              <animateMotion dur={`${dur}s`} begin={`${beg}s`}
                repeatCount="indefinite" path={ep}/>
            </circle>
          );
        }),
      ];
    });
  },[flowPaths,tileSize,gap,boardPadding]);

  if(!elements.length) return null;

  return (
    <svg className="flow-overlay" width={total} height={total}
      viewBox={`0 0 ${total} ${total}`}
      style={{position:'absolute',top:0,left:0,pointerEvents:'none',zIndex:10}}>
      <defs><style>{`
        @keyframes fdash{from{stroke-dashoffset:14}to{stroke-dashoffset:0}}
        @keyframes fglow{from{opacity:.15}to{opacity:.55}}
      `}</style></defs>
      {elements}
    </svg>
  );
}
