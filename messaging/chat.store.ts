
import { create } from 'zustand';
import { Message } from '../types';

interface ChatState {
  conversations: any[];
  messages: Message[];
  activeConversation: any | null;
  loading: boolean;
  setConversations: (convs: any[]) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  setActiveConversation: (conv: any | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: [],
  activeConversation: null,
  loading: false,
  setConversations: (conversations) => set({ conversations, loading: false }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ 
    messages: state.messages.find(m => m.id === msg.id) 
      ? state.messages 
      : [...state.messages, msg] 
  })),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ conversations: [], messages: [], activeConversation: null, loading: false })
}));
