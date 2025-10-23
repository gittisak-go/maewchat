// pages/api/admin/avatar-signed-url.js
// Example server-side API route that returns a signed download URL for a private avatar path.
// Requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL set in server environment (Vercel project settings).

import { createAdminSupabase } from '../../src/lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path query param' });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });

  const admin = createAdminSupabase(serviceRoleKey);
  try {
    // expiration seconds
    const expiresIn = 60; // 1 minute
    const { data, error } = await admin.storage.from('avatars').createSignedUrl(path, expiresIn);
    if (error) throw error;
    return res.status(200).json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error('signed url error', err);
    return res.status(500).json({ error: err.message || 'Error creating signed url' });
  }
}