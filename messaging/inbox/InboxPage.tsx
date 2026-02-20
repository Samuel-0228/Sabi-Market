import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { UserProfile, Message, Conversation } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { db } from '../../services/supabase/db';
import { useUIStore } from '../../store/ui.store';

const InboxPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { t } = useLanguage();
  const { addToast } = useUIStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<(Message & { pending?: boolean; error?: boolean })[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [view, setView] = useState<'list' | 'chat'>('list');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const fetchInbox = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*, listing:listings(title, image_url, price), seller:profiles!conversations_seller_id_fkey(full_name), buyer:profiles!conversations_buyer_id_fkey(full_name)')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) {
          setConversations(data || []);
          // On desktop, default to first conv. On mobile, stay in list.
          if (data && data.length > 0 && !activeConv && window.innerWidth > 1024) {
             setActiveConv(data[0]);
             setView('chat');
          }
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

  useEffect(() => {
    if (!activeConv) return;
    let mounted = true;
    
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: Message[] | null }) => { 
        if (mounted) setMessages(data || []); 
      });

    const channel = supabase.channel(`live_trade_${activeConv.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${activeConv.id}` 
      }, (payload: any) => {
        if (mounted) setMessages(prev => [...prev.filter(m => m.id !== payload.new.id), payload.new]);
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

  const handleSelectConv = (c: Conversation) => {
    setActiveConv(c);
    setView('chat');
  };

  const handleDeleteConv = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation for both participants? This action is permanent.")) return;

    try {
      await db.deleteConversation(conversationId);
      
      // Update local state immediately
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (activeConv?.id === conversationId) {
        setActiveConv(null);
        setMessages([]);
        setView('list');
      }
      
      addToast("Conversation deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      addToast("Failed to delete conversation. It might have already been removed.", "error");
      
      // Refresh list just in case it was deleted by someone else or failed partially
      const { data } = await supabase
        .from('conversations')
        .select('*, listing:listings(title, image_url, price), seller:profiles!conversations_seller_id_fkey(full_name), buyer:profiles!conversations_buyer_id_fkey(full_name)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (data) setConversations(data);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const content = input;
    setInput('');
    try {
      await db.sendMessage(activeConv.id, content);
    } catch (err) {
      console.error("Delivery failed");
    }
  };

  if (loading) return <div className="h-screen bg-savvy-bg dark:bg-savvy-dark flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-savvy-accent border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-24 md:pt-32 px-4 md:px-10 pb-10 h-screen flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-4 md:gap-12 overflow-hidden">
        
        {/* Sidebar - Hidden on mobile if chat is open */}
        <div className={`w-full lg:w-[350px] flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide ${view === 'chat' && 'hidden lg:flex'}`}>
          <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white mb-4">Inbox</h2>
          {conversations.map(c => (
            <div 
              key={c.id} 
              className="relative group"
            >
              <button 
                onClick={() => handleSelectConv(c)}
                className={`w-full p-6 text-left rounded-3xl transition-all duration-300 tibico-border flex items-center gap-4 ${
                  activeConv?.id === c.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-white/5 dark:text-white'
                }`}
              >
                <img src={c.listing?.image_url} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="img" />
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] font-black uppercase tracking-widest opacity-60 truncate">{c.listing?.title}</p>
                  <p className="text-sm font-black truncate uppercase tracking-tight">{c.seller_id === user.id ? c.buyer?.full_name : c.seller?.full_name}</p>
                </div>
                <button 
                  onClick={(e) => handleDeleteConv(e, c.id)}
                  className="p-2 opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
                  title="Delete Conversation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </button>
            </div>
          ))}
          {conversations.length === 0 && <p className="text-gray-400 text-xs italic">No messages found.</p>}
        </div>

        {/* Chat Window */}
        <div className={`flex-1 bg-white dark:bg-white/5 rounded-3xl md:rounded-[4rem] tibico-border flex flex-col overflow-hidden reveal ${view === 'list' && 'hidden lg:flex'}`}>
          {activeConv ? (
            <>
              <div className="p-5 md:p-10 border-b dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('list')} className="lg:hidden p-2 bg-gray-100 dark:bg-white/10 rounded-full">
                    <svg className="w-4 h-4 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div>
                    <h3 className="text-sm md:text-2xl font-black uppercase tracking-tight dark:text-white truncate max-w-[150px] md:max-w-none">{activeConv.listing?.title}</h3>
                    <p className="text-[7px] md:text-[9px] font-black text-savvy-accent uppercase tracking-widest mt-1">Trade Channel</p>
                  </div>
                </div>
                <p className="text-sm md:text-2xl font-black dark:text-white tracking-tighter">{activeConv.listing?.price} <span className="text-[8px]">ETB</span></p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 md:space-y-6" ref={scrollRef}>
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 px-6 rounded-2xl md:rounded-[2rem] max-w-[85%] text-xs md:text-base font-medium leading-relaxed ${
                      m.sender_id === user.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-black/40 dark:text-white'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="p-4 md:p-8 border-t dark:border-white/10 flex gap-3 md:gap-6 bg-white dark:bg-[#0c0c0e]">
                <input 
                  className="flex-1 bg-gray-50 dark:bg-black p-4 md:p-6 rounded-2xl outline-none text-sm md:text-xl font-medium dark:text-white" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="bg-black dark:bg-white text-white dark:text-black px-6 md:px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">SEND</button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-10 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] dark:text-white">Select a channel to begin trading</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;