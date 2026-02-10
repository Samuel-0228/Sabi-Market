import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const key = process.env.GENAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GenAI key not configured' });

  const { type, payload } = req.body || {};
  if (!type) return res.status(400).json({ error: 'Missing type' });

  const ai = new GoogleGenAI({ apiKey: key });

  try {
    if (type === 'chat') {
      const { history = [], message } = payload || {};
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: 'You are "Savvy Assistant", an expert AI advisor for Addis Ababa University students. Be professional and bilingual (English and Amharic).',
        }
      });
      return res.json({ text: (response as any).text || '' });
    }

    if (type === 'suggest') {
      const { title, description } = payload || {};
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Optimize this student marketplace listing:\nTitle: ${title}\nDescription: ${description}`,
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
          systemInstruction: 'You are a campus market expert for AAU. Optimize the listing for student engagement.'
        }
      });

      const parsed = ((response as any).text && JSON.parse((response as any).text)) || null;
      return res.json({ result: parsed });
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err: any) {
    console.error('GenAI proxy error', err?.message || err);
    return res.status(500).json({ error: 'AI backend error' });
  }
}
