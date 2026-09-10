/* ============================================================
   notices.js — Notice Management
   ============================================================ */
const NoticesView = {
  render(container) {
    const user = Auth.getCurrentUser();
    const canManage = user.role === 'admin' || user.role === 'manager';
    container.innerHTML = `
      <div class="view-header">
        <div><h1>Notices</h1><p>Announcements for students, managers, and hostel staff.</p></div>
        ${canManage ? `<button class="btn btn-primary" onclick="NoticesView.openForm()"><i class="fa-solid fa-bullhorn"></i> Create Notice</button>` : ''}
      </div>
      <div id="notice-list"></div>
    `;
    this.renderList();
  },

  renderList() {
    const user = Auth.getCurrentUser();
    const canManage = user.role === 'admin' || user.role === 'manager';
    const el = document.getElementById('notice-list');
    let notices = DB.getData(DB.KEYS.notices).slice().reverse();
    if (user.role === 'student') notices = notices.filter(n => n.audience === 'All Students' || n.audience === 'Specific Hostel');
    // Managers see all notices, including ones addressed specifically to them.

    if (notices.length === 0) {
      el.innerHTML = Utils.emptyState({ icon: 'fa-bullhorn', title: 'No notices found', message: 'There are no notices to display right now.', actionLabel: canManage ? 'Create Notice' : null, actionOnClick: 'NoticesView.openForm()' });
      return;
    }

    const prioColor = { High: 'notice-high', Medium: 'notice-medium', Low: 'notice-low' };
    el.innerHTML = `<div class="card-grid">${notices.map(n => `
      <div class="notice-card ${prioColor[n.priority]||''}">
        <div class="flex justify-between items-start">
          <h3>${Utils.escapeHtml(n.title)}</h3>
          ${Utils.priorityBadge(n.priority)}
        </div>
        <p class="text-sm mt-1">${Utils.escapeHtml(n.description)}</p>
        <div class="notice-meta">
          <span><i class="fa-regular fa-calendar"></i> ${Utils.formatDate(n.date)}</span>
          <span><i class="fa-regular fa-user"></i> ${Utils.escapeHtml(n.author)}</span>
          <span><i class="fa-solid fa-users"></i> ${Utils.escapeHtml(n.audience)}</span>
        </div>
        ${canManage ? `
        <div class="info-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="NoticesView.openForm('${n.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm icon-btn-danger" onclick="NoticesView.remove('${n.id}')">Delete</button>
        </div>` : ''}
      </div>`).join('')}</div>`;
  },

  openForm(id) {
    const n = id ? DB.findById(DB.KEYS.notices, id) : null;
    const user = Auth.getCurrentUser();
    Utils.showModal({
      title: n ? 'Edit Notice' : 'Create Notice',
      size: 'lg',
      bodyHtml: `
        <form id="notice-form" class="form-grid" novalidate>
          <div class="form-field col-span-2"><label>Title *</label><input name="title" required value="${Utils.escapeHtml(n?.title||'')}"></div>
          <div class="form-field col-span-2"><label>Description *</label><textarea name="description" rows="4" required>${Utils.escapeHtml(n?.description||'')}</textarea></div>
          <div class="form-field"><label>Priority *</label>
            <select name="priority" required>${['Low','Medium','High'].map(p=>`<option value="${p}" ${n?.priority===p?'selected':''}>${p}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>Target Audience *</label>
            <select name="audience" required>${['All Students','Specific Hostel','Specific Room','Managers'].map(a=>`<option value="${a}" ${n?.audience===a?'selected':''}>${a}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>Status</label>
            <select name="status">${['Published','Draft'].map(s=>`<option value="${s}" ${n?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${n?'Save Changes':'Publish Notice'}</button>
          </div>
        </form>`,
      onMount: () => {
        document.getElementById('notice-form').addEventListener('submit', e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = Object.fromEntries(fd.entries());
          if (!payload.title.trim() || !payload.description.trim()) return Utils.showToast('Please complete all required fields.', 'error');
          if (n) {
            DB.updateData(DB.KEYS.notices, n.id, payload);
            Utils.showToast('Notice updated successfully.', 'success');
          } else {
            DB.insert(DB.KEYS.notices, { id: DB.generateId('NTC'), date: new Date().toISOString().slice(0,10), author: user.name, ...payload });
            Utils.showToast('Notice published successfully.', 'success');
          }
          Utils.closeModal();
          this.renderList();
        });
      }
    });
  },

  remove(id) {
    Utils.confirmAction({
      title: 'Delete notice?',
      message: 'This notice will no longer be visible to students or staff.',
      confirmLabel: 'Delete',
      onConfirm: () => { DB.deleteData(DB.KEYS.notices, id); Utils.showToast('Notice deleted successfully.', 'success'); this.renderList(); }
    });
  }
};
