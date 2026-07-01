import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://uskdropmxtxfvlxrfhzj.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVza2Ryb3BteHR4ZnZseHJmaHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjI3NjEsImV4cCI6MjA5ODMzODc2MX0.EebO9zvchTFFBOHboY2lI0RofEzjsbU1MT5zBPnXAZU';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey).trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
