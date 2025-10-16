import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Configure Supabase client with better session management
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto refresh token when it's about to expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Check for session every 60 seconds
    detectSessionInUrl: true,
    // Set custom storage key to avoid conflicts
    storageKey: 'kerala-krishi-sahai-auth',
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development'
  },
  // Global settings
  global: {
    headers: {
      'X-Client-Info': 'kerala-krishi-sahai@1.0.0',
    },
  },
});
