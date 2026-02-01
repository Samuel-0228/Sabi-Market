
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
    
    // Subscribe to new messages for the active conversation
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (activeConv && msg.conversation_id === activeConv.id) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
      alert("Failed to send message.");
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse dark:text-white">Assembling your campus feed...</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 h-[80vh] flex gap-10">
      {/* Sidebar */}
      <div className="w-1/3 bg-white dark:bg-[#0c0c0e] rounded-[3rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 dark:border-white/5">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">No active chats</div>
          ) : (
            conversations.map(conv => {
              const otherParty = conv.buyer_id === user.id ? conv.seller : conv.buyer;
              return (
                <button 
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-8 text-left border-b border-gray-50 dark:border-white/5 transition-all hover:bg-gray-50 dark:hover:bg-white/5 flex gap-6 items-center ${activeConv?.id === conv.id ? 'bg-indigo-50/50 dark:bg-white/5' : ''}`}
                >
                  <img src={conv.listings?.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black dark:text-white text-sm truncate">{otherParty?.full_name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate mt-1">{conv.listings?.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[3rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-sm">
        {activeConv ? (
          <>
            <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-savvy-primary uppercase tracking-[0.2em] mb-1">Chatting about</p>
                <h3 className="text-xl font-black dark:text-white tracking-tighter">{activeConv.listings?.title}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold dark:text-white">{activeConv.buyer_id === user.id ? activeConv.seller?.full_name : activeConv.buyer?.full_name}</p>
                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Online Now</span>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/30 dark:bg-black/20">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-8 py-5 rounded-[2rem] text-sm font-medium shadow-sm ${m.sender_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-[#141414] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t border-gray-50 dark:border-white/5 bg-white dark:bg-[#0c0c0e] flex gap-4">
              <input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your campus message..."
                className="flex-1 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
              />
              <button className="bg-black dark:bg-white text-white dark:text-black px-10 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center">
            <div className="text-9xl mb-10">💬</div>
            <p className="text-2xl font-black dark:text-white tracking-tighter leading-tight">Pick a conversation to start campus trading.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
