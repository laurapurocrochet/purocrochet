import crypto from 'node:crypto';
import { productFor } from '../lib/products.js';
import { createOrder, getPatternById, signedDownload } from '../lib/supabase.js';
import { createCheckoutPreference } from '../lib/mercadopago.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { productId, quantity, email, items: cartItems } = req.body || {};

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Ingresá un email válido' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const findProduct = async id => (await getPatternById(id)) || productFor(id);
    let items = [];

    // Soporte para múltiples ítems del carrito o producto único
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      for (const item of cartItems) {
        const prod = await findProduct(item.id);
        if (prod) {
          items.push({
            id: prod.id,
            title: prod.title,
            price: Number(prod.price) || 0,
            quantity: Number(item.quantity) || 1,
            file: prod.file
          });
        }
      }
    } else if (productId) {
      const product = await findProduct(productId);
      const units = Number(quantity) || 1;
      if (!product || units < 1) {
        return res.status(400).json({ error: 'Producto o cantidad inválida' });
      }
      items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price) || 0,
        quantity: units,
        file: product.file
      });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: 'No se especificaron productos válidos' });
    }

    const reference = crypto.randomBytes(16).toString('hex');
    const totalAmount = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    // Si el total es 0 (patrón gratuito)
    if (totalAmount === 0) {
      const downloadItems = [];
      for (const item of items) {
        const downloadUrl = await signedDownload(item.file);
        downloadItems.push({
          id: item.id,
          title: item.title,
          file: item.file,
          downloadUrl
        });
      }

      const orderData = {
        reference,
        product_id: items.length === 1 ? items[0].id : 'multiple',
        items: downloadItems,
        quantity: items.reduce((acc, i) => acc + i.quantity, 0),
        buyer_email: cleanEmail,
        status: 'approved',
        email_sent: false,
        payment_id: 'GRATIS',
        created_at: new Date().toISOString()
      };

      await createOrder(orderData);

      return res.status(200).json({
        checkoutUrl: `/gracias.html?order=${reference}&status=approved`,
        preferenceId: 'free',
        orderId: reference
      });
    }

    // Pedido pago normal
    const orderData = {
      reference,
      product_id: items.length === 1 ? items[0].id : 'multiple',
      items: items,
      quantity: items.reduce((acc, i) => acc + i.quantity, 0),
      buyer_email: cleanEmail,
      status: 'pending',
      email_sent: false,
      created_at: new Date().toISOString()
    };

    await createOrder(orderData);

    const preferenceResult = await createCheckoutPreference({
      items,
      payerEmail: cleanEmail,
      externalReference: reference,
      siteUrl: process.env.SITE_URL,
      mode: process.env.MP_MODE
    });

    return res.status(200).json({
      checkoutUrl: preferenceResult.checkoutUrl,
      preferenceId: preferenceResult.id,
      orderId: reference
    });
  } catch (error) {
    console.error('Error al crear preferencia de Mercado Pago:', error);
    return res.status(500).json({ error: error.message || 'No se pudo iniciar el pago' });
  }
}
