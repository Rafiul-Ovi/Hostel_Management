/* ============================================================
   users.js — User Management (Admin only)
   ============================================================ */
const UsersView = {
  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div><h1>User Management</h1><p>Manage system accounts and role access.</p></div>
        <button class="btn btn-primary" onclick="UsersView.openForm()"><i class="fa-solid fa-user-plus"></i> Add User</button>
      </div>
      <div id="user-table-wrap"></div>
    `;
    this.renderTable();
  },

  renderTable() {
    const wrap = document.getElementById('user-table-wrap');
    const users = DB.getData(DB.KEYS.users);
    const hostels = DB.getData(DB.KEYS.hostels);
    if (users.length === 0) {
      wrap.innerHTML = Utils.emptyState({ icon: 'fa-users', title: 'No users found', message: 'There are no system accounts yet.', actionLabel: 'Add User', actionOnClick: 'UsersView.openForm()' });
      return;
    }
    const roleBadge = { admin: 'badge-blue', manager: 'badge-gold', student: 'badge-gray' };
    wrap.innerHTML = `
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Assigned Hostel</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td class="cell-primary">${Utils.escapeHtml(u.name)}</td>
                <td>${Utils.escapeHtml(u.email)}</td>
                <td><span class="badge ${roleBadge[u.role]||'badge-gray'}">${Utils.escapeHtml(u.role)}</span></td>
                <td>${u.hostelId ? Utils.escapeHtml(hostels.find(h=>h.id===u.hostelId)?.name||'—') : '—'}</td>
                <td class="text-right">
                  <button class="icon-btn" title="Edit" onclick="UsersView.openForm('${u.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="icon-btn icon-btn-danger" title="Delete" onclick="UsersView.remove('${u.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  openForm(id) {
    const u = id ? DB.findById(DB.KEYS.users, id) : null;
    const hostels = DB.getData(DB.KEYS.hostels);
    Utils.showModal({
      title: u ? 'Edit User' : 'Add User',
      size: 'lg',
      bodyHtml: `
        <form id="user-form" class="form-grid" novalidate>
          <div class="form-field"><label>Full Name *</label><input name="name" required value="${Utils.escapeHtml(u?.name||'')}"></div>
          <div class="form-field"><label>Email *</label><input name="email" type="email" required value="${Utils.escapeHtml(u?.email||'')}"></div>
          <div class="form-field"><label>Password ${u?'(leave blank to keep)':'*'}</label><input name="password" type="password" ${u?'':'required'}></div>
          <div class="form-field"><label>Role *</label>
            <select name="role" id="user-role" required>
              <option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option>
              <option value="manager" ${u?.role==='manager'?'selected':''}>Hostel Manager</option>
              <option value="student" ${u?.role==='student'?'selected':''}>Student</option>
            </select>
          </div>
          <div class="form-field" id="hostel-field" style="${u?.role==='manager'?'':'display:none'}"><label>Assigned Hostel</label>
            <select name="hostelId">
              <option value="">None</option>
              ${hostels.map(h=>`<option value="${h.id}" ${u?.hostelId===h.id?'selected':''}>${Utils.escapeHtml(h.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${u?'Save Changes':'Add User'}</button>
          </div>
        </form>`,
      onMount: () => {
        const roleSel = document.getElementById('user-role');
        const hostelField = document.getElementById('hostel-field');
        roleSel.addEventListener('change', () => { hostelField.style.display = roleSel.value === 'manager' ? '' : 'none'; });
        document.getElementById('user-form').addEventListener('submit', e => { e.preventDefault(); this.submitForm(e.target, u); });
      }
    });
  },

  submitForm(form, existing) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!Utils.validateEmail(payload.email)) return Utils.showToast('Enter a valid email address.', 'error');

    const users = DB.getData(DB.KEYS.users);
    const dup = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase() && u.id !== existing?.id);
    if (dup) return Utils.showToast('A user with this email already exists.', 'error');

    if (existing) {
      if (!payload.password) delete payload.password;
      DB.updateData(DB.KEYS.users, existing.id, payload);
      Utils.showToast('User updated successfully.', 'success');
    } else {
      if (!payload.password) return Utils.showToast('Password is required for new users.', 'error');
      DB.insert(DB.KEYS.users, { id: DB.generateId('USR'), ...payload });
      Utils.showToast('User added successfully.', 'success');
    }
    Utils.closeModal();
    this.renderTable();
  },

  remove(id) {
    const u = DB.findById(DB.KEYS.users, id);
    if (u?.email === 'admin@hostel.com') return Utils.showToast('The default admin account cannot be deleted.', 'error');
    Utils.confirmAction({
      title: 'Delete user?',
      message: `This will permanently remove access for ${u?.name || 'this user'}.`,
      confirmLabel: 'Delete',
      onConfirm: () => { DB.deleteData(DB.KEYS.users, id); Utils.showToast('User deleted successfully.', 'success'); this.renderTable(); }
    });
  }
};
