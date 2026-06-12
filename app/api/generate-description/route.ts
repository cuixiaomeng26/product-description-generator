import { NextRequest, NextResponse } from "next/server";
import { callGemini, parseGeminiJson } from "@/lib/gemini";

export interface GenerateDescriptionRequest {
  productName: string;
  category: string;
  sellingPoints: string;
  marketplace: string;
  tone: string;
  language: string;
}

export interface ProductDescriptionOutput {
  seoTitle: string;
  metaDescription: string;
  fullDescription: string;
  bulletPoints: string[];
  tags: string[];
}

const SYSTEM_PROMPT = `You are an expert e-commerce copywriter and SEO specialist.
Your job is to generate compelling, conversion-optimised product content for online sellers.
Always return a valid JSON object with exactly these keys:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "fullDescription": "...",
  "bulletPoints": ["...", "...", "...", "...", "..."],
  "tags": ["...", "...", "...", "...", "...", "...", "..."]
}
Do not include markdown fences or any text outside the JSON.`;

export async function POST(req: NextRequest) {
  let body: GenerateDescriptionRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { productName, category, sellingPoints, marketplace, tone, language } = body;
  if (!productName?.trim() || !sellingPoints?.trim()) {
    return NextResponse.json(
      { error: "Product name and selling points are required." },
      { status: 400 }
    );
  }

  const userMessage = `
Generate a complete product listing for the following product.

Product name: ${productName.trim()}
Category: ${category || "General"}
Key selling points: ${sellingPoints.trim()}
Target marketplace: ${marketplace || "General e-commerce"}
Tone: ${tone || "Professional"}
Output language: ${language || "English"}

Requirements:
- SEO title: max 70 characters, keyword-rich, compelling
- Meta description: max 160 characters, clear value proposition
- Full description: 150-250 words, benefits-led, engaging
- Bullet points: exactly 5, each starting with a strong verb, max 15 words each
- Tags: 7-10 relevant search keywords/phrases

Return only the JSON object.
`.trim();

  let raw: string;
  try {
    raw = await callGemini(SYSTEM_PROMPT, userMessage);
  } catch (err) {
    console.error("[generate-description] Gemini API error:", err);
    return NextResponse.json(
      { error: "Failed to contact AI service. Please try again." },
      { status: 502 }
    );
  }

  let output: ProductDescriptionOutput;
  try {
    output = parseGeminiJson<ProductDescriptionOutput>(raw, "generate-description");
  } catch (err) {
    return NextResponse.json(
      { error: "AI returned malformed data. Please retry.", detail: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ output }, { status: 200 });
}
