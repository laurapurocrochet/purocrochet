import { getPayment } from '../lib/mercadopago.js';
import { productFor } from '../lib/products.js';
import { findOrder, signedDownload, getPatternById } from '../lib/supabase.js';
import { sendPurchaseEmails } from '../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const reference = String(req.query.order || req.query.external_reference || '');
    const paymentId = String(req.query.payment_id || req.query.collection_id || '');
    const clientStatus = String(req.query.status || req.query.collection_status || '');

    const order = await findOrder(reference);

    // If order was not saved, or simple test mode without order persistence
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
        console.warn('No se pudo verificar el pago directamente con MP:', err.message);
        // Fallback to client status if available
        if (clientStatus === 'approved') status = 'approved';
      }
    }

    if (status !== 'approved') {
      return res.status(200).json({ status: status || 'waiting' });
    }

    // Prepare download items
    let itemsToDownload = [];

    if (order && order.items && order.items.length > 0) {
      for (const item of order.items) {
        const downloadUrl = await signedDownload(item.file);
        itemsToDownload.push({
          title: item.title,
          downloadUrl
        });
      }
    } else if (order && order.product_id) {
      const product = (await getPatternById(order.product_id)) || productFor(order.product_id);
      if (product) {
        const downloadUrl = await signedDownload(product.file);
        itemsToDownload.push({
          title: product.title,
          downloadUrl
        });
      }
    }

    // If no order items found but payment was approved, fallback to first product or general
    if (itemsToDownload.length === 0) {
      const defaultProduct = (await getPatternById('ruana-abrazo')) || productFor('ruana-abrazo');
      itemsToDownload.push({
        title: defaultProduct ? defaultProduct.title : 'Guía de tejido',
        downloadUrl: defaultProduct ? await signedDownload(defaultProduct.file) : '#'
      });
    }

    const payerEmail = (order && order.buyer_email) || (paymentData && paymentData.payer && paymentData.payer.email) || '';

    // Optionally send email notification
    if (payerEmail && itemsToDownload.length > 0) {
      sendPurchaseEmails({
        buyerEmail: payerEmail,
        ownerEmail: process.env.OWNER_EMAIL,
        product: itemsToDownload[0],
        downloadUrl: itemsToDownload[0].downloadUrl,
        paymentId: paymentId || 'MP'
      }).catch(err => console.error('Error enviando email:', err));
    }

    return res.status(200).json({
      status: 'approved',
      product: itemsToDownload[0].title,
      downloadUrl: itemsToDownload[0].downloadUrl,
      items: itemsToDownload,
      payerEmail
    });
  } catch (error) {
    console.error('Error en payment-status:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
