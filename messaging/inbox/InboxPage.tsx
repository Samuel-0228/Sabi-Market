
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';
import { UserProfile, Message, Conversation } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { db } from '../../services/supabase/db';

const InboxPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<(Message & { pending?: boolean })[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Resilient to reloads and pending inquiries
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

        let currentConversations = data || [];
        setConversations(currentConversations);

        // Check for cross-page navigation triggers (from Home Detail)
        const pending = localStorage.getItem('savvy_pending_chat');
        if (pending) {
          localStorage.removeItem('savvy_pending_chat');
          const { listingId, seller_id } = JSON.parse(pending);
          
          const cid = await db.getOrCreateConversation(listingId, seller_id, user.id);
          const existing = currentConversations.find(c => c.id === cid);
          
          if (existing) {
            setActiveConv(existing);
          } else {
            // Fetch the freshly created conversation details
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
        } else if (currentConversations.length > 0 && !activeConv) {
          setActiveConv(currentConversations[0]);
        }
      } catch (err) {
        console.error("Failed to load inbox:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInbox();
    return () => { mounted = false; };
  }, [user.id, activeConv]);

  // 2. Realtime Subscription: Telegram-style live updates
  useEffect(() => {
    if (!activeConv) return;
    
    let mounted = true;
    
    // Fetch initial message history
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (mounted) setMessages(data || []); });

    // Create a robust realtime channel
    const channel = supabase
      .channel(`chat_room_${activeConv.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${activeConv.id}` 
      }, (payload) => {
        if (!mounted) return;
        const newMsg = payload.new as Message;
        
        setMessages(prev => {
          // Check if this message was already added optimistically
          const exists = prev.find(m => m.id === newMsg.id || (m.pending && m.content === newMsg.content && m.sender_id === newMsg.sender_id));
          if (exists) {
            // Replace the pending message with the real one to remove the "pending" style
            return prev.map(m => (m.pending && m.content === newMsg.content ? newMsg : m));
          }
          return [...prev, newMsg];
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.debug("Chat online");
      });

    return () => { 
      mounted = false; 
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 4. Optimistic Message Sending
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    
    const content = input;
    setInput('');

    const optimisticMsg: Message & { pending: boolean } = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: content,
      created_at: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: activeConv.id,
        sender_id: user.id,
        content: content
      });
      
      if (error) throw error;
    } catch (e) {
      console.error("Failed to sync message");
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      alert("Message failed to send. Check connection.");
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
      {/* Sidebar: Active Conversations */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        <div className="p-8 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter leading-none">Inbox.</h2>
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-2">Verified Trading</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-16 text-center opacity-20">
              <span className="text-5xl block mb-4">📭</span>
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">No active trades</p>
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
                    {c.seller_id === user.id ? `Buyer: ${c.buyer?.full_name}` : `Seller: ${c.seller?.full_name}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
        {activeConv ? (
          <>
            <div className="p-6 border-b dark:border-white/5 bg-gray-50/10 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <img src={activeConv.listing?.image_url as string} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                <div>
                  <h3 className="font-black dark:text-white text-lg tracking-tight leading-tight">{activeConv.listing?.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                       {activeConv.seller_id === user.id ? activeConv.buyer?.full_name : activeConv.seller?.full_name}
                     </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-indigo-600">{activeConv.listing?.price} ETB</p>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">AAU Secure Escrow</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/5 dark:bg-black/5" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <p className="text-sm font-black uppercase tracking-[0.3em]">Discuss delivery & meetup</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 px-6 rounded-[1.8rem] max-w-[70%] shadow-sm transition-all duration-300 ${
                    m.sender_id === user.id 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-white/5 dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'
                    } ${m.pending ? 'opacity-50 scale-95' : 'opacity-100'}`}
                  >
                    <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                    <div className="flex items-center gap-2 mt-2 opacity-40">
                       <span className="text-[8px] font-black uppercase">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       {m.pending && <span className="text-[8px] animate-pulse">⏳</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-4 bg-white dark:bg-[#0c0c0e]">
              <input 
                className="flex-1 bg-gray-50 dark:bg-white/5 p-5 px-8 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-gray-400" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Negotiate or arrange meetup..." 
              />
              <button className="bg-black dark:bg-white text-white dark:text-black px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-6xl mb-8">💬</div>
            <p className="text-xl font-black uppercase tracking-widest dark:text-white">Select a Marketplace Inquiry</p>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default InboxPage;
