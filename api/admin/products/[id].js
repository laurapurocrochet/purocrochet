import { isAdminRequest } from '../../../lib/adminAuth.js';
import { updatePattern, deletePattern } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });
  const pid = req.query.id;

  if (req.method === 'PATCH') {
    try { return res.status(200).json(await updatePattern(pid, req.body)); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  if (req.method === 'DELETE') {
    try { await deletePattern(pid); return res.status(200).json({ ok: true }); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
