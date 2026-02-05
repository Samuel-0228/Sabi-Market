
import { create } from 'https://esm.sh/zustand';
import { Message } from '../types';

interface ChatState {
  conversations: any[];
  messages: Message[];
  activeConversation: any | null;
  setConversations: (convs: any[]) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  setActiveConversation: (conv: any | null) => void;
  clear: () => void;
}

// Strictly ephemeral. Reset on unmount of Inbox.
export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: [],
  activeConversation: null,
  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ 
    messages: state.messages.find(m => m.id === msg.id) 
      ? state.messages 
      : [...state.messages, msg] 
  })),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  clear: () => set({ conversations: [], messages: [], activeConversation: null })
}));
