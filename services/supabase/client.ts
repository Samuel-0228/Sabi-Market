
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqkrddoodkawtmcapvyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

// SINGLE SOURCE OF TRUTH: 
// This is the ONLY place createClient should be called to avoid the GoTrueClient warning.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'savvy-unified-v1',
    flowType: 'pkce'
  },
  global: {
    // Optimized timeout: 8s is the sweet spot for perceived performance
    fetch: (input, init) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000); 
      return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(id));
    }
  }
});
