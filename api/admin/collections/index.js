import { isAdminRequest } from '../../../lib/adminAuth.js';
import { createCollection, getCollections, setCollectionProducts } from '../../../lib/supabase.js';

function validCollection(data) {
  return typeof data?.name === 'string' && data.name.trim()
    && typeof data?.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug);
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    try { return res.status(200).json(await getCollections()); }
    catch (error) { return res.status(500).json({ error: error.message }); }
  }

  if (req.method === 'POST') {
    if (!validCollection(req.body)) return res.status(400).json({ error: 'Ingresá un nombre y un slug válido.' });
    try {
      const collection = await createCollection({
        name: req.body.name.trim(),
        slug: req.body.slug,
        description: typeof req.body.description === 'string' ? req.body.description.trim() : null
      });
      const productIds = Array.isArray(req.body.productIds)
        ? await setCollectionProducts(collection.id, req.body.productIds)
        : [];
      return res.status(201).json({ ...collection, productIds });
    } catch (error) { return res.status(400).json({ error: error.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}