/* ══════════════════════════════════════════════
   BELEZA — Main Application JavaScript
   SaaS Premium Agendamento Feminino
   ══════════════════════════════════════════════ */

'use strict';

/* ── Namespace Global ── */
const Beleza = (function () {

  /* ─────────────────────────────────────────
     CONSTANTES
  ───────────────────────────────────────── */
  const STORAGE_USER_KEY   = 'beleza_user';
  const STORAGE_APPTS_KEY  = 'beleza_appointments';
  const STORAGE_RESET_KEY  = 'beleza_reset';

  /* ─────────────────────────────────────────
     TOAST NOTIFICATIONS
  ───────────────────────────────────────── */

  /**
   * Exibe uma notificação toast premium
   * @param {string} message - Mensagem a exibir
   * @param {'success'|'error'|'warning'|'info'} type - Tipo da notificação
   * @param {number} duration - Duração em ms (padrão: 3500)
   */
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✅',
      error:   '❌',
      warning: '⚠️',
      info:    '💜'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  /* ─────────────────────────────────────────
     AUTENTICAÇÃO (localStorage fake)
  ───────────────────────────────────────── */

  /**
   * Retorna o usuário logado ou null
   * @returns {object|null}
   */
  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Salva usuário no localStorage
   * @param {object} user
   */
  function setUser(user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  }

  /**
   * Remove usuário (logout)
   */
  function logout() {
    localStorage.removeItem(STORAGE_USER_KEY);
    showToast('Você saiu da conta. Até logo! 👋', 'info');
    setTimeout(() => window.location.href = 'home.html', 1000);
  }

  /* ─────────────────────────────────────────
     RECUPERAÇÃO DE SENHA
  ───────────────────────────────────────── */

  /**
   * Gera código numérico aleatório de 6 dígitos
   * @returns {string}
   */
  function generateResetCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Salva código de reset para o email (simulação)
   * @param {string} email
   * @returns {string} código gerado
   */
  function saveResetCode(email) {
    const code    = generateResetCode();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutos
    localStorage.setItem(STORAGE_RESET_KEY, JSON.stringify({ email, code, expires }));
    return code;
  }

  /**
   * Valida código de reset inserido pelo usuário
   * @param {string} email
   * @param {string} code
   * @returns {boolean}
   */
  function validateResetCode(email, code) {
    try {
      const raw  = localStorage.getItem(STORAGE_RESET_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.email !== email) return false;
      if (data.code  !== code.trim()) return false;
      if (Date.now() > data.expires) { clearResetCode(); return false; }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove código de reset após uso
   */
  function clearResetCode() {
    localStorage.removeItem(STORAGE_RESET_KEY);
  }

  /* ─────────────────────────────────────────
     NAVBAR DINÂMICA
  ───────────────────────────────────────── */

  /**
   * Inicializa a navbar:
   * - Scroll effect
   * - Active link
   * - Menu mobile
   * - User state (Entrar / nome)
   */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Scroll effect
    function onScroll() {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Active link
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    const links = navbar.querySelectorAll('.navbar-links a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'home.html')) {
        link.classList.add('active');
      }
    });

    // Mobile burger
    const burger  = document.getElementById('navbar-burger');
    const drawer  = document.getElementById('navbar-drawer');
    if (burger && drawer) {
      burger.addEventListener('click', () => {
        const isOpen = drawer.classList.toggle('open');
        burger.classList.toggle('open', isOpen);
        burger.setAttribute('aria-expanded', isOpen);
      });

      // Fechar drawer ao clicar em link
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          drawer.classList.remove('open');
          burger.classList.remove('open');
        });
      });
    }

    // Atualizar botão de auth
    updateAuthButton();
  }

  /**
   * Atualiza o botão de autenticação na navbar
   */
  function updateAuthButton() {
    const user = getUser();
    const btnWrap = document.querySelector('.navbar-actions');
    if (!btnWrap) return;

    if (user) {
      btnWrap.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:13px; color:var(--muted); font-weight:500;">
            Olá, ${user.name.split(' ')[0]} ✨
          </span>
          <button class="btn btn-secondary btn-sm" onclick="Beleza.logout()">Sair</button>
        </div>
      `;
    } else {
      btnWrap.innerHTML = `
        <a href="login.html" class="btn btn-primary btn-sm">Entrar</a>
      `;
    }
  }

  /* ─────────────────────────────────────────
     SCROLL ANIMATIONS
  ───────────────────────────────────────── */

  /**
   * Inicializa animações de entrada no scroll
   */
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-up, .fade-in').forEach(el => {
      observer.observe(el);
    });
  }

  /* ─────────────────────────────────────────
     CALENDAR (agendamento.html)
  ───────────────────────────────────────── */

  let calendarDate = new Date();
  let selectedDate = null;
  let selectedTime = null;

  /**
   * Renderiza o calendário completo
   */
  function renderCalendar() {
    const title = document.getElementById('cal-title');
    const grid  = document.getElementById('cal-grid');
    if (!title || !grid) return;

    const year  = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();

    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    title.textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    grid.innerHTML = '';

    // Dias da semana
    ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-day-header';
      el.textContent = d;
      grid.appendChild(el);
    });

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
      const el = document.createElement('div');
      el.className = 'calendar-day other-month';
      el.textContent = daysInPrev - i;
      grid.appendChild(el);
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      const el    = document.createElement('div');
      const date  = new Date(year, month, d);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = date.toDateString() === today.toDateString();
      const isSunday = date.getDay() === 0;

      el.className = 'calendar-day';
      el.textContent = d;

      if (isPast || isSunday) {
        el.classList.add('disabled');
      } else {
        if (isToday) el.classList.add('today');
        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
          el.classList.add('selected');
        }
        el.addEventListener('click', () => selectDate(date, el));
      }
      grid.appendChild(el);
    }
  }

  /**
   * Seleciona uma data no calendário
   */
  function selectDate(date, el) {
    selectedDate = date;
    document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
    renderTimeSlots();
    updateBookingSummary();
  }

  /**
   * Navega o calendário para o mês anterior/próximo
   */
  function calendarNav(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderCalendar();
  }

  /**
   * Renderiza os horários disponíveis
   */
  function renderTimeSlots() {
    const wrap = document.getElementById('time-slots');
    if (!wrap) return;

    const slots   = ['09:00','09:30','10:00','10:30','11:00','11:30',
                     '13:00','13:30','14:00','14:30','15:00','15:30',
                     '16:00','16:30','17:00','17:30','18:00','18:30'];
    const taken   = ['09:30','11:00','14:00','16:30']; // Simulação

    wrap.innerHTML = '';
    slots.forEach(slot => {
      const el = document.createElement('div');
      el.className = 'time-slot' + (taken.includes(slot) ? ' taken' : '');
      el.textContent = slot;
      if (!taken.includes(slot)) {
        el.addEventListener('click', () => selectTime(slot, el));
      }
      wrap.appendChild(el);
    });

    document.getElementById('time-slots-section')?.classList.remove('hidden');
  }

  /**
   * Seleciona um horário
   */
  function selectTime(time, el) {
    selectedTime = time;
    document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    updateBookingSummary();
  }

  /**
   * Atualiza o resumo do agendamento
   */
  function updateBookingSummary() {
    const dateEl    = document.getElementById('summary-date');
    const timeEl    = document.getElementById('summary-time');
    const confirmBtn = document.getElementById('confirm-booking-btn');

    if (dateEl && selectedDate) {
      const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
      dateEl.textContent = `${days[selectedDate.getDay()]}, ${selectedDate.getDate()}/${selectedDate.getMonth()+1}`;
    }
    if (timeEl && selectedTime) {
      timeEl.textContent = selectedTime;
    }
    if (confirmBtn && selectedDate && selectedTime) {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove('opacity-50');
    }
  }

  /**
   * Confirma o agendamento (fake)
   */
  function confirmBooking() {
    const user = getUser();
    if (!user) {
      showToast('Faça login para confirmar seu agendamento 💖', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    const service  = document.getElementById('select-service')?.value;
    const prof     = document.getElementById('select-professional')?.value;
    const btn      = document.getElementById('confirm-booking-btn');

    if (!service || !prof) {
      showToast('Selecione serviço e profissional 💅', 'warning');
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast('Selecione data e horário 📅', 'warning');
      return;
    }

    // Loading
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      const appointment = {
        id: Date.now(),
        service, prof, user: user.name,
        date: selectedDate.toLocaleDateString('pt-BR'),
        time: selectedTime,
        createdAt: new Date().toISOString()
      };

      const appts = JSON.parse(localStorage.getItem(STORAGE_APPTS_KEY) || '[]');
      appts.push(appointment);
      localStorage.setItem(STORAGE_APPTS_KEY, JSON.stringify(appts));

      showToast('Agendamento confirmado! 🎉 Você receberá um lembrete.', 'success', 5000);
      btn.classList.remove('loading');
      btn.disabled = false;

      // Reset
      selectedDate = null;
      selectedTime = null;
      renderCalendar();

      const wrap = document.getElementById('time-slots');
      if (wrap) wrap.innerHTML = '';
    }, 1800);
  }

  /* ─────────────────────────────────────────
     MODAL HELPERS
  ───────────────────────────────────────── */

  /**
   * Abre uma modal pelo ID
   * @param {string} id
   */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(id);
    });
  }

  /**
   * Fecha uma modal pelo ID
   * @param {string} id
   */
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ─────────────────────────────────────────
     TOGGLE PASSWORD
  ───────────────────────────────────────── */

  /**
   * Alterna visibilidade do campo de senha
   * @param {string} inputId
   * @param {HTMLElement} btn
   */
  function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
      btn.title = 'Ocultar senha';
    } else {
      input.type = 'password';
      btn.textContent = '👁';
      btn.title = 'Mostrar senha';
    }
  }

  /* ─────────────────────────────────────────
     VALIDAÇÃO DE FORMULÁRIO
  ───────────────────────────────────────── */

  /**
   * Valida email
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /**
   * Valida senha (mínimo 8 chars)
   * @param {string} password
   * @returns {boolean}
   */
  function isValidPassword(password) {
    return password.length >= 8;
  }

  /**
   * Aplica feedback visual num input
   * @param {string} id - ID do input
   * @param {boolean} valid
   */
  function setInputState(id, valid) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('error', !valid);
    el.classList.toggle('success', valid);
  }

  /* ─────────────────────────────────────────
     PHONE MASK
  ───────────────────────────────────────── */

  /**
   * Inicializa máscaras de input
   */
  function initMasks() {
    document.querySelectorAll('[data-mask="phone"]').forEach(el => {
      el.addEventListener('input', () => {
        let v = el.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 10) {
          v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (v.length > 6) {
          v = v.replace(/^(\d{2})(\d{4})/, '($1) $2-');
        } else if (v.length > 2) {
          v = v.replace(/^(\d{2})/, '($1) ');
        }
        el.value = v;
      });
    });
  }

  /* ─────────────────────────────────────────
     INIT GERAL
  ───────────────────────────────────────── */

  /**
   * Ponto de entrada da aplicação
   */
  function init() {
    initNavbar();
    initScrollAnimations();
    initMasks();

    // Keyboard shortcut: ESC fecha modais
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => {
          closeModal(m.id);
        });
      }
    });
  }

  // Auto-init após DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ─────────────────────────────────────────
     API PÚBLICA
  ───────────────────────────────────────── */
  return {
    // Auth
    getUser,
    setUser,
    logout,
    // Toast
    showToast,
    // Modais
    openModal,
    closeModal,
    // Recuperação
    generateResetCode,
    saveResetCode,
    validateResetCode,
    clearResetCode,
    // Formulário
    togglePassword,
    isValidEmail,
    isValidPassword,
    setInputState,
    // Calendário
    renderCalendar,
    calendarNav,
    confirmBooking,
    updateBookingSummary,
  };

})();

// Expõe globalmente para uso inline no HTML
window.Beleza = Beleza;