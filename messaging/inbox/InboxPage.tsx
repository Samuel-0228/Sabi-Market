
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { UserProfile, Message, Conversation } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { db } from '../../services/supabase/db';

interface InboxPageProps {
  user: UserProfile;
}

const InboxPage: React.FC<InboxPageProps> = ({ user }) => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Load Conversations (Request/Response)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            listing:listings(title, image_url, price),
            seller:profiles!conversations_seller_id_fkey(full_name),
            buyer:profiles!conversations_buyer_id_fkey(full_name)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) {
          setConversations(data || []);
          
          const pending = localStorage.getItem('savvy_pending_chat');
          if (pending) {
            localStorage.removeItem('savvy_pending_chat');
            const { listingId, sellerId } = JSON.parse(pending);
            const cid = await db.getOrCreateConversation(listingId, sellerId, user.id);
            const fresh = data?.find(c => c.id === cid);
            if (fresh) setActiveConv(fresh);
          } else if (data?.[0]) {
            setActiveConv(data[0]);
          }
        }
      } catch (err) { console.error("Inbox load fail", err); }
      finally { if (mounted) setLoading(false); }
    };

    load();
    return () => { mounted = false; };
  }, [user.id]);

  // 2. Real-time Subscription (Scoped per Conversation)
  useEffect(() => {
    if (!activeConv) return;

    let mounted = true;
    
    // Fetch initial messages for active room
    supabase.from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (mounted) setMessages(data || []); });

    // Scoped channel subscription
    const channel = supabase
      .channel(`room_${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, (payload) => {
        if (mounted) {
          const nm = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === nm.id) ? prev : [...prev, nm]);
        }
      })
      .subscribe();

    // STRICT CLEANUP
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
    if (!input.trim() || !activeConv) return;
    const content = input;
    setInput('');
    try {
      await db.sendMessage(activeConv.id, content);
    } catch (e) { alert("Network sync failed"); }
  };

  if (loading && conversations.length === 0) return (
    <div className="h-[80vh] flex flex-col items-center justify-center opacity-40">
      <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Connecting Hub...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex flex-col lg:flex-row gap-8 overflow-hidden animate-in fade-in duration-700">
      {/* Sidebar - Conversation List */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        <div className="p-8 bg-gray-50/30 dark:bg-black/20 border-b dark:border-white/5">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const isSel = activeConv?.id === conv.id;
            const other = conv.seller_id === user.id ? conv.buyer : conv.seller;
            return (
              <button 
                key={conv.id} 
                onClick={() => setActiveConv(conv)}
                className={`w-full p-6 text-left flex items-center gap-4 border-b dark:border-white/5 transition-all ${isSel ? 'bg-indigo-50 dark:bg-white/5 border-l-4 border-l-indigo-600 shadow-inner' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <img src={conv.listing?.image_url as string} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-black dark:text-white text-sm truncate">{other?.full_name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{conv.listing?.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        {activeConv ? (
          <>
            <div className="p-6 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20 flex items-center gap-4">
              <img src={activeConv.listing?.image_url as string} className="w-14 h-14 rounded-2xl object-cover" />
              <div>
                <h3 className="font-black dark:text-white text-lg tracking-tight leading-none mb-1">{activeConv.listing?.title}</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  {activeConv.seller_id === user.id ? 'Customer Interaction' : 'Seller Interaction'}
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-gray-50/5 dark:bg-black/10" ref={scrollRef}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-6 py-4 rounded-2xl max-w-[75%] shadow-sm ${m.sender_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-[#141414] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'}`}>
                    <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                    <span className="text-[8px] font-black uppercase opacity-40 mt-2 block">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-4 bg-white dark:bg-[#0c0c0e]">
              <input 
                className="flex-1 bg-gray-50 dark:bg-white/5 p-5 px-8 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Message campus partner..." 
              />
              <button className="bg-black dark:bg-white text-white dark:text-black px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
            <span className="text-6xl mb-6">🤝</span>
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">AAU Node Hub</h3>
            <p className="text-sm font-medium mt-2 italic">Choose a trade conversation to continue.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
