/**
 * Puro Crochet - Lógica de Patrones Gratis
 */
(() => {
  'use strict';

  const PRODUCTOS_GRATIS_DATA = {
    'gratis-pareo': {
      nombre: 'PATRÓN PAREO',
      precio: '$0 (GRATIS)',
      stock: 'Descarga gratuita inmediata',
      fotos: ['Pareo foto9.jpeg', 'Pareo foto8.jpeg'],
      especificaciones: [
        { label: 'Formato', valor: 'PDF digital descargable' },
        { label: 'Nivel', valor: 'Principiante / Intermedio' },
        { label: 'Precio', valor: '$0 (Gratis)' }
      ],
      descripcion: 'Un hermoso patrón para tejer tu propio pareo calado paso a paso con explicaciones detalladas y fotos guía.'
    },
    'gratis-cuellito': {
      nombre: 'PATRÓN CUELLITO',
      precio: '$0 (GRATIS)',
      stock: 'Descarga gratuita inmediata',
      fotos: ['cuellito Abrazo foto2.jpeg', 'cuellito Abrazo foto1.jpeg'],
      especificaciones: [
        { label: 'Formato', valor: 'PDF digital descargable' },
        { label: 'Nivel', valor: 'Fácil / Rápido de tejer' },
        { label: 'Precio', valor: '$0 (Gratis)' }
      ],
      descripcion: 'Un patrón express super abrigado y fácil para tejer un cuellito acogedor en tus tardes de tejido.'
    }
  };

  window.PRODUCTOS_GRATIS_DATA = PRODUCTOS_GRATIS_DATA;

  function initGratis() {
    const modalOverlay = document.getElementById('modal-producto-overlay');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const modalFotoPrincipal = document.getElementById('modal-foto-principal');
    const modalMiniaturas = document.getElementById('modal-miniaturas');
    const modalNombre = document.getElementById('modal-nombre');
    const modalPrecio = document.getElementById('modal-precio');
    const modalStock = document.getElementById('modal-stock');
    const modalEspecificaciones = document.getElementById('modal-especificaciones');
    const modalDescripcion = document.getElementById('modal-descripcion');
    const inputCantidad = document.getElementById('modal-input-cantidad');
    const btnMenosCant = document.getElementById('btn-menos-cant');
    const btnMasCant = document.getElementById('btn-mas-cant');
    const btnComprarAhora = document.getElementById('btn-comprar-ahora');
    const btnModalAgregarCarrito = document.getElementById('btn-modal-agregar-carrito');

    let prodSeleccionado = null;
    let prodIdSeleccionado = null;

    function abrirModal(id) {
      const data = PRODUCTOS_GRATIS_DATA[id];
      if (!data || !modalOverlay) return;

      prodSeleccionado = data;
      prodIdSeleccionado = id;
      if (inputCantidad) inputCantidad.value = 1;

      if (modalNombre) modalNombre.textContent = data.nombre;
      if (modalPrecio) modalPrecio.textContent = data.precio;
      if (modalStock) modalStock.textContent = data.stock;
      if (modalDescripcion) modalDescripcion.textContent = data.descripcion;

      if (modalEspecificaciones) {
        modalEspecificaciones.innerHTML = (data.especificaciones || []).map(s => 
          `<li><strong>${s.label}:</strong> ${s.valor}</li>`
        ).join('');
      }

      if (modalFotoPrincipal && data.fotos && data.fotos[0]) {
        modalFotoPrincipal.src = data.fotos[0];
      }

      if (modalMiniaturas && Array.isArray(data.fotos)) {
        modalMiniaturas.innerHTML = '';
        data.fotos.forEach((f, idx) => {
          const item = document.createElement('div');
          item.className = `miniatura-item ${idx === 0 ? 'activo' : ''}`;
          const img = document.createElement('img');
          img.src = f;
          item.appendChild(img);
          item.addEventListener('click', () => {
            document.querySelectorAll('.miniatura-item').forEach(m => m.classList.remove('activo'));
            item.classList.add('activo');
            if (modalFotoPrincipal) modalFotoPrincipal.src = f;
          });
          modalMiniaturas.appendChild(item);
        });
      }

      modalOverlay.classList.add('activo');
      document.body.style.overflow = 'hidden';
    }

    window.abrirModal = abrirModal;

    function cerrarModal() {
      if (modalOverlay) modalOverlay.classList.remove('activo');
      document.body.style.overflow = '';
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
      });
    }

    if (btnMenosCant && inputCantidad) {
      btnMenosCant.addEventListener('click', () => {
        let val = parseInt(inputCantidad.value) || 1;
        if (val > 1) inputCantidad.value = val - 1;
      });
    }

    if (btnMasCant && inputCantidad) {
      btnMasCant.addEventListener('click', () => {
        let val = parseInt(inputCantidad.value) || 1;
        inputCantidad.value = val + 1;
      });
    }

    function bindProductEvents() {
      document.querySelectorAll('.tarjeta-producto').forEach(tarjeta => {
        const id = tarjeta.getAttribute('data-id');
        const enlaces = tarjeta.querySelectorAll('.enlace-detalle-producto, .contenedor-imagen img');
        enlaces.forEach(enlace => {
          enlace.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModal(id);
          });
        });
      });

      document.querySelectorAll('.boton-agregar-rapido').forEach((boton) => {
        boton.addEventListener('click', (e) => {
          e.stopPropagation();
          const tarjeta = boton.closest('.tarjeta-producto');
          const nombre = tarjeta?.querySelector('.nombre-producto')?.textContent.trim();
          if (window.agregarAlCarrito && tarjeta?.dataset.id) {
            window.agregarAlCarrito(tarjeta.dataset.id, nombre, 1, boton);
          }
        });
      });

      document.querySelectorAll('.boton-favorito').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          btn.classList.toggle('activo');
        });
      });
    }

    if (btnModalAgregarCarrito) {
      btnModalAgregarCarrito.addEventListener('click', (e) => {
        const cant = parseInt(inputCantidad?.value) || 1;
        if (window.agregarAlCarrito && prodIdSeleccionado && prodSeleccionado) {
          window.agregarAlCarrito(prodIdSeleccionado, prodSeleccionado.nombre, cant, e.currentTarget);
        }
        cerrarModal();
      });
    }

    if (btnComprarAhora) {
      btnComprarAhora.addEventListener('click', (e) => {
        const cant = parseInt(inputCantidad?.value) || 1;
        if (window.iniciarCompraProducto && prodIdSeleccionado && prodSeleccionado) {
          window.iniciarCompraProducto(prodIdSeleccionado, prodSeleccionado.nombre, cant);
        } else if (window.agregarAlCarrito && prodIdSeleccionado && prodSeleccionado) {
          window.agregarAlCarrito(prodIdSeleccionado, prodSeleccionado.nombre, cant, e.currentTarget);
          if (window.puroCrochetCart) window.puroCrochetCart.openCartDrawer();
        }
        cerrarModal();
      });
    }

    bindProductEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGratis);
  } else {
    initGratis();
  }
})();
