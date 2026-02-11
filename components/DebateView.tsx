
import React from 'react';
import { DebateTurn, Archetype } from '../types';

interface Props {
  transcript: DebateTurn[];
  judges: Archetype[];
}

export const DebateView: React.FC<Props> = ({ transcript, judges }) => {
  return (
    <div className="relative border border-white/10 bg-black/40 rounded-3xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
      
      <div className="p-6 lg:p-8 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
         <div className="flex items-center gap-3 mb-6 opacity-50">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Council Deliberation Feed</span>
         </div>

         {transcript.map((turn, idx) => {
           const arch = judges.find(a => a.id === turn.speakerId);
           const isLeft = idx % 2 === 0;

           return (
             <div key={idx} className={`flex gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
               {/* Avatar */}
               <div className="shrink-0 flex flex-col items-center gap-2">
                 <div 
                   className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black shadow-lg border border-white/20"
                   style={{ backgroundColor: arch?.color || '#888' }}
                 >
                   {arch?.icon}
                 </div>
               </div>

               {/* Bubble */}
               <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} max-w-[80%]`}>
                 <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 px-1">
                   {arch?.name} &bull; {turn.phase}
                 </span>
                 <div 
                   className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${isLeft ? 'rounded-tl-none bg-white/10 border-white/5' : 'rounded-tr-none bg-white/[0.05] border-white/5 text-right'}`}
                 >
                   {turn.message}
                 </div>
               </div>
             </div>
           );
         })}
         
         <div className="h-8" /> {/* Spacer */}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#030305] to-transparent pointer-events-none z-10" />
    </div>
  );
};
