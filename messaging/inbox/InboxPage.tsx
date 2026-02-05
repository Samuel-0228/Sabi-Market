
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
    clear 
  } = useChatStore();
  
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Component Lifecycle Cleanup
  useEffect(() => {
    let mounted = true;
    
    const fetchInboxes = async () => {
      // Use coreClient (REST) to fetch initial listing
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
        if (data && data.length > 0) setActiveConversation(data[0]);
        setLoading(false);
      }
    };

    fetchInboxes();

    return () => {
      mounted = false;
      // CRITICAL: Tear down all realtime sockets on this client specifically
      chatClient.removeAllChannels();
      // Reset the transient chat store
      clear();
    };
  }, [user.id]);

  // 2. Realtime Subscription (Sandboxed)
  useEffect(() => {
    if (!activeConversation) return;

    // Fetch message history with coreClient
    coreClient.from('messages')
      .select('*')
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // Subscribe using the isolated chatClient
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
    // Send message via REST (coreClient)
    await coreClient.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: user.id,
      content
    });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center dark:text-white">
       <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 h-[85vh] flex gap-8">
      {/* Inbox List */}
      <div className="w-96 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        <div className="p-8 border-b dark:border-white/5">
          <h2 className="text-2xl font-black dark:text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button 
              key={conv.id} 
              onClick={() => setActiveConversation(conv)}
              className={`w-full p-6 text-left flex items-center gap-4 border-b dark:border-white/5 ${activeConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-white/5' : ''}`}
            >
              <img src={conv.listings?.image_url} className="w-12 h-12 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="font-black dark:text-white text-sm truncate">
                  {conv.seller_id === user.id ? conv.buyer?.full_name : conv.seller?.full_name}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{conv.listings?.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
        {activeConversation ? (
          <>
            <div className="p-6 border-b dark:border-white/5 flex items-center gap-4">
              <img src={activeConversation.listings?.image_url} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                 <h3 className="font-black dark:text-white">{activeConversation.listings?.title}</h3>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AAU Secure Exchange</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-4" ref={scrollRef}>
               {messages.map(m => (
                 <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                   <div className={`px-6 py-3 rounded-2xl max-w-[70%] ${m.sender_id === user.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-white/5 dark:text-white'}`}>
                     {m.content}
                   </div>
                 </div>
               ))}
            </div>
            <form onSubmit={handleSend} className="p-8 border-t dark:border-white/5 flex gap-4">
              <input 
                className="flex-1 bg-gray-50 dark:bg-white/5 p-4 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-600" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Negotiate trade..."
              />
              <button className="bg-indigo-600 text-white px-10 rounded-xl font-black uppercase text-[10px]">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-30 dark:text-white font-black uppercase tracking-widest">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
