/* ================================================
   BELEZZA — Main JavaScript
   ================================================ */

// ── Navbar scroll behavior ──────────────────────
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
  // Run on load too
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}

// ── Mobile menu ──────────────────────────────────
const menuToggle = document.querySelector('.menu-toggle');
const navLinks   = document.querySelector('.navbar-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = menuToggle.querySelectorAll('span');
    spans.forEach(s => s.style.background = navLinks.classList.contains('open') ? 'var(--charcoal)' : '');
  });
  document.addEventListener('click', e => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

// ── Active nav link ──────────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.navbar-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ── Auth state ───────────────────────────────────
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('belezza_user')); } catch { return null; }
};
const setUser = (u) => localStorage.setItem('belezza_user', JSON.stringify(u));
const logout  = () => { localStorage.removeItem('belezza_user'); window.location.href = 'login.html'; };

// Update navbar user button
function updateNavbarUser() {
  const user = getUser();
  const actionsEl = document.querySelector('.navbar-actions');
  if (!actionsEl) return;
  if (user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    actionsEl.innerHTML = `
      <div class="navbar-user-btn" id="user-menu-btn">
        <div class="navbar-user-avatar">${initials}</div>
        <span>${user.name.split(' ')[0]}</span>
        <span style="font-size:10px; opacity:0.6;">▾</span>
      </div>
      <div id="user-dropdown" style="display:none; position:absolute; top:80px; right:24px; background:var(--white); border:1px solid var(--border); border-radius:var(--radius-md); padding:8px; min-width:180px; box-shadow:var(--shadow-hover); z-index:2000;">
        <div style="padding:12px 16px; border-bottom:1px solid var(--border); margin-bottom:8px;">
          <div style="font-size:14px; font-weight:600; color:var(--charcoal);">${user.name}</div>
          <div style="font-size:12px; color:var(--muted);">${user.email}</div>
        </div>
        <a href="agendamentos.html" style="display:flex; align-items:center; gap:10px; padding:10px 16px; border-radius:8px; font-size:14px; color:var(--charcoal); transition:var(--transition);" onmouseover="this.style.background='var(--rose-pale)'" onmouseout="this.style.background=''">📅 Meus Agendamentos</a>
        <a href="#" onclick="logout(); return false;" style="display:flex; align-items:center; gap:10px; padding:10px 16px; border-radius:8px; font-size:14px; color:#E57373; transition:var(--transition);" onmouseover="this.style.background='var(--rose-pale)'" onmouseout="this.style.background=''">🚪 Sair</a>
      </div>
    `;
    document.getElementById('user-menu-btn')?.addEventListener('click', () => {
      const dd = document.getElementById('user-dropdown');
      dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', e => {
      if (!document.getElementById('user-menu-btn')?.contains(e.target)) {
        const dd = document.getElementById('user-dropdown');
        if (dd) dd.style.display = 'none';
      }
    });
  } else {
    actionsEl.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Entrar</a>`;
  }
}
updateNavbarUser();

// ── Toast Notifications ──────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '💬', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s reverse forwards';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ── Modal helper ────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
  if (e.target.classList.contains('modal-close')) e.target.closest('.modal-overlay')?.classList.remove('active');
});

// ── Intersection Observer – fade in ─────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .team-card, .stat-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── Calendar Widget ─────────────────────────────
class Calendar {
  constructor(el, opts = {}) {
    this.el          = typeof el === 'string' ? document.querySelector(el) : el;
    this.current     = new Date();
    this.selected    = null;
    this.onSelect    = opts.onSelect || (() => {});
    this.disablePast = opts.disablePast !== false;
    this.availableDates = opts.availableDates || null;
    if (this.el) this.render();
  }
  render() {
    const { current } = this;
    const today = new Date();
    const year  = current.getFullYear();
    const month = current.getMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const dayNames   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = `
      <div class="calendar-header">
        <button class="calendar-nav" data-action="prev">‹</button>
        <div class="calendar-month">${monthNames[month]} ${year}</div>
        <button class="calendar-nav" data-action="next">›</button>
      </div>
      <div class="calendar-grid">
        ${dayNames.map(d => `<div class="calendar-day-name">${d}</div>`).join('')}
        ${Array(firstDay === 0 ? 6 : firstDay - 1).fill('<div></div>').join('')}
    `;
    for (let d = 1; d <= daysInMonth; d++) {
      const date   = new Date(year, month, d);
      const isToday = date.toDateString() === today.toDateString();
      const isPast  = this.disablePast && date < today && !isToday;
      const isSel   = this.selected && date.toDateString() === this.selected.toDateString();
      const hasSlot = !isPast && (this.availableDates === null || this.availableDates.includes(d));
      let cls = 'calendar-day';
      if (isPast)  cls += ' disabled';
      if (isToday) cls += ' today';
      if (isSel)   cls += ' selected';
      if (hasSlot && !isPast) cls += ' has-slot';
      html += `<div class="${cls}" data-day="${d}">${d}</div>`;
    }
    html += '</div>';
    this.el.innerHTML = html;
    this.el.querySelectorAll('.calendar-day:not(.disabled)').forEach(day => {
      day.addEventListener('click', () => {
        const d = parseInt(day.dataset.day);
        this.selected = new Date(year, month, d);
        this.onSelect(this.selected);
        this.render();
      });
    });
    this.el.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
      this.current = new Date(year, month - 1, 1); this.render();
    });
    this.el.querySelector('[data-action="next"]')?.addEventListener('click', () => {
      this.current = new Date(year, month + 1, 1); this.render();
    });
  }
}

// ── SlotPicker ──────────────────────────────────
class SlotPicker {
  constructor(el, opts = {}) {
    this.el          = typeof el === 'string' ? document.querySelector(el) : el;
    this.slots       = opts.slots || this.defaultSlots();
    this.unavailable = opts.unavailable || [];
    this.selected    = null;
    this.onSelect    = opts.onSelect || (() => {});
    if (this.el) this.render();
  }
  defaultSlots() {
    const times = [];
    for (let h = 8; h <= 18; h++) {
      ['00', '30'].forEach(m => { if (h < 18 || m === '00') times.push(`${String(h).padStart(2,'0')}:${m}`); });
    }
    return times;
  }
  render() {
    const html = this.slots.map(time => {
      const unavail  = this.unavailable.includes(time);
      const selected = this.selected === time;
      return `<div class="slot${unavail ? ' unavailable' : ''}${selected ? ' selected' : ''}" data-time="${time}">${time}</div>`;
    }).join('');
    this.el.innerHTML = `<div class="slots-grid">${html}</div>`;
    this.el.querySelectorAll('.slot:not(.unavailable)').forEach(slot => {
      slot.addEventListener('click', () => {
        this.selected = slot.dataset.time;
        this.onSelect(this.selected);
        this.render();
      });
    });
  }
}

// ── Format helpers ───────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function formatDateShort(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatCurrency(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Input mask – phone
document.querySelectorAll('input[data-mask="phone"]').forEach(input => {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10)      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    else if (v.length > 6)  v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    else if (v.length > 2)  v = v.replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
    this.value = v;
  });
});

// ── Expose globals ───────────────────────────────
window.Belezza = {
  Calendar, SlotPicker, showToast, openModal, closeModal,
  formatDate, formatDateShort, formatCurrency,
  getUser, setUser, logout
};