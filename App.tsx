import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ARCHETYPES } from './constants';
import { InputItem, AppConfig, SimulationResult, Archetype } from './types';
import { runBatchSimulation, parseRawInputToIdeas, generatePersona } from './services/geminiService';
import { ResultCard } from './components/ResultCard';
import { OrbitStage } from './components/OrbitStage';
import { DebateView } from './components/DebateView';
import { RankingChart } from './components/RankingChart';

const App: React.FC = () => {
  // State
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingJudge, setIsGeneratingJudge] = useState(false);
  const [viewMode, setViewMode] = useState<'input' | 'results'>('input');
  
  // Custom Judges State
  const [customJudges, setCustomJudges] = useState<Archetype[]>([]);
  const [judgeInput, setJudgeInput] = useState('');
  const [showJudgeCreator, setShowJudgeCreator] = useState(false);

  // UI State
  const [isDeckExpanded, setIsDeckExpanded] = useState(true);

  const [config, setConfig] = useState<AppConfig>({
    activeJudgeCount: 5,
    allowWebSearch: false
  });

  // Combine Default and Custom Judges
  const availableJudges = useMemo(() => [...customJudges, ...ARCHETYPES], [customJudges]);
  
  // Determine Active Judges based on slider count
  // We prioritize Custom Judges first, then fill remainder with default
  const activeJudges = useMemo(() => {
    const totalNeeded = config.activeJudgeCount;
    const customs = customJudges.slice(0, totalNeeded);
    const defaults = ARCHETYPES.slice(0, Math.max(0, totalNeeded - customs.length));
    return [...customs, ...defaults];
  }, [config.activeJudgeCount, customJudges]);

  // --- Handlers ---

  const handleAddIdea = () => {
    if (!inputText.trim()) return;
    const newItem: InputItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: inputText.trim()
    };
    setInputs(prev => [...prev, newItem]);
    setInputText('');
  };

  const handleSmartSplit = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    const splitIdeas = await parseRawInputToIdeas(inputText);
    
    const newItems = splitIdeas.map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text: text
    }));
    
    setInputs(prev => [...prev, ...newItems]);
    setInputText('');
    setIsParsing(false);
  };

  const handleAddJudge = async () => {
    if (!judgeInput.trim()) return;
    setIsGeneratingJudge(true);
    const newJudge = await generatePersona(judgeInput);
    if (newJudge) {
      setCustomJudges(prev => [newJudge, ...prev]);
      setJudgeInput('');
      setShowJudgeCreator(false);
    }
    setIsGeneratingJudge(false);
  };

  const handleRun = async () => {
    if (inputs.length === 0) return;
    setIsProcessing(true);
    setIsDeckExpanded(false); // Auto collapse for view
    setSimulationResult(null);

    const result = await runBatchSimulation(inputs, activeJudges, config.allowWebSearch);
    
    if (result) {
      setSimulationResult(result);
      setViewMode('results');
    }
    setIsProcessing(false);
  };

  const handleReset = () => {
    setInputs([]);
    setSimulationResult(null);
    setViewMode('input');
    setInputText('');
    setIsDeckExpanded(true);
  };

  return (
    <div className="relative h-screen w-screen bg-[#030305] text-white overflow-hidden font-body selection:bg-blue-500/30">
      
      {/* 1. BACKGROUND VISUALIZER */}
      <div className={`absolute inset-0 z-0 transition-all duration-1000 ${viewMode === 'results' ? 'lg:w-[50vw]' : 'w-full'}`}>
        <OrbitStage 
          activeJudges={activeJudges} 
          isProcessing={isProcessing}
          activeIdeas={inputs}
          viewMode={viewMode}
          winnerId={simulationResult?.winnerId}
        />
      </div>

      {/* 2. TOP HUD (Config) */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4 lg:p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <h1 className="text-xl font-bold font-head tracking-tighter text-white">
            Orbital Archetypes
          </h1>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-1">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isProcessing ? 'Simulating...' : 'System Ready'}
          </div>
        </div>

        {viewMode === 'results' && (
           <button 
             onClick={handleReset}
             className="pointer-events-auto px-6 py-3 bg-white text-black font-bold font-head rounded-full hover:scale-105 transition-transform shadow-lg"
           >
             NEW SESSION
           </button>
        )}
      </header>


      {/* 3. INPUT MODE: EXPANDABLE COMMAND DECK */}
      {viewMode === 'input' && !isProcessing && (
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl transition-all duration-500 ease-in-out ${isDeckExpanded ? 'translate-y-0' : 'translate-y-[90%]'}`}
        >
          {/* Toggle Tab */}
          <button 
            onClick={() => setIsDeckExpanded(!isDeckExpanded)}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border-t border-x border-white/20 rounded-t-xl px-6 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
          >
            {isDeckExpanded ? 'Collapse Deck' : 'Expand Deck'}
          </button>

          {/* Main Glass Panel */}
          <div className="bg-[#0a0a0c]/90 backdrop-blur-2xl border-t border-x border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-6 pb-8 flex flex-col gap-6">
             
             {/* Row 1: Controls & Judge Management */}
             <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                
                {/* Config Controls */}
                <div className="flex items-center gap-6">
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Active Judges</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" min="1" max="5" 
                          value={config.activeJudgeCount} 
                          onChange={(e) => setConfig(prev => ({ ...prev, activeJudgeCount: parseInt(e.target.value) }))}
                          className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <span className="font-mono text-sm">{config.activeJudgeCount}</span>
                      </div>
                   </div>

                   <div className="h-8 w-px bg-white/10" />

                   <button 
                      onClick={() => setConfig(prev => ({ ...prev, allowWebSearch: !prev.allowWebSearch }))}
                      className={`flex flex-col gap-1 text-left group`}
                   >
                      <label className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-white transition-colors cursor-pointer">Data Uplink</label>
                      <div className={`text-xs font-bold flex items-center gap-2 ${config.allowWebSearch ? 'text-blue-400' : 'text-gray-500'}`}>
                         <div className={`w-2 h-2 rounded-full ${config.allowWebSearch ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-gray-600'}`} />
                         {config.allowWebSearch ? 'ONLINE' : 'OFFLINE'}
                      </div>
                   </button>
                </div>

                {/* Judge Creator */}
                <div className="flex items-center gap-2">
                   {showJudgeCreator ? (
                     <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 pl-4 animate-in">
                        <input 
                          autoFocus
                          value={judgeInput}
                          onChange={(e) => setJudgeInput(e.target.value)}
                          placeholder="Name (e.g. Elon Musk)"
                          className="bg-transparent border-none text-sm text-white focus:ring-0 placeholder-gray-500 w-40"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddJudge()}
                        />
                        <button 
                          onClick={handleAddJudge}
                          disabled={isGeneratingJudge}
                          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                        >
                          {isGeneratingJudge ? '...' : '+'}
                        </button>
                     </div>
                   ) : (
                     <button 
                       onClick={() => setShowJudgeCreator(true)}
                       className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-gray-300 transition-all flex items-center gap-2"
                     >
                       <span>+ Define Judge</span>
                     </button>
                   )}
                </div>
             </div>

             {/* Row 2: Input Area */}
             <div className="flex gap-4">
                {/* Stardock (Mini List) */}
                {inputs.length > 0 && (
                   <div className="w-1/3 border-r border-white/10 pr-4 flex flex-col gap-2">
                      <div className="text-[10px] uppercase font-bold text-gray-500">Queued Vectors ({inputs.length})</div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[120px] space-y-2">
                        {inputs.map((item, i) => (
                           <div key={item.id} className="bg-white/5 p-2 rounded text-[11px] text-gray-300 relative group">
                              <span className="line-clamp-2">{item.text}</span>
                              <button 
                                onClick={() => setInputs(prev => prev.filter(p => p.id !== item.id))}
                                className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100"
                              >&times;</button>
                           </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Main Textarea */}
                <div className="flex-1 relative">
                   <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddIdea(); } }}
                      placeholder="Paste idea(s) here..."
                      className="w-full h-[120px] bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-200 focus:border-white/30 focus:bg-black/60 transition-all resize-y"
                   />
                   
                   {/* Actions Row within Textarea container */}
                   <div className="absolute bottom-3 right-3 flex gap-2">
                      <button 
                        onClick={handleSmartSplit}
                        disabled={!inputText.trim() || isParsing}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-wide hover:bg-white/10 disabled:opacity-30 transition-colors flex items-center gap-2"
                      >
                         {isParsing ? 'Parsing...' : 'AI Split'}
                      </button>
                      <button 
                        onClick={handleAddIdea}
                        className="px-3 py-1 bg-white text-black rounded text-[10px] font-bold uppercase tracking-wide hover:bg-gray-200 transition-colors"
                      >
                         Add
                      </button>
                   </div>
                </div>
             </div>
             
             {/* Row 3: Big Button */}
             <button 
                onClick={handleRun}
                disabled={inputs.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-head font-bold text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-blue-500/20 hover:scale-[1.01] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
             >
                Initialize Simulation
             </button>

          </div>
        </div>
      )}

      {/* 4. PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <div className="bg-black/40 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 animate-in">
              <div className="flex gap-2">
                 <div className="w-1.5 h-12 bg-blue-500 animate-pulse" />
                 <div className="w-1.5 h-12 bg-purple-500 animate-pulse delay-75" />
                 <div className="w-1.5 h-12 bg-pink-500 animate-pulse delay-150" />
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">Processing Vector</div>
           </div>
        </div>
      )}

      {/* 5. RESULTS MODE: SPLIT PANEL */}
      {viewMode === 'results' && simulationResult && (
        <div className="absolute inset-0 z-30 flex justify-end">
          
          {/* Right Results Panel (Slide In) */}
          <div className="w-full lg:w-[50vw] h-full bg-[#030305]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.8)] animate-in">
             
             {/* Results Header */}
             <div className="shrink-0 p-8 border-b border-white/10 bg-white/[0.02]">
                <h2 className="text-2xl font-head font-bold text-white mb-2">Council Verdict</h2>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                   <span>{inputs.length} Candidates</span>
                   <span className="w-1 h-1 bg-gray-600 rounded-full"/>
                   <span>{config.activeJudgeCount} Judges</span>
                   <span className="w-1 h-1 bg-gray-600 rounded-full"/>
                   <span className={config.allowWebSearch ? 'text-blue-400' : ''}>
                     {config.allowWebSearch ? 'External Data' : 'Internal Logic'}
                   </span>
                </div>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                
                {/* 1. Winner Highlight */}
                {simulationResult.rankings.filter(r => r.id === simulationResult.winnerId).map(winner => (
                  <section key={winner.id} className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent blur-2xl rounded-full" />
                      <div className="relative border border-emerald-500/30 bg-emerald-900/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                           <span className="px-2 py-1 bg-emerald-500 text-black text-[10px] font-bold uppercase rounded">Winner</span>
                           <span className="text-2xl font-head font-bold text-emerald-400">{Math.round(winner.averageScore)}/100</span>
                        </div>
                        <p className="text-lg font-head text-white leading-snug mb-4">{winner.scrubbedText}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                           <div className="bg-black/20 p-2 rounded">
                              <span className="block text-[9px] uppercase tracking-wider text-emerald-500 mb-1">Top Strength</span>
                              {winner.strengths[0]}
                           </div>
                           <div className="bg-black/20 p-2 rounded">
                              <span className="block text-[9px] uppercase tracking-wider text-emerald-500 mb-1">Key Insight</span>
                              {winner.evaluations.find(e => e.score >= 80)?.rationale.substring(0, 60)}...
                           </div>
                        </div>
                      </div>
                  </section>
                ))}

                {/* 2. Ranking Chart (If > 1 idea) */}
                {simulationResult.rankings.length > 1 && (
                  <section>
                     <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Comparative Analysis</h3>
                        <div className="h-px flex-1 bg-white/10" />
                     </div>
                     <RankingChart results={simulationResult.rankings} />
                  </section>
                )}

                {/* 3. Debate Transcript */}
                <section>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-white/10" />
                      <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Deliberation Log</h3>
                      <div className="h-px flex-1 bg-white/10" />
                   </div>
                   <DebateView transcript={simulationResult.debateTranscript} judges={availableJudges} />
                </section>

                {/* 4. Full Rankings */}
                <section className="pb-20">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-white/10" />
                      <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Detailed Breakdown</h3>
                      <div className="h-px flex-1 bg-white/10" />
                   </div>
                   <div className="space-y-4">
                      {simulationResult.rankings.map(idea => (
                        <ResultCard 
                          key={idea.id} 
                          idea={idea} 
                          isWinner={idea.id === simulationResult.winnerId}
                          judges={availableJudges}
                        />
                      ))}
                   </div>
                </section>

             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;