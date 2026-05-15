'use strict';

const TOKEN_KEY = 'atv_admin_token';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  users: [],
  catalog: [],
  tickets: {},          // userId -> tickets[] (cache)
  expanded: new Set(),  // expanded user ids
  search: '',
};

const $ = (id) => document.getElementById(id);
const loginView = $('login-view');
const dashboardView = $('dashboard-view');
const loginForm = $('login-form');
const loginPassword = $('login-password');
const loginError = $('login-error');
const loginBtn = $('login-btn');
const envLabel = $('env-label');
const statsEl = $('stats');
const usersEl = $('users');
const searchEl = $('search');
const userCountEl = $('user-count');
const modal = $('modal');
const modalMessage = $('modal-message');
const modalConfirm = $('modal-confirm');
const modalCancel = $('modal-cancel');
const toastEl = $('toast');

// ---- Helpers ----
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtEuro(n) {
  return '€' + Number(n || 0).toFixed(2);
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0] && parts[0][0] || '') + (parts[1] && parts[1][0] || '')).toUpperCase() || '?';
}

let toastTimer;
function toast(msg, type) {
  toastEl.textContent = msg;
  toastEl.className = 'toast' + (type ? ' toast-' + type : '');
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3500);
}

function confirmAction(message) {
  return new Promise((resolve) => {
    modalMessage.textContent = message;
    modal.hidden = false;
    function done(val) {
      modal.hidden = true;
      modalConfirm.removeEventListener('click', onYes);
      modalCancel.removeEventListener('click', onNo);
      resolve(val);
    }
    function onYes() { done(true); }
    function onNo() { done(false); }
    modalConfirm.addEventListener('click', onYes);
    modalCancel.addEventListener('click', onNo);
  });
}

// ---- API ----
async function api(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;

  let res;
  try {
    res = await fetch('/api/admin' + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Impossibile contattare il server.');
  }

  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (res.status === 401 && path !== '/login') {
    handleLogout();
    throw new Error('Sessione scaduta. Effettua di nuovo l’accesso.');
  }
  if (!res.ok) throw new Error(data.error || ('Errore ' + res.status));
  return data;
}

// ---- Auth ----
async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Accesso…';
  try {
    const { token } = await api('POST', '/login', { password: loginPassword.value });
    state.token = token;
    localStorage.setItem(TOKEN_KEY, token);
    loginPassword.value = '';
    showDashboard();
    await loadAll();
  } catch (err) {
    loginError.textContent = err.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Accedi';
  }
}

function handleLogout() {
  state.token = null;
  state.users = [];
  state.tickets = {};
  state.expanded.clear();
  localStorage.removeItem(TOKEN_KEY);
  dashboardView.hidden = true;
  loginView.hidden = false;
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  envLabel.textContent = 'Gestione: ' + location.host;
}

// ---- Data ----
async function loadAll() {
  try {
    if (!state.catalog.length) {
      const { catalog } = await api('GET', '/catalog');
      state.catalog = catalog || [];
    }
    const [stats, usersResp] = await Promise.all([
      api('GET', '/stats'),
      api('GET', '/users'),
    ]);
    renderStats(stats);
    state.users = usersResp.users || [];
    state.tickets = {};
    state.expanded = new Set(
      [...state.expanded].filter((id) => state.users.some((u) => u.id === id))
    );
    renderUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderStats(s) {
  const items = [
    { value: s.users, label: 'Utenti' },
    { value: s.activeTickets, label: 'Biglietti attivi' },
    { value: s.tickets, label: 'Biglietti totali' },
    { value: fmtEuro(s.revenue), label: 'Incasso' },
  ];
  statsEl.innerHTML = items.map((i) => (
    '<div class="stat-card"><div class="stat-value">' + esc(i.value) +
    '</div><div class="stat-label">' + esc(i.label) + '</div></div>'
  )).join('');
}

function renderUsers() {
  const q = state.search.trim().toLowerCase();
  const list = q
    ? state.users.filter((u) => (u.name + ' ' + u.email).toLowerCase().includes(q))
    : state.users;

  userCountEl.textContent = list.length + ' / ' + state.users.length + ' utenti';

  if (!list.length) {
    usersEl.innerHTML = '<div class="empty">' +
      (state.users.length ? 'Nessun utente corrisponde alla ricerca.' : 'Nessun utente registrato.') +
      '</div>';
    return;
  }

  usersEl.innerHTML = list.map((u) => {
    const open = state.expanded.has(u.id);
    let body = '';
    if (open) {
      body = state.tickets[u.id]
        ? renderTicketsHtml(u.id, state.tickets[u.id])
        : '<div class="empty">Caricamento…</div>';
    }
    return '' +
      '<article class="user-card' + (open ? ' open' : '') + '" data-id="' + u.id + '">' +
        '<div class="user-head" data-action="toggle" data-id="' + u.id + '">' +
          '<div class="avatar">' + esc(initials(u.name)) + '</div>' +
          '<div class="user-info">' +
            '<div class="user-name">' + esc(u.name) + '</div>' +
            '<div class="user-email">' + esc(u.email) + '</div>' +
          '</div>' +
          '<div class="user-meta">' +
            '<span class="badge">' + esc(u.ticket_count) + ' biglietti</span>' +
            '<span class="user-id">#' + esc(u.id) + '</span>' +
          '</div>' +
          '<button class="btn btn-danger btn-sm" data-action="del-user" data-id="' + u.id + '">Elimina</button>' +
          '<span class="chevron">▾</span>' +
        '</div>' +
        '<div class="user-body"' + (open ? '' : ' hidden') + '>' + body + '</div>' +
      '</article>';
  }).join('');

  state.expanded.forEach((id) => {
    if (!state.tickets[id]) loadTickets(id);
  });
}

async function loadTickets(userId) {
  try {
    const { tickets } = await api('GET', '/users/' + userId + '/tickets');
    state.tickets[userId] = tickets || [];
  } catch (err) {
    toast(err.message, 'error');
    return;
  }
  const card = usersEl.querySelector('.user-card[data-id="' + userId + '"]');
  if (card && state.expanded.has(userId)) {
    card.querySelector('.user-body').innerHTML = renderTicketsHtml(userId, state.tickets[userId]);
  }
}

function renderTicketsHtml(userId, tickets) {
  const rows = tickets.length
    ? tickets.map((t) => (
        '<div class="ticket-row">' +
          '<div class="ticket-main">' +
            '<div class="ticket-name">' + esc(t.ticket_name) + '</div>' +
            '<div class="ticket-sub">' + esc(t.ticket_type) + ' · scade: ' + esc(fmtDate(t.valid_until)) + '</div>' +
          '</div>' +
          '<span class="tstatus tstatus-' + esc(t.status) + '">' + esc(t.status) + '</span>' +
          '<span class="ticket-price">' + esc(fmtEuro(t.price)) + '</span>' +
          '<button class="btn btn-danger btn-sm" data-action="del-ticket" data-id="' + t.id + '" data-user="' + userId + '">Rimuovi</button>' +
        '</div>'
      )).join('')
    : '<div class="empty">Nessun biglietto.</div>';

  const options = state.catalog.map((c) => (
    '<option value="' + esc(c.type) + '">' + esc(c.name) + ' — ' + esc(fmtEuro(c.price)) + '</option>'
  )).join('');

  return '' +
    '<div class="tickets">' + rows + '</div>' +
    '<div class="give-form">' +
      '<select>' + options + '</select>' +
      '<button class="btn btn-primary btn-sm" data-action="give-ticket" data-id="' + userId + '">Assegna biglietto</button>' +
    '</div>';
}

// ---- Actions ----
function toggleUser(id) {
  if (state.expanded.has(id)) state.expanded.delete(id);
  else state.expanded.add(id);
  renderUsers();
}

async function deleteUser(id) {
  const user = state.users.find((u) => u.id === id);
  const label = user ? user.name : '#' + id;
  const ok = await confirmAction(
    'Eliminare l’utente "' + label + '"? Verranno rimossi anche tutti i suoi biglietti. Operazione irreversibile.'
  );
  if (!ok) return;
  try {
    await api('DELETE', '/users/' + id);
    toast('Utente eliminato.', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteTicket(ticketId) {
  const ok = await confirmAction('Rimuovere questo biglietto? Operazione irreversibile.');
  if (!ok) return;
  try {
    await api('DELETE', '/tickets/' + ticketId);
    toast('Biglietto rimosso.', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function giveTicket(userId) {
  const card = usersEl.querySelector('.user-card[data-id="' + userId + '"]');
  const select = card && card.querySelector('select');
  if (!select || !select.value) {
    toast('Seleziona un tipo di biglietto.', 'error');
    return;
  }
  try {
    await api('POST', '/users/' + userId + '/tickets', { ticket_type: select.value });
    toast('Biglietto assegnato.', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ---- Events ----
loginForm.addEventListener('submit', handleLogin);
$('logout-btn').addEventListener('click', handleLogout);
$('refresh-btn').addEventListener('click', () => loadAll());
searchEl.addEventListener('input', () => {
  state.search = searchEl.value;
  renderUsers();
});

usersEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = Number(el.dataset.id);
  if (action === 'toggle') toggleUser(id);
  else if (action === 'del-user') deleteUser(id);
  else if (action === 'del-ticket') deleteTicket(id);
  else if (action === 'give-ticket') giveTicket(id);
});

// ---- Init ----
if (state.token) {
  showDashboard();
  loadAll();
} else {
  loginView.hidden = false;
}
