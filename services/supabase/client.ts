
import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://fqkrddoodkawtmcapvyu.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3JkZG9vZGthd3RtY2Fwdnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTQzMzIsImV4cCI6MjA4MzA3MDMzMn0.cFX3TVq697b_-9bj_bONzGZivE5JzowVKoSvBkZvttY';

const supabaseUrl = process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// resilientFetch: wraps fetch with timeout + retry for transient network errors
const resilientFetch: typeof fetch = async (input: RequestInfo, init?: RequestInit) => {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeout = init?.signal ? undefined : 20000; // 20s default when caller hasn't provided a signal
    const id = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (id) clearTimeout(id);

      // Retry on common transient server errors
      if ([502, 503, 504].includes(response.status) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }

      return response;
    } catch (err: any) {
      if (id) clearTimeout(id);
      // If aborted by caller, rethrow immediately
      if (err?.name === 'AbortError') throw err;
      if (attempt >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }

  // Should not reach here
  throw new Error('Network request failed after retries');
};

// SINGLE SOURCE OF TRUTH: createClient should be called only here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'savvy-unified-v1',
    flowType: 'pkce'
  },
  global: {
    fetch: resilientFetch
  }
});
