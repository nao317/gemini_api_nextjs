import { GoogleGenAI } from "@google/genai";

const model = "gemini-2.5-flash";

function createClient() {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("環境変数にAPIキーを設定してください。");
  }

  return new GoogleGenAI({ apiKey });
}

export async function generateGeminiResponse(prompt: string) {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return {
    model,
    prompt,
    responseText: response.text ?? "",
    responseId: response.responseId ?? null,
    usageMetadata: response.usageMetadata ?? null,
  };
}