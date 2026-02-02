
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from '../../services/ai/gemini';
import { useLanguage } from '../../app/LanguageContext';

const ChatBot: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([{ role: 'model', text: 'How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await chatWithGemini(history, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response || 'Error' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'System busy' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="w-80 h-96 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-white/5">
          <div className="bg-indigo-600 p-4 text-white flex justify-between">
            <span className="font-bold">Savvy AI</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-white/5 dark:text-white'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t dark:border-white/5 flex gap-2">
            <input className="flex-1 bg-gray-50 dark:bg-black p-2 rounded-xl text-sm dark:text-white" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} className="bg-indigo-600 text-white px-4 rounded-xl">➤</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center">AI</button>
      )}
    </div>
  );
};

export default ChatBot;
