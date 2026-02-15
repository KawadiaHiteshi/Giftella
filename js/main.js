
// ===== Mobile menu =====
(function () {
  const toggle = document.getElementById("mobileToggle");
  const menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("show");
    menu.setAttribute("aria-hidden", String(!isOpen));
  });

  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      menu.classList.remove("show");
      menu.setAttribute("aria-hidden", "true");
    });
  });
})();

// ===== Smooth scroll =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ===== Reveal on scroll =====
(function () {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.16 });

  items.forEach(el => io.observe(el));
})();

// ===== Cute cursor (dot + ring) =====
(function () {
  const cursor = document.getElementById("cursor");
  if (!cursor) return;

  const dot = cursor.querySelector(".cursor-dot");
  const ring = cursor.querySelector(".cursor-ring");
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x, ry = y;

  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) { cursor.style.display = "none"; return; }

  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.left = x + "px";
    dot.style.top = y + "px";
  });

  function animate() {
    rx += (x - rx) * 0.14;
    ry += (y - ry) * 0.14;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(animate);
  }
  animate();

  document.querySelectorAll("a, button, .cat-card, .product").forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
})();

// ===== Floating hearts animation =====
(function () {
  const canvas = document.getElementById("heartsCanvas");
  const toggle = document.getElementById("toggleHearts");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let enabled = true;
  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isReduced) enabled = false;

  function resize(){
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(min, max){ return Math.random()*(max-min)+min; }

  const hearts = [];
  function spawnHeart(){
    const size = rand(10, 18);
    hearts.push({
      x: rand(0, window.innerWidth),
      y: window.innerHeight + rand(10, 60),
      vy: rand(0.6, 1.4),
      vx: rand(-0.35, 0.35),
      rot: rand(-0.8, 0.8),
      vr: rand(-0.01, 0.01),
      size,
      alpha: rand(0.35, 0.85),
      hue: Math.random() < 0.6 ? 350 : 10 // pink/red
    });
    if (hearts.length > 90) hearts.shift();
  }

  function drawHeart(x,y,size,rot,alpha,hue){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `hsl(${hue} 85% 60%)`;
    ctx.beginPath();
    const s = size;
    ctx.moveTo(0, s*0.35);
    ctx.bezierCurveTo(0, 0, -s, 0, -s, s*0.35);
    ctx.bezierCurveTo(-s, s*0.75, -s*0.2, s*0.95, 0, s*1.2);
    ctx.bezierCurveTo(s*0.2, s*0.95, s, s*0.75, s, s*0.35);
    ctx.bezierCurveTo(s, 0, 0, 0, 0, s*0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  let last = 0;
  function tick(t){
    if (!enabled) { requestAnimationFrame(tick); return; }
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

    if (t - last > 120){
      spawnHeart();
      last = t;
    }

    for (let i=hearts.length-1;i>=0;i--){
      const h = hearts[i];
      h.y -= h.vy;
      h.x += h.vx;
      h.rot += h.vr;
      h.alpha -= 0.0016;
      drawHeart(h.x, h.y, h.size, h.rot, h.alpha, h.hue);
      if (h.y < -80 || h.alpha <= 0) hearts.splice(i,1);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  if (toggle){
    toggle.addEventListener("click", () => {
      enabled = !enabled;
      toggle.textContent = enabled ? "♥ Hearts" : "♡ Hearts";
      if (!enabled) ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    });
  }
})();


// =========================
// CART + CHECKOUT (demo)
// =========================
const CART_STATE_KEY = "giftella_cart_v1";
const COUPON_KEY = "giftella_coupon_v1";

function money(n){ return "$" + (Math.round(n * 100) / 100).toFixed(2); }

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_STATE_KEY) || "[]"); } catch { return []; }
}
function saveCart(cart){ localStorage.setItem(CART_STATE_KEY, JSON.stringify(cart)); }

function loadCoupon(){
  try { return JSON.parse(localStorage.getItem(COUPON_KEY) || "null"); } catch { return null; }
}
function saveCoupon(c){ localStorage.setItem(COUPON_KEY, JSON.stringify(c)); }

function cartTotals(cart, coupon){
  const subtotal = cart.reduce((s, it) => s + (it.price * it.qty), 0);
  let discount = 0;
  if (coupon && coupon.type === "percent") discount = subtotal * (coupon.value / 100);
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

function getProductData(el){
  const name = el.dataset.name || el.querySelector(".product-name")?.textContent?.trim() || "Item";
  const price = Number(el.dataset.price || (el.querySelector(".product-price")?.textContent || "").replace(/[^\d.]/g,"")) || 0;
  const image = el.dataset.image || el.querySelector("img")?.getAttribute("src") || "";
  const category = el.dataset.category || "general";
  return { id: name.toLowerCase().replace(/\s+/g,"-") + "-" + category, name, price, image, category };
}

function addToCart(product){
  const cart = loadCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart(cart);
  refreshCartUI();
  openCart();
}

function removeFromCart(id){
  const cart = loadCart().filter(i => i.id !== id);
  saveCart(cart);
  refreshCartUI();
}

function setQty(id, qty){
  const cart = loadCart();
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty = Math.max(1, Math.min(99, qty));
  saveCart(cart);
  refreshCartUI();
}

function clearCart(){
  saveCart([]);
  refreshCartUI();
}

function setCouponFromCode(code){
  const clean = (code || "").trim().toUpperCase();
  if (clean === "LOVE10"){
    saveCoupon({ code: "LOVE10", type: "percent", value: 10 });
    return { ok: true, msg: "LOVE10 applied (10% off)" };
  }
  if (!clean){
    saveCoupon(null);
    return { ok: true, msg: "Coupon cleared" };
  }
  return { ok: false, msg: "Invalid coupon" };
}

function el(id){ return document.getElementById(id); }

function openCart(){
  const d = el("cartDrawer");
  if (!d) return;
  d.classList.add("show");
  d.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeCart(){
  const d = el("cartDrawer");
  if (!d) return;
  d.classList.remove("show");
  d.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openCheckout(){
  const m = el("checkoutModal");
  if (!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  refreshCheckoutSummary();
}
function closeCheckout(){
  const m = el("checkoutModal");
  if (!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function refreshCartUI(){
  const cart = loadCart();
  const coupon = loadCoupon();
  const { subtotal, discount, total } = cartTotals(cart, coupon);

  const count = cart.reduce((s, it) => s + it.qty, 0);
  const cartCount = el("cartCount");
  if (cartCount) cartCount.textContent = String(count);

  const cartSub = el("cartSub");
  if (cartSub) cartSub.textContent = `${count} item${count===1?"":"s"}`;

  const itemsWrap = el("cartItems");
  if (itemsWrap){
    if (!cart.length){
      itemsWrap.innerHTML = `<div class="cart-empty">Your cart is empty. Add chocolates, flowers or cakes to start 💝</div>`;
    } else {
      itemsWrap.innerHTML = cart.map(it => `
        <div class="cart-item">
          <img src="${it.image}" alt="${it.name}"/>
          <div>
            <h4>${it.name}</h4>
            <div class="meta"><span>${money(it.price)}</span><button class="btn" data-remove="${it.id}" type="button">Remove</button></div>
            <div class="qty">
              <button type="button" data-qtyminus="${it.id}">−</button>
              <div class="n">${it.qty}</div>
              <button type="button" data-qtyplus="${it.id}">+</button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }

  const subEl = el("subTotal"); if (subEl) subEl.textContent = money(subtotal);
  const discEl = el("discountLine"); if (discEl) discEl.textContent = "-" + money(discount);
  const totEl = el("grandTotal"); if (totEl) totEl.textContent = money(total);

  const couponInput = el("couponInput");
  if (couponInput){
    couponInput.value = coupon?.code ? coupon.code : "";
  }

  refreshCheckoutSummary();
}

function refreshCheckoutSummary(){
  const cart = loadCart();
  const coupon = loadCoupon();
  const { subtotal, discount, total } = cartTotals(cart, coupon);

  const sumItems = el("summaryItems");
  if (sumItems){
    sumItems.innerHTML = cart.length ? cart.map(it => `
      <div class="sum-row"><span>${it.name} × ${it.qty}</span><span>${money(it.price * it.qty)}</span></div>
    `).join("") : `<div class="small">No items yet. Add something from Chocolates or Flowers.</div>`;
  }
  const sumSub = el("sumSub"); if (sumSub) sumSub.textContent = money(subtotal);
  const sumDisc = el("sumDisc"); if (sumDisc) sumDisc.textContent = "-" + money(discount);
  const sumTot = el("sumTotal"); if (sumTot) sumTot.textContent = money(total);
}

// Bind Add to cart buttons
document.querySelectorAll('button.add[data-action="add"]').forEach(btn => {
  btn.addEventListener("click", () => {
    const productEl = btn.closest(".product");
    if (!productEl) return;
    addToCart(getProductData(productEl));
  });
});

// Open cart button
const openCartBtn = el("openCart");
if (openCartBtn) openCartBtn.addEventListener("click", openCart);

// Drawer close handlers
document.addEventListener("click", (e) => {
  const t = e.target;

  if (t?.dataset?.close === "cart" || t?.getAttribute?.("data-close") === "cart"){
    closeCart();
  }
  if (t?.dataset?.close === "checkout" || t?.getAttribute?.("data-close") === "checkout"){
    closeCheckout();
  }
  if (t?.dataset?.close === "discount" || t?.getAttribute?.("data-close") === "discount"){
    closePopup("discountPopup");
  }
  if (t?.dataset?.close === "ideas" || t?.getAttribute?.("data-close") === "ideas"){
    closePopup("ideasPopup");
  }

  // Remove / qty controls (event delegation)
  if (t?.dataset?.remove){
    removeFromCart(t.dataset.remove);
  }
  if (t?.dataset?.qtyplus){
    const id = t.dataset.qtyplus;
    const cart = loadCart();
    const it = cart.find(x => x.id === id);
    if (it) setQty(id, it.qty + 1);
  }
  if (t?.dataset?.qtyminus){
    const id = t.dataset.qtyminus;
    const cart = loadCart();
    const it = cart.find(x => x.id === id);
    if (it) setQty(id, it.qty - 1);
  }
});

// Apply coupon
const applyCouponBtn = el("applyCoupon");
if (applyCouponBtn){
  applyCouponBtn.addEventListener("click", () => {
    const code = el("couponInput")?.value || "";
    const res = setCouponFromCode(code);
    refreshCartUI();
    // quick message
    const sub = el("cartSub");
    if (sub) sub.textContent = res.msg;
    setTimeout(() => refreshCartUI(), 900);
  });
}

// Clear cart
const clearBtn = el("clearCart");
if (clearBtn) clearBtn.addEventListener("click", clearCart);

// Checkout
const checkoutBtn = el("checkoutBtn");
if (checkoutBtn){
  checkoutBtn.addEventListener("click", () => {
    const cart = loadCart();
    if (!cart.length){
      const sub = el("cartSub");
      if (sub) sub.textContent = "Add something first 🙂";
      return;
    }
    closeCart();
    openCheckout();
  });
}

const checkoutForm = el("checkoutForm");
if (checkoutForm){
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cart = loadCart();
    if (!cart.length){
      el("orderMsg").textContent = "Your cart is empty.";
      return;
    }
    el("orderMsg").textContent = "✅ Order placed! (demo) We’ll contact you soon.";
    clearCart();
    saveCoupon(null);
    refreshCartUI();
    setTimeout(() => closeCheckout(), 1200);
  });
}

// ===== Popups =====
function openPopup(id){
  const p = el(id);
  if (!p) return;
  p.classList.add("show");
  p.setAttribute("aria-hidden", "false");
}
function closePopup(id){
  const p = el(id);
  if (!p) return;
  p.classList.remove("show");
  p.setAttribute("aria-hidden", "true");
}

const useLove10 = el("useLove10");
if (useLove10){
  useLove10.addEventListener("click", () => {
    setCouponFromCode("LOVE10");
    refreshCartUI();
    closePopup("discountPopup");
    openCart();
  });
}

// Show discount popup once per session
(function(){
  const seen = sessionStorage.getItem("giftella_seen_discount");
  if (!seen){
    setTimeout(() => {
      openPopup("discountPopup");
      sessionStorage.setItem("giftella_seen_discount", "1");
    }, 1200);
  }
  const seenIdeas = sessionStorage.getItem("giftella_seen_ideas");
  if (!seenIdeas){
    setTimeout(() => {
      openPopup("ideasPopup");
      sessionStorage.setItem("giftella_seen_ideas", "1");
    }, 2800);
  }
})();

// Initialize UI on load
refreshCartUI();
