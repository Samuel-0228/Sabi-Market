
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';
import { chatWithGemini } from '../../services/ai/gemini';
import { useLanguage } from '../../app/LanguageContext';

const ChatBot: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hello! I am Savvy AI. How can I help you navigate the AAU marketplace today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
      setMessages(prev => [...prev, { role: 'model', text: response || 'I encountered an error. Please try again.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'My systems are currently busy. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[350px] h-[500px] bg-white dark:bg-[#0a0a0a] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-black/5 dark:border-white/5 mb-4"
          >
            <div className="bg-savvy-indigo p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-widest">Savvy AI</p>
                  <p className="text-[8px] opacity-60 uppercase tracking-widest">AAU Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-savvy-indigo text-white rounded-tr-none' 
                      : 'bg-gray-100 dark:bg-white/5 dark:text-white rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
              <div className="flex gap-2 bg-white dark:bg-white/5 p-2 rounded-2xl border dark:border-white/10">
                <input 
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-xs dark:text-white" 
                  placeholder="Ask anything..."
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSend()} 
                />
                <button 
                  onClick={handleSend} 
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 bg-savvy-indigo text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          isOpen ? 'bg-white dark:bg-[#141414] text-savvy-indigo' : 'bg-savvy-indigo text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

export default ChatBot;
