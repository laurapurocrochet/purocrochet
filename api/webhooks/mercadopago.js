import { getPayment } from '../../lib/mercadopago.js';
import { findOrder, updateOrder, signedDownload, getPatternById } from '../../lib/supabase.js';
import { productFor } from '../../lib/products.js';
import { sendPurchaseEmails } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const topic = req.query.topic || req.body?.type || req.query.type;
    const paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id;

    if ((topic === 'payment' || req.body?.action === 'payment.created') && paymentId) {
      const payment = await getPayment(paymentId);
      if (payment && payment.status === 'approved') {
        const reference = payment.external_reference;
        const order = reference ? await findOrder(reference) : null;
        const buyerEmail = (order && order.buyer_email) || payment.payer?.email;

        if (buyerEmail && (!order || !order.email_sent)) {
          // Extraer todos los ítems de la orden
          let itemsToDeliver = [];

          if (order && Array.isArray(order.items) && order.items.length > 0) {
            for (const item of order.items) {
              const downloadUrl = await signedDownload(item.file);
              itemsToDeliver.push({
                id: item.id,
                title: item.title,
                file: item.file,
                downloadUrl
              });
            }
          } else if (order && order.product_id && order.product_id !== 'multiple') {
            const product = (await getPatternById(order.product_id)) || productFor(order.product_id);
            if (product) {
              const downloadUrl = await signedDownload(product.file);
              itemsToDeliver.push({
                id: product.id,
                title: product.title,
                file: product.file,
                downloadUrl
              });
            }
          }

          if (itemsToDeliver.length === 0) {
            const defaultProduct = (await getPatternById('ruana-abrazo')) || productFor('ruana-abrazo');
            itemsToDeliver.push({
              id: 'guia',
              title: defaultProduct ? defaultProduct.title : 'Guía de tejido Puro Crochet',
              file: defaultProduct ? defaultProduct.file : null,
              downloadUrl: defaultProduct ? await signedDownload(defaultProduct.file) : '#'
            });
          }

          await sendPurchaseEmails({
            buyerEmail,
            ownerEmail: process.env.OWNER_EMAIL,
            items: itemsToDeliver,
            paymentId,
            orderReference: reference || ''
          });

          if (reference) {
            await updateOrder(reference, {
              status: 'approved',
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              payment_id: paymentId
            });
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ error: error.message });
  }
}
