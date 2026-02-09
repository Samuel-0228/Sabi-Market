
import { GoogleGenAI } from "@google/genai";

export const chatWithGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing. AI features will be disabled.");
    return "I'm sorry, my AI processing unit is currently offline. Please try again in a few minutes.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students using the Savvy Market platform. Help them with buying, selling, pricing, and navigating university life. Be professional, friendly, and bilingual in English and Amharic.',
      },
    });
    
    return response.text || "I'm having trouble thinking right now. Could you repeat that?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to the Savvy Brain was interrupted. Please check your internet and try again.";
  }
};
