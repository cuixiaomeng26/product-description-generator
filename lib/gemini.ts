import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to .env.local: GEMINI_API_KEY=AIza..."
    );
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Model pinned here — change once to update everywhere.
export const MODEL = "gemini-2.5-flash";

// Shared helper: call Gemini and return the text response
export async function callGemini(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      // @ts-ignore — thinkingConfig is supported at runtime but not yet typed
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const result = await model.generateContent(userMessage);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

// Shared helper: parse Gemini response as JSON
export function parseGeminiJson<T>(raw: string, context: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error(`[${context}] Failed to parse Gemini JSON.\nRaw:\n${cleaned}`);
    throw new Error(
      `Gemini returned invalid JSON in ${context}. ` +
      `Parse error: ${(err as Error).message}`
    );
  }
}
