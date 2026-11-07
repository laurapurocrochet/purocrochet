import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Configura y retorna el transportador de Nodemailer (Gmail o SMTP personalizado)
 */
function getTransporter() {
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

  if (gmailUser && gmailPass) {
    return {
      mailer: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      }),
      fromEmail: gmailUser,
      type: 'Gmail'
    };
  }

  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (smtpHost && smtpUser && smtpPass) {
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    return {
      mailer: nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      }),
      fromEmail: smtpUser,
      type: 'SMTP'
    };
  }

  return null;
}

/**
 * Normaliza una URL de descarga a una URL absoluta
 */
function toAbsoluteUrl(urlStr) {
  if (!urlStr || urlStr === '#') return '#';
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) return urlStr;
  const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${siteUrl}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
}

/**
 * Busca un archivo PDF local para adjuntarlo al correo
 */
function findLocalPdfFile(fileName) {
  if (!fileName) return null;

  const baseName = path.basename(fileName);
  const candidates = [
    path.join(projectRoot, fileName),
    path.join(projectRoot, baseName),
    path.join(projectRoot, 'pdfs', baseName)
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return {
          filename: baseName,
          path: candidate,
          contentType: 'application/pdf'
        };
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Envía los emails de confirmación de compra y entrega de patrones PDF
 * @param {Object} params
 * @param {string} params.buyerEmail - Correo del comprador
 * @param {string} [params.ownerEmail] - Correo de la dueña de la tienda
 * @param {Array} [params.items] - Lista de ítems [{ title, file, downloadUrl }]
 * @param {Object} [params.product] - Ítem único fallback { title, file, downloadUrl }
 * @param {string} [params.downloadUrl] - Enlace de descarga único fallback
 * @param {string} [params.paymentId] - Identificador del pago
 * @param {string} [params.orderReference] - Referencia interna de la orden
 */
export async function sendPurchaseEmails({
  buyerEmail,
  ownerEmail,
  items = [],
  product = null,
  quantity = 1,
  downloadUrl = null,
  paymentId = 'MP',
  orderReference = ''
}) {
  const cleanBuyerEmail = (buyerEmail || '').trim().toLowerCase();
  if (!cleanBuyerEmail || !cleanBuyerEmail.includes('@')) {
    console.warn('[Email] Email de comprador inválido:', buyerEmail);
    return { success: false, error: 'Email de comprador inválido' };
  }

  const transportConfig = getTransporter();
  if (!transportConfig) {
    console.warn('\n⚠️ [Email] ATENCIÓN: No se encontraron credenciales de correo en .env (GMAIL_USER y GMAIL_APP_PASSWORD no configurados).');
    console.warn(`   El email con los PDFs para ${cleanBuyerEmail} no se pudo enviar automáticamente.`);
    console.warn('   Configurá GMAIL_USER y GMAIL_APP_PASSWORD en .env para activar el envío automático.\n');
    return { success: false, error: 'Credenciales de correo no configuradas en .env' };
  }

  const { mailer, fromEmail, type } = transportConfig;
  const from = `Puro Crochet <${fromEmail}>`;

  // Normalizar lista de ítems a entregar
  let normalizedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    normalizedItems = items.map(item => ({
      title: item.title || 'Patrón de Crochet en PDF',
      file: item.file || null,
      downloadUrl: toAbsoluteUrl(item.downloadUrl)
    }));
  } else if (product) {
    normalizedItems = [{
      title: (typeof product === 'string' ? product : product.title) || 'Patrón de Crochet en PDF',
      file: product.file || null,
      downloadUrl: toAbsoluteUrl(downloadUrl || product.downloadUrl)
    }];
  }

  if (normalizedItems.length === 0) {
    normalizedItems.push({
      title: 'Guía de tejido Puro Crochet',
      file: null,
      downloadUrl: toAbsoluteUrl(downloadUrl || '#')
    });
  }

  // Preparar adjuntos PDF locales
  const attachments = [];
  const attachedNames = [];

  for (const item of normalizedItems) {
    if (item.file) {
      const pdfAttachment = findLocalPdfFile(item.file);
      if (pdfAttachment) {
        // Evitar duplicar el mismo archivo adjunto
        if (!attachments.some(a => a.path === pdfAttachment.path)) {
          attachments.push(pdfAttachment);
          attachedNames.push(pdfAttachment.filename);
        }
      }
    }
  }

  const hasAttachments = attachments.length > 0;
  const productsSummary = normalizedItems.map(i => i.title).join(', ');
  const subject = normalizedItems.length === 1
    ? `🧶 Tu patrón: ${normalizedItems[0].title} - Puro Crochet`
    : `🧶 Tus patrones de Puro Crochet (${normalizedItems.length} guías)`;

  // Renderizar plantilla HTML para el cliente
  const htmlItemsList = normalizedItems.map(item => {
    return `
      <div style="background: #ffffff; border: 1px solid #ede8e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="font-size: 16px; font-weight: 700; color: #2d2621; margin-bottom: 12px; display: flex; align-items: center;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #c68a6f; border-radius: 50%; margin-right: 10px;"></span>
          ${item.title}
        </div>
        <div>
          <a href="${item.downloadUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2d2621; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">
            📥 Descargar Patrón PDF
          </a>
        </div>
      </div>
    `;
  }).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f5f2; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebe5de;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #2d2621 0%, #4a3b32 100%); padding: 35px 25px; text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 6px;">🧶</div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">PURO CROCHET</h1>
                  <p style="color: #d8c7ba; margin: 6px 0 0 0; font-size: 14px; font-style: italic;">Diseños & Guías de Tejido Artesanal</p>
                </td>
              </tr>

              <!-- Contenido Principal -->
              <tr>
                <td style="padding: 35px 30px;">
                  <h2 style="color: #2d2621; margin-top: 0; font-size: 20px; font-weight: 700;">¡Muchas gracias por tu compra! 🎉</h2>
                  <p style="font-size: 15px; color: #555555; margin-bottom: 20px;">
                    Tu pago fue procesado con éxito. Ya podés disfrutar y comenzar a tejer tus proyectos.
                  </p>

                  ${hasAttachments ? `
                  <!-- Alerta de Adjuntos -->
                  <div style="background-color: #eef7ee; border-left: 4px solid #2e7d32; border-radius: 6px; padding: 14px 16px; margin-bottom: 25px;">
                    <div style="font-weight: 700; color: #2e7d32; font-size: 14px; margin-bottom: 4px;">
                      📎 Archivos PDF adjuntos a este correo
                    </div>
                    <div style="font-size: 13px; color: #3b603d;">
                      Adjuntamos directamente a este correo tus patrones (${attachedNames.join(', ')}) para que los tengas siempre guardados y disponibles en tu bandeja de entrada.
                    </div>
                  </div>
                  ` : ''}

                  <!-- Listado de Patrones -->
                  <div style="margin-bottom: 25px;">
                    <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #8c7b70; margin-bottom: 12px;">
                      Tus Patrones Comprados:
                    </div>
                    ${htmlItemsList}
                  </div>

                  <!-- Consejos de Guardado -->
                  <div style="background-color: #faf8f5; border: 1px solid #ede8e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px;">
                    <div style="font-weight: 700; color: #2d2621; font-size: 14px; margin-bottom: 8px;">
                      💡 Recomendación de guardado:
                    </div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #666666;">
                      <li style="margin-bottom: 6px;">Guardá el archivo PDF en tu celular, tablet o computadora (en tu carpeta de Descargas, Apple Books o Google Drive).</li>
                      <li>Así podrás tejer cómodamente sin necesidad de conexión a internet cada vez que quieras consultar el patrón.</li>
                    </ul>
                  </div>

                  <!-- Datos de la orden -->
                  <div style="border-top: 1px solid #f0ede8; padding-top: 18px; font-size: 12px; color: #999999;">
                    <span><strong>N° de Pago:</strong> ${paymentId}</span>
                    ${orderReference ? `<span style="margin-left: 15px;"><strong>Referencia:</strong> ${orderReference}</span>` : ''}
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #faf8f5; padding: 25px 30px; text-align: center; border-top: 1px solid #ebe5de;">
                  <p style="font-size: 14px; font-weight: 600; color: #2d2621; margin: 0 0 8px 0;">¿Tenés alguna consulta o duda con tu guía?</p>
                  <p style="font-size: 13px; color: #666666; margin: 0 0 15px 0;">
                    Estamos para ayudarte con cualquier duda durante el tejido de tu proyecto.
                  </p>
                  <div style="font-size: 13px; color: #555555;">
                    <span style="margin: 0 8px;">📸 <strong>Instagram:</strong> @laura_purocrochet</span> •
                    <span style="margin: 0 8px;">💬 <strong>WhatsApp:</strong> +59 9 11 6429-1026</span>
                  </div>
                  <p style="font-size: 11px; color: #aaaaaa; margin-top: 20px; margin-bottom: 0;">
                    Puro Crochet • Tienda Oficial • Gracias por valorar el tejido artesanal hecho con amor.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Versión de texto plano para clientes de correo sin HTML y filtros de spam
  const textBody = `
¡Gracias por tu compra en Puro Crochet! 🧶

Tu pago fue procesado con éxito.

Tus Patrones Comprados:
${normalizedItems.map(i => `- ${i.title}\n  Descarga: ${i.downloadUrl}`).join('\n\n')}

${hasAttachments ? `Adjuntamos los archivos PDF directamente a este correo (${attachedNames.join(', ')}) para que los tengas siempre guardados.` : ''}

💡 Recomendación: Guardá el archivo PDF en tu dispositivo para tenerlo siempre a mano.

Datos del pago: ${paymentId} ${orderReference ? `| Referencia: ${orderReference}` : ''}

¿Dudas o consultas?
Instagram: @laura_purocrochet
WhatsApp: +59 9 11 6429-1026
Email: lauracrochet73@gmail.com
  `.trim();

  try {
    console.log(`[Email] Enviando correo de compra a ${cleanBuyerEmail} (${normalizedItems.length} productos, ${attachments.length} adjuntos vía ${type})...`);

    const mailOptions = {
      from,
      to: cleanBuyerEmail,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: attachments.map(a => ({
        filename: a.filename,
        path: a.path,
        contentType: a.contentType
      }))
    };

    const buyerInfo = await mailer.sendMail(mailOptions);
    console.log(`[Email] ✓ Correo enviado exitosamente a ${cleanBuyerEmail}. MessageId: ${buyerInfo.messageId}`);

    // Notificación opcional para el dueño de la tienda
    const targetOwnerEmail = (ownerEmail || process.env.OWNER_EMAIL || '').trim();
    if (targetOwnerEmail && targetOwnerEmail.includes('@') && targetOwnerEmail.toLowerCase() !== cleanBuyerEmail) {
      try {
        await mailer.sendMail({
          from,
          to: targetOwnerEmail,
          subject: `🛒 Nueva venta aprobada: ${productsSummary}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #2e7d32; margin-top: 0;">¡Nueva venta registrada en Puro Crochet! 🧶</h2>
              <p>Se acreditó un nuevo pago y se despacharon los patrones al cliente.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding: 6px 0; font-weight: bold;">Cliente:</td><td>${cleanBuyerEmail}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Productos:</td><td>${productsSummary}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Cantidad total:</td><td>${normalizedItems.length}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">ID Pago MP:</td><td>${paymentId}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Referencia:</td><td>${orderReference || '-'}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">PDFs adjuntos:</td><td>${attachedNames.join(', ') || 'Descarga por link'}</td></tr>
              </table>
            </div>
          `
        });
        console.log(`[Email] ✓ Notificación de venta enviada a la dueña (${targetOwnerEmail})`);
      } catch (ownerErr) {
        console.warn('[Email] No se pudo enviar notificación a la dueña:', ownerErr.message);
      }
    }

    return {
      success: true,
      messageId: buyerInfo.messageId,
      attachmentsCount: attachments.length
    };
  } catch (err) {
    console.error(`[Email] ✗ Error al enviar correo a ${cleanBuyerEmail}:`, err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Función para probar el envío de un correo de prueba y validar credenciales
 */
export async function testEmailConnection(toEmail) {
  const targetEmail = (toEmail || '').trim();
  if (!targetEmail || !targetEmail.includes('@')) {
    return { success: false, error: 'Email destinatario inválido' };
  }

  const transportConfig = getTransporter();
  if (!transportConfig) {
    return {
      success: false,
      error: 'No hay credenciales de correo configuradas en .env (falta GMAIL_USER y GMAIL_APP_PASSWORD)'
    };
  }

  const { mailer, fromEmail, type } = transportConfig;

  try {
    const info = await mailer.sendMail({
      from: `Puro Crochet <${fromEmail}>`,
      to: targetEmail,
      subject: '🧶 Prueba de envío exitosa - Puro Crochet',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 25px; border: 1px solid #ddd; border-radius: 12px; background: #faf9f7;">
          <h2 style="color: #2e7d32; margin-top: 0;">¡Configuración de Email Correcta! 🧶</h2>
          <p>Este es un correo de prueba enviado desde tu servidor Puro Crochet utilizando <strong>${type}</strong> (${fromEmail}).</p>
          <p>El sistema está 100% listo para entregar los patrones PDF automáticamente a cada cliente que compre en tu tienda.</p>
        </div>
      `
    });

    return {
      success: true,
      message: `Correo de prueba enviado con éxito a ${targetEmail}`,
      messageId: info.messageId
    };
  } catch (err) {
    return {
      success: false,
      error: `Error al enviar prueba: ${err.message}`
    };
  }
}
