import { isAdminRequest } from '../../../lib/adminAuth.js';
import { getPatterns, createPattern } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    try { return res.status(200).json(await getPatterns(null, true)); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'POST') {
    try { return res.status(201).json(await createPattern(req.body)); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
