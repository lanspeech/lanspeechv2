import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://uskdropmxtxfvlxrfhzj.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVza2Ryb3BteHR4ZnZseHJmaHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjI3NjEsImV4cCI6MjA5ODMzODc2MX0.EebO9zvchTFFBOHboY2lI0RofEzjsbU1MT5zBPnXAZU';

// Prefer `process.env` in Node test runners; Vite will inline `import.meta.env` at build-time for the browser.
const metaEnv: NodeJS.ProcessEnv = (typeof process !== 'undefined' && process.env) ? process.env : {} as NodeJS.ProcessEnv;
const supabaseUrl = (metaEnv.VITE_SUPABASE_URL || fallbackSupabaseUrl).trim();
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey).trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
