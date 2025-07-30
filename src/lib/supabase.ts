import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kdpdpcwjdkcbuvjksokd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGRwY3dqZGtjYnV2amtzb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjE0MTIsImV4cCI6MjA2ODY5NzQxMn0.u5CISAlH6shReiO8P1NZjJf4zgCkltO2i5B-9UUDbW4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);