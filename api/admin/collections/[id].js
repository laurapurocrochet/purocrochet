import { isAdminRequest } from '../../../lib/adminAuth.js';
import { deleteCollection, setCollectionProducts, updateCollection } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });
  const collectionId = req.query.id;

  if (req.method === 'PATCH') {
    const { name, slug, description, productIds } = req.body || {};
    if (slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones.' });
    }
    if (productIds !== undefined && (!Array.isArray(productIds) || productIds.some(id => typeof id !== 'string'))) {
      return res.status(400).json({ error: 'La lista de artículos no es válida.' });
    }
    try {
      const hasCollectionFields = name !== undefined || slug !== undefined || description !== undefined;
      const collection = hasCollectionFields
        ? await updateCollection(collectionId, { name, slug, description })
        : { id: collectionId };
      const linkedProductIds = Array.isArray(productIds)
        ? await setCollectionProducts(collectionId, productIds)
        : undefined;
      return res.status(200).json({ ...collection, ...(linkedProductIds ? { productIds: linkedProductIds } : {}) });
    } catch (error) { return res.status(400).json({ error: error.message }); }
  }

  if (req.method === 'DELETE') {
    try { await deleteCollection(collectionId); return res.status(200).json({ ok: true }); }
    catch (error) { return res.status(400).json({ error: error.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}