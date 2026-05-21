/* ============================================================
   PURITY MUKISA — Shared Cart Logic (v2)
   Persists across pages via localStorage.
   Loaded with `defer` in <head> on every page.
============================================================ */
(function(){
  'use strict';

  const STORAGE_KEY     = 'purity_mukisa_cart_v1';
  const WHATSAPP_NUMBER = '256771492492';

  /* ---------------- Cart state ---------------- */
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(i => i && typeof i === 'object' && typeof i.id === 'string');
    } catch(e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(cart) ? cart : [])); }
    catch(e) {}
    notifyChange();
  }
  function clearCart() { saveCart([]); }
  function getCart()   { return loadCart(); }

  function addItem(item) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') return;
    const cart = loadCart();
    const ex = cart.find(i => i.id === item.id);
    if (ex) {
      ex.qty = (ex.qty || 0) + (item.qty || 1);
    } else {
      cart.push({
        id: item.id,
        name: item.name || 'Item',
        price: typeof item.price === 'number' ? item.price : 0,
        priceLabel: item.priceLabel || '',
        emoji: item.emoji || '🎵',
        gradient: item.gradient || 'linear-gradient(135deg,var(--terra),var(--amber))',
        qty: typeof item.qty === 'number' ? item.qty : 1,
      });
    }
    saveCart(cart);
  }
  function updateQty(id, qty) {
    if (typeof id !== 'string') return;
    const cart = loadCart();
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, typeof qty === 'number' && !isNaN(qty) ? qty : 1);
    saveCart(cart);
  }
  function removeItem(id) {
    if (typeof id !== 'string') return;
    saveCart(loadCart().filter(i => i.id !== id));
  }
  function getCount() {
    return loadCart().reduce((s,i) => s + (typeof i.qty === 'number' ? i.qty : 1), 0);
  }
  function getTotal() {
    return loadCart().reduce((s,i) => {
      const p = typeof i.price === 'number' ? i.price : 0;
      const q = typeof i.qty   === 'number' ? i.qty   : 1;
      return s + (p * q);
    }, 0);
  }
  function formatUGX(n) {
    const v = typeof n === 'number' && !isNaN(n) ? n : 0;
    if (v >= 1000) return 'UGX ' + (v/1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'K';
    return 'UGX ' + v;
  }

  /* ---------------- Badge sync ---------------- */
  function updateBadges() {
    const c = getCount();
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = c;
      el.classList.toggle('empty', c === 0);
    });
  }

  /* ---------------- Drawer render ---------------- */
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeJs(s)   { return String(s).replace(/'/g, "\\'"); }

  function renderDrawer() {
    const body   = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');
    if (!body) return;
    const cart = loadCart();
    if (cart.length === 0) {
      body.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛍️</div><h4>Your cart is empty</h4><p style="font-size:13px;margin-top:8px;">Browse the store and add something beautiful.</p></div>';
      if (footer) footer.style.display = 'none';
      return;
    }
    if (footer) footer.style.display = 'block';
    body.innerHTML = cart.map(it => `
      <div class="cart-item" data-id="${escapeHtml(it.id)}">
        <div class="cart-item-img" style="background:${it.gradient};">${it.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(it.name)}</div>
          <div class="cart-item-price">${formatUGX(it.price)} each</div>
          <div class="cart-qty-row">
            <button class="cart-qty-btn" data-cart-action="dec" data-id="${escapeHtml(it.id)}" aria-label="Decrease">−</button>
            <span class="cart-qty-display">${it.qty}</span>
            <button class="cart-qty-btn" data-cart-action="inc" data-id="${escapeHtml(it.id)}" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-cart-action="remove" data-id="${escapeHtml(it.id)}" aria-label="Remove">✕</button>
      </div>
    `).join('');
    const totalEl = document.getElementById('cartDrawerTotal');
    if (totalEl) totalEl.textContent = formatUGX(getTotal());
  }

  /* ---------------- Drawer open / close ---------------- */
  function openDrawer() {
    const d = document.getElementById('cartDrawer');
    const o = document.getElementById('cartOverlay');
    if (!d) { console.warn('[Cart] cartDrawer element missing on this page'); return; }
    renderDrawer();
    // Force browser to apply current state before transitioning
    void d.offsetWidth;
    d.classList.add('open');
    if (o) o.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    const d = document.getElementById('cartDrawer');
    const o = document.getElementById('cartOverlay');
    if (d) d.classList.remove('open');
    if (o) o.classList.remove('open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
  function toggleDrawer() {
    const d = document.getElementById('cartDrawer');
    if (d && d.classList.contains('open')) closeDrawer(); else openDrawer();
  }

  function notifyChange() {
    updateBadges();
    const d = document.getElementById('cartDrawer');
    if (d && d.classList.contains('open')) renderDrawer();
  }

  /* ---------------- WhatsApp order ---------------- */
  function buildOrderMessage(customer, paymentMethod, orderId) {
    const cart = loadCart();
    if (cart.length === 0) return '';
    const lines = [];
    lines.push(`*New Order — ${orderId}*`); lines.push('');
    lines.push('*Items:*');
    cart.forEach(it => lines.push(`• ${it.name} × ${it.qty} — ${formatUGX(it.price * it.qty)}`));
    lines.push(''); lines.push(`*Total: ${formatUGX(getTotal())}*`); lines.push('');
    lines.push(`*Payment method:* ${paymentMethod}`);
    if (customer) {
      lines.push(''); lines.push('*Delivery details:*');
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
    const code = Math.random().toString(36).slice(2,6).toUpperCase();
    return `PM-${yr}-${code}`;
  }

  /* ---------------- Public API ---------------- */
  window.Cart = {
    add: addItem, remove: removeItem, updateQty: updateQty, clear: clearCart,
    items: getCart, count: getCount, total: getTotal,
    formatUGX: formatUGX, whatsappNumber: WHATSAPP_NUMBER,
    buildOrderMessage: buildOrderMessage, generateOrderId: generateOrderId,
  };
  window.CartUI = {
    open: openDrawer, close: closeDrawer, toggle: toggleDrawer, render: renderDrawer,
    inc: function(id){ const it = loadCart().find(i => i.id === id); if (it) updateQty(id, it.qty + 1); },
    dec: function(id){ const it = loadCart().find(i => i.id === id); if (it && it.qty > 1) updateQty(id, it.qty - 1); else if (it) removeItem(id); },
    remove: removeItem,
  };

  /* ---------------- Global event delegation ----------------
     Works even if cart.js loads AFTER the cart button was rendered.
     Any element with [data-cart-action] is auto-wired.
  -------------------------------------------------------- */
  function onClick(e) {
    const target = e.target.closest('[data-cart-action]');
    if (!target) return;
    const action = target.getAttribute('data-cart-action');
    const id     = target.getAttribute('data-id');
    if (action === 'open')   { e.preventDefault(); openDrawer(); return; }
    if (action === 'close')  { e.preventDefault(); closeDrawer(); return; }
    if (action === 'inc' && id)    { window.CartUI.inc(id); return; }
    if (action === 'dec' && id)    { window.CartUI.dec(id); return; }
    if (action === 'remove' && id) { window.CartUI.remove(id); return; }
  }

  function onKey(e) {
    if (e.key === 'Escape') closeDrawer();
  }

  function init() {
    updateBadges();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Cross-tab sync */
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) { updateBadges(); renderDrawer(); }
  });
})();
yr}-${code}`;
  }

  /* ---------------- Public API ---------------- */
  window.Cart = {
    add: addItem, remove: removeItem, updateQty: updateQty, clear: clearCart,
    items: getCart, count: getCount, total: getTotal,
    formatUGX: formatUGX, whatsappNumber: WHATSAPP_NUMBER,
    buildOrderMessage: buildOrderMessage, generateOrderId: generateOrderId,
  };
  window.CartUI = {
    open: openDrawer, close: closeDrawer, toggle: toggleDrawer, render: renderDrawer,
    inc: function(id){ const it = loadCart().find(i => i.id === id); if (it) updateQty(id, it.qty + 1); },
    dec: function(id){ const it = loadCart().find(i => i.id === id); if (it && it.qty > 1) updateQty(id, it.qty - 1); else if (it) removeItem(id); },
    remove: removeItem,
  };

  /* ---------------- Global event delegation ----------------
     Works even if cart.js loads AFTER the cart button was rendered.
     Any element with [data-cart-action] is auto-wired.
  -------------------------------------------------------- */
  function onClick(e) {
    const target = e.target.closest('[data-cart-action]');
    if (!target) return;
    const action = target.getAttribute('data-cart-action');
    const id     = target.getAttribute('data-id');
    if (action === 'open')   { e.preventDefault(); openDrawer(); return; }
    if (action === 'close')  { e.preventDefault(); closeDrawer(); return; }
    if (action === 'inc' && id)    { window.CartUI.inc(id); return; }
    if (action === 'dec' && id)    { window.CartUI.dec(id); return; }
    if (action === 'remove' && id) { window.CartUI.remove(id); return; }
  }

  function onKey(e) {
    if (e.key === 'Escape') closeDrawer();
  }

  function init() {
    updateBadges();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Cross-tab sync */
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) { updateBadges(); renderDrawer(); }
  });
})();
