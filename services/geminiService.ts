
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
