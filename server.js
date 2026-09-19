import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env file automatically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["'](.*)["']$/, '$1');
      }
    }
  }
}

// Import route handlers
import createPreferenceHandler from './api/create-preference.js';
import paymentStatusHandler from './api/payment-status.js';
import webhookHandler from './api/webhooks/mercadopago.js';
// Import Supabase functions
import { getPatterns, createPattern, deletePattern, updatePattern, uploadPatternFile } from './lib/supabase.js';
import { PRODUCTS } from './lib/products.js';

const PORT = process.env.PORT || 3000;

// Admin session store (in-memory, 8h expiry)
const _adminSessions = new Map();
function _genToken() { return Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join(''); }
function _isAdmin(req) {
  const tok = (req.headers['authorization']||'').replace('Bearer ','').trim();
  if (!tok) return false;
  const exp = _adminSessions.get(tok);
  if (!exp || Date.now() > exp) { _adminSessions.delete(tok); return false; }
  return true;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jgp': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function parseQuery(url) {
  const query = {};
  const queryIdx = url.indexOf('?');
  if (queryIdx !== -1) {
    const searchParams = new URLSearchParams(url.slice(queryIdx + 1));
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }
  }
  return query;
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function parseMultipartBody(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    if (!boundaryMatch) return reject(new Error('Formulario de archivos inválido'));
    const boundary = Buffer.from(`--${boundaryMatch[1].replace(/^"|"$/g, '')}`);
    const chunks = [];
    let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > 15 * 1024 * 1024) { reject(new Error('El archivo supera el límite de 15 MB')); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const fields = {};
      let cursor = 0;
      while (cursor < body.length) {
        const start = body.indexOf(boundary, cursor);
        if (start < 0) break;
        const headerStart = start + boundary.length + 2;
        const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), headerStart);
        if (headerEnd < 0) break;
        const header = body.slice(headerStart, headerEnd).toString('utf8');
        const next = body.indexOf(boundary, headerEnd + 4);
        if (next < 0) break;
        const value = body.slice(headerEnd + 4, next - 2);
        const name = header.match(/name="([^"]+)"/i)?.[1];
        const filename = header.match(/filename="([^"]*)"/i)?.[1];
        if (name) fields[name] = filename ? { filename, contentType: header.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || 'application/octet-stream', buffer: value } : value.toString('utf8');
        cursor = next;
      }
      resolve(fields);
    });
    req.on('error', reject);
  });
}

function adaptResponse(res) {
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };
  res.json = function (obj) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = function (data) {
    res.end(data);
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  adaptResponse(res);
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  req.query = parseQuery(req.url);

  // ─── Public Products API ─────────────────────────────────────────────────
  if (pathname === '/api/products') {
    const section = parsedUrl.searchParams.get('section') || null;
    try {
      const products = await getPatterns(section);
      return res.status(200).json(products);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // ─── Admin Auth ───────────────────────────────────────────────────────────
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    req.body = await parseJsonBody(req);
    if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'ADMIN_PASSWORD no configurado en .env' });
    if (req.body.password === process.env.ADMIN_PASSWORD) {
      const token = _genToken();
      _adminSessions.set(token, Date.now() + 8*60*60*1000);
      return res.status(200).json({ token });
    }
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  // ─── Admin Products CRUD ──────────────────────────────────────────────────
  if (pathname === '/api/admin/products' && req.method === 'GET') {
    if (!_isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try { return res.status(200).json(await getPatterns(null, true)); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (pathname === '/api/admin/products' && req.method === 'POST') {
    if (!_isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    req.body = await parseJsonBody(req);
    try { return res.status(201).json(await createPattern(req.body)); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  if (pathname === '/api/admin/uploads' && req.method === 'POST') {
    if (!_isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
      const form = await parseMultipartBody(req);
      const file = form.file;
      const kind = form.kind === 'pdf' ? 'pdf' : 'image';
      if (!file?.buffer?.length) return res.status(400).json({ error: 'Elegí un archivo para subir' });
      if (kind === 'pdf' && file.contentType !== 'application/pdf' && !file.filename.toLowerCase().endsWith('.pdf')) return res.status(400).json({ error: 'El patrón debe ser un PDF' });
      if (kind === 'image' && !/^image\/(jpeg|png|webp|gif)$/i.test(file.contentType)) return res.status(400).json({ error: 'La imagen debe ser JPG, PNG, WEBP o GIF' });
      const objectPath = await uploadPatternFile({ ...file, kind });
      return res.status(201).json({ path: objectPath });
    } catch (e) { return res.status(400).json({ error: e.message }); }
  }

  if (pathname.startsWith('/api/admin/products/') && req.method === 'PATCH') {
    if (!_isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    req.body = await parseJsonBody(req);
    const pid = decodeURIComponent(pathname.replace('/api/admin/products/', ''));
    try { return res.status(200).json(await updatePattern(pid, req.body)); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  if (pathname.startsWith('/api/admin/products/') && req.method === 'DELETE') {
    if (!_isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const pid = decodeURIComponent(pathname.replace('/api/admin/products/', ''));
    try { await deletePattern(pid); return res.status(200).json({ ok: true }); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  // ─── Admin Seed (import default products to Supabase) ─────────────────────
  if (pathname === '/api/admin/seed' && req.method === 'POST') {
    if (!_isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const sectionMap = {
      'ruana-abrazo':'inicio','cardigan-abrazo':'inicio','chaleco-abrazo':'inicio',
      'bufanda-capucha-abrazo':'inicio','poncho-abrazo':'inicio','chaleco-suave':'inicio',
      'cardigan-calido':'inicio','poncho-luz':'inicio',
      'guia-ruana-abrazo':'guias','guia-cardigan-abrazo':'guias','guia-chaleco-abrazo':'guias',
      'guia-bufanda-capucha':'guias','guia-poncho-abrazo':'guias','guia-poncho-luz':'guias',
      'guia-chaleco-suave':'guias','guia-cardigan-calido':'guias','guia-medias':'guias',
      'pareo-alma':'guias','bolso-fiume':'guias',
      'gratis-pareo':'gratis','gratis-cuellito':'gratis'
    };
    const imgMap = {
      'ruana-abrazo':['ruana-abrazo-portada.jpg','ruana-abrazo-detalle.jpg'],
      'cardigan-abrazo':['cardigan-abrazo-portada.jpg','cardigan-abrazo-detalle.jpg'],
      'chaleco-abrazo':['chaleco-abrazo-portada.jpg','chaleco-abrazo-detalle.jpg'],
      'bufanda-capucha-abrazo':['bufanda-capucha-abrazo-portada.jpg','bufanda-capucha-abrazo.jpg'],
      'poncho-abrazo':['poncho-abrazo-portada.jpg','poncho-abrazo-detalle.jgp'],
      'chaleco-suave':['chaleco-suave-portada.jpg','chaleco-suave-detalle.jpg'],
      'cardigan-calido':['cardigan-calido-portada.jpg','cardigan-calido-detalle.jpg'],
      'poncho-luz':['poncho-luz-portada.jpg','poncho-luz-detalle.jgp.jpeg'],
      'guia-ruana-abrazo':['ruana-abrazo-portada.jpg','ruana-abrazo-detalle.jpg'],
      'guia-cardigan-abrazo':['cardigan-abrazo-portada.jpg','cardigan-abrazo-detalle.jpg'],
      'guia-chaleco-abrazo':['chaleco-abrazo-portada.jpg','chaleco-abrazo-detalle.jpg'],
      'guia-bufanda-capucha':['bufanda-capucha-abrazo-portada.jpg','bufanda-capucha-abrazo.jpg'],
      'guia-poncho-abrazo':['poncho-abrazo-portada.jpg','poncho-abrazo-detalle.jgp'],
      'guia-poncho-luz':['poncho-luz-portada.jpg','poncho-luz-detalle.jgp.jpeg'],
      'guia-chaleco-suave':['chaleco-suave-portada.jpg','chaleco-suave-detalle.jpg'],
      'guia-cardigan-calido':['cardigan-calido-portada.jpg','cardigan-calido-detalle.jpg'],
      'guia-medias':['medias-portada.jpg','medias-detalle.jpg'],
      'pareo-alma':['pareo-alma-portada.jpg','pareo-alma-detalle.jpg'],
      'bolso-fiume':['bolso-fiume-portada.jpg','bolso-fiume-detalle.jpg'],
      'gratis-pareo':['pareo-alma-portada.jpg','pareo-alma-detalle.jpg'],
      'gratis-cuellito':['bufanda-capucha-abrazo-portada.jpg','bufanda-capucha-abrazo.jpg']
    };
    let seeded = 0, skipped = 0, errors = [];
    for (const [id, section] of Object.entries(sectionMap)) {
      const prod = PRODUCTS[id];
      if (!prod) { skipped++; continue; }
      const imgs = imgMap[id] || [];
      try {
        await createPattern({ id:prod.id, title:prod.title, price:prod.price, file:prod.file,
          image_portada:imgs[0]||null, image_detalle:imgs[1]||null, section, visible:true });
        seeded++;
      } catch (e) {
        // Duplicate key means already seeded – count as ok
        if (e.message.includes('duplicate') || e.message.includes('23505')) { skipped++; }
        else { errors.push(`${id}: ${e.message}`); }
      }
    }
    return res.status(200).json({ seeded, skipped, errors });
  }

  // ─── Existing API Routes ──────────────────────────────────────────────────
  if (pathname === '/api/create-preference') {
    req.body = await parseJsonBody(req);
    return createPreferenceHandler(req, res);
  }

  if (pathname === '/api/payment-status') {
    return paymentStatusHandler(req, res);
  }

  if (pathname === '/api/webhooks/mercadopago') {
    req.body = await parseJsonBody(req);
    return webhookHandler(req, res);
  }

  // Secure local PDF download handler
  if (pathname.startsWith('/downloads/')) {
    const rawFile = decodeURIComponent(pathname.replace('/downloads/', ''));
    const safeFile = path.basename(rawFile);
    const filePath = path.join(__dirname, safeFile);

    if (fs.existsSync(filePath) && safeFile.toLowerCase().endsWith('.pdf')) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFile)}"`
      });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.status(404).json({ error: 'Archivo no encontrado' });
      return;
    }
  }

  // Static file serving
  let targetPath = pathname === '/' ? '/index.html' : (pathname === '/admin' ? '/admin.html' : pathname);
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(targetPath);
  } catch (e) {
    decodedPath = targetPath;
  }

  const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    return fs.createReadStream(filePath).pipe(res);
  }

  // Fallback 404
  res.status(404).setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.end(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>404 - Página no encontrada</h1>
      <p><a href="/">Volver al inicio</a></p>
    </div>
  `);
});

server.listen(PORT, () => {
  console.log(`
  🧶 ========================================================
     Puro Crochet - Servidor Node.js activo
  ========================================================
     🌐 Tienda: http://localhost:${PORT}
     💳 Mercado Pago: ${process.env.MP_MODE === 'test' ? 'MODO TEST / SANDBOX' : 'MODO PRODUCCIÓN'}
     📦 Access Token: ${process.env.MP_ACCESS_TOKEN ? 'Configurado ✓' : 'No configurado ✗'}
  ========================================================
  `);
});
