
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/supabase/db';
import { supabase } from '../../services/supabase/client';
import { UserProfile } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';

interface MessagesProps {
  user: UserProfile;
}

const MessagesPage: React.FC<MessagesProps> = ({ user }) => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Fetch
  useEffect(() => {
    let mounted = true;
    const fetchConversations = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            listings(title, image_url, price),
            seller:profiles!conversations_seller_id_fkey(id, full_name),
            buyer:profiles!conversations_buyer_id_fkey(id, full_name)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        setConversations(data || []);
        
        const pending = localStorage.getItem('savvy_pending_chat');
        if (pending) {
          localStorage.removeItem('savvy_pending_chat');
          const { listingId, sellerId } = JSON.parse(pending);
          const cid = await db.getOrCreateConversation(listingId, sellerId);
          const found = data?.find(c => c.id === cid);
          if (found) setActiveConv(found);
          else {
            const { data: fresh } = await supabase
              .from('conversations')
              .select('*, listings(title, image_url, price), seller:profiles!conversations_seller_id_fkey(id, full_name), buyer:profiles!conversations_buyer_id_fkey(id, full_name)')
              .eq('id', cid)
              .single();
            if (fresh && mounted) {
              setConversations(prev => [fresh, ...prev]);
              setActiveConv(fresh);
            }
          }
        } else if (data && data.length > 0 && !activeConv) {
          setActiveConv(data[0]);
        }
      } catch (err) {
        console.error("Inbox load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchConversations();
    return () => { mounted = false; };
  }, [user.id]);

  // 2. Realtime logic
  useEffect(() => {
    if (!activeConv) return;

    let mounted = true;
    // Load existing messages
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (mounted) setMessages(data || []); });

    // SUBSCRIPTION with proper cleanup
    const channel = supabase
      .channel(`chat_room_${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, (payload) => {
        if (!mounted) return;
        const newMsg = payload.new as any;
        setMessages(current => {
          if (current.find(m => m.id === newMsg.id)) return current;
          const optIdx = current.findIndex(m => m.temp && m.content === newMsg.content);
          if (optIdx !== -1) {
            const next = [...current];
            next[optIdx] = newMsg;
            return next;
          }
          return [...current, newMsg];
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const content = newMessage;
    setNewMessage('');

    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      temp: true
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      await db.sendMessage(activeConv.id, content);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert("Trade message failed to sync.");
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white">Opening Inbox...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-16 text-center opacity-30 flex flex-col items-center">
              <span className="text-5xl mb-6">💬</span>
              <p className="text-xs font-black uppercase tracking-widest dark:text-white">No trade chats</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.seller_id === user.id ? conv.buyer : conv.seller;
              const isSelected = activeConv?.id === conv.id;
              return (
                <button 
                  key={conv.id} 
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-6 text-left flex items-center gap-5 transition-all border-l-4 ${isSelected ? 'bg-indigo-50/50 dark:bg-white/5 border-l-indigo-600' : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                  <img src={conv.listings?.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black dark:text-white text-sm truncate">{other?.full_name || 'Student'}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest truncate">{conv.listings?.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Window */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] flex flex-col border border-gray-100 dark:border-white/5 overflow-hidden shadow-2xl">
        {activeConv ? (
          <>
            <div className="p-6 border-b dark:border-white/5 flex items-center gap-5 bg-gray-50/20 dark:bg-black/20">
              <img src={activeConv.listings?.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
              <div>
                <h3 className="text-xl font-black dark:text-white tracking-tighter">{activeConv.listings?.title}</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  {activeConv.seller_id === user.id ? 'Customer' : 'Seller'}: {activeConv.seller_id === user.id ? activeConv.buyer?.full_name : activeConv.seller?.full_name}
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-gray-50/5 dark:bg-black/5" ref={scrollRef}>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-6 py-3 rounded-2xl max-w-[75%] text-sm font-medium shadow-sm transition-all ${
                    m.sender_id === user.id 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-[#1a1a1c] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'
                    } ${m.temp ? 'opacity-70' : 'opacity-100'}`}
                  >
                    {m.content}
                    <div className="text-[8px] font-black uppercase mt-2 opacity-50">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.temp && " • Sending..."}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-4 bg-white dark:bg-[#0c0c0e]">
              <input 
                className="flex-1 bg-gray-50 dark:bg-white/5 border-none p-5 px-8 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 font-bold" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type your message..." 
              />
              <button className="bg-black dark:bg-white text-white dark:text-black px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <span className="text-6xl mb-6">📬</span>
            <p className="text-sm font-black uppercase tracking-widest dark:text-white">Select a chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
