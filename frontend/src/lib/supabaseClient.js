import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * REQUIRED ENVIRONMENT VARIABLES (set in Vercel):
 * - REACT_APP_SUPABASE_URL: Your Supabase project URL (e.g., https://xxxxx.supabase.co)
 * - REACT_APP_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 * 
 * To get these values:
 * 1. Go to your Supabase project dashboard (https://supabase.com/dashboard)
 * 2. Click on "Settings" → "API"
 * 3. Copy the "Project URL" and "anon public" key
 * 
 * Add them in Vercel:
 * 1. Go to Vercel project → Settings → Environment Variables
 * 2. Add: REACT_APP_SUPABASE_URL
 * 3. Add: REACT_APP_SUPABASE_ANON_KEY
 * 4. Redeploy the app
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Track if environment is properly configured
const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase environment variables are not set. Authentication will not work. ' +
    'Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment.'
  );
}

/**
 * Custom fetch wrapper that prevents "body stream already read" errors
 * by ensuring the response is properly cloned before any parsing
 */
const customFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  // Clone the response immediately so we can safely read it
  // This prevents "body stream already read" errors if the body
  // is accidentally read multiple times (e.g., in error handling)
  return response.clone();
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    global: {
      fetch: customFetch,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Export configuration status for use in other components
export const isSupabaseConfigured = isConfigured;
