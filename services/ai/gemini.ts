
import { GoogleGenAI } from "@google/genai";

export const chatWithGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students using the Savvy Market platform. Help them with buying, selling, pricing, and navigating university life. Be professional, friendly, and bilingual in English and Amharic.',
    },
  });
  
  return response.text;
};
