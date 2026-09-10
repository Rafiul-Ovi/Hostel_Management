/* ============================================================
   allocations.js — Room Allocation
   ============================================================ */
const AllocationsView = {
  state: { tab: 'active' },

  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div><h1>Room Allocation</h1><p>Assign students to rooms and track allocation history.</p></div>
        <button class="btn btn-primary" onclick="AllocationsView.openAssignForm()"><i class="fa-solid fa-right-to-bracket"></i> Allocate Room</button>
      </div>
      <div class="tabs">
        <button class="tab-btn ${this.state.tab==='active'?'tab-active':''}" onclick="AllocationsView.setTab('active')">Active Allocations</button>
        <button class="tab-btn ${this.state.tab==='history'?'tab-active':''}" onclick="AllocationsView.setTab('history')">Allocation History</button>
      </div>
      <div id="allocation-content"></div>
    `;
    this.renderContent();
  },

  setTab(tab) { this.state.tab = tab; this.render(document.getElementById('view-container')); },

  renderContent() {
    const el = document.getElementById('allocation-content');
    const allocations = DB.getData(DB.KEYS.allocations).slice().reverse();
    const students = DB.getData(DB.KEYS.students);
    const hostels = DB.getData(DB.KEYS.hostels);
    const rooms = DB.getData(DB.KEYS.rooms);
    const list = this.state.tab === 'active' ? allocations.filter(a => a.status === 'Active') : allocations;

    if (list.length === 0) {
      el.innerHTML = Utils.emptyState({ icon: 'fa-key', title: 'No allocations found', message: 'No allocation records to display yet.', actionLabel: 'Allocate Room', actionOnClick: 'AllocationsView.openAssignForm()' });
      return;
    }

    el.innerHTML = `
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>Student</th><th>Hostel / Room</th><th>Bed</th><th>Allocated</th><th>Checkout</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            ${list.map(a => {
              const s = students.find(x => x.id === a.studentId);
              const h = hostels.find(x => x.id === a.hostelId);
              const r = rooms.find(x => x.id === a.roomId);
              return `<tr>
                <td><div class="cell-primary">${Utils.escapeHtml(s?.name||'Unknown')}</div><div class="cell-secondary">${Utils.escapeHtml(a.studentId)}</div></td>
                <td>${Utils.escapeHtml(h?.name||'—')} · Room ${Utils.escapeHtml(r?.number||'—')}</td>
                <td>#${a.bedNumber}</td>
                <td>${Utils.formatDate(a.allocationDate)}</td>
                <td>${Utils.formatDate(a.checkoutDate)}</td>
                <td>${Utils.statusBadge(a.status==='Active'?'Active':'Inactive')}</td>
                <td class="text-right">
                  ${a.status === 'Active' ? `
                    <button class="btn btn-ghost btn-sm" onclick="AllocationsView.openChangeForm('${a.id}')">Change Room</button>
                    <button class="btn btn-ghost btn-sm icon-btn-danger" onclick="AllocationsView.vacate('${a.id}')">Vacate</button>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  openAssignForm() {
    const students = DB.getData(DB.KEYS.students).filter(s => !s.roomId);
    const hostels = DB.getData(DB.KEYS.hostels);
    if (students.length === 0) return Utils.showToast('All students are already allocated to a room.', 'info');
    Utils.showModal({
      title: 'Allocate Room',
      size: 'lg',
      bodyHtml: `
        <form id="allocate-form" class="form-grid" novalidate>
          <div class="form-field col-span-2"><label>Student *</label>
            <select name="studentId" id="alloc-student" required>
              <option value="">Select student</option>
              ${students.map(s=>`<option value="${s.id}">${Utils.escapeHtml(s.name)} (${s.id}) — ${s.gender}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Hostel *</label>
            <select name="hostelId" id="alloc-hostel" required>
              <option value="">Select hostel</option>
              ${hostels.map(h=>`<option value="${h.id}">${Utils.escapeHtml(h.name)} (${h.gender})</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Room *</label>
            <select name="roomId" id="alloc-room" required><option value="">Select hostel first</option></select>
          </div>
          <div class="form-field"><label>Allocation Date *</label><input name="allocationDate" type="date" required value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="form-field"><label>Expected Checkout Date</label><input name="checkoutDate" type="date"></div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Allocate</button>
          </div>
        </form>`,
      onMount: () => {
        const hostelSel = document.getElementById('alloc-hostel');
        const roomSel = document.getElementById('alloc-room');
        hostelSel.addEventListener('change', () => {
          const rooms = DB.getData(DB.KEYS.rooms).filter(r => r.hostelId === hostelSel.value && r.occupancy < r.capacity);
          roomSel.innerHTML = rooms.length
            ? `<option value="">Select room</option>` + rooms.map(r => `<option value="${r.id}">Room ${r.number} — ${r.type} (${r.capacity-r.occupancy} beds free)</option>`).join('')
            : `<option value="">No available rooms in this hostel</option>`;
        });
        document.getElementById('allocate-form').addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitAssign(e.target);
        });
      }
    });
  },

  submitAssign(form) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.studentId || !payload.roomId) return Utils.showToast('Please select both a student and a room.', 'error');

    const room = DB.findById(DB.KEYS.rooms, payload.roomId);
    if (!room) return Utils.showToast('Selected room no longer exists.', 'error');
    if (room.occupancy >= room.capacity) return Utils.showToast('This room is already full.', 'error');

    const newOccupancy = room.occupancy + 1;
    DB.updateData(DB.KEYS.rooms, room.id, {
      occupancy: newOccupancy,
      availableBeds: room.capacity - newOccupancy,
      status: newOccupancy >= room.capacity ? 'Full' : 'Partially Occupied'
    });
    DB.updateData(DB.KEYS.students, payload.studentId, { hostelId: payload.hostelId, roomId: payload.roomId });
    DB.insert(DB.KEYS.allocations, {
      id: DB.generateId('ALC'), studentId: payload.studentId, hostelId: payload.hostelId, roomId: payload.roomId,
      bedNumber: newOccupancy, allocationDate: payload.allocationDate, checkoutDate: payload.checkoutDate || null, status: 'Active'
    });
    Utils.showToast('Room allocated successfully.', 'success');
    Utils.closeModal();
    this.renderContent();
  },

  openChangeForm(allocationId) {
    const alloc = DB.findById(DB.KEYS.allocations, allocationId);
    const hostels = DB.getData(DB.KEYS.hostels);
    Utils.showModal({
      title: 'Change Room',
      size: 'lg',
      bodyHtml: `
        <form id="change-form" class="form-grid" novalidate>
          <div class="form-field"><label>New Hostel *</label>
            <select name="hostelId" id="chg-hostel" required>
              <option value="">Select hostel</option>
              ${hostels.map(h=>`<option value="${h.id}">${Utils.escapeHtml(h.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>New Room *</label>
            <select name="roomId" id="chg-room" required><option value="">Select hostel first</option></select>
          </div>
          <div class="form-actions col-span-2">
            <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Move Student</button>
          </div>
        </form>`,
      onMount: () => {
        const hostelSel = document.getElementById('chg-hostel');
        const roomSel = document.getElementById('chg-room');
        hostelSel.addEventListener('change', () => {
          const rooms = DB.getData(DB.KEYS.rooms).filter(r => r.hostelId === hostelSel.value && r.id !== alloc.roomId && r.occupancy < r.capacity);
          roomSel.innerHTML = rooms.length
            ? `<option value="">Select room</option>` + rooms.map(r => `<option value="${r.id}">Room ${r.number} — ${r.capacity-r.occupancy} beds free</option>`).join('')
            : `<option value="">No available rooms</option>`;
        });
        document.getElementById('change-form').addEventListener('submit', e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const newRoomId = fd.get('roomId'), newHostelId = fd.get('hostelId');
          if (!newRoomId) return Utils.showToast('Please select a room.', 'error');
          this.changeRoom(alloc, newHostelId, newRoomId);
        });
      }
    });
  },

  changeRoom(alloc, newHostelId, newRoomId) {
    const oldRoom = DB.findById(DB.KEYS.rooms, alloc.roomId);
    const newRoom = DB.findById(DB.KEYS.rooms, newRoomId);
    if (newRoom.occupancy >= newRoom.capacity) return Utils.showToast('That room is full.', 'error');

    DB.updateData(DB.KEYS.rooms, oldRoom.id, { occupancy: oldRoom.occupancy - 1, availableBeds: oldRoom.capacity - (oldRoom.occupancy - 1), status: (oldRoom.occupancy - 1) === 0 ? 'Available' : 'Partially Occupied' });
    const newOcc = newRoom.occupancy + 1;
    DB.updateData(DB.KEYS.rooms, newRoom.id, { occupancy: newOcc, availableBeds: newRoom.capacity - newOcc, status: newOcc >= newRoom.capacity ? 'Full' : 'Partially Occupied' });
    DB.updateData(DB.KEYS.students, alloc.studentId, { hostelId: newHostelId, roomId: newRoomId });
    DB.updateData(DB.KEYS.allocations, alloc.id, { status: 'Ended' });
    DB.insert(DB.KEYS.allocations, { id: DB.generateId('ALC'), studentId: alloc.studentId, hostelId: newHostelId, roomId: newRoomId, bedNumber: newOcc, allocationDate: new Date().toISOString().slice(0,10), checkoutDate: alloc.checkoutDate, status: 'Active' });

    Utils.showToast('Student moved to new room.', 'success');
    Utils.closeModal();
    this.renderContent();
  },

  vacate(allocationId) {
    const alloc = DB.findById(DB.KEYS.allocations, allocationId);
    Utils.confirmAction({
      title: 'Vacate room?',
      message: 'This will remove the student from their current room.',
      confirmLabel: 'Vacate',
      onConfirm: () => {
        const room = DB.findById(DB.KEYS.rooms, alloc.roomId);
        if (room) {
          const newOcc = Math.max(0, room.occupancy - 1);
          DB.updateData(DB.KEYS.rooms, room.id, { occupancy: newOcc, availableBeds: room.capacity - newOcc, status: newOcc === 0 ? 'Available' : 'Partially Occupied' });
        }
        DB.updateData(DB.KEYS.students, alloc.studentId, { hostelId: null, roomId: null });
        DB.updateData(DB.KEYS.allocations, alloc.id, { status: 'Ended' });
        Utils.showToast('Student vacated from room.', 'success');
        this.renderContent();
      }
    });
  }
};
