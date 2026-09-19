import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAdminRequest } from '../../lib/adminAuth.js';
import { createPattern, getPatternById, uploadPatternFile } from '../../lib/supabase.js';
import { PRODUCTS } from '../../lib/products.js';
import { SEED_SECTION_MAP, SEED_IMAGE_MAP } from '../../lib/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');

const IMAGE_CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jgp': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };

// Reads a file that already lives in the repo (the store's original hardcoded
// patterns) and uploads it into Supabase Storage, so seeded rows point at real
// signed-URL-able objects instead of a bare local filename.
async function uploadLocalFile(relativeName, kind) {
  if (!relativeName) return null;
  const filePath = path.join(projectRoot, relativeName);
  if (!fs.existsSync(filePath)) throw new Error(`Archivo local no encontrado: ${relativeName}`);
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(relativeName).toLowerCase();
  const contentType = kind === 'pdf' ? 'application/pdf' : (IMAGE_CONTENT_TYPES[ext] || 'application/octet-stream');
  return uploadPatternFile({ buffer, filename: relativeName, contentType, kind });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'No autorizado' });

  let seeded = 0, skipped = 0, errors = [];
  for (const [id, section] of Object.entries(SEED_SECTION_MAP)) {
    const prod = PRODUCTS[id];
    if (!prod) { skipped++; continue; }
    try {
      const existing = await getPatternById(id);
      if (existing) { skipped++; continue; }

      const imgs = SEED_IMAGE_MAP[id] || [];
      const filePath = await uploadLocalFile(prod.file, 'pdf');
      const portadaPath = await uploadLocalFile(imgs[0], 'image');
      const detallePath = await uploadLocalFile(imgs[1], 'image');

      await createPattern({
        id: prod.id, title: prod.title, price: prod.price,
        file: filePath, image_portada: portadaPath, image_detalle: detallePath,
        section, visible: true
      });
      seeded++;
    } catch (e) {
      if (e.message.includes('duplicate') || e.message.includes('23505')) skipped++;
      else errors.push(`${id}: ${e.message}`);
    }
  }
  return res.status(200).json({ seeded, skipped, errors });
}
