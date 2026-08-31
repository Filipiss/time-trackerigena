import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zmrkzizkgckbifrkxffi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptcmt6aXprZ2NrYmlmcmt4ZmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjgwMzEsImV4cCI6MjEwMjA0NDAzMX0.wXxkjBw6eHLm1_x2b0B08FHCg6wfB3TemjLBiQ-x5-c';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
