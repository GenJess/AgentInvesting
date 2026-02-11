
import React from 'react';
import { IdeaResult } from '../types';

interface Props {
  results: IdeaResult[];
}

export const RankingChart: React.FC<Props> = ({ results }) => {
  const sorted = [...results].sort((a, b) => b.averageScore - a.averageScore);
  const maxScore = 100;

  return (
    <div className="space-y-3 bg-black/20 border border-white/5 rounded-2xl p-6">
      {sorted.map((idea, idx) => {
        const isWinner = idx === 0;
        const width = (idea.averageScore / maxScore) * 100;
        
        return (
          <div key={idea.id} className="relative group">
            {/* Label Row */}
            <div className="flex justify-between items-end mb-1 text-xs">
              <span className={`font-bold ${isWinner ? 'text-emerald-400' : 'text-gray-400'} truncate max-w-[80%]`}>
                {idea.scrubbedText}
              </span>
              <span className="font-mono text-gray-500">{Math.round(idea.averageScore)}</span>
            </div>
            
            {/* Bar Background */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              {/* Bar Fill */}
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isWinner ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
