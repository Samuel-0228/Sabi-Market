
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../shared/lib/supabase';
import { Message } from '../../types';

export const useChatRealtime = (conversationId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
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

    fetchHistory();

    const channel = supabase
      .channel(`trade_chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload: { new: Message }) => {
        const newMsg = payload.new;
        setMessages((prev: Message[]) => {
          if (prev.find((m: Message) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchHistory]);

  const send = async (senderId: string, content: string) => {
    if (!conversationId) return;
    
    // Optimistic Push
    const tempId = `temp-${Math.random()}`;
    const optMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);

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

  return { messages, loading, send };
};
