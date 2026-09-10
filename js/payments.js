/* ============================================================
   payments.js — Payment Management
   ============================================================ */
const PaymentsView = {
  state: { search: '', statusFilter: '', monthFilter: '' },

  render(container) {
    const payments = DB.getData(DB.KEYS.payments);
    const months = [...new Set(payments.map(p => p.month))];
    const total = payments.reduce((s,p)=>s+Number(p.amount),0);
    const paid = payments.filter(p=>p.status==='Paid').reduce((s,p)=>s+Number(p.amount),0);
    const pending = payments.filter(p=>p.status==='Pending').reduce((s,p)=>s+Number(p.amount),0);
    const overdue = payments.filter(p=>p.status==='Overdue').reduce((s,p)=>s+Number(p.amount),0);

    container.innerHTML = `
      <div class="view-header">
        <div><h1>Payment Management</h1><p>Track hostel fee collections and outstanding balances.</p></div>
        <button class="btn btn-primary" onclick="PaymentsView.openForm()"><i class="fa-solid fa-money-bill-wave"></i> Add Payment</button>
      </div>
      <div class="stat-strip">
        <div class="stat-chip"><label>Total Billed</label><span>${Utils.formatCurrency(total)}</span></div>
        <div class="stat-chip stat-chip-green"><label>Paid</label><span>${Utils.formatCurrency(paid)}</span></div>
        <div class="stat-chip stat-chip-yellow"><label>Pending</label><span>${Utils.formatCurrency(pending)}</span></div>
        <div class="stat-chip stat-chip-red"><label>Overdue</label><span>${Utils.formatCurrency(overdue)}</span></div>
      </div>
      <div class="toolbar">
        <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="payment-search" placeholder="Search by student or transaction..." value="${Utils.escapeHtml(this.state.search)}"></div>
        <select id="payment-status-filter" class="select-input">
          <option value="">All Statuses</option>
          ${['Paid','Pending','Overdue'].map(s=>`<option value="${s}" ${this.state.statusFilter===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select id="payment-month-filter" class="select-input">
          <option value="">All Months</option>
          ${months.map(m=>`<option value="${m}" ${this.state.monthFilter===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div id="payment-table-wrap"></div>
    `;
    document.getElementById('payment-search').addEventListener('input', Utils.debounce(e=>{this.state.search=e.target.value;this.renderTable();},200));
    document.getElementById('payment-status-filter').addEventListener('change', e=>{this.state.statusFilter=e.target.value;this.renderTable();});
    document.getElementById('payment-month-filter').addEventListener('change', e=>{this.state.monthFilter=e.target.value;this.renderTable();});
    this.renderTable();
  },

  getFiltered() {
    let payments = DB.getData(DB.KEYS.payments).slice().reverse();
    if (this.state.search) {
      const q = this.state.search.toLowerCase();
      payments = payments.filter(p => [p.studentName, p.studentId, p.transactionId].join(' ').toLowerCase().includes(q));
    }
    if (this.state.statusFilter) payments = payments.filter(p => p.status === this.state.statusFilter);
    if (this.state.monthFilter) payments = payments.filter(p => p.month === this.state.monthFilter);
    return payments;
  },

  renderTable() {
    const wrap = document.getElementById('payment-table-wrap');
    const payments = this.getFiltered();
    if (payments.length === 0) {
      wrap.innerHTML = Utils.emptyState({ icon: 'fa-file-invoice-dollar', title: 'No payments found', message: 'No payment records match your search.', actionLabel: 'Add Payment', actionOnClick: 'PaymentsView.openForm()' });
      return;
    }
    wrap.innerHTML = `
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>Student</th><th>Month</th><th>Amount</th><th>Paid On</th><th>Method</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td><div class="cell-primary">${Utils.escapeHtml(p.studentName)}</div><div class="cell-secondary">${Utils.escapeHtml(p.studentId)}</div></td>
                <td>${Utils.escapeHtml(p.month)}</td>
                <td>${Utils.formatCurrency(p.amount)}</td>
                <td>${p.paymentDate ? Utils.formatDate(p.paymentDate) : '—'}</td>
                <td>${Utils.escapeHtml(p.method || '—')}</td>
                <td>${Utils.statusBadge(p.status)}</td>
                <td class="text-right">
                  <button class="icon-btn" title="View" onclick="PaymentsView.openView('${p.id}')"><i class="fa-solid fa-eye"></i></button>
                  <button class="icon-btn" title="Edit" onclick="PaymentsView.openForm('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="icon-btn icon-btn-danger" title="Delete" onclick="PaymentsView.remove('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  openView(id) {
    const p = DB.findById(DB.KEYS.payments, id);
    if (!p) return;
    Utils.showModal({
      title: `Payment ${p.id}`,
      bodyHtml: `
        <div class="detail-grid">
          <div><label>Student</label><p>${Utils.escapeHtml(p.studentName)}</p></div>
          <div><label>Month</label><p>${Utils.escapeHtml(p.month)}</p></div>
          <div><label>Amount</label><p>${Utils.formatCurrency(p.amount)}</p></div>
          <div><label>Status</label><p>${Utils.statusBadge(p.status)}</p></div>
          <div><label>Payment Date</label><p>${p.paymentDate?Utils.formatDate(p.paymentDate):'—'}</p></div>
          <div><label>Method</label><p>${Utils.escapeHtml(p.method||'—')}</p></div>
          <div class="col-span-2"><label>Transaction ID</label><p>${Utils.escapeHtml(p.transactionId||'—')}</p></div>
        </div>
        <div class="flex justify-end mt-4"><button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button></div>`
    });
  },

  openForm(id) {
    const p = id ? DB.findById(DB.KEYS.payments, id) : null;
    const students = DB.getData(DB.KEYS.students);
    Utils.showModal({
      title: p ? 'Edit Payment' : 'Add Payment',
      size: 'lg',
      bodyHtml: `
        <form id="payment-form" class="form-grid" novalidate>
          <div class="form-field col-span-2"><label>Student *</label>
            <select name="studentId" required ${p?'disabled':''}>
              <option value="">Select student</option>
              ${students.map(s=>`<option value="${s.id}" ${p?.studentId===s.id?'selected':''}>${Utils.escapeHtml(s.name)} (${s.id})</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Month *</label><input name="month" required placeholder="e.g. Sep 2025" value="${Utils.escapeHtml(p?.month||'')}"></div>
          <div class="form-field"><label>Amount *</label><input name="amount" type="number" min="0" step="0.01" required value="${p?.amount??''}"></div>
          <div class="form-field"><label>Status *</label>
            <select name="status" required>
              ${['Paid','Pending','Overdue'].map(s=>`<option value="${s}" ${p?.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Payment Date</label><input name="paymentDate" type="date" value="${p?.paymentDate||''}"></div>
          <div class="form-field"><label>Payment Method</label>
            <select name="method">
              <option value="">—</option>
              ${['Bank Transfer','Card','Cash','Mobile Wallet'].map(m=>`<option value="${m}" ${p?.method===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
          <div class="form-field col-span-2"><label>Transaction ID</label><input name="transactionId" value="${Utils.escapeHtml(p?.transactionId||'')}"></div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${p?'Save Changes':'Add Payment'}</button>
          </div>
        </form>`,
      onMount: () => {
        document.getElementById('payment-form').addEventListener('submit', e => { e.preventDefault(); this.submitForm(e.target, p); });
      }
    });
  },

  submitForm(form, existing) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.amount = Number(payload.amount);
    if (isNaN(payload.amount) || payload.amount <= 0) return Utils.showToast('Enter a valid payment amount.', 'error');

    if (existing) {
      DB.updateData(DB.KEYS.payments, existing.id, payload);
      Utils.showToast('Payment updated successfully.', 'success');
    } else {
      const student = DB.findById(DB.KEYS.students, payload.studentId);
      if (!student) return Utils.showToast('Please select a student.', 'error');
      DB.insert(DB.KEYS.payments, { id: DB.generateId('PAY'), studentName: student.name, ...payload });
      Utils.showToast('Payment recorded successfully.', 'success');
    }
    Utils.closeModal();
    this.renderTable();
  },

  remove(id) {
    Utils.confirmAction({
      title: 'Delete payment record?',
      message: 'This will permanently remove this payment record.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        DB.deleteData(DB.KEYS.payments, id);
        Utils.showToast('Payment deleted successfully.', 'success');
        this.renderTable();
      }
    });
  }
};
