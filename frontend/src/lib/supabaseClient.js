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

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Authentication will not work. ' +
    'Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
