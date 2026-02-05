
import React, { useEffect, useRef, useState } from 'react';
import { chatClient } from '../../services/supabase/chatClient';
import { coreClient } from '../../services/supabase/coreClient';
import { useChatStore } from '../chat.store';
import { UserProfile } from '../../types';

interface InboxPageProps {
  user: UserProfile;
}

const InboxPage: React.FC<InboxPageProps> = ({ user }) => {
  const { 
    conversations, 
    messages, 
    activeConversation, 
    setConversations, 
    setMessages, 
    addMessage, 
    setActiveConversation,
    loading,
    setLoading
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchInboxes = async () => {
      // If we already have conversations, don't trigger a global loading state
      if (conversations.length === 0) setLoading(true);

      const { data, error } = await coreClient
        .from('conversations')
        .select(`
          *,
          listings(title, image_url, price),
          seller:profiles!conversations_seller_id_fkey(full_name),
          buyer:profiles!conversations_buyer_id_fkey(full_name)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (mounted) {
        setConversations(data || []);
        // Set first conversation as active only if none is selected
        if (data && data.length > 0 && !activeConversation) {
          setActiveConversation(data[0]);
        }
        setLoading(false);
      }
    };

    fetchInboxes();

    return () => {
      mounted = false;
      // We do NOT clear the store here anymore to keep data for tab switching
    };
  }, [user.id]);

  useEffect(() => {
    if (!activeConversation) return;

    // Load messages from REST client
    coreClient.from('messages')
      .select('*')
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // Connect Realtime
    const channel = chatClient
      .channel(`room_${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, (payload) => {
        addMessage(payload.new as any);
      })
      .subscribe();

    return () => {
      chatClient.removeChannel(channel);
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation) return;
    const content = input;
    setInput('');
    
    // Optimistically add message to UI for perceived speed
    const tempId = Math.random().toString();
    addMessage({
      id: tempId,
      conversation_id: activeConversation.id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString()
    } as any);

    await coreClient.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: user.id,
      content
    });
  };

  if (loading && conversations.length === 0) return (
    <div className="h-[80vh] flex flex-col items-center justify-center dark:text-white">
       <div className="animate-spin w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full mb-4" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Syncing Inbox...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      <div className="w-full lg:w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b dark:border-white/5 bg-gray-50/20 dark:bg-black/20">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter leading-none">Inbox</h2>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2">Active Inquiries</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !loading && (
             <div className="p-20 text-center opacity-30">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
             </div>
          )}
          {conversations.map(conv => (
            <button 
              key={conv.id} 
              onClick={() => setActiveConversation(conv)}
              className={`w-full p-6 text-left flex items-center gap-4 border-b dark:border-white/5 transition-all ${activeConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-white/5 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <img src={conv.listings?.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="font-black dark:text-white text-sm truncate">
                  {conv.seller_id === user.id ? conv.buyer?.full_name : conv.seller?.full_name}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{conv.listings?.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl">
        {activeConversation ? (
          <>
            <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-gray-50/20 dark:bg-black/20">
              <div className="flex items-center gap-4">
                <img src={activeConversation.listings?.image_url} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                <div>
                   <h3 className="font-black dark:text-white text-lg leading-tight">{activeConversation.listings?.title}</h3>
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Secure Trading Active</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                 <p className="text-xl font-black text-indigo-600">{activeConversation.listings?.price} ETB</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-gray-50/5 dark:bg-black/5" ref={scrollRef}>
               {messages.map(m => (
                 <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                   <div className={`px-6 py-4 rounded-2xl max-w-[70%] shadow-sm ${m.sender_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-[#141414] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'}`}>
                     <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                     <span className="text-[8px] font-black uppercase opacity-50 mt-2 block">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 </div>
               ))}
            </div>
            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-4 bg-white dark:bg-[#0c0c0e]">
              <input 
                className="flex-1 bg-gray-50 dark:bg-white/5 p-5 px-8 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 font-bold" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Negotiate trade details..."
              />
              <button className="bg-black dark:bg-white text-white dark:text-black px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 dark:text-white text-center p-20">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner">🤝</div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Market Hub</h3>
            <p className="text-sm font-medium mt-2 italic">Select a conversation to finalize your trades.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
