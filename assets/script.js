// Jerni Business Holdings — shared front-end behavior

document.addEventListener('DOMContentLoaded', () => {

  // Hero background video — force playback.
  // Some browsers/sandboxed viewers ignore the HTML "autoplay" attribute
  // until play() is called from script, so we drive it explicitly here
  // and retry on the first user interaction as a fallback.
  const heroVideo = document.getElementById('hero-bg-video');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;
    const tryPlay = () => {
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay blocked — resume on the first tap/click/scroll anywhere.
          const resume = () => {
            heroVideo.play().catch(() => {});
            ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt =>
              document.removeEventListener(evt, resume)
            );
          };
          ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt =>
            document.addEventListener(evt, resume, { once: true, passive: true })
          );
        });
      }
    };
    if (heroVideo.readyState >= 2) {
      tryPlay();
    } else {
      heroVideo.addEventListener('loadeddata', tryPlay, { once: true });
    }
  }

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  // Accordion (FAQ)
  document.querySelectorAll('.accordion-item').forEach(item => {
    const head = item.querySelector('.accordion-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Animated counters
  const counters = document.querySelectorAll('[data-count]');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => countObserver.observe(c));

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(r => revealObserver.observe(r));

  // Pricing toggle
  const priceToggle = document.querySelectorAll('.toggle-row button');
  if (priceToggle.length) {
    priceToggle.forEach(btn => {
      btn.addEventListener('click', () => {
        priceToggle.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const period = btn.dataset.period;
        document.querySelectorAll('[data-monthly]').forEach(el => {
          el.textContent = period === 'annual' ? el.dataset.annual : el.dataset.monthly;
        });
        document.querySelectorAll('.price-suffix').forEach(el => {
          el.textContent = period === 'annual' ? '/mo, billed annually' : '/month';
        });
      });
    });
  }

  // Trade Plan Builder demo (client-side only, no persistence)
  const planForm = document.getElementById('plan-builder-form');
  if (planForm) {
    const statusEl = document.getElementById('plan-status');
    const rrOut = document.getElementById('plan-rr');
    function calcRR() {
      const entry = parseFloat(planForm.entry.value);
      const stop = parseFloat(planForm.stop.value);
      const target = parseFloat(planForm.target.value);
      if (!isNaN(entry) && !isNaN(stop) && !isNaN(target) && entry !== stop) {
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        const rr = (reward / risk).toFixed(2);
        rrOut.textContent = '1 : ' + rr;
      } else {
        rrOut.textContent = '—';
      }
    }
    ['entry','stop','target'].forEach(name => {
      planForm[name].addEventListener('input', calcRR);
    });
    planForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const required = ['account','instrument','direction','setup','entry','stop','target','size','confirmation','conditions'];
      const missing = required.some(name => !planForm[name].value);
      const readiness = planForm.querySelector('input[name="readiness"]:checked');
      if (missing || !readiness) {
        statusEl.innerHTML = '<span class="tag" style="background:rgba(239,68,68,.12);color:#b91c1c;">Incomplete — fill every field to organize this plan</span>';
        return;
      }
      statusEl.innerHTML = '<span class="tag tag-green">Trade Plan Organized ✓ — not an endorsement or recommendation</span>';
    });
  }

  // Position size calculator (Resources page)
  const posCalc = document.getElementById('position-size-form');
  if (posCalc) {
    posCalc.addEventListener('input', () => {
      const balance = parseFloat(posCalc.balance.value) || 0;
      const riskPct = parseFloat(posCalc.riskPct.value) || 0;
      const entry = parseFloat(posCalc.entry.value) || 0;
      const stop = parseFloat(posCalc.stop.value) || 0;
      const out = document.getElementById('position-size-out');
      const dollarRisk = balance * (riskPct / 100);
      const perUnitRisk = Math.abs(entry - stop);
      if (perUnitRisk > 0 && dollarRisk > 0) {
        const units = (dollarRisk / perUnitRisk).toFixed(2);
        out.textContent = units + ' units · $' + dollarRisk.toFixed(2) + ' at risk';
      } else {
        out.textContent = '—';
      }
    });
  }

  // Risk to reward calculator (Resources page)
  const rrCalc = document.getElementById('rr-form');
  if (rrCalc) {
    rrCalc.addEventListener('input', () => {
      const entry = parseFloat(rrCalc.entry.value);
      const stop = parseFloat(rrCalc.stop.value);
      const target = parseFloat(rrCalc.target.value);
      const out = document.getElementById('rr-out');
      if (!isNaN(entry) && !isNaN(stop) && !isNaN(target) && entry !== stop) {
        const rr = (Math.abs(target - entry) / Math.abs(entry - stop)).toFixed(2);
        out.textContent = '1 : ' + rr;
      } else {
        out.textContent = '—';
      }
    });
  }

  // Journal filter demo
  const journalFilter = document.getElementById('journal-filter');
  if (journalFilter) {
    const rows = document.querySelectorAll('#journal-table tbody tr');
    journalFilter.addEventListener('change', () => {
      const val = journalFilter.value;
      rows.forEach(row => {
        row.style.display = (val === 'all' || row.dataset.result === val) ? '' : 'none';
      });
    });
  }
});
