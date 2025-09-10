import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL (copy from dashboard)
const supabaseUrl = 'https://tncmfeesbincfacpcgzd.supabase.co';  // Replace 'your-project-ref' with actual, e.g., 'abc123xyz'

// Your anon public key (copy full string from dashboard – keep in quotes!)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuY21mZWVzYmluY2ZhY3BjZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjcyOTksImV4cCI6MjA3MjkwMzI5OX0.FCxlkYGPfVU7-wgfeLn0a6nvoxwMGEUfidftqxw7b90';  // Replace with your full key

// Create the client (connects app to DB/auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);