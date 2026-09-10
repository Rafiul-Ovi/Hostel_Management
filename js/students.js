/* ============================================================
   students.js — Student Management (Admin/Manager)
   ============================================================ */
const StudentsView = {
  state: { search: '', hostelFilter: '', statusFilter: '', sortBy: 'name', page: 1, pageSize: 8 },

  render(container) {
    const hostels = DB.getData(DB.KEYS.hostels);
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1>Student Management</h1>
          <p>Add, edit, and track every resident's record.</p>
        </div>
        <button class="btn btn-primary" onclick="StudentsView.openForm()"><i class="fa-solid fa-user-plus"></i> Add Student</button>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input id="student-search" type="text" placeholder="Search by name, ID, department..." value="${Utils.escapeHtml(this.state.search)}">
        </div>
        <select id="student-hostel-filter" class="select-input">
          <option value="">All Hostels</option>
          ${hostels.map(h => `<option value="${h.id}" ${this.state.hostelFilter === h.id ? 'selected' : ''}>${Utils.escapeHtml(h.name)}</option>`).join('')}
        </select>
        <select id="student-status-filter" class="select-input">
          <option value="">All Statuses</option>
          <option value="Active" ${this.state.statusFilter==='Active'?'selected':''}>Active</option>
          <option value="Inactive" ${this.state.statusFilter==='Inactive'?'selected':''}>Inactive</option>
        </select>
        <select id="student-sort" class="select-input">
          <option value="name" ${this.state.sortBy==='name'?'selected':''}>Sort: Name</option>
          <option value="id" ${this.state.sortBy==='id'?'selected':''}>Sort: Student ID</option>
          <option value="department" ${this.state.sortBy==='department'?'selected':''}>Sort: Department</option>
        </select>
      </div>

      <div id="student-table-wrap"></div>
    `;

    document.getElementById('student-search').addEventListener('input', Utils.debounce((e) => {
      this.state.search = e.target.value; this.state.page = 1; this.renderTable();
    }, 200));
    document.getElementById('student-hostel-filter').addEventListener('change', (e) => { this.state.hostelFilter = e.target.value; this.state.page = 1; this.renderTable(); });
    document.getElementById('student-status-filter').addEventListener('change', (e) => { this.state.statusFilter = e.target.value; this.state.page = 1; this.renderTable(); });
    document.getElementById('student-sort').addEventListener('change', (e) => { this.state.sortBy = e.target.value; this.renderTable(); });

    this.renderTable();
  },

  getFiltered() {
    let students = DB.getData(DB.KEYS.students);
    const { search, hostelFilter, statusFilter, sortBy } = this.state;
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s => [s.name, s.id, s.department, s.email].join(' ').toLowerCase().includes(q));
    }
    if (hostelFilter) students = students.filter(s => s.hostelId === hostelFilter);
    if (statusFilter) students = students.filter(s => s.status === statusFilter);
    students.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])));
    return students;
  },

  renderTable() {
    const wrap = document.getElementById('student-table-wrap');
    const all = this.getFiltered();
    const { page, pageSize } = this.state;
    const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
    const pageItems = all.slice((page - 1) * pageSize, page * pageSize);
    const hostels = DB.getData(DB.KEYS.hostels);
    const rooms = DB.getData(DB.KEYS.rooms);
    const hostelName = (id) => hostels.find(h => h.id === id)?.name || '—';
    const roomNumber = (id) => rooms.find(r => r.id === id)?.number || '—';

    if (all.length === 0) {
      wrap.innerHTML = Utils.emptyState({ icon: 'fa-user-graduate', title: 'No students found', message: 'There are currently no students matching your search.', actionLabel: 'Add Student', actionOnClick: 'StudentsView.openForm()' });
      return;
    }

    wrap.innerHTML = `
      <div class="table-card">
        <table class="data-table">
          <thead><tr>
            <th>Student</th><th>Department</th><th>Hostel / Room</th><th>Status</th><th class="text-right">Actions</th>
          </tr></thead>
          <tbody>
            ${pageItems.map(s => `
              <tr>
                <td>
                  <div class="cell-primary">${Utils.escapeHtml(s.name)}</div>
                  <div class="cell-secondary">${Utils.escapeHtml(s.id)} · ${Utils.escapeHtml(s.email)}</div>
                </td>
                <td>${Utils.escapeHtml(s.department)}</td>
                <td>${s.hostelId ? `${Utils.escapeHtml(hostelName(s.hostelId))} · Room ${Utils.escapeHtml(roomNumber(s.roomId))}` : '<span class="cell-secondary">Not allocated</span>'}</td>
                <td>${Utils.statusBadge(s.status)}</td>
                <td class="text-right">
                  <button class="icon-btn" title="View" onclick="StudentsView.openView('${s.id}')"><i class="fa-solid fa-eye"></i></button>
                  <button class="icon-btn" title="Edit" onclick="StudentsView.openForm('${s.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="icon-btn icon-btn-danger" title="Delete" onclick="StudentsView.remove('${s.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span>Showing ${pageItems.length} of ${all.length} students</span>
        <div class="pager-btns">
          <button class="btn btn-ghost btn-sm" ${page<=1?'disabled':''} onclick="StudentsView.goPage(${page-1})"><i class="fa-solid fa-chevron-left"></i></button>
          <span>Page ${page} / ${totalPages}</span>
          <button class="btn btn-ghost btn-sm" ${page>=totalPages?'disabled':''} onclick="StudentsView.goPage(${page+1})"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>`;
  },

  goPage(p) { this.state.page = p; this.renderTable(); },

  openView(id) {
    const s = DB.findById(DB.KEYS.students, id);
    if (!s) return;
    const hostels = DB.getData(DB.KEYS.hostels);
    const rooms = DB.getData(DB.KEYS.rooms);
    const hostel = hostels.find(h => h.id === s.hostelId);
    const room = rooms.find(r => r.id === s.roomId);
    Utils.showModal({
      title: s.name,
      size: 'lg',
      bodyHtml: `
        <div class="detail-grid">
          <div><label>Student ID</label><p>${Utils.escapeHtml(s.id)}</p></div>
          <div><label>Status</label><p>${Utils.statusBadge(s.status)}</p></div>
          <div><label>Email</label><p>${Utils.escapeHtml(s.email)}</p></div>
          <div><label>Phone</label><p>${Utils.escapeHtml(s.phone)}</p></div>
          <div><label>Department</label><p>${Utils.escapeHtml(s.department)}</p></div>
          <div><label>Session</label><p>${Utils.escapeHtml(s.session)}</p></div>
          <div><label>Gender</label><p>${Utils.escapeHtml(s.gender)}</p></div>
          <div><label>Date of Birth</label><p>${Utils.formatDate(s.dob)}</p></div>
          <div><label>Address</label><p>${Utils.escapeHtml(s.address) || '—'}</p></div>
          <div><label>Admission Date</label><p>${Utils.formatDate(s.admissionDate)}</p></div>
          <div><label>Guardian</label><p>${Utils.escapeHtml(s.guardianName) || '—'}</p></div>
          <div><label>Guardian Phone</label><p>${Utils.escapeHtml(s.guardianPhone) || '—'}</p></div>
          <div><label>Hostel</label><p>${hostel ? Utils.escapeHtml(hostel.name) : '—'}</p></div>
          <div><label>Room</label><p>${room ? Utils.escapeHtml(room.number) : '—'}</p></div>
        </div>
        <div class="flex justify-end mt-4"><button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button></div>`
    });
  },

  openForm(id) {
    const s = id ? DB.findById(DB.KEYS.students, id) : null;
    const hostels = DB.getData(DB.KEYS.hostels);
    Utils.showModal({
      title: s ? 'Edit Student' : 'Add Student',
      size: 'lg',
      bodyHtml: `
        <form id="student-form" class="form-grid" novalidate>
          <div class="form-field"><label>Full Name *</label><input name="name" required value="${Utils.escapeHtml(s?.name||'')}"></div>
          <div class="form-field"><label>Email *</label><input name="email" type="email" required value="${Utils.escapeHtml(s?.email||'')}"></div>
          <div class="form-field"><label>Phone *</label><input name="phone" required value="${Utils.escapeHtml(s?.phone||'')}"></div>
          <div class="form-field"><label>Department *</label><input name="department" required value="${Utils.escapeHtml(s?.department||'')}"></div>
          <div class="form-field"><label>Session</label><input name="session" value="${Utils.escapeHtml(s?.session||'2025-2026')}"></div>
          <div class="form-field"><label>Gender *</label>
            <select name="gender" required>
              <option value="">Select</option>
              <option value="Male" ${s?.gender==='Male'?'selected':''}>Male</option>
              <option value="Female" ${s?.gender==='Female'?'selected':''}>Female</option>
            </select>
          </div>
          <div class="form-field"><label>Date of Birth</label><input name="dob" type="date" value="${s?.dob||''}"></div>
          <div class="form-field"><label>Admission Date</label><input name="admissionDate" type="date" value="${s?.admissionDate||new Date().toISOString().slice(0,10)}"></div>
          <div class="form-field col-span-2"><label>Address</label><input name="address" value="${Utils.escapeHtml(s?.address||'')}"></div>
          <div class="form-field"><label>Guardian Name</label><input name="guardianName" value="${Utils.escapeHtml(s?.guardianName||'')}"></div>
          <div class="form-field"><label>Guardian Phone</label><input name="guardianPhone" value="${Utils.escapeHtml(s?.guardianPhone||'')}"></div>
          <div class="form-field"><label>Status</label>
            <select name="status">
              <option value="Active" ${s?.status==='Active'?'selected':''}>Active</option>
              <option value="Inactive" ${s?.status==='Inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
          <p class="form-note col-span-2">Room allocation is managed from the Room Allocation page.</p>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${s ? 'Save Changes' : 'Add Student'}</button>
          </div>
        </form>`,
      onMount: () => {
        document.getElementById('student-form').addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitForm(e.target, s?.id);
        });
      }
    });
  },

  submitForm(form, existingId) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.name.trim()) return Utils.showToast('Name is required.', 'error');
    if (!Utils.validateEmail(payload.email)) return Utils.showToast('Enter a valid email address.', 'error');
    if (!Utils.validatePhone(payload.phone)) return Utils.showToast('Enter a valid phone number.', 'error');

    const students = DB.getData(DB.KEYS.students);
    const dupEmail = students.find(s => s.email.toLowerCase() === payload.email.toLowerCase() && s.id !== existingId);
    if (dupEmail) return Utils.showToast('A student with this email already exists.', 'error');

    if (existingId) {
      DB.updateData(DB.KEYS.students, existingId, payload);
      Utils.showToast('Student updated successfully.', 'success');
    } else {
      const newStudent = { id: DB.generateId('STU'), hostelId: null, roomId: null, ...payload };
      DB.insert(DB.KEYS.students, newStudent);
      Utils.showToast('Student added successfully.', 'success');
    }
    Utils.closeModal();
    this.renderTable();
    if (window.DashboardView) DashboardView.refreshStatsIfVisible?.();
  },

  remove(id) {
    const s = DB.findById(DB.KEYS.students, id);
    Utils.confirmAction({
      title: 'Delete student?',
      message: `This will permanently remove ${s?.name || 'this student'} and cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        DB.deleteData(DB.KEYS.students, id);
        Utils.showToast('Student deleted successfully.', 'success');
        this.renderTable();
      }
    });
  }
};
