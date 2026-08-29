/**
 * SAEC CAFÉ - Google Gemini 2.5 Flash AI Agent Service
 * Handles direct Gemini API call integration with structured JSON actions and tool calling.
 */

export interface GeminiAgentRequest {
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  apiKey?: string;
}

export interface GeminiAgentResponse {
  text: string;
  card_type: string;
  structured_action?: {
    action: 'analytics' | 'update' | 'query' | 'booking' | 'report';
    target: 'inventory' | 'orders' | 'bookings' | 'analytics';
    parameters: Record<string, any>;
    confirmation_message: string;
  };
  data?: any;
}

/**
 * Gets active Gemini API key from environment variable or localStorage setting
 */
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta as any).env.VITE_GEMINI_API_KEY || '';
}

/**
 * Saves Gemini API Key to local browser storage
 */
export function saveGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', key.trim());
  }
}

/**
 * Calls Google Gemini 2.5 Flash API directly using API Key
 */
export async function callGeminiAgentAPI(req: GeminiAgentRequest): Promise<GeminiAgentResponse> {
  const apiKey = req.apiKey || getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set your Gemini API Key in System Settings or .env file.");
  }

  const systemInstruction = `
You are SAEC CAFÉ Canteen Operations AI Agent powered by Google Gemini.
Your job is to assist the admin by processing natural language commands and providing answers along with structured JSON backend actions.

Always structure your operational output with:
1. Natural language markdown response for the admin.
2. Structured action JSON object:
{
  "action": "<analytics | update | query | booking | report>",
  "target": "<inventory | orders | bookings | analytics>",
  "parameters": { ... },
  "confirmation_message": "<short human-readable response>"
}

Examples:
Input: "Update samosa stock to 50."
Action JSON: {"action":"update","target":"inventory","parameters":{"item":"samosa","quantity":50},"confirmation_message":"Samosa stock updated to 50."}

Input: "Show me top-selling items this week."
Action JSON: {"action":"analytics","target":"orders","parameters":{"timeframe":"7 days","metric":"top-selling"},"confirmation_message":"Here are the top-selling items for the last 7 days."}
`;

  const contents = [
    ...(req.history || []),
    {
      role: 'user' as const,
      parts: [{ text: req.prompt }]
    }
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API call failed with status ${response.status}`);
  }

  const resData = await response.json();
  const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract structured JSON action if present in response
  let structuredAction = undefined;
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*"action"[\s\S]*\})/);
  if (jsonMatch) {
    try {
      structuredAction = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn("Failed to parse extracted JSON from Gemini response", e);
    }
  }

  return {
    text: rawText.replace(/```json[\s\S]*?```/g, '').trim(),
    card_type: structuredAction ? 'CONFIRMATION_CARD' : 'TEXT',
    structured_action: structuredAction
  };
}
