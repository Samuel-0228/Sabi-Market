
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { UserProfile, Message, Conversation } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { db } from '../../services/supabase/db';

const InboxPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<(Message & { pending?: boolean; error?: boolean })[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial Load: Fetch conversations and handle deep-links
  useEffect(() => {
    let mounted = true;
    const fetchInbox = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*, listing:listings(title, image_url, price), seller:profiles!conversations_seller_id_fkey(full_name), buyer:profiles!conversations_buyer_id_fkey(full_name)')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!mounted) return;
        if (error) throw error;

        const currentConvs: Conversation[] = data || [];
        setConversations(currentConvs);

        // Check for pending chat request from Product Page
        const pending = localStorage.getItem('savvy_pending_chat');
        if (pending) {
          localStorage.removeItem('savvy_pending_chat');
          const { listingId, sellerId } = JSON.parse(pending);
          const cid = await db.getOrCreateConversation(listingId, sellerId, user.id);
          const existing = currentConvs.find(c => c.id === cid);
          
          if (existing) {
            setActiveConv(existing);
          } else {
            const { data: fresh } = await supabase
              .from('conversations')
              .select('*, listing:listings(title, image_url, price), seller:profiles!conversations_seller_id_fkey(full_name), buyer:profiles!conversations_buyer_id_fkey(full_name)')
              .eq('id', cid)
              .single();
            if (fresh && mounted) {
              setConversations(prev => [fresh, ...prev]);
              setActiveConv(fresh);
            }
          }
        } else if (currentConvs.length > 0 && !activeConv) {
          setActiveConv(currentConvs[0]);
        }
      } catch (err) {
        console.error("Inbox sync failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInbox();
    return () => { mounted = false; };
  }, [user.id]);

  // 2. Realtime Engine: Postgres Changes + Broadcast
  useEffect(() => {
    if (!activeConv) return;
    
    let mounted = true;
    setConnectionStatus('connecting');

    // Fetch message history
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: Message[] | null }) => { 
        if (mounted) setMessages(data || []); 
      });

    // Setup Realtime Channel
    const channel = supabase.channel(`live_trade_${activeConv.id}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${activeConv.id}` 
      }, (payload: any) => {
        if (!mounted) return;
        const newMsg = payload.new as Message;
        
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.id === newMsg.id)) return prev;
          
          // Telegram-style sync: Replace optimistic message if contents match
          const pendingIdx = prev.findIndex(m => m.pending && m.content === newMsg.content && m.sender_id === newMsg.sender_id);
          if (pendingIdx !== -1) {
            const updated = [...prev];
            updated[pendingIdx] = { ...newMsg, pending: false };
            return updated;
          }
          return [...prev, newMsg];
        });
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          setIsTyping(payload.isTyping);
          setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('online');
        else setConnectionStatus('offline');
      });

    return () => { 
      mounted = false; 
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id, user.id]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleTyping = () => {
    if (!activeConv) return;
    const channel = supabase.channel(`live_trade_${activeConv.id}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping: true }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false }
      });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    
    const content = input;
    setInput('');

    // OPTIMISTIC UPDATE: Instant rendering
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: Message & { pending: boolean } = {
      id: tempId,
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await db.sendMessage(activeConv.id, content);
    } catch (err) {
      console.error("Delivery failed");
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, error: true, pending: false } : m));
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center opacity-30">
      <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Connecting Trade Nodes...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        <div className="p-8 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black dark:text-white tracking-tighter">Inbox</h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${connectionStatus === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <span className={`w-1 h-1 rounded-full ${connectionStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {connectionStatus}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-16 text-center opacity-20">
              <span className="text-5xl block mb-4">📭</span>
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">No trade history</p>
            </div>
          ) : (
            conversations.map(c => (
              <button 
                key={c.id}
                onClick={() => setActiveConv(c)}
                className={`w-full p-6 text-left flex items-center gap-4 transition-all border-b dark:border-white/5 ${activeConv?.id === c.id ? 'bg-indigo-50/50 dark:bg-white/5 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <img src={c.listing?.image_url as string} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-black dark:text-white text-sm truncate">{c.listing?.title}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase truncate">
                    {c.seller_id === user.id ? `Customer: ${c.buyer?.full_name}` : `Seller: ${c.seller?.full_name}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[3rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-2xl">
        {activeConv ? (
          <>
            <div className="p-6 border-b dark:border-white/5 bg-gray-50/10 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <img src={activeConv.listing?.image_url as string} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                <div>
                  <h3 className="font-black dark:text-white text-lg tracking-tight leading-tight">{activeConv.listing?.title}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                    {activeConv.seller_id === user.id ? activeConv.buyer?.full_name : activeConv.seller?.full_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-indigo-600">{activeConv.listing?.price} ETB</p>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">AAU Secure Escrow</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/5 dark:bg-black/5" ref={scrollRef}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 px-6 rounded-[1.8rem] max-w-[75%] shadow-sm transition-all duration-300 relative group ${
                    m.sender_id === user.id 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-[#141414] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'
                    } ${m.pending ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1.5 opacity-40">
                       <span className="text-[7px] font-black uppercase">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       {m.sender_id === user.id && (
                         <span className="text-[10px]">{m.pending ? '🕒' : '✓✓'}</span>
                       )}
                    </div>
                    {m.error && <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-red-500">⚠️</span>}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-gray-100 dark:bg-white/5 px-6 py-3 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Trade partner is typing...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-4 bg-white dark:bg-[#0c0c0e]">
              <input 
                className="flex-1 bg-gray-50 dark:bg-white/5 p-5 px-8 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" 
                value={input} 
                onChange={e => { setInput(e.target.value); handleTyping(); }} 
                placeholder="Type your message..." 
              />
              <button disabled={!input.trim()} className="bg-black dark:bg-white text-white dark:text-black px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-30">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <span className="text-6xl mb-6">🤝</span>
            <p className="text-sm font-black uppercase tracking-widest dark:text-white">Select a trade to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
