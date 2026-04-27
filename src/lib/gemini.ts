import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export type MessageRole = "user" | "model";

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: number;
  module?: string;
}

export const MODULE_INSTRUCTIONS: Record<string, string> = {
  general: "You are Aura, a premium AI assistant. Be helpful, concise, and natural.",
  writer: "You are an expert Writing Assistant. Help user create high-quality articles, emails, and stories with perfect grammar and tone.",
  coder: "You are a Senior Software Engineer. Write clean, efficient, and well-documented code. Explain your logic clearly.",
  productivity: "You are a productivity expert. Help with translations, summaries, and business ideas efficiently.",
};

export async function chatWithGemini(
  messages: ChatMessage[],
  systemInstruction?: string
) {
  // Convert our message format to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === "model" ? "model" as const : "user" as const,
    parts: msg.parts.map((p) => {
      if (p.inlineData) return { inlineData: p.inlineData };
      return { text: p.text || "" };
    }),
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: systemInstruction || MODULE_INSTRUCTIONS.general,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
}
