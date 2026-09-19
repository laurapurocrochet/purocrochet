import { getPayment } from '../../lib/mercadopago.js';
import { findOrder, signedDownload, getPatternById } from '../../lib/supabase.js';
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
        const order = await findOrder(reference);
        const buyerEmail = (order && order.buyer_email) || payment.payer?.email;

        if (buyerEmail) {
          const product = order?.product_id ? ((await getPatternById(order.product_id)) || productFor(order.product_id)) : null;
          const downloadUrl = product ? await signedDownload(product.file) : '#';
          await sendPurchaseEmails({
            buyerEmail,
            ownerEmail: process.env.OWNER_EMAIL,
            product: product || { title: 'Guía de tejido Puro Crochet' },
            downloadUrl,
            paymentId
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ error: error.message });
  }
}
