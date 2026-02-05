
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqkrddoodkawtmcapvyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

// ISOLATED CORE CLIENT: Dedicated to standard REST operations (Auth, Feed, Orders)
// Realtime is explicitly disabled here to ensure commerce requests never hang.
export const coreClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    // Disable realtime on the core client to avoid socket poisoning
    params: {
      eventsPerSecond: 0 
    }
  }
});
