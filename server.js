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
import productsHandler from './api/products.js';
import adminLoginHandler from './api/admin/login.js';
import adminProductsHandler from './api/admin/products/index.js';
import adminProductByIdHandler from './api/admin/products/[id].js';
import adminUploadsHandler from './api/admin/uploads.js';
import adminSeedHandler from './api/admin/seed.js';

const PORT = process.env.PORT || 3000;

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
    return productsHandler(req, res);
  }

  // ─── Admin Auth ───────────────────────────────────────────────────────────
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    req.body = await parseJsonBody(req);
    return adminLoginHandler(req, res);
  }

  // ─── Admin Products CRUD ──────────────────────────────────────────────────
  if (pathname === '/api/admin/products' && (req.method === 'GET' || req.method === 'POST')) {
    if (req.method === 'POST') req.body = await parseJsonBody(req);
    return adminProductsHandler(req, res);
  }

  if (pathname === '/api/admin/uploads' && req.method === 'POST') {
    return adminUploadsHandler(req, res);
  }

  if (pathname.startsWith('/api/admin/products/') && (req.method === 'PATCH' || req.method === 'DELETE')) {
    req.query.id = decodeURIComponent(pathname.replace('/api/admin/products/', ''));
    if (req.method === 'PATCH') req.body = await parseJsonBody(req);
    return adminProductByIdHandler(req, res);
  }

  // ─── Admin Seed (import default products to Supabase) ─────────────────────
  if (pathname === '/api/admin/seed' && req.method === 'POST') {
    return adminSeedHandler(req, res);
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
