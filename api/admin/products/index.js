import { isAdminRequest } from '../../../lib/adminAuth.js';
import { getPatterns, getPatternById, createPattern, addPatternSection } from '../../../lib/supabase.js';

function isPatternIdConflict(error) {
  try {
    const details = JSON.parse(error.message);
    return details.code === '23505' && details.details?.startsWith('Key (id)=');
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    try { return res.status(200).json(await getPatterns(null, true)); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      const existing = await getPatternById(data.id);
      if (existing) {
        await addPatternSection(data.id, data.section);
        return res.status(200).json(existing);
      }
      try {
        return res.status(201).json(await createPattern(data));
      } catch (error) {
        if (!isPatternIdConflict(error)) throw error;
        const duplicate = await getPatternById(data.id);
        if (!duplicate) throw error;
        await addPatternSection(data.id, data.section);
        return res.status(200).json(duplicate);
      }
    }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
