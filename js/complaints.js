/* ============================================================
   complaints.js — Complaint Management
   ============================================================ */
const ComplaintsView = {
  state: { search: '', statusFilter: '', categoryFilter: '' },

  render(container) {
    const user = Auth.getCurrentUser();
    const isStudent = user.role === 'student';
    container.innerHTML = `
      <div class="view-header">
        <div><h1>Complaint Management</h1><p>${isStudent ? 'Submit and track your complaints.' : 'Review and resolve student complaints.'}</p></div>
        ${isStudent ? `<button class="btn btn-primary" onclick="ComplaintsView.openForm()"><i class="fa-solid fa-triangle-exclamation"></i> Submit Complaint</button>` : ''}
      </div>
      <div class="toolbar">
        <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="complaint-search" placeholder="Search complaints..." value="${Utils.escapeHtml(this.state.search)}"></div>
        <select id="complaint-status-filter" class="select-input">
          <option value="">All Statuses</option>
          ${['Pending','In Progress','Resolved','Rejected'].map(s=>`<option value="${s}" ${this.state.statusFilter===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select id="complaint-category-filter" class="select-input">
          <option value="">All Categories</option>
          ${['Electricity','Water','Internet','Cleaning','Food','Maintenance','Security','Other'].map(c=>`<option value="${c}" ${this.state.categoryFilter===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div id="complaint-list"></div>
    `;
    document.getElementById('complaint-search').addEventListener('input', Utils.debounce(e=>{this.state.search=e.target.value;this.renderList();},200));
    document.getElementById('complaint-status-filter').addEventListener('change', e=>{this.state.statusFilter=e.target.value;this.renderList();});
    document.getElementById('complaint-category-filter').addEventListener('change', e=>{this.state.categoryFilter=e.target.value;this.renderList();});
    this.renderList();
  },

  renderList() {
    const user = Auth.getCurrentUser();
    const isStudent = user.role === 'student';
    const el = document.getElementById('complaint-list');
    const students = DB.getData(DB.KEYS.students);
    const rooms = DB.getData(DB.KEYS.rooms);
    let complaints = DB.getData(DB.KEYS.complaints).slice().reverse();

    if (isStudent) complaints = complaints.filter(c => c.studentId === user.studentId);
    if (this.state.search) {
      const q = this.state.search.toLowerCase();
      complaints = complaints.filter(c => [c.subject, c.category, c.id].join(' ').toLowerCase().includes(q));
    }
    if (this.state.statusFilter) complaints = complaints.filter(c => c.status === this.state.statusFilter);
    if (this.state.categoryFilter) complaints = complaints.filter(c => c.category === this.state.categoryFilter);

    if (complaints.length === 0) {
      el.innerHTML = Utils.emptyState({
        icon: 'fa-comment-dots', title: 'No complaints found',
        message: isStudent ? "You haven't submitted any complaints yet." : 'No complaints match your search.',
        actionLabel: isStudent ? 'Submit Complaint' : null, actionOnClick: 'ComplaintsView.openForm()'
      });
      return;
    }

    el.innerHTML = `<div class="stacked-list">${complaints.map(c => {
      const s = students.find(x => x.id === c.studentId);
      const room = rooms.find(x => x.id === c.roomId);
      return `
      <div class="list-row">
        <div class="list-row-main">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="cell-primary">${Utils.escapeHtml(c.subject)}</span>
            ${Utils.priorityBadge(c.priority)} ${Utils.statusBadge(c.status)}
          </div>
          <p class="cell-secondary">${Utils.escapeHtml(c.category)} · Room ${Utils.escapeHtml(room?.number||'—')} · ${Utils.formatDate(c.date)} ${!isStudent ? `· ${Utils.escapeHtml(s?.name||'Unknown')}` : ''}</p>
          <p class="text-sm mt-1">${Utils.escapeHtml(c.description)}</p>
        </div>
        ${!isStudent ? `
        <div class="list-row-actions">
          <select class="select-input select-sm" onchange="ComplaintsView.updateStatus('${c.id}', this.value)">
            ${['Pending','In Progress','Resolved','Rejected'].map(s=>`<option value="${s}" ${c.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="icon-btn icon-btn-danger" title="Delete" onclick="ComplaintsView.remove('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>` : ''}
      </div>`;
    }).join('')}</div>`;
  },

  openForm() {
    const user = Auth.getCurrentUser();
    const student = DB.findById(DB.KEYS.students, user.studentId);
    if (!student?.roomId) return Utils.showToast('You must be allocated to a room before submitting a complaint.', 'error');
    Utils.showModal({
      title: 'Submit Complaint',
      size: 'lg',
      bodyHtml: `
        <form id="complaint-form" class="form-grid" novalidate>
          <div class="form-field"><label>Category *</label>
            <select name="category" required>
              ${['Electricity','Water','Internet','Cleaning','Food','Maintenance','Security','Other'].map(c=>`<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Priority *</label>
            <select name="priority" required>
              ${['Low','Medium','High'].map(p=>`<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-field col-span-2"><label>Subject *</label><input name="subject" required maxlength="80"></div>
          <div class="form-field col-span-2"><label>Description *</label><textarea name="description" rows="4" required></textarea></div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Complaint</button>
          </div>
        </form>`,
      onMount: () => {
        document.getElementById('complaint-form').addEventListener('submit', e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = Object.fromEntries(fd.entries());
          if (!payload.subject.trim() || !payload.description.trim()) return Utils.showToast('Please fill in all required fields.', 'error');
          DB.insert(DB.KEYS.complaints, { id: DB.generateId('CMP'), studentId: student.id, roomId: student.roomId, date: new Date().toISOString().slice(0,10), status: 'Pending', ...payload });
          Utils.showToast('Complaint submitted successfully.', 'success');
          Utils.closeModal();
          this.renderList();
        });
      }
    });
  },

  updateStatus(id, status) {
    DB.updateData(DB.KEYS.complaints, id, { status });
    Utils.showToast('Complaint status updated.', 'success');
    this.renderList();
  },

  remove(id) {
    Utils.confirmAction({
      title: 'Delete complaint?',
      message: 'This will permanently remove this complaint record.',
      confirmLabel: 'Delete',
      onConfirm: () => { DB.deleteData(DB.KEYS.complaints, id); Utils.showToast('Complaint deleted.', 'success'); this.renderList(); }
    });
  }
};
