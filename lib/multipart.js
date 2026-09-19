// Minimal multipart/form-data parser for raw Node request streams
// (works both under server.js's plain http server and Vercel's Node.js
// serverless runtime, which does not auto-parse multipart bodies).
export function parseMultipartBody(req) {
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
