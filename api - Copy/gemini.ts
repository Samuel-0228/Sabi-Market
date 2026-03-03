
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { contents, model, config } = request.body;

  if (!process.env.API_KEY) {
    return response.status(500).json({ error: 'API_KEY not configured' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const result = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents,
      config: config || {}
    });

    return response.status(200).json({ text: result.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
