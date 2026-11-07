import { getPayment } from '../lib/mercadopago.js';
import { productFor } from '../lib/products.js';
import { findOrder, updateOrder, signedDownload, getPatternById } from '../lib/supabase.js';
import { sendPurchaseEmails } from '../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Método no permitido' });
  }

  try {
    const reference = String(req.query.order || req.query.external_reference || '');
    const paymentId = String(req.query.payment_id || req.query.collection_id || '');
    const clientStatus = String(req.query.status || req.query.collection_status || '');

    const order = await findOrder(reference);

    // Si la orden no existe y no hay paymentId, retornar no encontrada
    if (!order && !paymentId) {
      return res.status(404).json({ status: 'not_found' });
    }

    let status = clientStatus || 'waiting';
    let paymentData = null;

    if (paymentId && paymentId !== 'null' && paymentId !== 'undefined') {
      try {
        paymentData = await getPayment(paymentId);
        if (paymentData && paymentData.status) {
          status = paymentData.status;
        }
      } catch (err) {
        console.warn('[PaymentStatus] No se pudo verificar el pago directamente con MP:', err.message);
        if (clientStatus === 'approved') status = 'approved';
      }
    }

    // Si la orden ya estaba marcada como aprobada (ej. patrón gratis o procesado previo)
    if (order && order.status === 'approved') {
      status = 'approved';
    }

    if (status !== 'approved') {
      return res.status(200).json({ status: status || 'waiting' });
    }

    // Preparar lista completa de ítems con sus archivos y enlaces de descarga
    let itemsToDownload = [];

    if (order && Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        const downloadUrl = await signedDownload(item.file);
        itemsToDownload.push({
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
        itemsToDownload.push({
          id: product.id,
          title: product.title,
          file: product.file,
          downloadUrl
        });
      }
    }

    // Si por alguna razón no se encontraron ítems pero el pago fue aprobado
    if (itemsToDownload.length === 0) {
      const defaultProduct = (await getPatternById('ruana-abrazo')) || productFor('ruana-abrazo');
      itemsToDownload.push({
        id: defaultProduct ? defaultProduct.id : 'guia',
        title: defaultProduct ? defaultProduct.title : 'Guía de tejido Puro Crochet',
        file: defaultProduct ? defaultProduct.file : null,
        downloadUrl: defaultProduct ? await signedDownload(defaultProduct.file) : '#'
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
