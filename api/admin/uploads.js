import { isAdminRequest } from '../../lib/adminAuth.js';
import { uploadPatternFile } from '../../lib/supabase.js';
import { parseMultipartBody } from '../../lib/multipart.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });

  try {
    const form = await parseMultipartBody(req);
    const file = form.file;
    const kind = form.kind === 'pdf' ? 'pdf' : 'image';
    if (!file?.buffer?.length) return res.status(400).json({ error: 'Elegí un archivo para subir' });
    if (kind === 'pdf' && file.contentType !== 'application/pdf' && !file.filename.toLowerCase().endsWith('.pdf')) return res.status(400).json({ error: 'El patrón debe ser un PDF' });
    if (kind === 'image' && !/^image\/(jpeg|png|webp|gif)$/i.test(file.contentType)) return res.status(400).json({ error: 'La imagen debe ser JPG, PNG, WEBP o GIF' });
    const objectPath = await uploadPatternFile({ ...file, kind });
    return res.status(201).json({ path: objectPath });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
