/* Catálogo público: la fuente de verdad es Supabase, nunca localStorage. */
(function () {
  const heartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
  const cartIcon = `<svg class="icono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><line x1="12" y1="10" x2="12" y2="16"></line><line x1="9" y1="13" x2="15" y2="13"></line></svg>`;
  const priceLabel = price => Number(price) === 0 ? 'GRATIS' : `$${Number(price).toLocaleString('es-AR')}`;
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]);

  function registerForModal(product) {
    const data = { nombre: product.title.toUpperCase(), precio: priceLabel(product.price), stock: Number(product.price) === 0 ? 'Descarga gratuita inmediata' : 'Entrega inmediata vía Email (PDF descargable)', fotos: [product.image_portada, product.image_detalle].filter(Boolean), especificaciones: [], descripcion: product.description || '' };
    if (window.PRODUCTOS_DATA) window.PRODUCTOS_DATA[product.id] = data;
    if (window.PRODUCTOS_GUIAS_DATA) window.PRODUCTOS_GUIAS_DATA[product.id] = data;
    if (window.PRODUCTOS_GRATIS_DATA) window.PRODUCTOS_GRATIS_DATA[product.id] = data;
  }

  function createCard(product) {
    registerForModal(product);
    const card = document.createElement('article');
    card.className = 'tarjeta-producto'; card.dataset.id = product.id;
    card.innerHTML = `<div class="contenedor-imagen"><a href="#" class="enlace-detalle-producto"><img src="${escapeHtml(product.image_portada)}" alt="${escapeHtml(product.title)}"></a><button class="boton-favorito" aria-label="Añadir a favoritos">${heartIcon}</button></div><div class="info-producto"><div class="detalles-texto"><h3 class="nombre-producto"><a href="#" class="enlace-detalle-producto">${escapeHtml(product.title).toUpperCase()}</a></h3><p class="precio-producto">${priceLabel(product.price)}</p></div><button class="boton-agregar-rapido" aria-label="Añadir directo al carrito">${cartIcon}</button></div>`;
    const openModal = event => { event.preventDefault(); if (typeof window.abrirModalProducto === 'function') window.abrirModalProducto(product.id); else if (typeof window.abrirModal === 'function') window.abrirModal(product.id); };
    card.querySelectorAll('.enlace-detalle-producto, .contenedor-imagen img').forEach(el => el.addEventListener('click', openModal));
    card.querySelector('.boton-agregar-rapido').addEventListener('click', event => { event.stopPropagation(); window.agregarAlCarrito?.(product.id, product.title, 1, event.currentTarget, { price: product.price, image: product.image_portada }); });
    card.querySelector('.boton-favorito').addEventListener('click', event => { event.stopPropagation(); event.currentTarget.classList.toggle('activo'); });
    return card;
  }

  async function loadCatalog() {
    const section = document.body.dataset.productsSection;
    const grid = document.querySelector('[data-products-grid]');
    if (!section || !grid) return;
    grid.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(`/api/products?section=${encodeURIComponent(section)}`);
      if (!response.ok) throw new Error('No se pudo cargar el catálogo');
      const products = await response.json();
      grid.replaceChildren();
      products.forEach(product => grid.appendChild(createCard(product)));
      if (!products.length) grid.innerHTML = '<p class="catalogo-vacio">Próximamente habrá nuevos patrones por acá.</p>';
    } catch (error) {
      console.warn('Catálogo no disponible:', error.message);
      grid.innerHTML = '<p class="catalogo-vacio">No pudimos cargar los patrones. Intentá nuevamente en unos minutos.</p>';
    } finally { grid.removeAttribute('aria-busy'); }
  }
  document.addEventListener('DOMContentLoaded', loadCatalog);
})();
