/* =============================================================
   main.js — Suryadoot Energy Solution
   All UI logic, Calculator, Gallery Filter, Animations
   ============================================================= */

document.addEventListener('DOMContentLoaded', function () {

  // ── Stub gtag if GA is not loaded (dev safety) ──
  if (typeof gtag !== 'function') {
    window.gtag = function () {};
  }

  initNavbar();
  initCalculator();
  initEducationTabs();
  initNetMeter();
  initGallery();
  initContactForm();
  initScrollAnimations();
  initGAClickEvents();
});

/* ============================================================
   NAVBAR
   ============================================================ */
function initNavbar() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '✕' : '☰';
  });

  // Close on link click (mobile)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Active nav highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   SOLAR CALCULATOR ENGINE
   ============================================================ */
let calcTimer = null;

function initCalculator() {
  const typeEl = document.getElementById('consumerType');
  const tariffEl = document.getElementById('tariffRate');
  if (!typeEl || !tariffEl) return;

  // Set default tariff from config
  tariffEl.value = SOLAR_CONFIG.tariff[typeEl.value];

  // Update tariff default when consumer type changes
  typeEl.addEventListener('change', () => {
    tariffEl.value = SOLAR_CONFIG.tariff[typeEl.value];
    recalculate();
  });

  // Live recalculation (debounced 300ms)
  ['monthlyBill', 'roofArea', 'tariffRate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      clearTimeout(calcTimer);
      calcTimer = setTimeout(recalculate, 300);
    });
  });

  const resetBtn = document.getElementById('calcReset');
  if (resetBtn) resetBtn.addEventListener('click', resetCalc);
}

function recalculate() {
  const bill = parseFloat(document.getElementById('monthlyBill').value);
  const area = parseFloat(document.getElementById('roofArea').value) || null;
  const type = document.getElementById('consumerType').value;
  const tariff = parseFloat(document.getElementById('tariffRate').value) || SOLAR_CONFIG.tariff[type];

  if (!bill || bill < 500) { showPlaceholder(); return; }

  // STEP 1: Recommended system size
  const sizeFromBill = bill / SOLAR_CONFIG.billPerKw;
  const sizeFromRoof = area ? area / SOLAR_CONFIG.sqftPerKw : Infinity;
  let size = Math.min(sizeFromBill, sizeFromRoof);
  size = Math.max(1, Math.round(size * 10) / 10);

  // STEP 2: Monthly generation
  const dailyGen = size * SOLAR_CONFIG.peakSunHours * SOLAR_CONFIG.systemEfficiency;
  const monthlyGen = dailyGen * 30;

  // STEP 3: Monthly saving
  const unitsFromBill = bill / tariff;
  const billableUnits = Math.min(monthlyGen, unitsFromBill);
  const savingMonthly = billableUnits * tariff;
  const savingPct = Math.round((savingMonthly / bill) * 100);

  // STEP 4: Subsidy (residential only)
  let subsidy = 0;
  if (type === 'residential') {
    const s = SOLAR_CONFIG.subsidy;
    if      (size <= 1) subsidy = s.upTo1kW;
    else if (size <= 2) subsidy = s.upTo2kW;
    else if (size <= 3) subsidy = s.upTo3kW;
    else                subsidy = s.above3kW;
  }

  // STEP 5: System cost
  const costPerKw = SOLAR_CONFIG.costPerKw[type] || SOLAR_CONFIG.costPerKw.residential;
  const grossCost = size * costPerKw;
  const netCost = Math.max(0, grossCost - subsidy);

  // STEP 6: Payback
  const paybackYrs = savingMonthly > 0 ? (netCost / (savingMonthly * 12)) : 0;

  // STEP 7: Environmental
  const co2Annual = monthlyGen * 12 * SOLAR_CONFIG.co2PerUnit;
  const trees = Math.round(size * SOLAR_CONFIG.treesPerKw);

  showResults({ size, monthlyGen, savingMonthly, savingPct, subsidy,
                grossCost, netCost, paybackYrs, co2Annual, trees, type, bill });

  buildWALink({ size, savingMonthly, subsidy, netCost, paybackYrs });

  // GA4 Event
  gtag('event', 'calculator_used', {
    event_category: 'Calculator',
    monthly_bill: bill,
    system_size: size,
    consumer_type: type
  });
}

function showResults(r) {
  const placeholder = document.getElementById('resultsPlaceholder');
  const grid = document.getElementById('resultsGrid');
  const ctas = document.getElementById('calcCTAs');
  if (placeholder) placeholder.style.display = 'none';
  if (grid) grid.style.display = 'grid';
  if (ctas) ctas.style.display = 'flex';

  setText('res-size',    r.size + ' kW');
  setText('res-gen',     Math.round(r.monthlyGen) + ' units/month');
  setText('res-saving',  '₹' + Math.round(r.savingMonthly).toLocaleString('en-IN') + '/mo (' + r.savingPct + '%)');
  setText('res-subsidy', r.type === 'residential'
    ? '₹' + r.subsidy.toLocaleString('en-IN') : 'N/A (Commercial)');
  setText('res-netcost', '₹' + Math.round(r.netCost).toLocaleString('en-IN'));
  setText('res-payback', r.paybackYrs.toFixed(1) + ' years');
  setText('res-trees',   r.trees + ' trees equiv/yr');
  setText('res-co2',     Math.round(r.co2Annual) + ' kg/year');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function buildWALink(r) {
  const subsidy = r.subsidy ? '₹' + r.subsidy.toLocaleString('en-IN') : 'N/A';
  const msg = `Hi Suryadoot Team! I used your Solar Calculator and got these results:%0A%0A` +
    `• System Size: ${r.size} kW%0A` +
    `• Monthly Savings: ₹${Math.round(r.savingMonthly).toLocaleString('en-IN')}%0A` +
    `• Subsidy: ${subsidy}%0A` +
    `• Net Cost: ₹${Math.round(r.netCost).toLocaleString('en-IN')}%0A` +
    `• Payback: ${r.paybackYrs.toFixed(1)} years%0A%0A` +
    `Please send me a detailed quote. Thank you!`;
  const btn = document.getElementById('btnWAQuote');
  if (btn) btn.href = SOLAR_CONFIG.waBaseUrl + SOLAR_CONFIG.whatsappNumber + '?text=' + msg;
}

function showPlaceholder() {
  const placeholder = document.getElementById('resultsPlaceholder');
  const grid = document.getElementById('resultsGrid');
  const ctas = document.getElementById('calcCTAs');
  if (placeholder) placeholder.style.display = 'flex';
  if (grid) grid.style.display = 'none';
  if (ctas) ctas.style.display = 'none';
}

function resetCalc() {
  const billEl = document.getElementById('monthlyBill');
  const areaEl = document.getElementById('roofArea');
  const tariffEl = document.getElementById('tariffRate');
  const typeEl = document.getElementById('consumerType');
  if (billEl) billEl.value = '';
  if (areaEl) areaEl.value = '';
  if (typeEl && tariffEl) tariffEl.value = SOLAR_CONFIG.tariff[typeEl.value];
  showPlaceholder();
}

/* ============================================================
   EDUCATION TABS
   ============================================================ */
function initEducationTabs() {
  const tabs = document.querySelectorAll('.edu-tab');
  const panels = document.querySelectorAll('.edu-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

/* ============================================================
   NET METERING SVG DAY/NIGHT TOGGLE
   ============================================================ */
function initNetMeter() {
  const svg = document.getElementById('nmSvg');
  const toggleBtns = document.querySelectorAll('.nm-toggle');
  const caption = document.getElementById('nmCaption');
  if (!svg) return;

  svg.classList.add('day-mode');

  const captions = {
    day: '☀️ Daytime: Your solar panels power your home directly. Excess electricity flows to the grid — your meter runs backwards! You earn credits for every unit exported.',
    night: '🌙 Nighttime: Your solar system is dormant. Your home draws power from the DISCOM grid, using the credits you earned during the day. You only pay for the net difference!'
  };

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      svg.classList.remove('day-mode', 'night-mode');
      svg.classList.add(mode + '-mode');
      if (caption) caption.textContent = captions[mode];
    });
  });
}

/* ============================================================
   GALLERY FILTER
   ============================================================ */
function initGallery() {
  const filterBtns = document.querySelectorAll('.gf-btn');
  const cards = document.querySelectorAll('.gallery-card');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.style.opacity = match ? '1' : '0';
        card.style.transform = match ? 'scale(1)' : 'scale(0.9)';
        card.style.pointerEvents = match ? 'auto' : 'none';
        setTimeout(() => {
          card.style.display = match ? '' : 'none';
        }, match ? 0 : 350);
        if (match) card.style.display = '';
      });
    });
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const btn = this.querySelector('[type=submit]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      const res = await fetch(this.action, {
        method: 'POST', body: formData,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const successEl = document.getElementById('formSuccess');
        if (successEl) successEl.style.display = 'block';
        this.reset();
        btn.textContent = '✅ Sent!';
        gtag('event', 'form_submit', { event_category: 'Lead', event_label: 'Contact Form' });
      } else {
        btn.textContent = 'Error — Try again';
        btn.disabled = false;
      }
    } catch {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

/* ============================================================
   SCROLL FADE-IN ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
  const fadeEls = document.querySelectorAll('.section-fade');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  fadeEls.forEach(el => io.observe(el));
}

/* ============================================================
   GA4 CLICK EVENTS
   ============================================================ */
function initGAClickEvents() {
  // Floating WA button
  const fab = document.querySelector('.fab-whatsapp');
  if (fab) fab.addEventListener('click', () =>
    gtag('event', 'wa_fab_click', { event_category: 'Contact', location: 'floating_button' }));

  // Call Now links
  document.querySelectorAll('[href^="tel:"]').forEach(el =>
    el.addEventListener('click', () =>
      gtag('event', 'call_now_click', { event_category: 'Contact' })));

  // WA Quote from calculator
  const waQuoteBtn = document.getElementById('btnWAQuote');
  if (waQuoteBtn) waQuoteBtn.addEventListener('click', () => {
    const sizeEl = document.getElementById('res-size');
    gtag('event', 'wa_quote_click', {
      event_category: 'Lead',
      system_size: sizeEl ? sizeEl.textContent : ''
    });
  });

  // Free visit buttons
  document.querySelectorAll('[href="#contact"]').forEach(el => {
    if (el.textContent.toLowerCase().includes('visit') || el.textContent.toLowerCase().includes('visit')) {
      el.addEventListener('click', () =>
        gtag('event', 'free_visit_click', { event_category: 'Lead' }));
    }
  });
}
