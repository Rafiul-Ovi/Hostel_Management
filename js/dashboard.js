/* ============================================================
   dashboard.js — Admin / Manager Dashboard
   ============================================================ */
const DashboardView = {
  charts: [],

  render(container) {
    const user = Auth.getCurrentUser();
    const students = DB.getData(DB.KEYS.students);
    const hostels = DB.getData(DB.KEYS.hostels);
    let rooms = DB.getData(DB.KEYS.rooms);
    const payments = DB.getData(DB.KEYS.payments);
    const complaints = DB.getData(DB.KEYS.complaints);

    if (user.role === 'manager') rooms = rooms.filter(r => r.hostelId === user.hostelId);

    const totalStudents = user.role === 'manager' ? students.filter(s => s.hostelId === user.hostelId).length : students.length;
    const totalHostels = hostels.length;
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'Available').length;
    const occupiedRooms = rooms.filter(r => r.occupancy > 0).length;
    const pendingPayments = payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length;
    const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;

    const cards = [
      { label: 'Total Students', value: totalStudents, icon: 'fa-user-graduate', tone: 'blue' },
      { label: 'Total Hostels', value: totalHostels, icon: 'fa-building', tone: 'indigo' },
      { label: 'Total Rooms', value: totalRooms, icon: 'fa-door-closed', tone: 'slate' },
      { label: 'Available Rooms', value: availableRooms, icon: 'fa-door-open', tone: 'green' },
      { label: 'Occupied Rooms', value: occupiedRooms, icon: 'fa-bed', tone: 'gold' },
      { label: 'Pending Payments', value: pendingPayments, icon: 'fa-file-invoice-dollar', tone: 'yellow' },
      { label: 'Pending Complaints', value: pendingComplaints, icon: 'fa-triangle-exclamation', tone: 'red' }
    ];

    container.innerHTML = `
      <div class="view-header">
        <div><h1>Welcome back, ${Utils.escapeHtml(user.name.split(' ')[0])}</h1><p>Here's what's happening across the hostel today.</p></div>
      </div>
      <div class="stat-card-grid">
        ${cards.map(c => `
          <div class="stat-card stat-card-${c.tone}">
            <div class="stat-card-icon"><i class="fa-solid ${c.icon}"></i></div>
            <div><p class="stat-card-value">${c.value}</p><p class="stat-card-label">${c.label}</p></div>
          </div>`).join('')}
      </div>
      <div class="chart-grid">
        <div class="chart-card"><h3>Students by Hostel</h3><canvas id="chart-students-hostel"></canvas></div>
        <div class="chart-card"><h3>Room Occupancy</h3><canvas id="chart-room-occupancy"></canvas></div>
        <div class="chart-card"><h3>Monthly Payments</h3><canvas id="chart-payments"></canvas></div>
        <div class="chart-card"><h3>Complaint Status</h3><canvas id="chart-complaints"></canvas></div>
      </div>
    `;
    this.renderCharts(user);
  },

  renderCharts(user) {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    const palette = ['#2D4159', '#C08A2E', '#3B6E91', '#B8433A', '#3F7D58', '#7C8CA3'];

    const students = DB.getData(DB.KEYS.students);
    const hostels = DB.getData(DB.KEYS.hostels);
    const byHostel = hostels.map(h => students.filter(s => s.hostelId === h.id).length);
    this.charts.push(new Chart(document.getElementById('chart-students-hostel'), {
      type: 'bar',
      data: { labels: hostels.map(h => h.name), datasets: [{ data: byHostel, backgroundColor: palette[0] }] },
      options: this.baseOpts(false)
    }));

    let rooms = DB.getData(DB.KEYS.rooms);
    if (user.role === 'manager') rooms = rooms.filter(r => r.hostelId === user.hostelId);
    const occGroups = ['Available','Partially Occupied','Full','Maintenance'].map(s => rooms.filter(r => r.status === s).length);
    this.charts.push(new Chart(document.getElementById('chart-room-occupancy'), {
      type: 'doughnut',
      data: { labels: ['Available','Partially Occupied','Full','Maintenance'], datasets: [{ data: occGroups, backgroundColor: palette }] },
      options: this.baseOpts(true)
    }));

    const payments = DB.getData(DB.KEYS.payments);
    const months = [...new Set(payments.map(p => p.month))];
    const paidByMonth = months.map(m => payments.filter(p => p.month === m && p.status === 'Paid').reduce((s,p)=>s+Number(p.amount),0));
    this.charts.push(new Chart(document.getElementById('chart-payments'), {
      type: 'line',
      data: { labels: months, datasets: [{ label: 'Collected', data: paidByMonth, borderColor: palette[1], backgroundColor: 'rgba(192,138,46,0.15)', tension: 0.35, fill: true }] },
      options: this.baseOpts(false)
    }));

    const complaints = DB.getData(DB.KEYS.complaints);
    const cStatuses = ['Pending','In Progress','Resolved','Rejected'];
    const cData = cStatuses.map(s => complaints.filter(c => c.status === s).length);
    this.charts.push(new Chart(document.getElementById('chart-complaints'), {
      type: 'pie',
      data: { labels: cStatuses, datasets: [{ data: cData, backgroundColor: palette }] },
      options: this.baseOpts(true)
    }));
  },

  baseOpts(showLegend) {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#C9D2DE' : '#4B5568';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: showLegend, labels: { color: textColor, boxWidth: 12, font: { size: 11 } } } },
      scales: showLegend ? {} : {
        x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } },
        y: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: isDark ? '#2A3340' : '#E7EAEF' } }
      }
    };
  },

  refreshStatsIfVisible() {
    const container = document.getElementById('view-container');
    if (container && container.dataset.view === 'dashboard') this.render(container);
  }
};
