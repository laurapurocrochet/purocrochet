import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN || '';
  return new MercadoPagoConfig({ accessToken: token });
}

export async function createCheckoutPreference({ items, payerEmail, externalReference, siteUrl, mode }) {
  const client = getClient();
  const preference = new Preference(client);

  const site = (siteUrl || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const backUrl = `${site}/gracias.html?order=${encodeURIComponent(externalReference)}`;
  const isLocalhost = site.includes('localhost') || site.includes('127.0.0.1');

  const body = {
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price),
      currency_id: 'ARS'
    })),
    payer: {
      email: payerEmail
    },
    external_reference: externalReference,
    back_urls: {
      success: backUrl,
      pending: backUrl,
      failure: backUrl
    }
  };

  // auto_return and notification_url are only supported by MP on public URLs
  if (!isLocalhost) {
    body.auto_return = 'approved';
    body.notification_url = `${site}/api/webhooks/mercadopago`;
  }

  const response = await preference.create({ body });
  const isTest = (mode || process.env.MP_MODE) === 'test';
  const checkoutUrl = isTest && response.sandbox_init_point ? response.sandbox_init_point : response.init_point;

  return {
    id: response.id,
    checkoutUrl: checkoutUrl || response.init_point
  };
}

export async function getPayment(paymentId) {
  const client = getClient();
  const payment = new Payment(client);
  const result = await payment.get({ id: paymentId });
  return result;
}
