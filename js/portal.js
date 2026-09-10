/* ============================================================
   portal.js — Student Portal (Dashboard, Profile, My Room,
   My Payments, Hostel Rules)
   ============================================================ */
const PortalView = {
  renderDashboard(container) {
    const user = Auth.getCurrentUser();
    const student = DB.findById(DB.KEYS.students, user.studentId);
    const hostels = DB.getData(DB.KEYS.hostels);
    const rooms = DB.getData(DB.KEYS.rooms);
    const payments = DB.getData(DB.KEYS.payments).filter(p => p.studentId === student.id);
    const complaints = DB.getData(DB.KEYS.complaints).filter(c => c.studentId === student.id);
    const hostel = hostels.find(h => h.id === student.hostelId);
    const room = rooms.find(r => r.id === student.roomId);
    const latestPayment = payments[payments.length - 1];
    const openComplaints = complaints.filter(c => c.status === 'Pending' || c.status === 'In Progress').length;

    container.innerHTML = `
      <div class="view-header"><div><h1>Welcome, ${Utils.escapeHtml(student.name.split(' ')[0])}</h1><p>Your hostel life, all in one place.</p></div></div>

      <div class="profile-card">
        <div class="profile-avatar">${Utils.escapeHtml(student.name.split(' ').map(n=>n[0]).join('').slice(0,2))}</div>
        <div>
          <h3>${Utils.escapeHtml(student.name)}</h3>
          <p class="cell-secondary">${Utils.escapeHtml(student.id)} · ${Utils.escapeHtml(student.department)}</p>
          <p class="cell-secondary">${hostel ? Utils.escapeHtml(hostel.name) + ' · Room ' + Utils.escapeHtml(room?.number||'') : 'Not yet allocated to a room'}</p>
        </div>
      </div>

      <div class="stat-card-grid">
        <div class="stat-card stat-card-gold"><div class="stat-card-icon"><i class="fa-solid fa-dollar-sign"></i></div><div><p class="stat-card-value">${room?Utils.formatCurrency(room.rent):'—'}</p><p class="stat-card-label">Monthly Rent</p></div></div>
        <div class="stat-card stat-card-blue"><div class="stat-card-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div><div><p class="stat-card-value">${latestPayment?latestPayment.status:'—'}</p><p class="stat-card-label">Payment Status</p></div></div>
        <div class="stat-card stat-card-red"><div class="stat-card-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div><p class="stat-card-value">${openComplaints}</p><p class="stat-card-label">Open Complaints</p></div></div>
        <div class="stat-card stat-card-green"><div class="stat-card-icon"><i class="fa-solid fa-door-open"></i></div><div><p class="stat-card-value">${room?room.status:'Unassigned'}</p><p class="stat-card-label">Room Status</p></div></div>
      </div>

      <h3 class="section-label">Quick Actions</h3>
      <div class="quick-actions">
        <button class="quick-action-btn" onclick="App.navigate('complaints')"><i class="fa-solid fa-triangle-exclamation"></i> Submit Complaint</button>
        <button class="quick-action-btn" onclick="App.navigate('my-payments')"><i class="fa-solid fa-file-invoice-dollar"></i> View Payments</button>
        <button class="quick-action-btn" onclick="App.navigate('my-room')"><i class="fa-solid fa-door-open"></i> View Room</button>
        <button class="quick-action-btn" onclick="App.navigate('notices')"><i class="fa-solid fa-bullhorn"></i> View Notices</button>
      </div>
    `;
  },

  renderProfile(container) {
    const user = Auth.getCurrentUser();
    const student = DB.findById(DB.KEYS.students, user.studentId);
    container.innerHTML = `
      <div class="view-header"><div><h1>My Profile</h1><p>Your personal and academic details.</p></div></div>
      <div class="table-card p-6">
        <div class="detail-grid">
          <div><label>Student ID</label><p>${Utils.escapeHtml(student.id)}</p></div>
          <div><label>Status</label><p>${Utils.statusBadge(student.status)}</p></div>
          <div><label>Name</label><p>${Utils.escapeHtml(student.name)}</p></div>
          <div><label>Email</label><p>${Utils.escapeHtml(student.email)}</p></div>
          <div><label>Phone</label><p>${Utils.escapeHtml(student.phone)||'—'}</p></div>
          <div><label>Department</label><p>${Utils.escapeHtml(student.department)}</p></div>
          <div><label>Session</label><p>${Utils.escapeHtml(student.session)}</p></div>
          <div><label>Gender</label><p>${Utils.escapeHtml(student.gender)}</p></div>
          <div><label>Date of Birth</label><p>${student.dob?Utils.formatDate(student.dob):'—'}</p></div>
          <div><label>Admission Date</label><p>${Utils.formatDate(student.admissionDate)}</p></div>
          <div><label>Address</label><p>${Utils.escapeHtml(student.address)||'—'}</p></div>
          <div><label>Guardian</label><p>${Utils.escapeHtml(student.guardianName)||'—'}</p></div>
          <div><label>Guardian Phone</label><p>${Utils.escapeHtml(student.guardianPhone)||'—'}</p></div>
        </div>
      </div>`;
  },

  renderMyRoom(container) {
    const user = Auth.getCurrentUser();
    const student = DB.findById(DB.KEYS.students, user.studentId);
    const hostel = DB.findById(DB.KEYS.hostels, student.hostelId);
    const room = DB.findById(DB.KEYS.rooms, student.roomId);
    container.innerHTML = `<div class="view-header"><div><h1>My Room</h1><p>Details of your current hostel accommodation.</p></div></div>`;
    if (!room) {
      container.innerHTML += Utils.emptyState({ icon: 'fa-door-closed', title: 'No room assigned', message: 'You have not yet been allocated to a hostel room. Please contact the hostel office.' });
      return;
    }
    const roommates = DB.getData(DB.KEYS.students).filter(s => s.roomId === room.id && s.id !== student.id);
    container.innerHTML += `
      <div class="table-card p-6">
        <div class="detail-grid">
          <div><label>Hostel</label><p>${Utils.escapeHtml(hostel?.name||'—')}</p></div>
          <div><label>Room Number</label><p>${Utils.escapeHtml(room.number)}</p></div>
          <div><label>Floor</label><p>${room.floor}</p></div>
          <div><label>Type</label><p>${Utils.escapeHtml(room.type)}</p></div>
          <div><label>Monthly Rent</label><p>${Utils.formatCurrency(room.rent)}</p></div>
          <div><label>Room Status</label><p>${Utils.statusBadge(room.status)}</p></div>
        </div>
        <label class="block mt-4 mb-1 text-sm font-medium">Roommates</label>
        ${roommates.length ? `<ul class="list-disc pl-5 text-sm">${roommates.map(r=>`<li>${Utils.escapeHtml(r.name)}</li>`).join('')}</ul>` : '<p class="cell-secondary">You currently have no roommates.</p>'}
      </div>`;
  },

  renderMyPayments(container) {
    const user = Auth.getCurrentUser();
    const payments = DB.getData(DB.KEYS.payments).filter(p => p.studentId === user.studentId).reverse();
    container.innerHTML = `<div class="view-header"><div><h1>My Payments</h1><p>Your hostel fee payment history.</p></div></div>`;
    if (payments.length === 0) {
      container.innerHTML += Utils.emptyState({ icon: 'fa-file-invoice-dollar', title: 'No payment records', message: 'You do not have any payment records yet.' });
      return;
    }
    container.innerHTML += `
      <div class="table-card">
        <table class="data-table">
          <thead><tr><th>Month</th><th>Amount</th><th>Status</th><th>Paid On</th><th>Method</th></tr></thead>
          <tbody>${payments.map(p => `
            <tr><td>${Utils.escapeHtml(p.month)}</td><td>${Utils.formatCurrency(p.amount)}</td><td>${Utils.statusBadge(p.status)}</td><td>${p.paymentDate?Utils.formatDate(p.paymentDate):'—'}</td><td>${Utils.escapeHtml(p.method||'—')}</td></tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  },

  renderRules(container) {
    const sections = [
      { title: 'General Rules', icon: 'fa-book', items: ['All residents must carry a valid hostel ID at all times.', 'Ragging or bullying of any kind is strictly prohibited.', 'Residents must vacate rooms by the end of each academic session unless otherwise approved.'] },
      { title: 'Room Rules', icon: 'fa-door-closed', items: ['Keep rooms clean and free of prohibited electrical appliances.', 'Do not alter room fixtures or paint walls without permission.', 'Report any maintenance issues promptly through the complaints portal.'] },
      { title: 'Visitor Rules', icon: 'fa-user-group', items: ['Visitors are allowed only during designated visiting hours.', 'All guests must register at the front desk.', 'Overnight guests are not permitted without prior written approval.'] },
      { title: 'Security Rules', icon: 'fa-shield-halved', items: ['Main gates are locked at 11 PM; late entry requires warden approval.', 'Do not share room keys or access cards with anyone.', 'Report suspicious activity to hostel security immediately.'] },
      { title: 'Meal Rules', icon: 'fa-utensils', items: ['Dining hall hours are 7–9 AM, 12–2 PM, and 7–9 PM.', 'Outside food deliveries must be collected at the main gate.', 'Wastage of food is discouraged and may incur a fine.'] },
      { title: 'Internet Rules', icon: 'fa-wifi', items: ['Hostel Wi-Fi is for academic and personal use only.', 'Excessive bandwidth use (e.g. torrenting) is prohibited.', 'Report connectivity issues to IT support.'] },
      { title: 'Disciplinary Rules', icon: 'fa-gavel', items: ['Violations may result in warnings, fines, or expulsion from the hostel.', 'Damage to hostel property must be compensated by the responsible resident.', 'Repeated violations are reviewed by the hostel disciplinary committee.'] },
      { title: 'Emergency Procedures', icon: 'fa-truck-medical', items: ['In case of fire, use the nearest marked exit and assemble at the muster point.', 'Medical emergencies should be reported to the warden or front desk immediately.', 'Emergency contact numbers are posted on every floor notice board.'] }
    ];
    container.innerHTML = `
      <div class="view-header"><div><h1>Hostel Rules</h1><p>Please review and follow these guidelines during your stay.</p></div></div>
      <div class="accordion">
        ${sections.map((s, i) => `
          <div class="accordion-item">
            <button class="accordion-head" onclick="PortalView.toggleAccordion(${i})">
              <span><i class="fa-solid ${s.icon}"></i> ${s.title}</span>
              <i class="fa-solid fa-chevron-down accordion-caret" id="caret-${i}"></i>
            </button>
            <div class="accordion-body" id="acc-${i}">
              <ul>${s.items.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
          </div>`).join('')}
      </div>`;
  },

  toggleAccordion(i) {
    const body = document.getElementById(`acc-${i}`);
    const caret = document.getElementById(`caret-${i}`);
    const open = body.classList.toggle('accordion-open');
    caret.classList.toggle('rotate-180', open);
  }
};
