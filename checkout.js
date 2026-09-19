/**
 * Puro Crochet - Modal de Checkout & Integración Mercado Pago
 * Diseño visual moderno, cálido y artesanal.
 */
(() => {
  'use strict';

  const PRODUCT_IMAGES = {
    'ruana-abrazo': 'ruana-abrazo-portada.jpg',
    'guia-ruana-abrazo': 'ruana-abrazo-portada.jpg',
    'cardigan-abrazo': 'cardigan-abrazo-portada.jpg',
    'guia-cardigan-abrazo': 'cardigan-abrazo-portada.jpg',
    'chaleco-abrazo': 'chaleco-abrazo-portada.jpg',
    'guia-chaleco-abrazo': 'chaleco-abrazo-portada.jpg',
    'bufanda-capucha-abrazo': 'bufanda-capucha-abrazo-portada.jpg',
    'guia-bufanda-capucha': 'bufanda-capucha-abrazo-portada.jpg',
    'poncho-abrazo': 'poncho-abrazo-portada.jpg',
    'guia-poncho-abrazo': 'poncho-abrazo-portada.jpg',
    'poncho-luz': 'poncho-luz-portada.jpg',
    'guia-poncho-luz': 'poncho-luz-portada.jpg',
    'chaleco-suave': 'chaleco-suave-portada.jpg',
    'guia-chaleco-suave': 'chaleco-suave-portada.jpg',
    'cardigan-calido': 'cardigan-calido-portada.jpg',
    'guia-cardigan-calido': 'cardigan-calido-portada.jpg',
    'guia-medias': 'medias-portada.jpg',
    'pareo-alma': 'pareo-alma-portada.jpg',
    'bolso-fiume': 'bolso-fiume-portada.jpg',
    'gratis-pareo': 'pareo-alma-portada.jpg',
    'gratis-cuellito': 'bufanda-capucha-abrazo-portada.jpg'
  };

  const PRODUCT_PRICES = {
    'ruana-abrazo': 20000,
    'guia-ruana-abrazo': 20000,
    'cardigan-abrazo': 25000,
    'guia-cardigan-abrazo': 25000,
    'chaleco-abrazo': 15000,
    'guia-chaleco-abrazo': 15000,
    'bufanda-capucha-abrazo': 12000,
    'guia-bufanda-capucha': 12000,
    'poncho-abrazo': 20000,
    'guia-poncho-abrazo': 20000,
    'poncho-luz': 20000,
    'guia-poncho-luz': 20000,
    'chaleco-suave': 15000,
    'guia-chaleco-suave': 15000,
    'cardigan-calido': 20000,
    'guia-cardigan-calido': 20000,
    'guia-medias': 8000,
    'pareo-alma': 18000,
    'bolso-fiume': 12000,
    'gratis-pareo': 0,
    'gratis-cuellito': 0
  };

  function formatPrice(num) {
    if (Number(num) === 0) return 'GRATIS ($0)';
    return '$' + (Number(num) || 0).toLocaleString('es-AR');
  }

  let dialog = null;
  let currentPurchase = null;

  function closeDialog() {
    if (dialog) dialog.classList.remove('visible');
    currentPurchase = null;
  }

  function ensureCheckoutModal() {
    if (dialog && document.body && (typeof document.body.contains === 'function' ? document.body.contains(dialog) : true)) {
      return dialog;
    }

    let existing = document.getElementById('checkout-modal-overlay');
    if (existing) {
      dialog = existing;
      return dialog;
    }

    if (!document.body) return null;

    dialog = document.createElement('div');
    dialog.id = 'checkout-modal-overlay';
    dialog.className = 'checkout-overlay';
    dialog.innerHTML = `
      <section class="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <!-- Botón cerrar -->
        <button type="button" class="checkout-close" id="btn-cerrar-checkout-modal" aria-label="Cerrar modal">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Encabezado del modal -->
        <div class="checkout-header">
          <div class="checkout-brand-badge">
            <span class="checkout-badge-icon">🧶</span>
            <span>Puro Crochet • Tienda Oficial</span>
          </div>
          <h2 id="checkout-title" class="checkout-heading">Finalizar tu compra</h2>
          <p class="checkout-subtitle">Recibí tus patrones de tejido en PDF de forma instantánea.</p>
        </div>

        <!-- Resumen de Pedido -->
        <div class="checkout-summary-card">
          <div class="checkout-summary-header">
            <span class="checkout-summary-title">Resumen de tu pedido</span>
            <span class="checkout-digital-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              PDF Descargable
            </span>
          </div>

          <div id="checkout-items-list" class="checkout-items-list">
            <!-- Inyectado dinámicamente -->
          </div>

          <div class="checkout-divider"></div>

          <div class="checkout-total-row">
            <span class="checkout-total-label">Total a pagar:</span>
            <span id="checkout-total-val" class="checkout-total-val">$0</span>
          </div>
        </div>

        <!-- Formulario de Email -->
        <div class="checkout-form-group">
          <label for="checkout-email" class="checkout-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            ¿Dónde querés recibir tus patrones?
          </label>
          <div class="checkout-input-wrapper">
            <input id="checkout-email" class="checkout-input" type="email" autocomplete="email" placeholder="tu-email@ejemplo.com" required>
          </div>
          <div class="checkout-instant-delivery-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span><strong>Entrega instantánea:</strong> El archivo PDF se enviará a este email ni bien se acredite el pago.</span>
          </div>
        </div>

        <!-- Botón de Pago con Mercado Pago -->
        <button type="button" id="checkout-pay" class="pc-btn-mp-pay">
          <svg class="mp-logo-svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
          </svg>
          <span id="checkout-pay-text">Ir a pagar con Mercado Pago</span>
          <svg class="mp-arrow-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <!-- Mensaje de Error -->
        <div id="checkout-error" class="checkout-error-box" role="alert" style="display: none;"></div>

        <!-- Sellos de Confianza y Métodos de Pago -->
        <div class="checkout-trust-footer">
          <div class="checkout-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#009ee3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Pago Seguro SSL</span>
          </div>
          <div class="checkout-trust-dot">•</div>
          <div class="checkout-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#009ee3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <span>Tarjetas, Débito o Transferencia</span>
          </div>
          <div class="checkout-trust-dot">•</div>
          <div class="checkout-trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Garantía Puro Crochet</span>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('#btn-cerrar-checkout-modal')) {
        closeDialog();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dialog.classList.contains('visible')) {
        closeDialog();
      }
    });

    const payButton = dialog.querySelector('#checkout-pay');
    if (payButton) {
      payButton.addEventListener('click', handlePayment);
    }

    return dialog;
  }

  // Renderizar la lista de ítems dentro del modal
  function renderCheckoutSummary(purchase) {
    ensureCheckoutModal();
    if (!dialog) return;

    const listContainer = dialog.querySelector('#checkout-items-list');
    const totalEl = dialog.querySelector('#checkout-total-val');
    const payText = dialog.querySelector('#checkout-pay-text');
    if (!listContainer) return;

    let itemsToRender = [];
    let totalPrice = 0;

    if (Array.isArray(purchase.items) && purchase.items.length > 0) {
      itemsToRender = purchase.items;
      totalPrice = itemsToRender.reduce((sum, item) => {
        const itemPrice = (item.id in PRODUCT_PRICES) ? PRODUCT_PRICES[item.id] : (item.price || 0);
        return sum + (itemPrice * (item.quantity || 1));
      }, 0);
    } else {
      const price = (purchase.productId in PRODUCT_PRICES) ? PRODUCT_PRICES[purchase.productId] : 20000;
      const qty = Number(purchase.quantity) || 1;
      const img = PRODUCT_IMAGES[purchase.productId] || 'banner.jpg';
      itemsToRender = [{
        id: purchase.productId,
        title: purchase.title || 'Patrón de Crochet en PDF',
        price: price,
        quantity: qty,
        img: img
      }];
      totalPrice = price * qty;
    }

    let html = '';
    itemsToRender.forEach(item => {
      const itemPrice = (item.id in PRODUCT_PRICES) ? PRODUCT_PRICES[item.id] : (item.price || 0);
      const itemImg = item.img || PRODUCT_IMAGES[item.id] || 'banner.jpg';
      const itemTotal = itemPrice * (item.quantity || 1);

      html += `
        <div class="checkout-item-row">
          <img src="${itemImg}" alt="${item.title}" class="checkout-item-thumb" onerror="this.src='banner.jpg'">
          <div class="checkout-item-info">
            <span class="checkout-item-title">${item.title}</span>
            <div class="checkout-item-meta">
              <span class="checkout-item-qty">Cant: ${item.quantity}</span>
              <span class="checkout-item-price">${formatPrice(itemTotal)}</span>
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
    if (totalEl) totalEl.textContent = formatPrice(totalPrice);
    if (payText) {
      if (totalPrice === 0) {
        payText.textContent = 'Descargar Patrón Gratis';
      } else {
        payText.textContent = `Pagar ${formatPrice(totalPrice)} con Mercado Pago`;
      }
    }
  }

  // Iniciar compra (Global)
  window.iniciarCompraProducto = (productId, title, quantity = 1, cartItems = null) => {
    ensureCheckoutModal();
    if (!dialog) return;

    currentPurchase = {
      productId,
      title,
      quantity: Number(quantity) || 1,
      items: Array.isArray(cartItems) ? cartItems : null
    };

    const emailInput = dialog.querySelector('#checkout-email');
    const errorEl = dialog.querySelector('#checkout-error');

    if (emailInput) emailInput.value = '';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    renderCheckoutSummary(currentPurchase);

    dialog.classList.add('visible');
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 150);
    }
  };

  window.iniciarCompraCarrito = (cartItems) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;
    const title = cartItems.map(i => `${i.title} (x${i.quantity})`).join(', ');
    window.iniciarCompraProducto('multiple', title, 1, cartItems);
  };

  // Enviar a Mercado Pago
  async function handlePayment() {
    if (!dialog) return;
    const emailInput = dialog.querySelector('#checkout-email');
    const errorEl = dialog.querySelector('#checkout-error');
    const payText = dialog.querySelector('#checkout-pay-text');
    const payButton = dialog.querySelector('#checkout-pay');
    const email = (emailInput?.value || '').trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      if (errorEl) {
        errorEl.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Por favor ingresá un correo electrónico válido para enviarte el patrón.</span>
        `;
        errorEl.style.display = 'flex';
      }
      if (emailInput) emailInput.focus();
      return;
    }

    if (payButton) {
      payButton.disabled = true;
      payButton.classList.add('loading');
    }
    if (payText) payText.textContent = 'Conectando con Mercado Pago seguro…';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    try {
      const payload = {
        productId: currentPurchase?.productId,
        quantity: currentPurchase?.quantity || 1,
        items: currentPurchase?.items,
        email: email
      };

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'No pudimos generar el enlace seguro de Mercado Pago. Por favor intentá nuevamente.');
      }

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      console.error('Error al procesar checkout:', err);
      if (errorEl) {
        errorEl.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>${err.message || 'Ocurrió un inconveniente al conectar con Mercado Pago. Probá de nuevo en unos instantes.'}</span>
        `;
        errorEl.style.display = 'flex';
      }
      if (payButton) {
        payButton.disabled = false;
        payButton.classList.remove('loading');
      }
      renderCheckoutSummary(currentPurchase);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCheckoutModal);
  } else {
    ensureCheckoutModal();
  }

})();
