import { getPatterns } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const section = req.query?.section || null;
  try {
    const products = await getPatterns(section);
    return res.status(200).json(products);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
