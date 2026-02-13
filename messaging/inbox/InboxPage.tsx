
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
          if (data && data.length > 0 && !activeConv) setActiveConv(data[0]);
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
  }, [messages, isTyping]);

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

  if (loading) return <div className="h-screen bg-savvy-bg dark:bg-savvy-dark" />;

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-32 px-10 pb-10 h-screen flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-12 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-y-auto pr-4 scrollbar-hide">
          <h2 className="text-5xl font-black uppercase tracking-tighter dark:text-white mb-8">Communications</h2>
          {conversations.map(c => (
            <button 
              key={c.id} 
              onClick={() => setActiveConv(c)}
              className={`p-10 text-left rounded-[3rem] transition-all duration-500 tibico-border ${
                activeConv?.id === c.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-white/5 dark:text-white'
              }`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4 opacity-60">{c.listing?.title}</p>
              <p className="text-2xl font-black tracking-tighter uppercase">{c.seller_id === user.id ? c.buyer?.full_name : c.seller?.full_name}</p>
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white dark:bg-white/5 rounded-[4rem] tibico-border flex flex-col overflow-hidden reveal">
          {activeConv ? (
            <>
              <div className="p-12 border-b dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white">{activeConv.listing?.title}</h3>
                  <p className="text-[10px] font-black text-savvy-accent uppercase tracking-[0.4em] mt-2">Trade Channel Active</p>
                </div>
                <p className="text-4xl font-black dark:text-white tracking-tighter">{activeConv.listing?.price} <span className="text-xs">ETB</span></p>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-8" ref={scrollRef}>
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-8 px-10 rounded-[2.5rem] max-w-[70%] font-medium text-lg leading-relaxed ${
                      m.sender_id === user.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-black/40 dark:text-white'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="p-10 border-t dark:border-white/10 flex gap-6">
                <input 
                  className="flex-1 bg-gray-50 dark:bg-black p-8 rounded-[2rem] outline-none text-xl font-medium dark:text-white" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Draft your proposal..."
                />
                <button className="bg-black dark:bg-white text-white dark:text-black px-12 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl">TRANSMIT</button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
               <p className="text-[10px] font-black uppercase tracking-[1em] dark:text-white">Idle Channel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
