import nodemailer from 'nodemailer';

function transport() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

export async function sendPurchaseEmails({ buyerEmail, ownerEmail, product, quantity, downloadUrl, paymentId }) {
  const mailer = transport();
  if (!mailer) {
    console.log(`[Email] Configuración de Gmail no presente. Email a ${buyerEmail} omitido.`);
    return;
  }

  const from = `Puro Crochet <${process.env.GMAIL_USER}>`;
  const productTitle = product ? (product.title || product) : 'Guía de tejido';

  try {
    await mailer.sendMail({
      from,
      to: buyerEmail,
      subject: `Tu compra: ${productTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #222;">¡Gracias por tu compra en Puro Crochet! 🧶</h1>
          <p>Tu pago fue procesado y aprobado con éxito.</p>
          <p>Podés descargar tu patrón <strong>${productTitle}</strong> haciendo clic en el siguiente botón:</p>
          <p style="margin: 25px 0;">
            <a href="${downloadUrl}" style="background: #222; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Descargar mi PDF
            </a>
          </p>
          <p style="font-size: 13px; color: #777;">💡 Te recomendamos guardar el archivo en tu computadora o celular para tenerlo siempre a mano.</p>
        </div>
      `
    });

    if (ownerEmail) {
      await mailer.sendMail({
        from,
        to: ownerEmail,
        subject: `Nueva venta: ${productTitle}`,
        html: `
          <p>Se ha registrado un nuevo pago aprobado.</p>
          <ul>
            <li><strong>Producto:</strong> ${productTitle}</li>
            <li><strong>Cantidad:</strong> ${quantity || 1}</li>
            <li><strong>Pago Mercado Pago:</strong> ${paymentId}</li>
            <li><strong>Cliente:</strong> ${buyerEmail}</li>
          </ul>
        `
      });
    }
  } catch (err) {
    console.error('Error enviando email:', err);
  }
}
