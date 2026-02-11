
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { UserProfile, Message, Conversation } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { db } from '../../services/supabase/db';

const InboxPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load of Conversations & Pending Chat Check
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

        // Check for pending chat request from Home page
        const pending = localStorage.getItem('savvy_pending_chat');
        if (pending) {
          localStorage.removeItem('savvy_pending_chat');
          const { listingId, seller_id } = JSON.parse(pending);
          
          // Ensure conversation exists using the robust db wrapper
          const cid = await db.getOrCreateConversation(listingId, seller_id, user.id);
          
          const existing = currentConversations.find(c => c.id === cid);
          if (existing) {
            setActiveConv(existing);
          } else {
            // If it's brand new and not in the initial list, fetch its full details
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
  }, [user.id]);

  // 2. Room-Scoped Realtime Subscription
  useEffect(() => {
    if (!activeConv) return;
    
    let mounted = true;
    
    // Fetch History
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (mounted) setMessages(data || []); });

    // Scoped Telegram-style Realtime
    const channel = supabase
      .channel(`room_${activeConv.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${activeConv.id}` 
      }, (payload) => {
        if (mounted) {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const content = input;
    setInput('');
    try {
      await db.sendMessage(activeConv.id, content);
    } catch (e) {
      console.error("Chat sync failed");
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center opacity-30">
      <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Connecting Trade Nodes...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        <div className="p-8 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter leading-none">Inbox.</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
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
                className={`w-full p-6 text-left flex items-center gap-4 transition-all border-b dark:border-white/5 ${activeConv?.id === c.id ? 'bg-indigo-50 dark:bg-white/5 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <img src={c.listing?.image_url as string} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-black dark:text-white text-sm truncate">{c.listing?.title}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase truncate">
                    {c.seller_id === user.id ? `Buyer: ${c.buyer?.full_name}` : `Seller: ${c.seller?.full_name}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-xl relative">
        {activeConv ? (
          <>
            <div className="p-6 border-b dark:border-white/5 bg-gray-50/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={activeConv.listing?.image_url as string} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 className="font-black dark:text-white text-lg tracking-tight">{activeConv.listing?.title}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    {activeConv.seller_id === user.id ? activeConv.buyer?.full_name : activeConv.seller?.full_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-indigo-600">{activeConv.listing?.price} ETB</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <p className="text-sm font-black uppercase tracking-[0.3em]">Start the conversation</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 px-6 rounded-2xl max-w-[70%] shadow-sm ${m.sender_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-50 dark:bg-white/5 dark:text-white rounded-bl-none'}`}>
                    <p className="text-sm font-medium">{m.content}</p>
                    <span className="text-[8px] font-black uppercase opacity-40 mt-2 block">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="p-8 border-t dark:border-white/5 flex gap-4">
              <input className="flex-1 bg-gray-50 dark:bg-white/5 p-4 px-8 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." />
              <button className="bg-black dark:bg-white text-white dark:text-black px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <span className="text-6xl mb-6">💬</span>
            <p className="text-xl font-black uppercase tracking-widest">Select a Conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
