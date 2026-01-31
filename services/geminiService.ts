
import { GoogleGenAI } from "@google/genai";

// Use gemini-3-pro-preview for complex reasoning and bilingual support for students
export const chatWithGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  // Always initialize right before making an API call to ensure current credentials are used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // For text-based tasks with history, use ai.models.generateContent to include the full context
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students using the Savvy Market platform. Help them with buying, selling, pricing, and navigating university life. Be professional, friendly, and bilingual in English and Amharic.',
    },
  });
  
  // Use the .text property directly, not as a method
  return response.text;
};

// Use appropriate image generation model based on user quality requirements
export const generateProductImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  // Always initialize right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Default to gemini-2.5-flash-image; upgrade to gemini-3-pro-image-preview only for high-quality (2K/4K)
  const model = size === "1K" ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        // Only gemini-3-pro-image-preview supports explicitly setting imageSize
        ...(model === 'gemini-3-pro-image-preview' ? { imageSize: size } : {})
      }
    },
  });

  // Iterating through all parts of the candidate to find the image part, as required for nano banana series models
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
};
