// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!publicUrl || !publicAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(publicUrl, publicAnonKey);

// For server-side (admin) usage: createAdminSupabase(serviceRoleKey)
// Use only in server environment (API routes, getServerSideProps) and never expose service role key to client.
export const createAdminSupabase = (serviceRoleKey) => {
  if (!process.env.SUPABASE_URL || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(process.env.SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false }
  });
};