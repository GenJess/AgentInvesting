
import React, { useEffect, useState } from 'react';
import { Archetype, InputItem } from '../types';

interface Props {
  activeJudges: Archetype[];
  isProcessing: boolean;
  activeIdeas: InputItem[];
  viewMode: 'input' | 'results';
  winnerId?: string;
}

export const OrbitStage: React.FC<Props> = ({ activeJudges, isProcessing, activeIdeas, viewMode, winnerId }) => {
  const [dimensions, setDimensions] = useState({ radius: 300, cx: 0, cy: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // When in results mode, center the orbit in the LEFT half of the screen
      const centerX = viewMode === 'results' && width > 1024 ? width * 0.25 : width / 2;
      const centerY = height / 2;
      
      const minDim = Math.min(width, height);
      // Adjust scale for results mode to fit nicely
      const scale = viewMode === 'results' ? 0.25 : 0.35;
      
      setDimensions({ radius: minDim * scale, cx: centerX, cy: centerY });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden transition-all duration-1000">
      
      {/* 1. Deep Space Background Elements */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-20 bg-blue-900 transition-all duration-[2000ms]"
        style={{ width: isProcessing ? '80vw' : '40vw', height: isProcessing ? '80vh' : '40vh' }}
      />
      
      {/* 2. The Orbital Rings */}
      <div 
        className="absolute flex items-center justify-center transition-all duration-1000"
        style={{ left: dimensions.cx, top: dimensions.cy }}
      >
         <div 
            className="absolute border border-white/[0.04] rounded-full animate-spin-slow -translate-x-1/2 -translate-y-1/2"
            style={{ width: dimensions.radius * 2.5, height: dimensions.radius * 2.5 }}
         />
         <div 
            className="absolute border border-dashed border-white/[0.06] rounded-full animate-spin-reverse-slow -translate-x-1/2 -translate-y-1/2"
            style={{ width: dimensions.radius * 1.8, height: dimensions.radius * 1.8 }}
         />
      </div>

      {/* 3. The Central "Stardock" (Ideas) */}
      <div 
        className="absolute flex items-center justify-center z-10 transition-all duration-1000"
        style={{ left: dimensions.cx, top: dimensions.cy }}
      >
        {activeIdeas.length === 0 ? (
           // Empty State Core
           <div className="w-4 h-4 rounded-full bg-white/20 animate-pulse blur-sm -translate-x-1/2 -translate-y-1/2" />
        ) : (
           // Active Ideas Cluster
           <div className={`relative transition-all duration-1000 -translate-x-1/2 -translate-y-1/2 ${isProcessing ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
              {activeIdeas.map((idea, idx) => {
                 // Distribute ideas in a tight inner circle
                 const angle = (idx / activeIdeas.length) * 2 * Math.PI;
                 const distance = activeIdeas.length > 1 ? 40 : 0; 
                 const ix = Math.cos(angle) * distance;
                 const iy = Math.sin(angle) * distance;
                 const isWinner = winnerId === idea.id;

                 return (
                    <div 
                      key={idea.id}
                      className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border border-white/20 bg-black/80 backdrop-blur-md flex items-center justify-center text-[10px] font-mono transition-all duration-500`}
                      style={{ 
                        transform: `translate(${ix}px, ${iy}px)`,
                        borderColor: isWinner ? '#10b981' : 'rgba(255,255,255,0.2)',
                        zIndex: isWinner ? 20 : 10
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${isWinner ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-white/50'}`} />
                    </div>
                 );
              })}
           </div>
        )}
      </div>

      {/* 4. The Processing Singularity (Only visible during Sim) */}
      <div 
        className={`absolute w-0 h-0 rounded-full bg-white shadow-[0_0_100px_white] transition-all duration-[2000ms] z-20 -translate-x-1/2 -translate-y-1/2 ${isProcessing ? 'w-24 h-24 opacity-100' : 'w-0 h-0 opacity-0'}`} 
        style={{ left: dimensions.cx, top: dimensions.cy }}
      />

      {/* 5. The Judges (Satellites) */}
      <div className="absolute inset-0">
        {activeJudges.map((arch, idx) => {
          const angle = (idx / activeJudges.length) * 2 * Math.PI - (Math.PI / 2);
          // During processing, judges move closer to center
          const currentRadius = isProcessing ? dimensions.radius * 0.4 : dimensions.radius;
          
          const x = Math.cos(angle) * currentRadius + dimensions.cx;
          const y = Math.sin(angle) * currentRadius + dimensions.cy;

          return (
            <div 
              key={arch.id}
              className="absolute w-0 h-0 transition-all duration-[1500ms] ease-in-out"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
               {/* Laser Beam during processing */}
               <div 
                 className={`absolute top-0 left-0 h-px origin-left transition-all duration-500 ${isProcessing ? 'opacity-60' : 'opacity-0'}`}
                 style={{ 
                   width: currentRadius, 
                   backgroundColor: arch.color,
                   transform: `rotate(${angle + Math.PI}rad) translateX(-100%)` // Aim at center
                 }}
               />

               {/* Judge Icon */}
               <div 
                 className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group"
               >
                 <div 
                   className={`w-14 h-14 rounded-full border-2 bg-black flex items-center justify-center font-head text-xl font-bold transition-all duration-300 relative overflow-hidden`}
                   style={{ 
                     borderColor: arch.color,
                     color: arch.color,
                     boxShadow: `0 0 ${isProcessing ? '40px' : '15px'} ${arch.color}44`,
                     // Highlight custom judges with a specialized border style
                     borderStyle: arch.isCustom ? 'double' : 'solid',
                     borderWidth: arch.isCustom ? '4px' : '2px'
                   }}
                 >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {arch.icon}
                 </div>
                 
                 <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/60 border border-white/10 text-white backdrop-blur-md transition-all ${isProcessing ? 'opacity-0' : 'opacity-100'}`}>
                    {arch.name} {arch.isCustom && '*'}
                 </div>
               </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
