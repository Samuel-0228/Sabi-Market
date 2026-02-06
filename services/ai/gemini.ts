
import { GoogleGenAI, Type } from "@google/genai";

export const chatWithGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students. Help them with buying, selling, and pricing. Be professional, friendly, and bilingual (English and Amharic). Use specific campus landmarks for delivery advice.',
      thinkingConfig: { thinkingBudget: 0 }
    },
  });
  return response.text;
};

export const suggestListingDetails = async (title: string, description: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Optimize this student marketplace listing:\nTitle: ${title}\nDescription: ${description}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Optimized snappy title' },
          price: { type: Type.NUMBER, description: 'Competitive price in ETB' },
          category: { type: Type.STRING, description: 'One of: goods, course, academic_materials, food' },
          description: { type: Type.STRING, description: 'Improved, persuasive description' }
        },
        required: ['title', 'price', 'category', 'description']
      },
      systemInstruction: 'You are a campus market expert for AAU. Optimize the listing for student engagement.',
    },
  });
  
  return JSON.parse(response.text);
};
