import { postJson } from '../network';

type ChatHistoryPart = { text: string };
type ChatHistoryItem = { role: 'user' | 'model'; parts: ChatHistoryPart[] };

export const chatWithGemini = async (history: ChatHistoryItem[], message: string) => {
  const res = await postJson('/api/gemini', { type: 'chat', payload: { history, message } });
  return res?.text || '';
};

export const suggestListingDetails = async (title: string, description: string) => {
  const res = await postJson('/api/gemini', { type: 'suggest', payload: { title, description } });
  return res?.result || {};
};
