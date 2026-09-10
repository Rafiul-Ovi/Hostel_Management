/* ============================================================
   utils.js — reusable UI + formatting helpers
   ============================================================ */

const Utils = {
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatCurrency(amount) {
    const n = Number(amount);
    if (isNaN(n)) return '—';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },

  debounce(fn, delay = 250) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },

  validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
  validatePhone(phone) { return /^[\d\-\+\(\)\s]{7,20}$/.test(phone); },

  statusBadge(status) {
    const map = {
      'Active': 'badge-green', 'Paid': 'badge-green', 'Available': 'badge-green', 'Resolved': 'badge-green', 'Published': 'badge-green',
      'Pending': 'badge-yellow', 'Partially Occupied': 'badge-yellow', 'In Progress': 'badge-blue',
      'Overdue': 'badge-red', 'Rejected': 'badge-red', 'Full': 'badge-red', 'Maintenance': 'badge-gray',
      'Inactive': 'badge-gray', 'Draft': 'badge-gray'
    };
    const cls = map[status] || 'badge-gray';
    return `<span class="badge ${cls}">${Utils.escapeHtml(status)}</span>`;
  },

  priorityBadge(p) {
    const map = { High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-blue' };
    return `<span class="badge ${map[p] || 'badge-gray'}">${Utils.escapeHtml(p)}</span>`;
  },

  /* ---------------- Toasts ---------------- */
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${Utils.escapeHtml(message)}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  /* ---------------- Modal ---------------- */
  showModal({ title, bodyHtml, size = 'md', onMount }) {
    const root = document.getElementById('modal-root');
    const sizeCls = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size] || 'max-w-lg';
    root.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-panel ${sizeCls}" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>${Utils.escapeHtml(title)}</h3>
            <button class="modal-close" id="modal-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
        </div>
      </div>`;
    document.getElementById('modal-close-btn').addEventListener('click', Utils.closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') Utils.closeModal();
    });
    document.addEventListener('keydown', Utils._escHandler);
    if (typeof onMount === 'function') onMount();
  },

  _escHandler(e) { if (e.key === 'Escape') Utils.closeModal(); },

  closeModal() {
    const root = document.getElementById('modal-root');
    root.innerHTML = '';
    document.removeEventListener('keydown', Utils._escHandler);
  },

  /* ---------------- Confirm dialog ---------------- */
  confirmAction({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', danger = true, onConfirm }) {
    Utils.showModal({
      title,
      size: 'sm',
      bodyHtml: `
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-5">${Utils.escapeHtml(message)}</p>
        <div class="flex justify-end gap-2">
          <button id="confirm-cancel" class="btn btn-ghost">Cancel</button>
          <button id="confirm-ok" class="btn ${danger ? 'btn-danger' : 'btn-primary'}">${Utils.escapeHtml(confirmLabel)}</button>
        </div>`,
      onMount: () => {
        document.getElementById('confirm-cancel').addEventListener('click', Utils.closeModal);
        document.getElementById('confirm-ok').addEventListener('click', () => {
          Utils.closeModal();
          onConfirm();
        });
      }
    });
  },

  emptyState({ icon = 'fa-inbox', title, message, actionLabel, actionOnClick }) {
    return `
      <div class="empty-state">
        <i class="fa-solid ${icon}"></i>
        <p class="empty-title">${Utils.escapeHtml(title)}</p>
        <p class="empty-msg">${Utils.escapeHtml(message)}</p>
        ${actionLabel ? `<button class="btn btn-primary mt-3" onclick="${actionOnClick}">${Utils.escapeHtml(actionLabel)}</button>` : ''}
      </div>`;
  },

  csvExport(filename, headers, rows) {
    const escapeCsv = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.map(escapeCsv).join(',')].concat(
      rows.map(row => row.map(escapeCsv).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    Utils.showToast(`${filename} exported.`, 'success');
  }
};
