/**
 * ============================================================================
 * THE EYESHADES STUDIO - ADMIN DASHBOARD CONTROLLER (admin.js)
 * Talks to the same window.EyeShadesAPI as the public site (api.js), using
 * the admin-only methods: getAllOrders / updateOrder / getVisitorStats.
 * ============================================================================
 */

(function () {
  'use strict';

  const state = {
    orders: [],
    activeFilter: 'All'
  };

  const DOM = {};

  function initDOM() {
    DOM.loginScreen = document.getElementById('adminLoginScreen');
    DOM.loginError = document.getElementById('adminLoginError');
    DOM.passwordInput = document.getElementById('adminPasswordInput');
    DOM.loginBtn = document.getElementById('adminLoginBtn');

    DOM.shell = document.getElementById('adminShell');
    DOM.logoutBtn = document.getElementById('adminLogoutBtn');
    DOM.refreshBtn = document.getElementById('adminRefreshBtn');

    DOM.statTotalVisits = document.getElementById('statTotalVisits');
    DOM.statTodayVisits = document.getElementById('statTodayVisits');
    DOM.statTotalOrders = document.getElementById('statTotalOrders');
    DOM.statPendingOrders = document.getElementById('statPendingOrders');
    DOM.visitsBarsRow = document.getElementById('visitsBarsRow');

    DOM.filterRow = document.getElementById('adminFilterRow');
    DOM.ordersList = document.getElementById('adminOrdersList');

    DOM.toastContainer = document.getElementById('toastContainer');
  }

  function showToast(message, isError = false) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'studio-toast';
    toast.innerHTML = `<span>${isError ? '\u26a0\ufe0f' : '\u2705'}</span><span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ---------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------
  function checkAuth() {
    if (window.EyeShadesAPI.isAdminAuthed()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    DOM.loginScreen.style.display = 'flex';
    DOM.shell.classList.remove('active');
  }

  function showDashboard() {
    DOM.loginScreen.style.display = 'none';
    DOM.shell.classList.add('active');
    refreshAll();
  }

  function attemptLogin() {
    const pw = DOM.passwordInput.value;
    if (window.EyeShadesAPI.adminLogin(pw)) {
      DOM.loginError.textContent = '';
      DOM.passwordInput.value = '';
      showDashboard();
    } else {
      DOM.loginError.textContent = 'Incorrect password. Try again.';
    }
  }

  // ---------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------
  async function refreshAll() {
    await Promise.all([loadStats(), loadOrders()]);
  }

  async function loadStats() {
    try {
      const [visits, orders] = await Promise.all([
        window.EyeShadesAPI.getVisitorStats(),
        window.EyeShadesAPI.getAllOrders()
      ]);

      DOM.statTotalVisits.textContent = visits.totalVisits;
      DOM.statTodayVisits.textContent = visits.todayVisits;
      DOM.statTotalOrders.textContent = orders.length;
      DOM.statPendingOrders.textContent = orders.filter(o => o.status === 'Pending Review').length;

      renderVisitsChart(visits.last7Days);
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }

  function renderVisitsChart(last7Days) {
    if (!DOM.visitsBarsRow) return;
    const max = Math.max(1, ...last7Days.map(d => d.count));

    DOM.visitsBarsRow.innerHTML = last7Days.map(d => {
      const heightPct = Math.max(4, Math.round((d.count / max) * 100));
      const label = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
      return `
        <div class="visits-bar-col">
          <span class="visits-bar-count">${d.count}</span>
          <div class="visits-bar" style="height: ${heightPct}%;"></div>
          <span class="visits-bar-label">${label}</span>
        </div>
      `;
    }).join('');
  }

  async function loadOrders() {
    try {
      state.orders = await window.EyeShadesAPI.getAllOrders();
      renderOrders();
    } catch (err) {
      console.error('Orders load error:', err);
    }
  }

  // ---------------------------------------------------------------------
  // Orders rendering
  // ---------------------------------------------------------------------
  function renderOrders() {
    const filtered = state.activeFilter === 'All'
      ? state.orders
      : state.orders.filter(o => o.status === state.activeFilter);

    if (!filtered.length) {
      DOM.ordersList.innerHTML = `<div class="admin-empty-state">No orders in this view yet.</div>`;
      return;
    }

    DOM.ordersList.innerHTML = filtered.map(order => orderCardHTML(order)).join('');
    filtered.forEach(order => wireOrderCard(order));
  }

  function orderCardHTML(order) {
    const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
    const priceValue = order.finalPrice != null ? order.finalPrice : order.estimatedBudget;

    return `
      <div class="admin-order-card" data-order-id="${order.id}">
        <div class="admin-order-top">
          <div>
            <div class="admin-order-id">#${escapeHtml(order.id)}</div>
            <div class="admin-order-client">${escapeHtml(order.clientName || 'Unknown client')}</div>
            <div class="admin-order-email">${escapeHtml(order.email || '')}</div>
          </div>
          <span class="status-chip ${statusClass}">${escapeHtml(order.status)}</span>
        </div>

        <div class="admin-order-meta">
          ${escapeHtml(order.tier || 'Custom Portrait')} &bull; ${escapeHtml(order.framing || 'Unframed')} &bull; Estimate: \u20b9${Number(order.estimatedBudget) || 0}
          ${order.date ? `&bull; Submitted ${escapeHtml(order.date)}` : ''}
        </div>

        ${order.brief ? `<div class="admin-order-brief">${escapeHtml(order.brief)}</div>` : ''}

        <div class="admin-order-controls">
          <div class="admin-field-mini">
            <label>Final Price (\u20b9)</label>
            <input type="number" class="order-price-input" value="${priceValue || ''}" min="0" step="1">
          </div>

          <div class="admin-field-mini">
            <label>Status</label>
            <select class="order-status-select">
              ${['Pending Review', 'Accepted', 'In Progress', 'Completed', 'Rejected'].map(s =>
                `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>

          <div class="admin-field-mini">
            <label>Progress (%)</label>
            <input type="number" class="order-progress-input" value="${order.progress || 0}" min="0" max="100" step="5">
          </div>

          <div class="admin-order-actions">
            ${order.status === 'Pending Review' ? `
              <button class="btn-admin-accept order-accept-btn">ACCEPT</button>
              <button class="btn-admin-reject order-reject-btn">REJECT</button>
            ` : ''}
            <button class="btn-admin-save order-save-btn">SAVE</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireOrderCard(order) {
    const card = DOM.ordersList.querySelector(`[data-order-id="${cssEscape(order.id)}"]`);
    if (!card) return;

    const priceInput = card.querySelector('.order-price-input');
    const statusSelect = card.querySelector('.order-status-select');
    const progressInput = card.querySelector('.order-progress-input');
    const saveBtn = card.querySelector('.order-save-btn');
    const acceptBtn = card.querySelector('.order-accept-btn');
    const rejectBtn = card.querySelector('.order-reject-btn');

    const save = async (statusOverride) => {
      const patch = {
        finalPrice: priceInput.value ? Number(priceInput.value) : null,
        status: statusOverride || statusSelect.value,
        progress: Number(progressInput.value) || 0
      };
      try {
        await window.EyeShadesAPI.updateOrder(order.id, patch);
        showToast(`Order #${order.id} updated`);
        await refreshAll();
      } catch (err) {
        showToast('Failed to update order', true);
      }
    };

    if (saveBtn) saveBtn.addEventListener('click', () => save());
    if (acceptBtn) acceptBtn.addEventListener('click', () => save('Accepted'));
    if (rejectBtn) rejectBtn.addEventListener('click', () => save('Rejected'));
  }

  function cssEscape(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------
  function setupEvents() {
    DOM.loginBtn.addEventListener('click', attemptLogin);
    DOM.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });

    DOM.logoutBtn.addEventListener('click', () => {
      window.EyeShadesAPI.adminLogout();
      showLogin();
    });

    DOM.refreshBtn.addEventListener('click', refreshAll);

    DOM.filterRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-filter-btn');
      if (!btn) return;
      DOM.filterRow.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.getAttribute('data-filter');
      renderOrders();
    });
  }

  function bootstrap() {
    initDOM();
    setupEvents();
    checkAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();