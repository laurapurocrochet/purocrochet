import { getPayment } from '../lib/mercadopago.js';
import { findOrder, updateOrder } from '../lib/supabase.js';
import { sendPurchaseEmails } from '../lib/email.js';
import { resolveOrderItems } from '../lib/order-delivery.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Método no permitido' });
  }

  try {
    const reference = String(req.query.order || req.query.external_reference || '');
    const paymentId = String(req.query.payment_id || req.query.collection_id || '');

    const order = await findOrder(reference);

    // Si la orden no existe y no hay paymentId, retornar no encontrada
    if (!order && !paymentId) {
      return res.status(404).json({ status: 'not_found' });
    }

    let status = order?.status || 'waiting';
    let paymentData = null;

    if (paymentId && paymentId !== 'null' && paymentId !== 'undefined') {
      try {
        paymentData = await getPayment(paymentId);
        if (paymentData && paymentData.status) {
          status = paymentData.status;
        }
      } catch (err) {
        console.warn('[PaymentStatus] No se pudo verificar el pago directamente con MP:', err.message);
      }
    }

    // Si la orden ya estaba marcada como aprobada (ej. patrón gratis o procesado previo)
    if (order && order.status === 'approved') {
      status = 'approved';
    }

    if (status !== 'approved') {
      return res.status(200).json({ status: status || 'waiting' });
    }

    if (!order) {
      return res.status(409).json({
        status: 'error',
        code: 'order_not_found',
        message: 'El pago fue aprobado, pero no pudimos recuperar los artículos del pedido. Contactanos para recibir tu patrón.'
      });
    }

    const itemsToDownload = await resolveOrderItems(order);
    if (itemsToDownload.length === 0) {
      return res.status(409).json({
        status: 'error',
        code: 'order_items_missing',
        message: 'El pago fue aprobado, pero el pedido no tiene archivos descargables configurados. Contactanos para recibir tu patrón.'
      });
    }

    const payerEmail = (order && order.buyer_email) || (paymentData && paymentData.payer && paymentData.payer.email) || '';

    // Enviar email automáticamente si no fue enviado previamente
    let emailSentResult = null;
    if (payerEmail && itemsToDownload.length > 0) {
      const alreadySent = order && order.email_sent;

      if (!alreadySent) {
        // Enviar email con todos los ítems y los PDFs adjuntos
        emailSentResult = await sendPurchaseEmails({
          buyerEmail: payerEmail,
          ownerEmail: process.env.OWNER_EMAIL,
          items: itemsToDownload,
          paymentId: paymentId || 'MP',
          orderReference: reference
        });

        // Registrar que el email ya fue enviado para evitar duplicados en siguientes peticiones
        if (reference && emailSentResult?.success) {
          await updateOrder(reference, {
            status: 'approved',
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            payment_id: paymentId || 'MP'
          });
        }
      }
    }

    return res.status(200).json({
      status: 'approved',
      isFree: order?.payment_id === 'GRATIS',
      product: itemsToDownload[0].title,
      downloadUrl: itemsToDownload[0].downloadUrl,
      items: itemsToDownload,
      payerEmail,
      emailSent: Boolean(order?.email_sent || emailSentResult?.success)
    });
  } catch (error) {
    console.error('Error en payment-status:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
