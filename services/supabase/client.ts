import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqkrddoodkawtmcapvyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

// SINGLE SOURCE OF TRUTH: 
// Unified storageKey to ensure session is shared across all components.
export const supabase: any = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'savvy-unified-v1', // Matched across all client files
    flowType: 'pkce'
  },
  global: {
    fetch: (input, init) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 20000); 
      return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(id));
    }
  }
});