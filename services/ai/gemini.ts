
import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI helper
export const savvyAI = {
  async getMarketAdvice(query: string, history: any[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: `You are "Savvy Assistant", the official AI guide for Savvy Market at Addis Ababa University. 
        Use Google Search to provide actual price comparisons in Ethiopia. 
        Always provide sourcing links if using search. Help students price fairly and stay safe.`,
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  async optimizeListing(title: string, description: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Product: ${title}\nRaw Description: ${description}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            price: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['title', 'price', 'category', 'description']
        },
        systemInstruction: 'Rewrite this marketplace listing to be highly attractive to AAU students. Suggest a competitive ETB price.',
      }
    });
    // Correctly access text property from response
    const text = response.text;
    return JSON.parse(text || '{}');
  }
};

// Fix: Export chatWithGemini for the ChatBot component
export const chatWithGemini = async (history: any[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students using the Savvy Market platform. Help them with buying, selling, pricing, and navigating university life. Be professional, friendly, and bilingual in English and Amharic.',
    },
  });
  // Correctly access text property from response
  return response.text;
};

// Fix: Export suggestListingDetails for the AddListingModal component
export const suggestListingDetails = async (title: string, description: string) => {
  return await savvyAI.optimizeListing(title, description);
};
