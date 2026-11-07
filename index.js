/**
 * Puro Crochet - Lógica de Página de Inicio e Interacción de Productos
 */
(() => {
  'use strict';

  const PRODUCTOS_DATA = {
    'poncho-luz': {
      nombre: 'PATRÓN PONCHO LUZ',
      precio: '$15.000',
      stock: 'Stock disponible',
      fotos: ['poncho-luz-portada.jpg', 'poncho-luz-detalle.jgp.jpeg'],
      especificaciones: [
        { label: 'Material', valor: 'Lana en grosor intermedio' },
        { label: 'Talle', valor: 'Personalizado' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Un poncho luminoso, delicado y super calentito para acompañarte en tus días de otoño e invierno.'
    },
    'ruana-abrazo': {
      nombre: 'PATRÓN RUANA ABRAZO',
      precio: '$20.000',
      stock: 'Stock disponible',
      fotos: ['ruana-abrazo-portada.jpg', 'ruana-abrazo-detalle.jpg'],
      especificaciones: [
        { label: 'Material', valor: 'Hilado de algodón grosor fino' },
        { label: 'Talle', valor: 'Único' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Una prenda cómoda, versátil y perfecta para acompañarte en cualquier momento.\nCon ese toque artesanal que la hace única.'
    },
    'cardigan-abrazo': {
      nombre: 'PATRÓN CÁRDIGAN ABRAZO',
      precio: '$25.000',
      stock: 'Stock disponible',
      fotos: ['cardigan-abrazo-portada.jpg', 'cardigan-abrazo-detalle.jpg'],
      especificaciones: [
        { label: 'Material', valor: 'Hilado de algodón grosor fino' },
        { label: 'Talle', valor: 'Personalizado' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Es un diseño cómodo, suave y pensado para usar todos los días, de esos que no te querés sacar.'
    },
    'chaleco-abrazo': {
      nombre: 'CHALECO ABRAZO',
      precio: '$15.000',
      stock: 'Stock disponible',
      fotos: ['chaleco-abrazo-portada.jpg', 'chaleco-abrazo-detalle.jpg'],
      especificaciones: [
        { label: 'Material', valor: 'Lana con brillo papayta grosor intermedio' },
        { label: 'Talle', valor: 'Personalizado' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Este chaleco lo pensé para usar sin vueltas: con jean, con algo más arreglado o simplemente para estar cómoda y linda al mismo tiempo.'
    },
    'bufanda-capucha-abrazo': {
      nombre: 'BUFANDA CON CAPUCHA ABRAZO',
      precio: '$12.000',
      stock: 'Stock disponible',
      fotos: ['bufanda-capucha-abrazo-portada.jpg', 'bufanda-capucha-abrazo.jpg'],
      especificaciones: [
        { label: 'Material', valor: 'Lana nevilan' },
        { label: 'Talle', valor: 'Personalizado' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Práctica, versátil y con ese toque especial de lo hecho a mano.'
    },
    'poncho-abrazo': {
      nombre: 'PONCHO ABRAZO',
      precio: '$20.000',
      stock: 'Stock disponible',
      fotos: ['poncho-abrazo-portada.jpg', 'poncho-abrazo-detalle.jgp'],
      especificaciones: [
        { label: 'Material', valor: 'Lana nevilan o cualquier lana de grosor intermedio' },
        { label: 'Talle', valor: 'Personalizado' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Este poncho nació granny por granny para crear algo lindo y abrigado para tejer paso a paso.'
    },
    'chaleco-suave': {
      nombre: 'CHALECO ABRAZO SUAVE',
      precio: '$15.000',
      stock: 'Stock disponible',
      fotos: ['chaleco-suave-portada.jpg', 'chaleco-suave-detalle.jpg'],
      especificaciones: [
        { label: 'Material', valor: 'Lana pansy de L.H.O (260 grs)' },
        { label: 'Talle', valor: 'Único' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Es un chaleco cómodo, amplio y para utilizar en cualquier momento del día.'
    },
    'cardigan-calido': {
      nombre: 'CÁRDIGAN ABRAZO CÁLIDO',
      precio: '$20.000',
      stock: 'Stock disponible',
      fotos: ['cardigan-calido-portada.jpg', 'cardigan-calido-detalle.jpg'],
      especificaciones: [
        { label: 'Material', valor: 'Profano de L.H.O' },
        { label: 'Talle', valor: 'Personalizado' },
        { label: 'Cuidados', valor: 'Lavado a mano, no retorcer y secar sobre superficie plana' }
      ],
      descripcion: 'Es un cárdigan cómodo, versátil y pensado para acompañarte en los días frescos.'
    }
  };

  window.PRODUCTOS_DATA = PRODUCTOS_DATA;

  function initPage() {
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

    let productoActualSeleccionado = null;
    let productoActualIdSeleccionado = null;

    function abrirModalProducto(idProducto) {
      const data = PRODUCTOS_DATA[idProducto];
      if (!data || !modalOverlay) return;

      productoActualSeleccionado = data;
      productoActualIdSeleccionado = idProducto;
      if (inputCantidad) inputCantidad.value = 1;

      if (modalNombre) modalNombre.textContent = data.nombre;
      if (modalPrecio) modalPrecio.textContent = data.precio;
      if (modalStock) modalStock.textContent = data.stock;
      if (modalDescripcion) modalDescripcion.textContent = data.descripcion;

      if (modalEspecificaciones) {
        modalEspecificaciones.innerHTML = (data.especificaciones || []).map(spec => 
          `<li><strong>${spec.label}:</strong> ${spec.valor}</li>`
        ).join('');
      }

      if (modalFotoPrincipal && data.fotos && data.fotos[0]) {
        modalFotoPrincipal.src = data.fotos[0];
      }

      if (modalMiniaturas && Array.isArray(data.fotos)) {
        modalMiniaturas.innerHTML = '';
        data.fotos.forEach((foto, index) => {
          const item = document.createElement('div');
          item.className = `miniatura-item ${index === 0 ? 'activo' : ''}`;
          const img = document.createElement('img');
          img.src = foto;
          img.alt = `${data.nombre} foto ${index + 1}`;
          img.onerror = function() { this.src = data.fotos[0]; };
          item.appendChild(img);

          item.addEventListener('click', () => {
            document.querySelectorAll('.miniatura-item').forEach(m => m.classList.remove('activo'));
            item.classList.add('activo');
            if (modalFotoPrincipal) modalFotoPrincipal.src = img.src;
          });

          modalMiniaturas.appendChild(item);
        });
      }

      modalOverlay.classList.add('activo');
      document.body.style.overflow = 'hidden';
    }

    window.abrirModalProducto = abrirModalProducto;

    function cerrarModal() {
      if (modalOverlay) modalOverlay.classList.remove('activo');
      document.body.style.overflow = 'auto';
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay?.classList.contains('activo')) cerrarModal();
    });

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

    // Eventos para abrir modal en tarjetas estáticas
    document.querySelectorAll('.tarjeta-producto').forEach(tarjeta => {
      const id = tarjeta.getAttribute('data-id');
      const enlaces = tarjeta.querySelectorAll('.enlace-detalle-producto, .contenedor-imagen img');
      enlaces.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
          e.preventDefault();
          abrirModalProducto(id);
        });
      });
    });

    if (btnModalAgregarCarrito) {
      btnModalAgregarCarrito.addEventListener('click', (e) => {
        const cant = parseInt(inputCantidad?.value) || 1;
        if (window.agregarAlCarrito && productoActualIdSeleccionado) {
          window.agregarAlCarrito(productoActualIdSeleccionado, productoActualSeleccionado?.nombre, cant, e.currentTarget);
        }
        cerrarModal();
      });
    }

    if (btnComprarAhora) {
      btnComprarAhora.addEventListener('click', () => {
        const cant = parseInt(inputCantidad?.value) || 1;
        if (window.iniciarCompraProducto && productoActualIdSeleccionado) {
          window.iniciarCompraProducto(productoActualIdSeleccionado, productoActualSeleccionado?.nombre, cant);
        }
      });
    }

    // Botones de agregar rápido en la grilla
    document.querySelectorAll('.boton-agregar-rapido').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const tarjeta = button.closest('.tarjeta-producto');
        const id = tarjeta?.getAttribute('data-id');
        const nombre = tarjeta?.querySelector('.nombre-producto')?.textContent.trim();
        if (window.agregarAlCarrito && id) {
          window.agregarAlCarrito(id, nombre, 1, button);
        }
      });
    });

    // Botones de favoritos
    document.querySelectorAll('.boton-favorito').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        button.classList.toggle('activo');
      });
    });

    // Buscador
    const botonLupa = document.getElementById('boton-lupa');
    const cajaBusqueda = document.getElementById('caja-busqueda');
    const inputBuscar = document.getElementById('input-buscar');

    if (botonLupa && cajaBusqueda) {
      botonLupa.addEventListener('click', (e) => {
        e.stopPropagation();
        cajaBusqueda.classList.toggle('activo');
        if (cajaBusqueda.classList.contains('activo') && inputBuscar) {
          inputBuscar.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (!cajaBusqueda.contains(e.target) && e.target !== botonLupa && !botonLupa.contains(e.target)) {
          cajaBusqueda.classList.remove('activo');
        }
      });
    }

    if (inputBuscar) {
      inputBuscar.addEventListener('input', (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.tarjeta-producto').forEach(tarjeta => {
          const nombreProducto = tarjeta.querySelector('.nombre-producto')?.textContent.toLowerCase() || '';
          tarjeta.style.display = nombreProducto.includes(textoBusqueda) ? 'block' : 'none';
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
