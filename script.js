// ══════════════════════════════════════════════════════════
//  Mangalyam Store · G. Anandan · Frontend Script
//  Works BOTH with Node.js server AND as standalone HTML
// ══════════════════════════════════════════════════════════

const API = '';

// ── Fallback product data (used when server is not running) ──
const FALLBACK_PRODS = [
  {id:'p1',cats:['all','yellow'],name:'Classic Manjal Thali Kayiru',tamil:'கைவினை முறை மஞ்சள் தாலி கயிறு',brand:'Mangalyam · G. Anandan',type:'Natural Turmeric · Pure Cotton · 24 inch',badge:'BESTSELLER',bc:'m',imgs:['images/product1.jpg','images/product4.jpg'],emoji:'🟡',retail:22,ws:10,wsMin:20,rating:4.9,reviews:521,specs:{Material:'Pure Cotton',Length:'24 inches',Dye:'Natural Haldi',Twist:'3-ply',Owner:'G. Anandan',Origin:'Poonamalle, Chennai'}},
  {id:'p2',cats:['all','bulk','wholesale'],name:'Bulk Bundle — 10 pcs',tamil:'10 நூல் தொகுப்பு',brand:'Mangalyam · G. Anandan',type:'Set of 10 · Ready Dispatch · Plastic Packed',badge:'BULK',bc:'g',imgs:['images/product2.jpg','images/product3.jpg'],emoji:'📦',retail:220,ws:100,wsMin:1,rating:4.8,reviews:342,specs:{Quantity:'10 pcs',Material:'Pure Cotton',Price:'₹22/pc retail',WSPrice:'₹11/pc wholesale',Dispatch:'Same day',Origin:'Poonamalle, Chennai'}},
  {id:'p3',cats:['all','wholesale'],name:'Wholesale Pack — 50 pcs',tamil:'50 நூல் மொத்த தொகுப்பு',brand:'Mangalyam · G. Anandan',type:'50 pcs · Plastic Sealed · GST Invoice',badge:'WHOLESALE',bc:'m',imgs:['images/product3.jpg','images/product2.jpg'],emoji:'🏷️',retail:1100,ws:500,wsMin:1,rating:4.9,reviews:187,specs:{Quantity:'50 pcs',Price:'₹22/pc retail',WSPrice:'₹11/pc wholesale',GST:'Invoice incl.',Dispatch:'Priority 24hrs',Origin:'Poonamalle, Chennai'}},
  {id:'p4',cats:['all','temple'],name:'Temple Grade Premium Kayiru',tamil:'கோவில் தர தாலி கயிறு',brand:'Mangalyam · G. Anandan',type:'Premium Cotton · Double Dyed · 24 inch',badge:'TEMPLE',bc:'m',imgs:['images/product4.jpg','images/product1.jpg'],emoji:'🛕',retail:25,ws:13,wsMin:20,rating:5.0,reviews:289,specs:{Material:'Premium Cotton',Length:'24 inches',Dye:'Double Haldi',Grade:'Temple Grade',Owner:'G. Anandan',Origin:'Poonamalle, Chennai'}},
  {id:'p5',cats:['all','wholesale'],name:'Mega Pack — 100 pcs',tamil:'100 நூல் மொத்த விலை',brand:'Mangalyam · G. Anandan',type:'100 pcs · Factory Direct · Best Rate',badge:'BEST VALUE',bc:'g',imgs:['images/product3.jpg','images/product2.jpg'],emoji:'🏭',retail:2200,ws:1000,wsMin:1,rating:4.8,reviews:94,specs:{Quantity:'100 pcs',RetailRate:'₹22/pc',WSRate:'₹10/pc',Savings:'₹1,200 saved',Dispatch:'Priority',Origin:'Poonamalle, Chennai'}},
  {id:'p6',cats:['all','yellow'],name:'Short Thali Kayiru — 18 inch',tamil:'குறுகிய தாலி கயிறு',brand:'Mangalyam · G. Anandan',type:'Compact · 18 inch · Natural Dye',badge:'NEW',bc:'g',imgs:['images/product1.jpg','images/product4.jpg'],emoji:'✨',retail:20,ws:10,wsMin:20,rating:4.7,reviews:67,specs:{Material:'Pure Cotton',Length:'18 inches',Dye:'Natural Haldi',Twist:'3-ply',Owner:'G. Anandan',Origin:'Poonamalle, Chennai'}},
];

// ── App State ─────────────────────────────────────────────
let PRODS       = [];
let cart        = [];
let modalQty    = 1;
let activeProd  = null;
let authToken   = localStorage.getItem('mg_token') || null;
let currentUser = JSON.parse(localStorage.getItem('mg_user') || 'null');
let SERVER_UP   = false; // will check on init

// ── API Helper (with fallback) ────────────────────────────
async function apiFetch(path, options = {}) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
    const res  = await fetch(API + path, { ...options, headers });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: 'Server not running' } };
  }
}

// ── Check if server is available ──────────────────────────
async function checkServer() {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    SERVER_UP = res.ok;
  } catch {
    SERVER_UP = false;
  }
  return SERVER_UP;
}

// Re-check server on demand (called before login/register)
async function ensureServerCheck() {
  if (!SERVER_UP) await checkServer();
  return SERVER_UP;
}

// ══ PAGE ROUTING ══════════════════════════════════════════
function showPage(p) {
  ['home','shop','pricing','about','track'].forEach(x => {
    const el = document.getElementById('page-' + x);
    if (el) el.style.display = x === p ? '' : 'none';
  });
  document.querySelectorAll('.nav-links a').forEach((a, i) => {
    a.classList.toggle('active', ['home','shop','pricing','about','track'][i] === p);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (p === 'shop') loadShop('all');
}

// ══ LOAD PRODUCTS (API → fallback) ════════════════════════
async function loadProducts(category = 'all') {
  if (SERVER_UP) {
    try {
      const q   = category !== 'all' ? '?category=' + category : '';
      const res = await apiFetch('/api/products' + q);
      if (res.ok && res.data.products && res.data.products.length) {
        return res.data.products.map(p => ({
          id:      p._id,
          cats:    p.categories,
          name:    p.name,
          tamil:   p.tamilName,
          brand:   p.brand,
          type:    p.type,
          badge:   p.badge,
          bc:      p.badgeColor,
          imgs:    p.images && p.images.length ? p.images : [],
          emoji:   p.emoji || '🧵',
          retail:  p.retailPrice,
          ws:      p.wholesalePrice,
          wsMin:   p.wholesaleMinQty,
          rating:  p.rating,
          reviews: p.reviewCount,
          specs:   p.specs || {},
        }));
      }
    } catch(e) {}
  }
  // ── Fallback: use local data ──
  if (category === 'all') return FALLBACK_PRODS;
  return FALLBACK_PRODS.filter(p => p.cats.includes(category));
}

async function initHome() {
  await checkServer();
  PRODS = await loadProducts();
  renderGrid('featGrid', PRODS.slice(0, 4));
}

async function loadShop(category) {
  const grid = document.getElementById('shopGrid');
  if (grid) grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted)">Loading...</div>';
  PRODS = await loadProducts(category);
  renderGrid('shopGrid', PRODS);
}

// ══ RENDER GRID ═══════════════════════════════════════════
function renderGrid(gid, list) {
  const g = document.getElementById(gid);
  if (!g) return;
  if (!list || !list.length) {
    g.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted)">Products கிடைக்கவில்லை</div>';
    return;
  }
  g.innerHTML = list.map(p => {
    const isMulti   = p.retail > 100;
    const retailStr = isMulti ? '₹' + p.retail.toLocaleString('en-IN') : '₹' + p.retail + '/pc';
    const wsStr     = isMulti ? '₹' + p.ws.toLocaleString('en-IN') : '₹' + p.ws;
    const stars     = '★'.repeat(Math.floor(p.rating));
    const imgSrc    = p.imgs && p.imgs[0] ? p.imgs[0] : '';
    return `<div class="p-card" onclick="openMod('${p.id}')">
      <div class="p-badge ${p.bc}">${p.badge}</div>
      <button class="p-wish" onclick="event.stopPropagation();this.textContent=this.textContent==='🤍'?'❤️':'🤍'">🤍</button>
      <div class="p-img">
        <img src="${imgSrc}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;font-size:3.5rem;width:100%;height:100%;align-items:center;justify-content:center">${p.emoji}</div>
      </div>
      <div class="p-body">
        <div class="p-brand">${p.brand}</div>
        <div class="p-name">${p.name}</div>
        <div class="p-tamil">${p.tamil || ''}</div>
        <div class="p-stars">${stars}<span>(${p.reviews})</span></div>
        <div class="p-price-block">
          <div class="p-retail-price">${retailStr}</div>
          <div class="p-price-range">Retail: ₹20–₹25/pc · Premium: ₹40/pc</div>
          <div class="p-ws-price">Wholesale: <span>${wsStr}/pc</span> (${p.wsMin}+ pcs)</div>
        </div>
        <button class="btn-add" onclick="event.stopPropagation();addC('${p.id}',1)">🛒 Add to Cart</button>
      </div>
    </div>`;
  }).join('');
}

function filterShop(el, cat) {
  document.querySelectorAll('#page-shop .btn-nav').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  loadShop(cat);
}

// ══ PRODUCT MODAL ══════════════════════════════════════════
async function openMod(id) {
  // First check local cache
  activeProd = PRODS.find(p => p.id === id) || FALLBACK_PRODS.find(p => p.id === id);

  // If not found locally and server is up, fetch from API
  if (!activeProd && SERVER_UP) {
    const res = await apiFetch('/api/products/' + id);
    if (res.ok) {
      const p = res.data.product;
      activeProd = {
        id:p._id, cats:p.categories, name:p.name, tamil:p.tamilName,
        brand:p.brand, type:p.type, badge:p.badge, bc:p.badgeColor,
        imgs:p.images||[], emoji:p.emoji||'🧵',
        retail:p.retailPrice, ws:p.wholesalePrice, wsMin:p.wholesaleMinQty,
        rating:p.rating, reviews:p.reviewCount, specs:p.specs||{}
      };
    }
  }

  if (!activeProd) return;
  modalQty = 1;
  buildMod();
  document.getElementById('prodModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMod() {
  document.getElementById('prodModal').classList.remove('open');
  document.body.style.overflow = '';
}

function buildMod() {
  const p       = activeProd;
  const isMulti = p.retail > 100;
  const pRetail = isMulti ? '₹' + p.retail.toLocaleString('en-IN') : '₹' + (p.retail * modalQty);
  const pWS     = isMulti ? '₹' + p.ws.toLocaleString('en-IN')     : '₹' + (p.ws * modalQty);
  const thumbs  = (p.imgs || []).map((s, i) =>
    `<div class="m-thumb ${i===0?'active':''}" onclick="swI(this,'${s}')">
      <img src="${s}" onerror="this.parentElement.style.background='var(--gold3)';this.style.display='none'">
    </div>`
  ).join('');
  let specsObj = p.specs;
  if (specsObj instanceof Map) specsObj = Object.fromEntries(specsObj);
  const specs = Object.entries(specsObj || {}).map(([k, v]) =>
    `<div class="m-spec-item"><div class="m-spec-k">${k}</div><div class="m-spec-v">${v}</div></div>`
  ).join('');
  const mainImg = p.imgs && p.imgs[0]
    ? `<img id="mI" src="${p.imgs[0]}" onerror="this.style.display='none'">`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:5rem">${p.emoji}</div>`;

  document.getElementById('modContent').innerHTML = `
    <div class="modal-imgs-s">
      <div class="modal-thumbs">${thumbs}</div>
      <div class="m-main">${mainImg}</div>
    </div>
    <div class="modal-info-s">
      <div class="m-brand">${p.brand}</div>
      <div class="m-name">${p.name}</div>
      <div class="m-tamil">${p.tamil || ''}</div>
      <div class="m-rating"><div class="m-rbox">${p.rating}★</div><span class="m-rcnt">${p.reviews} ratings</span></div>
      <div class="m-price-pair">
        <div class="m-price-tile retail-tile">
          <div class="m-tile-label">🛍️ Retail</div>
          <div class="m-tile-price" id="mRPrice">${pRetail}</div>
          <div class="m-tile-sub">₹20–₹25 per piece</div>
        </div>
        <div class="m-price-tile ws-tile">
          <div class="m-tile-label">🏭 Wholesale</div>
          <div class="m-tile-price" id="mWPrice">${pWS}</div>
          <div class="m-tile-sub">₹10–₹15 / piece (${p.wsMin}+ pcs)</div>
        </div>
      </div>
      <div class="m-ws-note">📞 Bulk: <strong>G. Anandan 9710835979</strong></div>
      <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:4px;padding:.5rem .8rem;font-size:.74rem;color:#1B5E20;margin-bottom:.8rem">
        🚚 Poonamalle, Chennai → 24 hrs dispatch · ₹199+ free delivery
      </div>
      ${!isMulti ? `
      <div class="qty-lbl">Quantity</div>
      <div class="qty-row">
        <div style="display:flex;align-items:center">
          <button class="q-btn" style="border-radius:4px 0 0 4px" onclick="chMQ(-1)">−</button>
          <div class="q-num" id="mQN">${modalQty}</div>
          <button class="q-btn" style="border-radius:0 4px 4px 0" onclick="chMQ(1)">+</button>
        </div>
        <span class="q-tier" id="mTier">Retail rate</span>
      </div>` : ''}
      <div class="m-actions">
        <button class="m-btn-a m-btn-gold" onclick="addC('${p.id}',${isMulti?1:'modalQty'});closeMod()">🛒 Add to Cart</button>
        <button class="m-btn-a m-btn-red" onclick="addC('${p.id}',${isMulti?1:'modalQty'});closeMod();openCart()">⚡ Buy Now</button>
        <button class="m-btn-a m-btn-wa" onclick="window.open('https://wa.me/919710835979?text=Hi%20G.%20Anandan%2C%20I%20want%20${encodeURIComponent(p.name)}','_blank')">💬 WhatsApp G. Anandan</button>
      </div>
      <div style="font-size:.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem">Specifications</div>
      <div class="m-spec-grid">${specs}</div>
    </div>`;
}

function swI(el, src) {
  const mI = document.getElementById('mI');
  if (mI) mI.src = src;
  document.querySelectorAll('.m-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function chMQ(d) {
  modalQty = Math.max(1, modalQty + d);
  const p = activeProd;
  document.getElementById('mQN').textContent = modalQty;
  document.getElementById('mRPrice').textContent = '₹' + (p.retail * modalQty);
  document.getElementById('mWPrice').textContent = '₹' + (p.ws * modalQty);
  const t = document.getElementById('mTier');
  if (t) t.textContent = modalQty >= p.wsMin ? '✦ Wholesale rate!' : modalQty >= 10 ? 'Semi-bulk' : 'Retail rate';
}

// ══ CART ══════════════════════════════════════════════════
function addC(id, qty) {
  const p = PRODS.find(x => x.id === id) || FALLBACK_PRODS.find(x => x.id === id);
  if (!p) return;
  qty = parseInt(qty) || 1;
  const ex = cart.find(x => x.id === id);
  if (ex) ex.qty += qty; else cart.push({ ...p, qty });
  updCart();
  showToast(`✓ "${p.name}" added!`);
}

function chCQ(id, d) {
  const i = cart.find(x => x.id === id);
  if (!i) return;
  i.qty += d;
  if (i.qty <= 0) cart = cart.filter(x => x.id !== id);
  updCart();
}

function rmC(id) { cart = cart.filter(x => x.id !== id); updCart(); }

function updCart() {
  const total = cart.reduce((s, i) => s + (i.retail * i.qty), 0);
  document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
  const body = document.getElementById('cartBody');
  if (!cart.length) {
    body.innerHTML = '<div class="cart-empty"><div style="font-size:3rem;margin-bottom:.7rem">🧵</div><p style="font-size:.82rem;color:var(--muted)">Cart empty!</p></div>';
    document.getElementById('cartFoot').style.display = 'none';
    return;
  }
  document.getElementById('cartFoot').style.display = 'block';
  document.getElementById('cTotal').textContent = '₹' + total.toLocaleString('en-IN');
  document.getElementById('cDel').textContent = total >= 199 ? 'FREE' : '₹40';
  body.innerHTML = cart.map(i => `
    <div class="c-item">
      <div class="c-img">
        <img src="${i.imgs && i.imgs[0] ? i.imgs[0] : ''}" onerror="this.parentElement.innerHTML='<div style=font-size:1.8rem;display:flex;align-items:center;justify-content:center;height:100%>${i.emoji}</div>'">
      </div>
      <div style="flex:1">
        <div class="c-name">${i.name}</div>
        <div class="c-price">₹${(i.retail * i.qty).toLocaleString('en-IN')}</div>
        <div class="c-range">₹${i.retail}/pc · WS ₹${i.ws}/pc</div>
        <div class="c-ctrl">
          <button class="c-btn" onclick="chCQ('${i.id}',-1)">−</button>
          <span class="c-n">${i.qty}</span>
          <button class="c-btn" onclick="chCQ('${i.id}',1)">+</button>
          <button class="c-btn" style="margin-left:4px;color:var(--maroon)" onclick="rmC('${i.id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

function openCart()  { document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartDrawer').classList.add('open'); }
function closeCart() { document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartDrawer').classList.remove('open'); }

function placeOrder() {
  if (!cart.length) { showToast('Cart is empty!'); return; }
  // Show address form modal instead of prompt
  openAddressForm();
}

function openAddressForm() {
  const existing = document.getElementById('addrModal');
  if (existing) existing.remove();
  const total = cart.reduce((s, i) => s + (i.retail * i.qty), 0);
  const del   = total >= 199 ? 'FREE' : '₹40';
  const grand = total >= 199 ? total : total + 40;
  const preName  = currentUser ? currentUser.name  : '';
  const prePhone = currentUser ? currentUser.phone : '';
  const preCity  = currentUser ? (currentUser.city || '') : '';

  const modal = document.createElement('div');
  modal.id = 'addrModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(44,26,14,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div style="background:var(--white);border-radius:10px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(44,26,14,.3);">
      <div style="background:linear-gradient(135deg,var(--maroon3),var(--maroon));padding:1.2rem 1.5rem;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:white;">Delivery Details</div>
          <div style="font-size:.72rem;color:var(--gold2);">G. Anandan · Poonamalle, Chennai — 24hr dispatch</div>
        </div>
        <button onclick="document.getElementById('addrModal').remove()" style="background:rgba(255,255,255,.15);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:1rem;">✕</button>
      </div>

      <!-- Order Summary -->
      <div style="background:var(--cream2);padding:.8rem 1.5rem;border-bottom:1px solid var(--border);">
        <div style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem;">Your Order</div>
        ${cart.map(i => `
          <div style="display:flex;align-items:center;gap:.7rem;padding:.35rem 0;border-bottom:1px solid rgba(221,208,179,.5);">
            <div style="width:38px;height:38px;border-radius:5px;overflow:hidden;background:var(--cream3);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
              ${i.imgs && i.imgs[0]
                ? `<img src="${i.imgs[0]}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=font-size:1.4rem>${i.emoji}</span>'">`
                : `<span style="font-size:1.4rem">${i.emoji}</span>`}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:.78rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.name}</div>
              <div style="font-size:.7rem;color:var(--muted);">Qty: ${i.qty} × ₹${i.retail}</div>
            </div>
            <div style="font-size:.85rem;font-weight:700;color:var(--maroon);flex-shrink:0;">₹${(i.retail * i.qty).toLocaleString('en-IN')}</div>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:.4rem 0 0;font-size:.78rem;">
          <span style="color:var(--muted);">Subtotal</span><span style="font-weight:700;">₹${total.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-top:.2rem;">
          <span style="color:var(--muted);">Delivery</span><span style="color:var(--green);font-weight:700;">${del}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-top:.4rem;padding-top:.4rem;border-top:1px solid var(--border);">
          <span style="font-weight:700;color:var(--maroon);">Total</span><span style="font-weight:700;color:var(--maroon);">₹${grand.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Address Form -->
      <div style="padding:1.2rem 1.5rem;">
        <div style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.9rem;">Delivery Address</div>
        <div class="fg" style="margin-bottom:.75rem;"><label style="font-size:.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:.3rem;">Full Name *</label>
          <input id="aName" type="text" value="${preName}" placeholder="உங்கள் பெயர்" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.85rem;background:var(--cream2);outline:none;">
        </div>
        <div class="fg" style="margin-bottom:.75rem;"><label style="font-size:.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:.3rem;">WhatsApp / Phone *</label>
          <input id="aPhone" type="tel" value="${prePhone}" placeholder="10-digit mobile number" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.85rem;background:var(--cream2);outline:none;">
        </div>
        <div class="fg" style="margin-bottom:.75rem;"><label style="font-size:.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:.3rem;">Door No / Street *</label>
          <input id="aStreet" type="text" placeholder="Door no, Street name" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.85rem;background:var(--cream2);outline:none;">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.75rem;">
          <div><label style="font-size:.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:.3rem;">City *</label>
            <input id="aCity" type="text" value="${preCity}" placeholder="City" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.85rem;background:var(--cream2);outline:none;">
          </div>
          <div><label style="font-size:.75rem;font-weight:700;color:var(--muted);display:block;margin-bottom:.3rem;">Pincode</label>
            <input id="aPin" type="text" placeholder="6-digit pincode" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.85rem;background:var(--cream2);outline:none;">
          </div>
        </div>
        <div style="margin-bottom:1rem;">
          <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">💳 Payment Method</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">
            <label style="display:flex;align-items:center;gap:.5rem;background:white;border:2px solid var(--gold);border-radius:8px;padding:.6rem .8rem;cursor:pointer;">
              <input type="radio" name="payMode" value="upi" checked style="accent-color:#6B1A1A;">
              <span style="font-size:.8rem;font-weight:700;color:var(--maroon);">📱 UPI / QR Pay</span>
            </label>
            <label style="display:flex;align-items:center;gap:.5rem;background:white;border:1.5px solid var(--border);border-radius:8px;padding:.6rem .8rem;cursor:pointer;">
              <input type="radio" name="payMode" value="cod" style="accent-color:#6B1A1A;">
              <span style="font-size:.8rem;font-weight:700;color:var(--muted);">💵 Cash on Delivery</span>
            </label>
          </div>
        </div>
        <button onclick="submitOrder()" style="width:100%;background:linear-gradient(135deg,var(--maroon),var(--maroon2));color:white;border:none;padding:13px;border-radius:5px;font-family:'Lato',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;letter-spacing:.03em;">
          ✅ Confirm Order →
        </button>
        <button onclick="document.getElementById('addrModal').remove();waCart()" style="width:100%;background:var(--wa);color:white;border:none;padding:11px;border-radius:5px;font-family:'Lato',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;margin-top:.5rem;">
          💬 Order via WhatsApp instead
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function submitOrder() {
  const name   = document.getElementById('aName')  && document.getElementById('aName').value.trim();
  const phone  = document.getElementById('aPhone') && document.getElementById('aPhone').value.trim();
  const street = document.getElementById('aStreet')&& document.getElementById('aStreet').value.trim();
  const city   = document.getElementById('aCity')  && document.getElementById('aCity').value.trim();
  const pin    = document.getElementById('aPin')   && document.getElementById('aPin').value.trim();

  if (!name)   { showToast('பெயர் கொடுக்கவும்'); return; }
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) { showToast('சரியான 10-digit phone கொடுக்கவும்'); return; }
  if (!street) { showToast('Address கொடுக்கவும்'); return; }
  if (!city)   { showToast('City கொடுக்கவும்'); return; }

  const total = cart.reduce((s, i) => s + (i.retail * i.qty), 0);
  const grand = total >= 199 ? total : total + 40;
  const orderItems = cart.map(i => ({ productId: i.id, productName: i.name, qty: i.qty, unitPrice: i.retail, image: i.imgs && i.imgs[0] ? i.imgs[0] : '', emoji: i.emoji }));

  const payMode = document.querySelector('input[name="payMode"]:checked')?.value || 'upi';
  if (payMode === 'upi') {
    const num = String(Date.now()).slice(-5);
    const oid = 'MG-' + new Date().getFullYear() + '-' + num;
    document.getElementById('addrModal').remove();
    showUPIPayment(grand, oid, name, phone, city, street, pin, orderItems, total);
    return;
  }

  if (SERVER_UP) {
    showToast('⏳ Order placing...');
    const res = await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: orderItems,
        deliveryAddress: { name, phone, city, street, pincode: pin, state: 'Tamil Nadu' },
        paymentMethod: 'COD',
        guestPhone: currentUser ? undefined : phone,
      }),
    });
    if (res.ok) {
      const oid = res.data.orderId || res.data.order?.orderId;
      document.getElementById('addrModal').remove();
      closeCart();
      showOrderDetails(oid, name, phone, city, street, pin, orderItems, total, grand);
      cart = []; updCart();
    } else { showToast('❌ ' + (res.data.message || 'Order failed')); }
  } else {
    // Generate offline Order ID
    const num = String(Date.now()).slice(-5);
    const oid = 'MG-' + new Date().getFullYear() + '-' + num;
    // Save to localStorage for tracking
    const savedOrders = JSON.parse(localStorage.getItem('mg_orders') || '{}');
    savedOrders[oid] = {
      orderId: oid,
      status: 'placed',
      name, phone, city, street, pincode: pin,
      items: orderItems,
      total, grand,
      placedAt: new Date().toISOString(),
      timeline: [{ status:'placed', message:'Order placed with G. Anandan · Poonamalle, Chennai. WhatsApp confirmation will be sent to ' + phone, timestamp: new Date().toISOString() }]
    };
    localStorage.setItem('mg_orders', JSON.stringify(savedOrders));
    document.getElementById('addrModal').remove();
    closeCart();
    showOrderDetails(oid, name, phone, city, street, pin, orderItems, total, grand);
    cart = []; updCart();
  }
}

// ══ ORDER DETAILS PAGE ════════════════════════════════════
function showOrderDetails(oid, name, phone, city, street, pin, items, subtotal, grand) {
  const del = subtotal >= 199 ? 'FREE' : '₹40';
  const existing = document.getElementById('orderDetailPage');
  if (existing) existing.remove();

  const page = document.createElement('div');
  page.id = 'orderDetailPage';
  page.style.cssText = 'position:fixed;inset:0;background:var(--cream);z-index:9000;overflow-y:auto;';
  page.innerHTML = `
    <!-- Top bar -->
    <div style="background:linear-gradient(135deg,var(--maroon3),var(--maroon));padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem;position:sticky;top:0;z-index:10;">
      <button onclick="document.getElementById('orderDetailPage').remove();showPage('home')" style="background:rgba(255,255,255,.15);border:none;color:white;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:.8rem;font-weight:700;">← Home</button>
      <div style="flex:1;">
        <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:white;font-weight:700;">Order Confirmed! 🎉</div>
        <div style="font-size:.7rem;color:var(--gold2);">MangalyamStore · G. Anandan</div>
      </div>
      <button onclick="document.getElementById('orderDetailPage').remove();showPage('track')" style="background:var(--gold);color:var(--maroon3);border:none;padding:7px 14px;border-radius:4px;cursor:pointer;font-size:.78rem;font-weight:700;">Track Order</button>
    </div>

    <div style="max-width:600px;margin:0 auto;padding:1.5rem 1rem 4rem;">

      <!-- Success banner -->
      <div style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border:1.5px solid #A5D6A7;border-radius:10px;padding:1.5rem;text-align:center;margin-bottom:1.5rem;">
        <div style="font-size:3rem;margin-bottom:.5rem;">🎉</div>
        <div style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:var(--green);margin-bottom:.3rem;">Order Placed Successfully!</div>
        <div style="font-size:.82rem;color:#2E7D32;margin-bottom:.9rem;">G. Anandan will dispatch from Poonamalle within 24 hours</div>
        <div style="background:white;border-radius:6px;padding:.7rem 1.2rem;display:inline-block;border:1.5px solid #A5D6A7;">
          <div style="font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.2rem;">Your Order ID</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--maroon);letter-spacing:.04em;">${oid}</div>
          <div style="font-size:.68rem;color:var(--muted);margin-top:.2rem;">Save this ID to track your order</div>
        </div>
      </div>

      <!-- Quick actions -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-bottom:1.5rem;">
        <button onclick="document.getElementById('orderDetailPage').remove();setTrack('${oid}');showPage('track')" style="background:linear-gradient(135deg,var(--maroon),var(--maroon2));color:white;border:none;padding:12px;border-radius:6px;font-family:'Lato',sans-serif;font-weight:700;font-size:.83rem;cursor:pointer;">
          📍 Track Order
        </button>
        <button onclick="window.open('https://wa.me/919710835979?text=Hi%20G.%20Anandan%2C%20I%20just%20placed%20Order%20ID%3A%20${oid}%20.%20Please%20confirm.','_blank')" style="background:var(--wa);color:white;border:none;padding:12px;border-radius:6px;font-family:'Lato',sans-serif;font-weight:700;font-size:.83rem;cursor:pointer;">
          💬 WhatsApp Confirm
        </button>
      </div>

      <!-- Order items -->
      <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <div style="padding:.9rem 1.2rem;border-bottom:1px solid var(--border);background:var(--cream2);">
          <div style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">Order Items</div>
        </div>
        ${items.map(i => `
          <div style="display:flex;align-items:center;gap:.9rem;padding:.9rem 1.2rem;border-bottom:1px solid var(--border);">
            <div style="width:52px;height:52px;border-radius:7px;overflow:hidden;background:var(--cream3);flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--border);">
              ${i.image
                ? `<img src="${i.image}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=font-size:2rem>${i.emoji || '🧵'}</span>'">`
                : `<span style="font-size:2rem">${i.emoji || '🧵'}</span>`}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:.85rem;font-weight:700;color:var(--text);">${i.productName}</div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:.15rem;">Qty: ${i.qty} × ₹${i.unitPrice}/pc · COD</div>
            </div>
            <div style="font-size:.95rem;font-weight:700;color:var(--maroon);flex-shrink:0;">₹${(i.unitPrice * i.qty).toLocaleString('en-IN')}</div>
          </div>`).join('')}
        <div style="padding:.9rem 1.2rem;background:var(--cream2);">
          <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.3rem;">
            <span style="color:var(--muted);">Subtotal</span><span style="font-weight:700;">₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.4rem;">
            <span style="color:var(--muted);">Delivery</span><span style="color:var(--green);font-weight:700;">${del}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:1rem;padding-top:.5rem;border-top:1px solid var(--border);">
            <span style="font-weight:700;color:var(--maroon);">Grand Total</span>
            <span style="font-weight:700;color:var(--maroon);font-size:1.1rem;">₹${grand.toLocaleString('en-IN')}</span>
          </div>
          <div style="margin-top:.5rem;font-size:.72rem;color:var(--muted);">💳 Payment: Cash on Delivery · Pay when you receive</div>
        </div>
      </div>

      <!-- Delivery details -->
      <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <div style="padding:.9rem 1.2rem;border-bottom:1px solid var(--border);background:var(--cream2);">
          <div style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">Delivery Address</div>
        </div>
        <div style="padding:1rem 1.2rem;">
          <div style="font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:.2rem;">${name}</div>
          <div style="font-size:.82rem;color:var(--muted);line-height:1.7;">${street}<br>${city}${pin ? ', ' + pin : ''}<br>📞 ${phone}</div>
        </div>
      </div>

      <!-- Timeline -->
      <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <div style="padding:.9rem 1.2rem;border-bottom:1px solid var(--border);background:var(--cream2);">
          <div style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">Order Status</div>
        </div>
        <div style="padding:1rem 1.2rem;">
          ${['Order Placed','Confirmed by G. Anandan','Packed & Ready','Out for Delivery','Delivered'].map((lbl,i) => `
            <div style="display:flex;gap:.9rem;padding-bottom:${i<4?'1rem':'0'};">
              <div style="display:flex;flex-direction:column;align-items:center;">
                <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0;${i===0?'background:var(--maroon);color:white;':'background:var(--cream3);color:var(--muted);border:1.5px solid var(--border);'}">
                  ${i===0?'✓':(i+1)}
                </div>
                ${i<4?`<div style="width:1.5px;height:100%;min-height:18px;background:${i===0?'var(--gold)':'var(--border)'};margin-top:4px;flex:1;"></div>`:''}
              </div>
              <div style="padding-top:4px;padding-bottom:${i<4?'.5rem':'0'};">
                <div style="font-size:.82rem;font-weight:700;color:${i===0?'var(--maroon)':'var(--muted)'};">${lbl}</div>
                ${i===0?`<div style="font-size:.72rem;color:var(--muted);margin-top:.1rem;">${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})}</div>`:''}
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Seller info -->
      <div style="background:linear-gradient(135deg,var(--maroon3),var(--maroon));border-radius:10px;padding:1.2rem;color:white;text-align:center;">
        <div style="font-family:'Playfair Display',serif;font-size:1rem;margin-bottom:.3rem;">Sold by G. Anandan</div>
        <div style="font-size:.75rem;color:var(--gold2);margin-bottom:.8rem;">Mangalyam Store · Poonamalle, Chennai</div>
        <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;">
          <a href="tel:9710835979" style="background:rgba(255,255,255,.15);color:white;text-decoration:none;padding:7px 14px;border-radius:4px;font-size:.78rem;font-weight:700;">📞 9710835979</a>
          <a href="tel:7305775184" style="background:rgba(255,255,255,.15);color:white;text-decoration:none;padding:7px 14px;border-radius:4px;font-size:.78rem;font-weight:700;">📱 7305775184</a>
          <button onclick="window.open('https://wa.me/919710835979?text=Order%20ID%3A%20${oid}','_blank')" style="background:var(--wa);color:white;border:none;padding:7px 14px;border-radius:4px;font-size:.78rem;font-weight:700;cursor:pointer;">💬 WhatsApp</button>
        </div>
      </div>

    </div>`;
  document.body.appendChild(page);
  page.scrollTo({ top: 0 });
}

function closeSuc() { document.getElementById('sucMod').classList.remove('open'); }

function waCart() {
  const items = cart.map(i => `${i.name} x${i.qty}=₹${(i.retail * i.qty).toLocaleString('en-IN')}`).join('%0A');
  const total = cart.reduce((s, i) => s + (i.retail * i.qty), 0);
  window.open(`https://wa.me/919710835979?text=Hi%20G.%20Anandan%2C%20Order:%0A${items}%0ATotal:%20₹${total.toLocaleString('en-IN')}`, '_blank');
}

// ══ AUTH ══════════════════════════════════════════════════
function openLogin(t = 'login') { document.getElementById('loginOv').classList.add('open'); document.body.style.overflow = 'hidden'; switchTab(t); }
function closeLogin() { document.getElementById('loginOv').classList.remove('open'); document.body.style.overflow = ''; }

function switchTab(t) {
  document.getElementById('tLogin').classList.toggle('active', t === 'login');
  document.getElementById('tReg').classList.toggle('active', t === 'reg');
  document.getElementById('lForm').innerHTML = t === 'login' ? `
    <div class="fg"><label>Phone</label><input id="lPhone" type="tel" placeholder="Mobile number"></div>
    <div class="fg"><label>Password</label><input id="lPass" type="password" placeholder="Password"></div>
    <button class="btn-login" onclick="doLogin()">Login →</button>
    <div class="l-div">or</div>
    <button class="btn-wa-l" onclick="window.open('https://wa.me/919710835979','_blank')">💬 WhatsApp Login</button>
  ` : `
    <div class="fg"><label>Full Name</label><input id="rName" type="text" placeholder="உங்கள் பெயர்"></div>
    <div class="fg"><label>Phone</label><input id="rPhone" type="tel" placeholder="Mobile number"></div>
    <div class="fg"><label>City</label><input id="rCity" type="text" placeholder="Your city"></div>
    <div class="fg"><label>Password</label><input id="rPass" type="password" placeholder="Create password"></div>
    <button class="btn-login" onclick="doRegister()">Create Account →</button>
    <div class="l-div">or</div>
    <button class="btn-wa-l" onclick="window.open('https://wa.me/919710835979','_blank')">💬 Register via WhatsApp</button>
  `;
}

// ── Local user DB (when server is offline) ───────────────
function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem('mg_users') || '[]'); } catch { return []; }
}
function saveLocalUsers(users) {
  localStorage.setItem('mg_users', JSON.stringify(users));
}
function localLogin(phone, pass) {
  const users = getLocalUsers();
  const user  = users.find(u => u.phone === phone && u.password === pass);
  if (!user) return null;
  return { id: user.phone, name: user.name, phone: user.phone, city: user.city, role: 'customer' };
}
function localRegister(name, phone, city, pass) {
  const users = getLocalUsers();
  if (users.find(u => u.phone === phone)) return { error: 'இந்த phone number already registered' };
  const newUser = { name, phone, city, password: pass, role: 'customer' };
  users.push(newUser);
  saveLocalUsers(users);
  return { id: phone, name, phone, city, role: 'customer' };
}

async function doLogin() {
  const phone = document.getElementById('lPhone').value.trim();
  const pass  = document.getElementById('lPass').value;
  if (!phone || !pass) { showToast('Phone & password கொடுக்கவும்'); return; }

  showToast('⏳ Checking...');
  await ensureServerCheck();

  if (SERVER_UP) {
    showToast('⏳ Logging in...');
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password: pass }) });
    if (res.ok) {
      authToken = res.data.token; currentUser = res.data.user;
      localStorage.setItem('mg_token', authToken);
      localStorage.setItem('mg_user', JSON.stringify(currentUser));
      closeLogin(); showToast('வணக்கம் ' + currentUser.name + '! ✅');
    } else { showToast('❌ ' + res.data.message); }
  } else {
    // Offline login via localStorage
    const user = localLogin(phone, pass);
    if (!user) { showToast('❌ Phone அல்லது password தவறு'); return; }
    currentUser = user;
    authToken   = 'local_' + phone;
    localStorage.setItem('mg_token', authToken);
    localStorage.setItem('mg_user', JSON.stringify(currentUser));
    closeLogin();
    showToast('வணக்கம் ' + user.name + '! ✅');
    updateNavForUser();
  }
}

async function doRegister() {
  const name  = document.getElementById('rName').value.trim();
  const phone = document.getElementById('rPhone').value.trim();
  const city  = document.getElementById('rCity').value.trim();
  const pass  = document.getElementById('rPass').value;
  if (!name || !phone || !pass) { showToast('எல்லா details-ம் கொடுக்கவும்'); return; }
  if (!/^[6-9]\d{9}$/.test(phone)) { showToast('சரியான 10-digit phone number கொடுக்கவும்'); return; }
  if (pass.length < 6) { showToast('Password குறைந்தது 6 characters இருக்கணும்'); return; }

  showToast('⏳ Checking...');
  await ensureServerCheck();

  if (SERVER_UP) {
    showToast('⏳ Registering...');
    const res = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, phone, city, password: pass }) });
    if (res.ok) {
      authToken = res.data.token; currentUser = res.data.user;
      localStorage.setItem('mg_token', authToken);
      localStorage.setItem('mg_user', JSON.stringify(currentUser));
      closeLogin(); showToast('வணக்கம் ' + currentUser.name + '! Registration successful 🎉');
      updateNavForUser();
    } else { showToast('❌ ' + res.data.message); }
  } else {
    // Offline register via localStorage
    const result = localRegister(name, phone, city, pass);
    if (result.error) { showToast('❌ ' + result.error); return; }
    currentUser = result;
    authToken   = 'local_' + phone;
    localStorage.setItem('mg_token', authToken);
    localStorage.setItem('mg_user', JSON.stringify(currentUser));
    closeLogin();
    showToast('வணக்கம் ' + name + '! Registration successful 🎉');
    updateNavForUser();
  }
}

function updateNavForUser() {
  if (!currentUser) return;
  // Update login button to show user name
  const btns = document.querySelectorAll('.btn-nav');
  btns.forEach(b => {
    if (b.textContent === 'Login') b.textContent = currentUser.name.split(' ')[0];
  });
}

// ══ ORDER TRACKING ════════════════════════════════════════
const STATUS_MAP = { placed:{step:0}, confirmed:{step:1}, packed:{step:2}, out_for_delivery:{step:3}, delivered:{step:4} };
const DEMO_ORDERS = {
  'MG-2025-001': { orderId:'MG-2025-001', status:'out_for_delivery', timeline:[{message:'Dispatched from Poonamalle — estimated delivery today 6 PM'}] },
  'MG-2025-042': { orderId:'MG-2025-042', status:'delivered',        timeline:[{message:'Delivered successfully ✓'}] },
  'MG-2025-099': { orderId:'MG-2025-099', status:'packed',           timeline:[{message:'Packed by G. Anandan — courier pickup scheduled'}] },
};

function setTrack(id) { document.getElementById('trackInput').value = id; trackOrder(); }

async function trackOrder() {
  const id  = document.getElementById('trackInput').value.trim().toUpperCase();
  const res = document.getElementById('trackResult');
  if (!id) { showToast('Order ID கொடுக்கவும்'); return; }

  let order = null;
  if (SERVER_UP) {
    showToast('⏳ Tracking...');
    const r = await apiFetch('/api/orders/track/' + id);
    if (r.ok) order = r.data.order;
  }
  // Check localStorage saved orders
  if (!order) {
    const savedOrders = JSON.parse(localStorage.getItem('mg_orders') || '{}');
    if (savedOrders[id]) order = savedOrders[id];
  }
  if (!order) order = DEMO_ORDERS[id];
  if (!order) { res.style.display = 'none'; showToast('❌ Order கிடைக்கவில்லை — ID சரியா?'); return; }

  const stepInfo = STATUS_MAP[order.status] || { step: 0 };
  res.style.display = 'block';
  document.getElementById('tOrderId').textContent = order.orderId;
  document.getElementById('tStatus').textContent  = order.status.replace(/_/g,' ').toUpperCase();
  const msg = order.timeline && order.timeline.length ? order.timeline[order.timeline.length-1].message : 'Status updated';
  document.getElementById('tMsg').textContent = msg;
  for (let i = 0; i < 5; i++) {
    const s = document.getElementById('ts' + i);
    if (!s) continue;
    s.classList.remove('done', 'active');
    if (i < stepInfo.step) s.classList.add('done');
    else if (i === stepInfo.step) s.classList.add('active');
  }
  res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ══ TOAST ═════════════════════════════════════════════════
let tt;
function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('show'), 2800);
}

// ══ LIVE TICKER ════════════════════════════════════════════
const ticks = ['✅ 3 orders in last 1 hour from Chennai','📦 Bulk 50pc dispatched to Madurai temple','⚡ Retail ₹38 · Wholesale ₹12 — order now','🎉 New wholesale buyer from Coimbatore','🚚 G. Anandan delivered to Salem today'];
let ti = 0;
setInterval(() => {
  const el = document.getElementById('liveTick');
  if (el) { const sp = el.querySelector('span'); if (sp) sp.textContent = ticks[ti % ticks.length]; ti++; }
}, 4000);

// ══ INIT ══════════════════════════════════════════════════
(async () => {
  await initHome();
  switchTab('login');
})();

// ══ UPI PAYMENT MODAL ═════════════════════════════════════
function showUPIPayment(grand, oid, name, phone, city, street, pin, orderItems, total) {
  const upiId   = 'boopalana154@okaxis';
  const upiName = 'G Anandan Mangalyam';
  const upiUrl  = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${grand}&cu=INR&tn=${encodeURIComponent('Mangalyam Order ' + oid)}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  const modal = document.createElement('div');
  modal.id = 'upiModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(44,26,14,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div style="background:white;border-radius:14px;max-width:380px;width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(44,26,14,.4);">
      <div style="background:linear-gradient(135deg,#4A0E0E,#6B1A1A);padding:1.2rem 1.5rem;text-align:center;">
        <div style="font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;color:#FFD700;">📱 UPI Payment</div>
        <div style="font-size:.75rem;color:rgba(245,220,150,.7);margin-top:3px;">Scan & Pay · G. Anandan · Mangalyam Store</div>
      </div>
      <div style="background:#FFF8E1;padding:.8rem;text-align:center;border-bottom:1px solid #FFE082;">
        <div style="font-size:.7rem;color:#888;text-transform:uppercase;letter-spacing:.08em;">Total Amount</div>
        <div style="font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:#6B1A1A;">₹${grand.toLocaleString('en-IN')}</div>
        <div style="font-size:.72rem;color:#888;">Order ID: ${oid}</div>
      </div>
      <div style="padding:1.2rem;text-align:center;">
        <div style="font-size:.75rem;color:#666;margin-bottom:.8rem;">📷 PhonePe / GPay / Paytm-ல் scan பண்ணுங்கள்</div>
        <div style="display:inline-block;padding:10px;border:3px solid #FFD700;border-radius:10px;background:white;">
          <img src="${qrUrl}" width="180" height="180" alt="UPI QR Code" style="display:block;">
        </div>
        <div style="margin-top:.8rem;background:#f5f5f5;border-radius:8px;padding:.6rem;font-size:.78rem;">
          <div style="color:#666;margin-bottom:2px;">UPI ID</div>
          <div style="font-weight:700;color:#333;font-size:.9rem;">${upiId}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-top:.8rem;">
          <a href="${upiUrl}" style="background:#5f259f;color:white;padding:8px 4px;border-radius:8px;font-size:.7rem;font-weight:700;text-decoration:none;text-align:center;display:block;">📱 PhonePe</a>
          <a href="${upiUrl}" style="background:#1a73e8;color:white;padding:8px 4px;border-radius:8px;font-size:.7rem;font-weight:700;text-decoration:none;text-align:center;display:block;">💳 GPay</a>
          <a href="${upiUrl}" style="background:#002970;color:white;padding:8px 4px;border-radius:8px;font-size:.7rem;font-weight:700;text-decoration:none;text-align:center;display:block;">💙 Paytm</a>
        </div>
      </div>
      <div style="padding:.8rem 1.2rem 1.2rem;">
        <div style="font-size:.72rem;color:#888;text-align:center;margin-bottom:.7rem;">Payment பண்ணிட்டீர்களா?</div>
        <button onclick="confirmUPIPayment('${oid}','${name}','${phone}','${city}','${street}','${pin}',${grand})"
          style="width:100%;background:linear-gradient(135deg,#2E7D32,#388E3C);color:white;border:none;padding:12px;border-radius:8px;font-family:'Lato',sans-serif;font-weight:700;font-size:.88rem;cursor:pointer;margin-bottom:.5rem;">
          ✅ Payment பண்ணிட்டேன் — Order Confirm
        </button>
        <button onclick="document.getElementById('upiModal').remove()"
          style="width:100%;background:#f5f5f5;color:#666;border:none;padding:10px;border-radius:8px;font-family:'Lato',sans-serif;font-weight:600;font-size:.82rem;cursor:pointer;">
          ← திரும்பி போ
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function confirmUPIPayment(oid, name, phone, city, street, pin, grand) {
  document.getElementById('upiModal').remove();
  const orderItems = cart.map(i => ({ productId: i.id, productName: i.name, qty: i.qty, unitPrice: i.retail }));
  const total = cart.reduce((s, i) => s + (i.retail * i.qty), 0);
  if (SERVER_UP) {
    await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: orderItems,
        deliveryAddress: { name, phone, city, street, pincode: pin, state: 'Tamil Nadu' },
        paymentMethod: 'UPI',
        guestPhone: phone,
      }),
    });
  }
  closeCart();
  showOrderDetails(oid, name, phone, city, street, pin, orderItems, total, grand);
  cart = []; updCart();
  showToast('✅ Payment confirmed! Order placed!');
}
