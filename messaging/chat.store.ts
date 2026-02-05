
import { create } from 'https://esm.sh/zustand';
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

// Stores conversation and message history to allow instant UI switching
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
