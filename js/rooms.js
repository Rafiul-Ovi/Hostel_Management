/* ============================================================
   rooms.js — Room Management
   ============================================================ */
const RoomsView = {
  state: { search: '', hostelFilter: '', statusFilter: '' },

  render(container) {
    const hostels = DB.getData(DB.KEYS.hostels);
    container.innerHTML = `
      <div class="view-header">
        <div><h1>Room Management</h1><p>Track room types, capacity, and availability.</p></div>
        <button class="btn btn-primary" onclick="RoomsView.openForm()"><i class="fa-solid fa-door-open"></i> Add Room</button>
      </div>
      <div class="toolbar">
        <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="room-search" placeholder="Search by room number..." value="${Utils.escapeHtml(this.state.search)}"></div>
        <select id="room-hostel-filter" class="select-input">
          <option value="">All Hostels</option>
          ${hostels.map(h => `<option value="${h.id}" ${this.state.hostelFilter===h.id?'selected':''}>${Utils.escapeHtml(h.name)}</option>`).join('')}
        </select>
        <select id="room-status-filter" class="select-input">
          <option value="">All Statuses</option>
          ${['Available','Partially Occupied','Full','Maintenance'].map(s => `<option value="${s}" ${this.state.statusFilter===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div id="room-grid"></div>
    `;
    document.getElementById('room-search').addEventListener('input', Utils.debounce(e => { this.state.search = e.target.value; this.renderGrid(); }, 200));
    document.getElementById('room-hostel-filter').addEventListener('change', e => { this.state.hostelFilter = e.target.value; this.renderGrid(); });
    document.getElementById('room-status-filter').addEventListener('change', e => { this.state.statusFilter = e.target.value; this.renderGrid(); });
    this.renderGrid();
  },

  renderGrid() {
    const grid = document.getElementById('room-grid');
    const hostels = DB.getData(DB.KEYS.hostels);
    const hostelName = id => hostels.find(h => h.id === id)?.name || '—';
    let rooms = DB.getData(DB.KEYS.rooms);
    if (this.state.search) rooms = rooms.filter(r => r.number.toLowerCase().includes(this.state.search.toLowerCase()));
    if (this.state.hostelFilter) rooms = rooms.filter(r => r.hostelId === this.state.hostelFilter);
    if (this.state.statusFilter) rooms = rooms.filter(r => r.status === this.state.statusFilter);

    if (rooms.length === 0) {
      grid.innerHTML = Utils.emptyState({ icon: 'fa-door-closed', title: 'No rooms found', message: 'No rooms match your filters.', actionLabel: 'Add Room', actionOnClick: 'RoomsView.openForm()' });
      return;
    }

    const dotClass = { 'Available': 'dot-green', 'Partially Occupied': 'dot-yellow', 'Full': 'dot-red', 'Maintenance': 'dot-gray' };
    grid.innerHTML = `<div class="card-grid card-grid-sm">${rooms.map(r => `
      <div class="room-card">
        <div class="room-card-top">
          <span class="dot ${dotClass[r.status]||'dot-gray'}"></span>
          <span class="room-number">Room ${Utils.escapeHtml(r.number)}</span>
          ${Utils.statusBadge(r.status)}
        </div>
        <p class="cell-secondary">${Utils.escapeHtml(hostelName(r.hostelId))} · Floor ${r.floor}</p>
        <div class="room-card-meta">
          <span><i class="fa-solid fa-bed"></i> ${r.type}</span>
          <span><i class="fa-solid fa-users"></i> ${r.occupancy}/${r.capacity}</span>
          <span><i class="fa-solid fa-dollar-sign"></i> ${Utils.formatCurrency(r.rent)}/mo</span>
        </div>
        <div class="info-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="RoomsView.openView('${r.id}')">View</button>
          <button class="btn btn-ghost btn-sm" onclick="RoomsView.openForm('${r.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm icon-btn-danger" onclick="RoomsView.remove('${r.id}')">Delete</button>
        </div>
      </div>`).join('')}</div>`;
  },

  openView(id) {
    const r = DB.findById(DB.KEYS.rooms, id);
    if (!r) return;
    const hostels = DB.getData(DB.KEYS.hostels);
    const students = DB.getData(DB.KEYS.students).filter(s => s.roomId === id);
    Utils.showModal({
      title: `Room ${r.number}`,
      bodyHtml: `
        <div class="detail-grid">
          <div><label>Hostel</label><p>${Utils.escapeHtml(hostels.find(h=>h.id===r.hostelId)?.name||'—')}</p></div>
          <div><label>Floor</label><p>${r.floor}</p></div>
          <div><label>Type</label><p>${Utils.escapeHtml(r.type)}</p></div>
          <div><label>Status</label><p>${Utils.statusBadge(r.status)}</p></div>
          <div><label>Capacity</label><p>${r.capacity}</p></div>
          <div><label>Occupancy</label><p>${r.occupancy} (${r.capacity - r.occupancy} beds free)</p></div>
          <div><label>Monthly Rent</label><p>${Utils.formatCurrency(r.rent)}</p></div>
        </div>
        <label class="block mt-3 mb-1 text-sm font-medium">Current Residents</label>
        ${students.length ? `<ul class="list-disc pl-5 text-sm">${students.map(s=>`<li>${Utils.escapeHtml(s.name)}</li>`).join('')}</ul>` : '<p class="cell-secondary">No residents currently.</p>'}
        <div class="flex justify-end mt-4"><button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button></div>`
    });
  },

  openForm(id) {
    const r = id ? DB.findById(DB.KEYS.rooms, id) : null;
    const hostels = DB.getData(DB.KEYS.hostels);
    Utils.showModal({
      title: r ? 'Edit Room' : 'Add Room',
      size: 'lg',
      bodyHtml: `
        <form id="room-form" class="form-grid" novalidate>
          <div class="form-field"><label>Room Number *</label><input name="number" required value="${Utils.escapeHtml(r?.number||'')}"></div>
          <div class="form-field"><label>Hostel *</label>
            <select name="hostelId" required>
              <option value="">Select hostel</option>
              ${hostels.map(h=>`<option value="${h.id}" ${r?.hostelId===h.id?'selected':''}>${Utils.escapeHtml(h.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Floor *</label><input name="floor" type="number" min="1" required value="${r?.floor??''}"></div>
          <div class="form-field"><label>Room Type *</label>
            <select name="type" required>
              ${['Single','Double','Triple','Four Bed'].map(t=>`<option value="${t}" ${r?.type===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Capacity *</label><input name="capacity" type="number" min="1" required value="${r?.capacity??''}"></div>
          <div class="form-field"><label>Monthly Rent *</label><input name="rent" type="number" min="0" required value="${r?.rent??''}"></div>
          <div class="form-field"><label>Status</label>
            <select name="status">
              ${['Available','Partially Occupied','Full','Maintenance'].map(s=>`<option value="${s}" ${r?.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <p class="form-note col-span-2">Occupancy updates automatically through Room Allocation.</p>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${r ? 'Save Changes' : 'Add Room'}</button>
          </div>
        </form>`,
      onMount: () => {
        document.getElementById('room-form').addEventListener('submit', e => { e.preventDefault(); this.submitForm(e.target, r?.id); });
      }
    });
  },

  submitForm(form, existingId) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    ['floor','capacity','rent'].forEach(f => payload[f] = Number(payload[f]));
    if (!payload.number.trim() || !payload.hostelId) return Utils.showToast('Room number and hostel are required.', 'error');
    if (payload.capacity <= 0) return Utils.showToast('Capacity must be greater than zero.', 'error');

    if (existingId) {
      const existing = DB.findById(DB.KEYS.rooms, existingId);
      if (payload.capacity < existing.occupancy) return Utils.showToast('Capacity cannot be less than current occupancy.', 'error');
      payload.availableBeds = payload.capacity - existing.occupancy;
      DB.updateData(DB.KEYS.rooms, existingId, payload);
      Utils.showToast('Room updated successfully.', 'success');
    } else {
      DB.insert(DB.KEYS.rooms, { id: DB.generateId('R'), occupancy: 0, availableBeds: payload.capacity, ...payload });
      Utils.showToast('Room added successfully.', 'success');
    }
    Utils.closeModal();
    this.renderGrid();
  },

  remove(id) {
    const r = DB.findById(DB.KEYS.rooms, id);
    if (r && r.occupancy > 0) return Utils.showToast('Cannot delete a room with active residents.', 'error');
    Utils.confirmAction({
      title: 'Delete room?',
      message: `This will permanently remove room ${r?.number || ''}.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        DB.deleteData(DB.KEYS.rooms, id);
        Utils.showToast('Room deleted successfully.', 'success');
        this.renderGrid();
      }
    });
  }
};
