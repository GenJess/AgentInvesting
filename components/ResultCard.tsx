
import React, { useState } from 'react';
import { IdeaResult, Archetype } from '../types';

interface Props {
  idea: IdeaResult;
  isWinner: boolean;
  judges: Archetype[];
}

export const ResultCard: React.FC<Props> = ({ idea, isWinner, judges }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  return (
    <div 
      className={`group relative overflow-hidden transition-all duration-300 ease-out border rounded-2xl p-6 
        ${isExpanded 
          ? 'bg-white/[0.08] border-white/20 shadow-2xl scale-[1.01]' 
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
        } ${isWinner ? 'border-emerald-500/30' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="shrink-0 flex flex-col items-center gap-1">
             <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${isWinner ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                #{idea.rank}
             </span>
          </div>
          <div className="min-w-0">
             <h3 className="text-sm lg:text-base font-semibold text-white/90 leading-snug">
               {idea.scrubbedText}
             </h3>
             {isWinner && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 block">Council Choice</span>}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-3xl font-bold font-head leading-none tabular-nums" style={{ color: getStatusColor(idea.averageScore) }}>
            {Math.round(idea.averageScore)}
          </div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Avg Score</div>
        </div>
      </div>

      {/* Mini Judge Performance Bar */}
      <div className="flex gap-1.5 h-1.5 mt-6">
        {idea.evaluations.map((ev) => {
          const arch = judges.find(a => a.id === ev.judgeId);
          const isHigh = ev.score >= 70;
          return (
            <div 
              key={ev.judgeId}
              className="flex-1 rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: isHigh ? arch?.color || '#888' : '#ffffff10',
                opacity: isHigh ? 1 : 0.3
              }}
              title={`${arch?.name}: ${ev.score}`}
            />
          );
        })}
      </div>

      {isExpanded && (
        <div className="mt-8 space-y-8 animate-in cursor-default" onClick={e => e.stopPropagation()}>
          
          {/* Summary Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-emerald-900/10 border border-emerald-500/10 p-4 rounded-xl">
               <h4 className="text-[10px] uppercase font-bold text-emerald-400 mb-2 tracking-widest">Consensus Strengths</h4>
               <ul className="space-y-1">
                 {idea.strengths.map((s, i) => (
                   <li key={i} className="text-[11px] text-gray-300 flex items-start gap-2">
                     <span className="text-emerald-500 mt-0.5">+</span> {s}
                   </li>
                 ))}
               </ul>
             </div>
             <div className="bg-rose-900/10 border border-rose-500/10 p-4 rounded-xl">
               <h4 className="text-[10px] uppercase font-bold text-rose-400 mb-2 tracking-widest">Critical Risks</h4>
               <ul className="space-y-1">
                 {idea.weaknesses.map((s, i) => (
                   <li key={i} className="text-[11px] text-gray-300 flex items-start gap-2">
                     <span className="text-rose-500 mt-0.5">-</span> {s}
                   </li>
                 ))}
               </ul>
             </div>
          </div>

          {/* Individual Breakdown */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-white/5 pb-2">Judge Breakdown</h4>
            {idea.evaluations.map((ev) => {
              const arch = judges.find(a => a.id === ev.judgeId);
              return (
                <div key={ev.judgeId} className="flex gap-4 items-start">
                   <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg" style={{ backgroundColor: arch?.color || '#888' }}>
                     {arch?.icon}
                   </div>
                   <div className="flex-1 space-y-1">
                     <div className="flex justify-between items-center">
                       <span className="text-xs font-bold" style={{ color: arch?.color || '#fff' }}>{arch?.name}</span>
                       <span className="text-xs font-mono font-bold" style={{ color: getStatusColor(ev.score) }}>{ev.score}/100</span>
                     </div>
                     <p className="text-[11px] text-gray-400 leading-relaxed bg-white/[0.03] p-2 rounded">
                       {ev.rationale}
                     </p>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`mt-4 flex justify-center transition-all duration-300 ${isExpanded ? 'rotate-180 opacity-50' : 'opacity-20 group-hover:opacity-100'}`}>
         <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
         </svg>
      </div>
    </div>
  );
};
