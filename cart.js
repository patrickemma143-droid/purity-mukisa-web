/* ============================================================
   PURITY MUKISA — Shared Cart Logic
   Persists across pages via localStorage.
============================================================ */
(function(){
  'use strict';

  const STORAGE_KEY = 'purity_mukisa_cart_v1';
  const WHATSAPP_NUMBER = '256771492492';

  // ---- Cart state ----
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch(e){}
    notifyChange();
  }
  function clearCart() { saveCart([]); }

  function getCart() { return loadCart(); }

  function addItem(item) {
    const cart = loadCart();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty += (item.qty || 1);
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,          // numeric, in UGX
        priceLabel: item.priceLabel, // display string
        emoji: item.emoji || '🎵',
        gradient: item.gradient || 'linear-gradient(135deg,var(--terra),var(--amber))',
        qty: item.qty || 1,
      });
    }
    saveCart(cart);
  }

  function updateQty(id, qty) {
    const cart = loadCart();
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, qty);
    saveCart(cart);
  }

  function removeItem(id) {
    const cart = loadCart().filter(i => i.id !== id);
    saveCart(cart);
  }

  function getCount() {
    return loadCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function getTotal() {
    return loadCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
  }

  function formatUGX(n) {
    if (n >= 1000) return 'UGX ' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
    return 'UGX ' + n;
  }

  // ---- Cart count badge sync (any element with .cart-count-badge) ----
  function updateBadges() {
    const count = getCount();
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = count;
      el.classList.toggle('empty', count === 0);
    });
  }

  // ---- Drawer rendering ----
  function renderDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');
    if (!body) return;

    const cart = loadCart();

    if (cart.length === 0) {
      body.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛍️</div><h4>Your cart is empty</h4><p style="font-size:13px;margin-top:8px;">Browse the store and add something beautiful.</p></div>';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    body.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${escapeHtml(item.id)}">
        <div class="cart-item-img" style="background:${item.gradient};">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">${formatUGX(item.price)} each</div>
          <div class="cart-qty-row">
            <button class="cart-qty-btn" onclick="CartUI.dec('${escapeJs(item.id)}')" aria-label="Decrease">−</button>
            <span class="cart-qty-display">${item.qty}</span>
            <button class="cart-qty-btn" onclick="CartUI.inc('${escapeJs(item.id)}')" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="CartUI.remove('${escapeJs(item.id)}')" aria-label="Remove">✕</button>
      </div>
    `).join('');

    const total = getTotal();
    const totalEl = document.getElementById('cartDrawerTotal');
    if (totalEl) totalEl.textContent = formatUGX(total);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeJs(s) {
    return String(s).replace(/'/g, "\\'");
  }

  // ---- Drawer open/close ----
  function openDrawer() {
    const d = document.getElementById('cartDrawer');
    const o = document.getElementById('cartOverlay');
    if (!d || !o) return;
    renderDrawer();
    d.classList.add('open');
    o.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    const d = document.getElementById('cartDrawer');
    const o = document.getElementById('cartOverlay');
    if (d) d.classList.remove('open');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
  }

  function notifyChange() {
    updateBadges();
    if (document.getElementById('cartDrawer') && document.getElementById('cartDrawer').classList.contains('open')) {
      renderDrawer();
    }
  }

  // ---- WhatsApp message generator ----
  function buildOrderMessage(customer, paymentMethod, orderId) {
    const cart = loadCart();
    if (cart.length === 0) return '';
    const lines = [];
    lines.push(`*New Order — ${orderId}*`);
    lines.push('');
    lines.push('*Items:*');
    cart.forEach(it => {
      lines.push(`• ${it.name} × ${it.qty} — ${formatUGX(it.price * it.qty)}`);
    });
    lines.push('');
    lines.push(`*Total: ${formatUGX(getTotal())}*`);
    lines.push('');
    lines.push(`*Payment method:* ${paymentMethod}`);
    if (customer) {
      lines.push('');
      lines.push('*Delivery details:*');
      if (customer.name)    lines.push(`Name: ${customer.name}`);
      if (customer.phone)   lines.push(`Phone: ${customer.phone}`);
      if (customer.email)   lines.push(`Email: ${customer.email}`);
      if (customer.address) lines.push(`Address: ${customer.address}`);
      if (customer.notes)   lines.push(`Notes: ${customer.notes}`);
    }
    return encodeURIComponent(lines.join('\n'));
  }

  function generateOrderId() {
    const yr = new Date().getFullYear();
    const code = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PM-${yr}-${code}`;
  }

  // ---- Public API ----
  window.Cart = {
    add: addItem,
    remove: removeItem,
    updateQty: updateQty,
    clear: clearCart,
    items: getCart,
    count: getCount,
    total: getTotal,
    formatUGX: formatUGX,
    whatsappNumber: WHATSAPP_NUMBER,
    buildOrderMessage: buildOrderMessage,
    generateOrderId: generateOrderId,
  };
  window.CartUI = {
    open: openDrawer,
    close: closeDrawer,
    render: renderDrawer,
    inc: function(id){ const it = loadCart().find(i => i.id === id); if (it) updateQty(id, it.qty + 1); },
    dec: function(id){ const it = loadCart().find(i => i.id === id); if (it && it.qty > 1) updateQty(id, it.qty - 1); else if (it) removeItem(id); },
    remove: removeItem,
  };

  // Init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateBadges);
  } else {
    updateBadges();
  }

  // Listen for cart changes from other tabs
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) updateBadges();
  });
})();
