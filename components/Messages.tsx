
import React, { useState, useEffect, useRef } from 'react';
import { db, supabase } from '../services/supabaseService';
import { Conversation, Message, UserProfile } from '../types';
import { useLanguage } from './LanguageContext';

interface MessagesProps {
  user: UserProfile;
}

const Messages: React.FC<MessagesProps> = ({ user }) => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        const msg = payload.new as Message;
        if (activeConv && msg.conversation_id === activeConv.id) {
          setMessages(prev => [...prev, msg]);
        }
        // Refresh sidebar for latest messages
        fetchConversations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeConv, user.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, listings(title, image_url, price), seller:profiles!conversations_seller_id_fkey(full_name), buyer:profiles!conversations_buyer_id_fkey(full_name)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      if (data && data.length > 0 && !activeConv) setActiveConv(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv.id);
  }, [activeConv]);

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    const content = newMessage;
    setNewMessage('');
    try {
      await db.sendMessage(activeConv.id, content);
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center opacity-40 dark:text-white">
      <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest">Opening Campus Inbox...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700">
      {/* Inbox Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter">{t('inbox')}</h2>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 italic">Savvy Campus Trading</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-12 text-center opacity-30 flex flex-col items-center">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-xs font-black uppercase tracking-widest dark:text-white">Empty Inbox</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isSeller = conv.seller_id === user.id;
              const otherParty = isSeller ? conv.buyer : conv.seller;
              const isSelected = activeConv?.id === conv.id;
              
              return (
                <button 
                  key={conv.id} 
                  onClick={() => setActiveConv(conv)} 
                  className={`w-full p-6 text-left border-b last:border-0 dark:border-white/5 transition-all flex items-center gap-5 hover:bg-gray-50 dark:hover:bg-white/5 ${isSelected ? 'bg-indigo-50/50 dark:bg-white/5 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="relative">
                    <img src={conv.listings?.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                    <div className="absolute -top-1 -right-1">
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${isSeller ? 'bg-pink-500 text-white' : 'bg-indigo-600 text-white'}`}>
                        {isSeller ? 'Customer' : 'Seller'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                       <p className="font-black dark:text-white text-sm truncate">{otherParty?.full_name}</p>
                       <span className="text-[8px] font-bold text-gray-400">Live</span>
                    </div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest truncate">{conv.listings?.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] flex flex-col border border-gray-100 dark:border-white/5 overflow-hidden shadow-2xl relative">
        {activeConv ? (
          <>
            <div className="p-8 border-b dark:border-white/5 flex justify-between items-center bg-gray-50/30 dark:bg-black/20">
              <div className="flex items-center gap-5">
                <img src={activeConv.listings?.image_url} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 className="text-xl font-black dark:text-white tracking-tighter leading-tight">{activeConv.listings?.title}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Trading with: <span className="text-indigo-500 font-black">{activeConv.buyer_id === user.id ? activeConv.seller?.full_name : activeConv.buyer?.full_name}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-indigo-600">{activeConv.listings?.price} ETB</p>
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">AAU Verified Buyer</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/10 dark:bg-black/10" ref={scrollRef}>
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                   <span className="text-6xl mb-6">💬</span>
                   <p className="text-sm font-black uppercase tracking-[0.2em] dark:text-white">Start the conversation</p>
                 </div>
               )}
               {messages.map(m => (
                 <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-5 px-7 rounded-[1.5rem] max-w-[75%] shadow-sm ${m.sender_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-[#141414] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'}`}>
                      <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-2 block ${m.sender_id === user.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                 </div>
               ))}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-5 bg-white dark:bg-[#0c0c0e]">
               <input 
                 className="flex-1 bg-gray-50 dark:bg-white/5 border-none p-5 px-8 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all" 
                 value={newMessage} 
                 onChange={e => setNewMessage(e.target.value)} 
                 placeholder="Discuss meetups or pricing..." 
               />
               <button className="bg-black dark:bg-white text-white dark:text-black px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
            <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-4xl mb-8 shadow-inner">💬</div>
            <h3 className="text-2xl font-black dark:text-white tracking-tighter">Your Campus Conversations</h3>
            <p className="text-gray-400 font-medium max-w-xs mt-4">Select a chat from the left to manage your orders and trade with other AAU students.</p>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
      `}</style>
    </div>
  );
};

export default Messages;
