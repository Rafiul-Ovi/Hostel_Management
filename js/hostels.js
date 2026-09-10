/* ============================================================
   hostels.js — Hostel Management
   ============================================================ */
const HostelsView = {
  state: { search: '' },

  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div><h1>Hostel Management</h1><p>Manage hostel blocks, wardens, and capacity.</p></div>
        <button class="btn btn-primary" onclick="HostelsView.openForm()"><i class="fa-solid fa-building-circle-arrow-right"></i> Add Hostel</button>
      </div>
      <div class="toolbar">
        <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i>
          <input id="hostel-search" placeholder="Search hostels..." value="${Utils.escapeHtml(this.state.search)}">
        </div>
      </div>
      <div id="hostel-grid"></div>
    `;
    document.getElementById('hostel-search').addEventListener('input', Utils.debounce((e) => {
      this.state.search = e.target.value; this.renderGrid();
    }, 200));
    this.renderGrid();
  },

  renderGrid() {
    const grid = document.getElementById('hostel-grid');
    let hostels = DB.getData(DB.KEYS.hostels);
    if (this.state.search) {
      const q = this.state.search.toLowerCase();
      hostels = hostels.filter(h => [h.name, h.type, h.warden].join(' ').toLowerCase().includes(q));
    }
    if (hostels.length === 0) {
      grid.innerHTML = Utils.emptyState({ icon: 'fa-building', title: 'No hostels found', message: 'No hostels match your search.', actionLabel: 'Add Hostel', actionOnClick: 'HostelsView.openForm()' });
      return;
    }
    const rooms = DB.getData(DB.KEYS.rooms);
    grid.innerHTML = `<div class="card-grid">${hostels.map(h => {
      const hRooms = rooms.filter(r => r.hostelId === h.id);
      const occupied = hRooms.reduce((sum, r) => sum + r.occupancy, 0);
      const pct = h.totalCapacity ? Math.round((occupied / h.totalCapacity) * 100) : 0;
      return `
        <div class="info-card">
          <div class="info-card-head">
            <div>
              <h3>${Utils.escapeHtml(h.name)}</h3>
              <p class="cell-secondary">${Utils.escapeHtml(h.type)} · ${Utils.escapeHtml(h.gender)}</p>
            </div>
            ${Utils.statusBadge(h.status)}
          </div>
          <div class="info-card-stats">
            <div><span>${h.floors}</span><label>Floors</label></div>
            <div><span>${h.totalRooms}</span><label>Rooms</label></div>
            <div><span>${occupied}/${h.totalCapacity}</span><label>Occupancy</label></div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <p class="cell-secondary mt-2"><i class="fa-solid fa-user-tie"></i> ${Utils.escapeHtml(h.warden)} · ${Utils.escapeHtml(h.wardenPhone)}</p>
          <div class="info-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="HostelsView.openView('${h.id}')">View</button>
            <button class="btn btn-ghost btn-sm" onclick="HostelsView.openForm('${h.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm icon-btn-danger" onclick="HostelsView.remove('${h.id}')">Delete</button>
          </div>
        </div>`;
    }).join('')}</div>`;
  },

  openView(id) {
    const h = DB.findById(DB.KEYS.hostels, id);
    if (!h) return;
    Utils.showModal({
      title: h.name,
      bodyHtml: `
        <div class="detail-grid">
          <div><label>Type</label><p>${Utils.escapeHtml(h.type)}</p></div>
          <div><label>Gender</label><p>${Utils.escapeHtml(h.gender)}</p></div>
          <div><label>Floors</label><p>${h.floors}</p></div>
          <div><label>Total Rooms</label><p>${h.totalRooms}</p></div>
          <div><label>Total Capacity</label><p>${h.totalCapacity}</p></div>
          <div><label>Status</label><p>${Utils.statusBadge(h.status)}</p></div>
          <div><label>Warden</label><p>${Utils.escapeHtml(h.warden)}</p></div>
          <div><label>Warden Phone</label><p>${Utils.escapeHtml(h.wardenPhone)}</p></div>
          <div class="col-span-2"><label>Address</label><p>${Utils.escapeHtml(h.address)}</p></div>
        </div>
        <div class="flex justify-end mt-4"><button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button></div>`
    });
  },

  openForm(id) {
    const h = id ? DB.findById(DB.KEYS.hostels, id) : null;
    Utils.showModal({
      title: h ? 'Edit Hostel' : 'Add Hostel',
      size: 'lg',
      bodyHtml: `
        <form id="hostel-form" class="form-grid" novalidate>
          <div class="form-field"><label>Hostel Name *</label><input name="name" required value="${Utils.escapeHtml(h?.name||'')}"></div>
          <div class="form-field"><label>Type *</label><input name="type" required placeholder="Boys / Girls / Co-ed" value="${Utils.escapeHtml(h?.type||'')}"></div>
          <div class="form-field"><label>Gender *</label>
            <select name="gender" required>
              <option value="">Select</option>
              <option value="Male" ${h?.gender==='Male'?'selected':''}>Male</option>
              <option value="Female" ${h?.gender==='Female'?'selected':''}>Female</option>
              <option value="Co-ed" ${h?.gender==='Co-ed'?'selected':''}>Co-ed</option>
            </select>
          </div>
          <div class="form-field"><label>Floors *</label><input name="floors" type="number" min="1" required value="${h?.floors??''}"></div>
          <div class="form-field"><label>Total Rooms *</label><input name="totalRooms" type="number" min="1" required value="${h?.totalRooms??''}"></div>
          <div class="form-field"><label>Total Capacity *</label><input name="totalCapacity" type="number" min="1" required value="${h?.totalCapacity??''}"></div>
          <div class="form-field"><label>Warden Name *</label><input name="warden" required value="${Utils.escapeHtml(h?.warden||'')}"></div>
          <div class="form-field"><label>Warden Phone *</label><input name="wardenPhone" required value="${Utils.escapeHtml(h?.wardenPhone||'')}"></div>
          <div class="form-field col-span-2"><label>Address</label><input name="address" value="${Utils.escapeHtml(h?.address||'')}"></div>
          <div class="form-field"><label>Status</label>
            <select name="status">
              <option value="Active" ${h?.status==='Active'?'selected':''}>Active</option>
              <option value="Inactive" ${h?.status==='Inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${h ? 'Save Changes' : 'Add Hostel'}</button>
          </div>
        </form>`,
      onMount: () => {
        document.getElementById('hostel-form').addEventListener('submit', (e) => {
          e.preventDefault(); this.submitForm(e.target, h?.id);
        });
      }
    });
  },

  submitForm(form, existingId) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    ['floors','totalRooms','totalCapacity'].forEach(f => payload[f] = Number(payload[f]));
    if (!payload.name.trim()) return Utils.showToast('Hostel name is required.', 'error');
    if (payload.floors <= 0 || payload.totalRooms <= 0 || payload.totalCapacity <= 0) return Utils.showToast('Numeric fields must be positive.', 'error');

    if (existingId) {
      DB.updateData(DB.KEYS.hostels, existingId, payload);
      Utils.showToast('Hostel updated successfully.', 'success');
    } else {
      DB.insert(DB.KEYS.hostels, { id: DB.generateId('H'), ...payload });
      Utils.showToast('Hostel added successfully.', 'success');
    }
    Utils.closeModal();
    this.renderGrid();
  },

  remove(id) {
    const rooms = DB.getData(DB.KEYS.rooms);
    if (rooms.some(r => r.hostelId === id)) {
      return Utils.showToast('Cannot delete a hostel that still has rooms assigned to it.', 'error');
    }
    const h = DB.findById(DB.KEYS.hostels, id);
    Utils.confirmAction({
      title: 'Delete hostel?',
      message: `This will permanently remove ${h?.name || 'this hostel'}.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        DB.deleteData(DB.KEYS.hostels, id);
        Utils.showToast('Hostel deleted successfully.', 'success');
        this.renderGrid();
      }
    });
  }
};
