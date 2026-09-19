/**
 * Puro Crochet - Cart & Animation Manager
 * Manejo del carrito de compras, persistencia en localStorage y animación artesanal de ovillo de lana.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'purocrochet_cart_v1';
    const LEGACY_STORAGE_KEY = 'puro_crochet_cart_v1';

    // Base de datos de imágenes de productos para miniaturas del carrito
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

    // Funciones de almacenamiento seguras
    function getCart() {
        try {
            const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error leyendo carrito:', e);
            return [];
        }
    }

    function saveCart(cart) {
        try {
            if (!Array.isArray(cart)) cart = [];
            const str = JSON.stringify(cart);
            localStorage.setItem(STORAGE_KEY, str);
            localStorage.setItem(LEGACY_STORAGE_KEY, str);
            updateCartBadges(true);
            renderCartDrawer();
        } catch (e) {
            console.error('Error guardando carrito:', e);
        }
    }

    function getTotalCount() {
        const cart = getCart();
        return cart.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 1), 0);
    }

    function getTotalPrice() {
        const cart = getCart();
        return cart.reduce((acc, item) => {
            const price = (typeof item.price === 'number') ? item.price : ((item.id in PRODUCT_PRICES) ? PRODUCT_PRICES[item.id] : 0);
            return acc + (price * (parseInt(item.quantity, 10) || 1));
        }, 0);
    }

    function formatCurrency(num) {
        if (Number(num) === 0) return 'GRATIS ($0)';
        return '$' + (Number(num) || 0).toLocaleString('es-AR');
    }

    // Actualiza los badges de todos los íconos de carrito en la página
    function updateCartBadges(animate = false) {
        try {
            const count = getTotalCount();
            const badges = document.querySelectorAll('.contador-rojo');
            badges.forEach(badge => {
                if (!badge) return;
                badge.textContent = count;
                if (count > 0) {
                    badge.style.display = 'flex';
                }
                if (animate) {
                    badge.classList.remove('badge-pop-anim');
                    void badge.offsetWidth; // Trigger reflow
                    badge.classList.add('badge-pop-anim');
                }
            });
        } catch (e) {
            console.error('Error actualizando badges:', e);
        }
    }

    // Animación de Ovillo de Lana que vuela hacia el carrito
    function playFlyingYarnAnimation(startEl) {
        try {
            const cartIcon = document.querySelector('.carrito-contenedor');
            if (!cartIcon || !document.body) return;

            let startX = (typeof window !== 'undefined' && window.innerWidth) ? (window.innerWidth / 2) : 200;
            let startY = (typeof window !== 'undefined' && window.innerHeight) ? (window.innerHeight / 2) : 200;

            if (startEl && typeof startEl.getBoundingClientRect === 'function') {
                const startRect = startEl.getBoundingClientRect();
                if (startRect && startRect.width > 0) {
                    startX = startRect.left + (startRect.width / 2);
                    startY = startRect.top + (startRect.height / 2);
                }
            }

            const endRect = cartIcon.getBoundingClientRect();
            let endX = startX;
            let endY = startY - 100;
            if (endRect) {
                endX = endRect.left + (endRect.width / 2);
                endY = endRect.top + (endRect.height / 2);
            }

            // Crear elemento del ovillo de lana volador
            const yarn = document.createElement('div');
            yarn.className = 'flying-yarn-ball';
            yarn.innerHTML = `
                <svg viewBox="0 0 36 36" class="svg-yarn-ball">
                    <ellipse cx="18" cy="20" rx="14" ry="12" fill="#d87d60" opacity="0.4" />
                    <circle cx="18" cy="18" r="14" fill="#d87d60" />
                    <path d="M7 14 C12 8, 24 8, 29 14" stroke="#f6c2a8" stroke-width="2.5" fill="none" stroke-linecap="round" />
                    <path d="M5 19 C11 13, 25 13, 31 19" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85" />
                    <path d="M7 23 C12 28, 24 28, 29 23" stroke="#b9583b" stroke-width="2.5" fill="none" stroke-linecap="round" />
                    <path d="M12 7 C18 12, 18 24, 12 29" stroke="#f6c2a8" stroke-width="2" fill="none" stroke-linecap="round" />
                    <path d="M24 7 C18 12, 18 24, 24 29" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.75" />
                    <path d="M29 22 C34 26, 30 33, 35 34" stroke="#d87d60" stroke-width="2" fill="none" stroke-linecap="round" />
                </svg>
            `;

            document.body.appendChild(yarn);

            yarn.style.left = `${startX - 18}px`;
            yarn.style.top = `${startY - 18}px`;
            yarn.style.transform = 'scale(0.3) rotate(0deg)';
            yarn.style.opacity = '0';

            const duration = 700; // ms
            const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

            const controlX = (startX + endX) / 2 + (startX < endX ? -30 : 30);
            const controlY = Math.min(startY, endY) - 120;

            function animateYarn(currentTime) {
                const now = currentTime || ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const t = progress;
                const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                const currentX = (1 - easeT) * (1 - easeT) * startX + 2 * (1 - easeT) * easeT * controlX + easeT * easeT * endX;
                const currentY = (1 - easeT) * (1 - easeT) * startY + 2 * (1 - easeT) * easeT * controlY + easeT * easeT * endY;

                let scale = 1;
                if (progress < 0.2) {
                    scale = 0.3 + (progress / 0.2) * 0.9;
                } else if (progress > 0.8) {
                    scale = 1.2 - ((progress - 0.8) / 0.2) * 0.7;
                } else {
                    scale = 1.2;
                }

                const rotation = progress * 720;
                const opacity = progress < 0.08 ? progress / 0.08 : (progress > 0.92 ? (1 - progress) / 0.08 : 1);

                yarn.style.left = `${currentX - 18}px`;
                yarn.style.top = `${currentY - 18}px`;
                yarn.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
                yarn.style.opacity = opacity.toString();

                if (progress < 1) {
                    if (typeof requestAnimationFrame !== 'undefined') {
                        requestAnimationFrame(animateYarn);
                    } else {
                        setTimeout(() => animateYarn(Date.now()), 16);
                    }
                } else {
                    if (yarn.parentNode) yarn.parentNode.removeChild(yarn);
                    triggerCartBounce();
                }
            }

            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(animateYarn);
            } else {
                setTimeout(() => animateYarn(Date.now()), 16);
            }
        } catch (e) {
            console.error('Error in playFlyingYarnAnimation:', e);
        }
    }

    // Efecto de rebote en el ícono del carrito
    function triggerCartBounce() {
        try {
            const cartContainers = document.querySelectorAll('.carrito-contenedor');
            cartContainers.forEach(container => {
                if (!container) return;
                container.classList.remove('cart-bounce-effect');
                void container.offsetWidth;
                container.classList.add('cart-bounce-effect');
                createSparkles(container);
            });

            updateCartBadges(true);
        } catch (e) {
            console.error('Error in triggerCartBounce:', e);
        }
    }

    function createSparkles(container) {
        try {
            if (!container || typeof container.getBoundingClientRect !== 'function' || !document.body) return;
            const rect = container.getBoundingClientRect();
            for (let i = 0; i < 6; i++) {
                const spark = document.createElement('span');
                spark.className = 'yarn-sparkle';
                const angle = (i / 6) * Math.PI * 2;
                const dist = 22 + Math.random() * 12;
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist;

                spark.style.setProperty('--tx', `${tx}px`);
                spark.style.setProperty('--ty', `${ty}px`);
                spark.style.left = `${rect.left + rect.width / 2}px`;
                spark.style.top = `${rect.top + rect.height / 2}px`;

                document.body.appendChild(spark);
                setTimeout(() => {
                    if (spark.parentNode) spark.parentNode.removeChild(spark);
                }, 650);
            }
        } catch (e) {
            console.error('Error creating sparkles:', e);
        }
    }

    // Toast artesanal
    function showCrochetToast(title, imgUrl) {
        try {
            if (!document.body) return;
            let toast = document.getElementById('toast-carrito-artesanal');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast-carrito-artesanal';
                toast.className = 'notificacion-toast-artesanal';
                document.body.appendChild(toast);
            }

            const thumbHtml = imgUrl
                ? `<img src="${imgUrl}" alt="${title}" class="toast-thumb-img" onerror="this.style.display='none'">`
                : `<span class="toast-yarn-icon">🧶</span>`;

            toast.innerHTML = `
                <div class="toast-contenido">
                    ${thumbHtml}
                    <div class="toast-textos">
                        <span class="toast-tag">¡Añadido con cariño!</span>
                        <strong class="toast-titulo">${title}</strong>
                    </div>
                </div>
                <button type="button" class="toast-btn-ver" aria-label="Ver bolsa de compras">Ver bolsa</button>
            `;

            const btnVer = toast.querySelector('.toast-btn-ver');
            if (btnVer) {
                btnVer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openCartDrawer();
                    toast.classList.remove('activo');
                });
            }

            toast.classList.add('activo');

            if (toast.dismissTimeout) clearTimeout(toast.dismissTimeout);
            toast.dismissTimeout = setTimeout(() => {
                toast.classList.remove('activo');
            }, 3200);
        } catch (e) {
            console.error('Error in showCrochetToast:', e);
        }
    }

    // Agregar producto al carrito (Global)
    window.agregarAlCarrito = function (productId, productTitle, quantity = 1, sourceElement = null, options = {}) {
        try {
            quantity = parseInt(quantity, 10) || 1;
            if (quantity < 1) quantity = 1;

            let cleanTitle = (productTitle || 'Patrón de Crochet').trim();
            const price = Number.isFinite(Number(options.price)) ? Number(options.price) : ((productId in PRODUCT_PRICES) ? PRODUCT_PRICES[productId] : 20000);
            const img = options.image || PRODUCT_IMAGES[productId] || 'banner.jpg';

            const cart = getCart();
            const existingIndex = cart.findIndex(item => item.id === productId);

            if (existingIndex > -1) {
                cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity, 10) || 1) + quantity;
                if (cleanTitle) cart[existingIndex].title = cleanTitle;
                if (typeof price === 'number') cart[existingIndex].price = price;
                if (img) cart[existingIndex].img = img;
            } else {
                cart.push({
                    id: productId,
                    title: cleanTitle,
                    price: price,
                    img: img,
                    quantity: quantity
                });
            }

            saveCart(cart);

            if (sourceElement && sourceElement.classList) {
                sourceElement.classList.add('btn-item-added');
                setTimeout(() => sourceElement.classList.remove('btn-item-added'), 700);
            }

            playFlyingYarnAnimation(sourceElement);
            showCrochetToast(cleanTitle, img);
        } catch (err) {
            console.error('Error en agregarAlCarrito:', err);
        }
    };

    // Estructura del Drawer Lateral
    function injectCartDrawer() {
        if (!document.body) return;
        if (document.getElementById('pc-cart-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'pc-cart-overlay';
        overlay.className = 'pc-cart-overlay';
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('role', 'dialog');

        overlay.innerHTML = `
            <div class="pc-cart-sidebar">
                <div class="pc-cart-header">
                    <h3>Mi Bolsa de Tejido 🧶</h3>
                    <button type="button" class="pc-cart-close" id="btn-cerrar-drawer" aria-label="Cerrar bolsa">✕</button>
                </div>
                <div class="pc-cart-body" id="pc-cart-items-container"></div>
                <div class="pc-cart-footer" id="pc-cart-footer">
                    <div class="pc-cart-subtotal-row">
                        <span>Total:</span>
                        <span id="pc-cart-subtotal-val">$0</span>
                    </div>
                    <p class="pc-cart-info-envio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Descarga digital en PDF inmediata y a tu email
                    </p>
                    <button type="button" class="pc-btn-checkout" id="btn-cart-checkout">
                        Finalizar compra
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const btnCerrar = overlay.querySelector('#btn-cerrar-drawer');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', closeCartDrawer);
        }
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeCartDrawer();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('visible')) {
                closeCartDrawer();
            }
        });

        const btnCheckout = overlay.querySelector('#btn-cart-checkout');
        if (btnCheckout) {
            btnCheckout.addEventListener('click', () => {
                const cart = getCart();
                if (cart.length === 0) return;

                if (window.iniciarCompraCarrito) {
                    window.iniciarCompraCarrito(cart);
                } else if (window.iniciarCompraProducto) {
                    const primerItem = cart[0];
                    const resumenTitulos = cart.map(i => `${i.title} (x${i.quantity})`).join(', ');
                    window.iniciarCompraProducto(primerItem.id, resumenTitulos, 1, cart);
                }
                closeCartDrawer();
            });
        }
    }

    function openCartDrawer() {
        injectCartDrawer();
        const overlay = document.getElementById('pc-cart-overlay');
        if (!overlay) return;
        renderCartDrawer();
        overlay.classList.add('visible');
        if (document.body) document.body.style.overflow = 'hidden';
    }

    function closeCartDrawer() {
        const overlay = document.getElementById('pc-cart-overlay');
        if (!overlay) return;
        overlay.classList.remove('visible');
        if (document.body) document.body.style.overflow = '';
    }

    function renderCartDrawer() {
        injectCartDrawer();
        const container = document.getElementById('pc-cart-items-container');
        const footer = document.getElementById('pc-cart-footer');
        const subtotalEl = document.getElementById('pc-cart-subtotal-val');
        if (!container) return;

        const cart = getCart();

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="pc-cart-empty">
                    <div style="font-size: 48px; margin-bottom: 5px;">🧶</div>
                    <p style="font-weight: 600; color: #333; font-size: 16px;">Tu bolsa de tejido está vacía</p>
                    <p style="font-size: 13px; color: #888;">Elegí tus patrones favoritos para comenzar a tejer.</p>
                    <a href="Guias de tejido.html" class="pc-btn-ver-patrones" id="btn-drawer-ver-patrones">Ver patrones disponibles</a>
                </div>
            `;
            if (footer) footer.style.display = 'none';

            const btnVer = container.querySelector('#btn-drawer-ver-patrones');
            if (btnVer) {
                btnVer.addEventListener('click', () => closeCartDrawer());
            }
            return;
        }

        if (footer) footer.style.display = 'block';

        let html = '';
        cart.forEach((item, index) => {
            const itemPrice = (typeof item.price === 'number') ? item.price : ((item.id in PRODUCT_PRICES) ? PRODUCT_PRICES[item.id] : 0);
            const itemTotal = itemPrice * (item.quantity || 1);
            const priceDisplay = formatCurrency(itemTotal);

            html += `
                <div class="pc-cart-item" data-id="${item.id}">
                    <img src="${item.img || 'banner.jpg'}" alt="${item.title}" class="pc-cart-item-img" onerror="this.src='banner.jpg'">
                    <div class="pc-cart-item-details">
                        <h4 class="pc-cart-item-title">${item.title}</h4>
                        <div class="pc-cart-item-price">${priceDisplay}</div>
                        <div class="pc-cart-item-controls">
                            <div class="pc-cart-qty-picker">
                                <button type="button" class="pc-btn-qty" data-action="decrease" data-index="${index}" aria-label="Restar">-</button>
                                <span class="pc-qty-val">${item.quantity}</span>
                                <button type="button" class="pc-btn-qty" data-action="increase" data-index="${index}" aria-label="Sumar">+</button>
                            </div>
                            <button type="button" class="pc-btn-remove-item" data-action="remove" data-index="${index}" title="Eliminar de la bolsa" aria-label="Eliminar producto">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        if (subtotalEl) {
            subtotalEl.textContent = formatCurrency(getTotalPrice());
        }

        container.querySelectorAll('.pc-btn-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                const currentCart = getCart();
                if (!currentCart[idx]) return;
                if (action === 'increase') {
                    currentCart[idx].quantity += 1;
                } else if (action === 'decrease') {
                    if (currentCart[idx].quantity > 1) {
                        currentCart[idx].quantity -= 1;
                    } else {
                        currentCart.splice(idx, 1);
                    }
                }
                saveCart(currentCart);
            });
        });

        container.querySelectorAll('.pc-btn-remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                const currentCart = getCart();
                if (!currentCart[idx]) return;
                currentCart.splice(idx, 1);
                saveCart(currentCart);
            });
        });
    }

    // Inicialización al cargar la página
    function init() {
        injectCartDrawer();
        updateCartBadges(false);

        document.querySelectorAll('.carrito-contenedor').forEach(cartIcon => {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                openCartDrawer();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API Global
    window.puroCrochetCart = {
        getCart,
        saveCart,
        getTotalCount,
        getTotalPrice,
        openCartDrawer,
        closeCartDrawer,
        playFlyingYarnAnimation,
        triggerCartBounce
    };

})();
