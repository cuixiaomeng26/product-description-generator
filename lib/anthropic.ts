import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const response = await stream.finalMessage();
  const block = response.content.find((b: { type: string }) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text in Claude response");
  return block.text;
}

export function parseClaudeJson<T>(raw: string, context: string): T {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`[${context}] Failed to parse JSON: ${cleaned.slice(0, 200)}`);
  }
}
