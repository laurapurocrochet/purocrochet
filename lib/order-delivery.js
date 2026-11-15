import { getPatternById, signedDownload } from './supabase.js';
import { productFor } from './products.js';

export async function resolveOrderItems(order) {
  let orderItems = Array.isArray(order?.items) ? order.items : [];

  if (orderItems.length === 0 && order?.product_id && order.product_id !== 'multiple') {
    const product = (await getPatternById(order.product_id)) || productFor(order.product_id);
    if (product) orderItems = [product];
  }

  const items = [];
  for (const item of orderItems) {
    const product = item.id && (!item.file || !item.title)
      ? (await getPatternById(item.id)) || productFor(item.id)
      : null;
    const file = item.file || product?.file;
    const title = item.title || product?.title;

    if (!file || !title) {
      throw new Error(`El patrón ${item.id || ''} no tiene un archivo descargable configurado`);
    }

    items.push({
      id: item.id || product?.id,
      title,
      file,
      downloadUrl: await signedDownload(file)
    });
  }

  return items;
}
