import { createClient } from '@supabase/supabase-js';

// Hardcoded for automatic global access as requested by the user.
// This allows users to use the app without entering their own credentials.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nztdqtywrzhfdqrvbzyt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dGRxdHl3cnpoZmRxcnZienl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzMwNzksImV4cCI6MjA5MTc0OTA3OX0.4I-HOh4xMs5tQ03IvIJa-ZUfpmAA5HGvK4XB8Eb0I3Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
