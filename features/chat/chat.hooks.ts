
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../shared/lib/supabase';
import { Message } from '../../types';

export const useChatRoom = (conversationId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial message history
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // PRODUCTION-GRADE CLEANUP: Scoped channel logic
    const channel = supabase
      .channel(`room:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload: { new: Message }) => {
        const newMsg = payload.new;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Fix: Updated dependency from fetchHistory (undefined) to fetchMessages
  }, [conversationId, fetchMessages]);

  const sendMessage = async (senderId: string, content: string) => {
    if (!conversationId) return;
    
    // Optimistic Update
    const tempId = Math.random().toString(36);
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      throw error;
    }
  };

  return { messages, loading, sendMessage };
};
