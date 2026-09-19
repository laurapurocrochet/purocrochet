import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ordersCacheFile = path.join(__dirname, '..', '.orders.json');

// Local storage fallback for development / offline use
function readLocalOrders() {
  try {
    if (fs.existsSync(ordersCacheFile)) {
      return JSON.parse(fs.readFileSync(ordersCacheFile, 'utf8') || '{}');
    }
  } catch (e) {}
  return {};
}

function writeLocalOrder(order) {
  try {
    const orders = readLocalOrders();
    orders[order.reference] = order;
    fs.writeFileSync(ordersCacheFile, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {}
}

function customFetch(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = lib.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => JSON.parse(data || '{}'),
          text: async () => data
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

const PATTERNS_BUCKET = 'patterns';
const isConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_URL.includes('tu-proyecto'));
const encodeObjectPath = objectPath => String(objectPath).split('/').map(encodeURIComponent).join('/');

const headers = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
});

export async function createOrder(order) {
  // Always save in local persistent cache
  writeLocalOrder(order);

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_URL.includes('tu-proyecto')) {
    try {
      const response = await customFetch(`${process.env.SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify(order)
      });
      if (!response.ok) {
        console.warn('Advertencia Supabase:', await response.text());
      }
    } catch (err) {
      console.warn('Error guardando en Supabase, usando guardado local:', err.message);
    }
  }
}

export async function findOrder(reference) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_URL.includes('tu-proyecto')) {
    try {
      const response = await customFetch(`${process.env.SUPABASE_URL}/rest/v1/orders?reference=eq.${encodeURIComponent(reference)}&select=*`, {
        headers: headers()
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data[0]) return data[0];
      }
    } catch (err) {
      console.warn('Error leyendo Supabase:', err.message);
    }
  }
  const orders = readLocalOrders();
  return orders[reference] || null;
}

export async function signedDownload(file) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_URL.includes('tu-proyecto')) {
    try {
      const bucket = String(file || '').startsWith('pdfs/') ? PATTERNS_BUCKET : 'pdfs';
      const objectPath = String(file || '').startsWith('pdfs/') ? file : file;
      const response = await customFetch(`${process.env.SUPABASE_URL}/storage/v1/object/sign/${bucket}/${encodeObjectPath(objectPath)}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ expiresIn: 604800 })
      });
      if (response.ok) {
        const data = await response.json();
        return `${process.env.SUPABASE_URL}/storage/v1${data.signedURL}`;
      }
    } catch (err) {
      console.warn('Error generando signed url de Supabase:', err.message);
    }
  }
  // Local fallback download endpoint
  return `/downloads/${encodeURIComponent(file)}`;
}

async function signedAsset(objectPath) {
  if (!objectPath || !String(objectPath).includes('/') || !isConfigured()) return objectPath || null;
  try {
    const response = await customFetch(`${process.env.SUPABASE_URL}/storage/v1/object/sign/${PATTERNS_BUCKET}/${encodeObjectPath(objectPath)}`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ expiresIn: 604800 })
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return `${process.env.SUPABASE_URL}/storage/v1${data.signedURL}`;
  } catch (error) {
    console.warn('Error firmando archivo de patrón:', error.message);
    return null;
  }
}

async function exposePattern(pattern) {
  return {
    ...pattern,
    image_portada: await signedAsset(pattern.image_portada),
    image_detalle: await signedAsset(pattern.image_detalle)
  };
}

export async function uploadPatternFile({ buffer, filename, contentType, kind }) {
  if (!isConfigured()) throw new Error('Supabase no está configurado');
  const safeName = String(filename || 'archivo').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const extension = path.extname(safeName) || (kind === 'pdf' ? '.pdf' : '');
  const objectPath = `${kind === 'pdf' ? 'pdfs' : 'images'}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
  const response = await customFetch(`${process.env.SUPABASE_URL}/storage/v1/object/${PATTERNS_BUCKET}/${encodeObjectPath(objectPath)}`, {
    method: 'POST',
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'false' },
    body: buffer
  });
  if (!response.ok) throw new Error(`No se pudo subir el archivo: ${await response.text()}`);
  return objectPath;
}

export async function getPatterns(section = null, includeAll = false) {
  if (!isConfigured()) {
    return [];
  }
  try {
    let url = `${process.env.SUPABASE_URL}/rest/v1/patterns?select=*&order=created_at.asc`;
    if (!includeAll) url += '&visible=eq.true';
    if (section) url += `&section=eq.${encodeURIComponent(section)}`;
    const keyToUse = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await customFetch(url, {
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? Promise.all(data.map(exposePattern)) : [];
    }
    console.warn('Error obteniendo patrones:', await response.text());
    return [];
  } catch (err) {
    console.warn('Error obteniendo patrones de Supabase:', err.message);
    return [];
  }
}

export async function getPatternById(id) {
  if (!isConfigured()) return null;
  const response = await customFetch(`${process.env.SUPABASE_URL}/rest/v1/patterns?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows[0] || null;
}

export async function createPattern(data) {
  const response = await customFetch(`${process.env.SUPABASE_URL}/rest/v1/patterns`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

export async function deletePattern(id) {
  const response = await customFetch(
    `${process.env.SUPABASE_URL}/rest/v1/patterns?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: { ...headers(), Prefer: 'return=minimal' } }
  );
  if (!response.ok) throw new Error(await response.text());
  return true;
}

export async function updatePattern(id, data) {
  const response = await customFetch(
    `${process.env.SUPABASE_URL}/rest/v1/patterns?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      body: JSON.stringify(data)
    }
  );
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}
