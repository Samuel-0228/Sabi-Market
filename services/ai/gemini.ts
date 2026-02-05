
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const chatWithGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students. Help them with buying, selling, and pricing. Be professional, friendly, and bilingual.',
    },
  });
  return response.text;
};

export const suggestListingDetails = async (title: string, description: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this student listing, suggest optimized details.
    Original Title: ${title}
    Original Description: ${description}`,
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
      systemInstruction: 'You are a campus market expert. Optimize the listing for AAU students.',
    },
  });
  
  return JSON.parse(response.text);
};
