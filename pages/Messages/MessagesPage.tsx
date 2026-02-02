
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/supabase/db';
import { supabase } from '../../services/supabase/client';
import { Conversation, Message, UserProfile } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';

interface MessagesProps {
  user: UserProfile;
}

const MessagesPage: React.FC<MessagesProps> = ({ user }) => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const subscription = supabase.channel('public:messages').on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages' 
    }, (payload) => {
      const msg = payload.new as Message;
      if (activeConv && msg.conversation_id === activeConv.id) setMessages(prev => [...prev, msg]);
    }).subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, [activeConv]);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, listings(title, image_url), seller:profiles!conversations_seller_id_fkey(full_name), buyer:profiles!conversations_buyer_id_fkey(full_name)')
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
      alert("Error sending message"); 
    }
  };

  if (loading) return <div className="p-10 text-center dark:text-white">Loading chats...</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 h-[80vh] flex gap-10">
      <div className="w-1/3 bg-white dark:bg-[#0c0c0e] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No conversations yet</div>
        ) : (
          conversations.map(conv => (
            <button key={conv.id} onClick={() => setActiveConv(conv)} className={`w-full p-6 text-left border-b dark:border-white/5 transition-colors ${activeConv?.id === conv.id ? 'bg-indigo-50 dark:bg-white/5' : ''}`}>
               <p className="font-black dark:text-white">{conv.listings?.title}</p>
               <p className="text-xs text-gray-400 truncate">
                 {conv.buyer_id === user.id ? conv.seller?.full_name : conv.buyer?.full_name}
               </p>
            </button>
          ))
        )}
      </div>
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2rem] flex flex-col border border-gray-100 dark:border-white/5 overflow-hidden">
        {activeConv ? (
          <>
            <div className="flex-1 overflow-y-auto p-10 space-y-4" ref={scrollRef}>
               {messages.map(m => (
                 <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-xl max-w-[70%] ${m.sender_id === user.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-white/5 dark:text-white'}`}>
                      {m.content}
                    </div>
                 </div>
               ))}
            </div>
            <form onSubmit={handleSend} className="p-6 border-t dark:border-white/5 flex gap-4 bg-white dark:bg-[#0c0c0e]">
               <input className="flex-1 bg-gray-50 dark:bg-black p-4 rounded-xl dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." />
               <button className="bg-black dark:bg-white text-white dark:text-black px-8 rounded-xl font-black uppercase text-xs tracking-widest">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Select a conversation to start
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
