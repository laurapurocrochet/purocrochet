import { getPayment } from '../../lib/mercadopago.js';
import { findOrder, updateOrder } from '../../lib/supabase.js';
import { sendPurchaseEmails } from '../../lib/email.js';
import { resolveOrderItems } from '../../lib/order-delivery.js';

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
        if (!order) {
          console.error(`[Webhook] Pedido no encontrado para la referencia ${reference || '(vacía)'}`);
          return res.status(200).json({ received: true, orderFound: false });
        }

        const buyerEmail = order.buyer_email || payment.payer?.email;
        if (buyerEmail && !order.email_sent) {
          const itemsToDeliver = await resolveOrderItems(order);
          if (itemsToDeliver.length === 0) {
            console.error(`[Webhook] Pedido sin artículos descargables para la referencia ${reference}`);
            return res.status(200).json({ received: true, itemsFound: false });
          }

          const result = await sendPurchaseEmails({
            buyerEmail,
            ownerEmail: process.env.OWNER_EMAIL,
            items: itemsToDeliver,
            paymentId,
            orderReference: reference
          });

          if (result?.success && reference) {
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
