
export type ArchetypeID = string;

export interface Archetype {
  id: ArchetypeID;
  name: string;
  color: string;
  icon: string;
  style: string;
  bias: string;
  isCustom?: boolean;
}

export interface DebateTurn {
  speakerId: ArchetypeID;
  message: string;
  phase: 'opening' | 'rebuttal' | 'consensus';
}

export interface Evaluation {
  judgeId: ArchetypeID;
  score: number; // 0-100
  rationale: string;
}

export interface IdeaResult {
  id: string; // The temp ID used during input
  originalText: string;
  scrubbedText: string; // What the judges saw
  evaluations: Evaluation[];
  averageScore: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
}

export interface SimulationResult {
  winnerId: string;
  rankings: IdeaResult[];
  debateTranscript: DebateTurn[];
  summary: string;
}

export interface InputItem {
  id: string;
  text: string;
}

export interface AppConfig {
  activeJudgeCount: number;
  allowWebSearch: boolean;
}
