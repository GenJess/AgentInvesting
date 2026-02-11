import { GoogleGenAI, Type } from "@google/genai";
import { Archetype, SimulationResult, InputItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Scrubbing Service
const scrubSingleText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an anonymity filter. Remove all specific brand names, founder names, and company identifiers. 
      Replace them with generic placeholders (e.g., [Tech Company], [Founder]).
      Keep the business model and value prop intact. 
      Input: "${text}"
      Output (Text Only):`,
    });
    return response.text?.trim() || text;
  } catch {
    return text;
  }
};

// 2. Intelligent Splitter
export const parseRawInputToIdeas = async (rawText: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following text. It may contain one or multiple business ideas pasted together.
      Split them into distinct, standalone pitch summaries.
      Return a JSON array of strings.
      
      TEXT: "${rawText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const result = JSON.parse(response.text || '{}');
    return result.ideas || [rawText];
  } catch (e) {
    console.error("Failed to parse ideas", e);
    return [rawText];
  }
};

// 3. Custom Judge Generator
export const generatePersona = async (name: string): Promise<Archetype | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a fictional or real persona profile for a judge named "${name}".
      Determine their investment style, bias, a Hex color code representing them, and a single letter icon.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            style: { type: Type.STRING, description: "Short 2-3 word description of their vibe (e.g. 'Ruthless Efficiency')" },
            bias: { type: Type.STRING, description: "What they look for (e.g. 'scalability, crypto, mars')" },
            color: { type: Type.STRING, description: "Hex code" },
            icon: { type: Type.STRING, description: "Single character, usually first letter" }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    if (!data.name) return null;

    return {
      id: `custom-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      style: data.style,
      bias: data.bias,
      color: data.color,
      icon: data.icon,
      isCustom: true
    };
  } catch (e) {
    console.error("Failed to generate persona", e);
    return null;
  }
};

// 4. Main Simulation
export const runBatchSimulation = async (
  inputs: InputItem[], 
  activeArchetypes: Archetype[], 
  webSearch: boolean
): Promise<SimulationResult | null> => {
  
  const processedInputs = await Promise.all(inputs.map(async (item) => {
    if (webSearch) {
      const scrubbed = await scrubSingleText(item.text);
      return { ...item, processedText: scrubbed };
    }
    return { ...item, processedText: item.text };
  }));

  const archetypesPrompt = activeArchetypes.map(a => 
    `- ${a.name} (${a.style}): Focuses on ${a.bias}.`
  ).join('\n');

  const ideasPrompt = processedInputs.map(i => 
    `ID: ${i.id}
     PITCH: "${i.processedText}"`
  ).join('\n\n');

  const systemPrompt = `
    You are the Orbital Council, a board of AI Venture Capital archetypes.
    
    YOUR GOAL:
    1. Analyze the provided ideas.
    2. Rank them against each other.
    3. Hold a debate amongst the judges to determine the winner.
    
    THE JUDGES:
    ${archetypesPrompt}
    
    THE CONTEXT:
    ${webSearch ? "You have Web Search access. The ideas have been anonymized (Blind Test). Use search to validate market size and competition, but judge the raw merit of the idea without founder bias." : "You do NOT have Web Search. This is an internal logic assessment. Identities are revealed."}

    INSTRUCTIONS:
    - If there is only 1 idea, evaluate it thoroughly.
    - If there are 2+ ideas, compare them directly.
    - Generate a "Debate Transcript" where judges speak to each other.
      - If scores are close, they should argue.
      - If scores are divergent, they should debate the controversy.
      - Each active judge should speak at least once.
      - End with a consensus.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        ${systemPrompt}
        
        CANDIDATE IDEAS:
        ${ideasPrompt}
      `,
      config: {
        responseMimeType: "application/json",
        tools: webSearch ? [{ googleSearch: {} }] : [],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rankings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Must match the input ID" },
                  scrubbedText: { type: Type.STRING },
                  averageScore: { type: Type.NUMBER },
                  rank: { type: Type.NUMBER },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evaluations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        judgeId: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        rationale: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            debateTranscript: {
              type: Type.ARRAY,
              description: "A conversation between judges discussing the ideas.",
              items: {
                type: Type.OBJECT,
                properties: {
                  speakerId: { type: Type.STRING },
                  message: { type: Type.STRING },
                  phase: { type: Type.STRING, enum: ["opening", "rebuttal", "consensus"] }
                }
              }
            },
            winnerId: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}') as SimulationResult;
    if (!result.rankings) return null;
    return result;

  } catch (error) {
    console.error("Batch simulation failed", error);
    return null;
  }
};