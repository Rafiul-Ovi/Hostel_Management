/* ============================================================
   reports.js — Reports & CSV Export
   ============================================================ */
const ReportsView = {
  render(container) {
    const students = DB.getData(DB.KEYS.students);
    const rooms = DB.getData(DB.KEYS.rooms);
    const payments = DB.getData(DB.KEYS.payments);
    const complaints = DB.getData(DB.KEYS.complaints);

    const byDept = {};
    students.forEach(s => byDept[s.department] = (byDept[s.department]||0)+1);
    const hostels = DB.getData(DB.KEYS.hostels);
    const byHostel = {};
    students.forEach(s => { const h = hostels.find(x=>x.id===s.hostelId); const name = h?h.name:'Unallocated'; byHostel[name]=(byHostel[name]||0)+1; });

    const roomStats = {
      total: rooms.length,
      available: rooms.filter(r=>r.status==='Available').length,
      occupied: rooms.filter(r=>r.occupancy>0).length,
      maintenance: rooms.filter(r=>r.status==='Maintenance').length
    };
    const payStats = {
      total: payments.reduce((s,p)=>s+Number(p.amount),0),
      pending: payments.filter(p=>p.status==='Pending').reduce((s,p)=>s+Number(p.amount),0),
      overdue: payments.filter(p=>p.status==='Overdue').reduce((s,p)=>s+Number(p.amount),0)
    };
    const cmpStats = {
      total: complaints.length,
      pending: complaints.filter(c=>c.status==='Pending').length,
      inProgress: complaints.filter(c=>c.status==='In Progress').length,
      resolved: complaints.filter(c=>c.status==='Resolved').length
    };

    container.innerHTML = `
      <div class="view-header no-print">
        <div><h1>Reports</h1><p>Institution-wide summaries across students, rooms, payments, and complaints.</p></div>
        <button class="btn btn-ghost" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Report</button>
      </div>

      <div class="report-grid">
        <div class="report-card">
          <div class="report-card-head"><h3>Student Report</h3><button class="btn btn-ghost btn-sm no-print" onclick="ReportsView.exportStudents()"><i class="fa-solid fa-file-csv"></i> Export CSV</button></div>
          <p class="report-big">${students.length} <span>total students</span></p>
          <label class="report-sublabel">By Department</label>
          <ul class="report-list">${Object.entries(byDept).map(([k,v])=>`<li><span>${Utils.escapeHtml(k)}</span><span>${v}</span></li>`).join('')}</ul>
          <label class="report-sublabel">By Hostel</label>
          <ul class="report-list">${Object.entries(byHostel).map(([k,v])=>`<li><span>${Utils.escapeHtml(k)}</span><span>${v}</span></li>`).join('')}</ul>
        </div>

        <div class="report-card">
          <div class="report-card-head"><h3>Room Report</h3><button class="btn btn-ghost btn-sm no-print" onclick="ReportsView.exportRooms()"><i class="fa-solid fa-file-csv"></i> Export CSV</button></div>
          <p class="report-big">${roomStats.total} <span>total rooms</span></p>
          <ul class="report-list">
            <li><span>Available</span><span>${roomStats.available}</span></li>
            <li><span>Occupied</span><span>${roomStats.occupied}</span></li>
            <li><span>Maintenance</span><span>${roomStats.maintenance}</span></li>
          </ul>
        </div>

        <div class="report-card">
          <div class="report-card-head"><h3>Payment Report</h3><button class="btn btn-ghost btn-sm no-print" onclick="ReportsView.exportPayments()"><i class="fa-solid fa-file-csv"></i> Export CSV</button></div>
          <p class="report-big">${Utils.formatCurrency(payStats.total)} <span>total collection</span></p>
          <ul class="report-list">
            <li><span>Pending</span><span>${Utils.formatCurrency(payStats.pending)}</span></li>
            <li><span>Overdue</span><span>${Utils.formatCurrency(payStats.overdue)}</span></li>
          </ul>
        </div>

        <div class="report-card">
          <div class="report-card-head"><h3>Complaint Report</h3><button class="btn btn-ghost btn-sm no-print" onclick="ReportsView.exportComplaints()"><i class="fa-solid fa-file-csv"></i> Export CSV</button></div>
          <p class="report-big">${cmpStats.total} <span>total complaints</span></p>
          <ul class="report-list">
            <li><span>Pending</span><span>${cmpStats.pending}</span></li>
            <li><span>In Progress</span><span>${cmpStats.inProgress}</span></li>
            <li><span>Resolved</span><span>${cmpStats.resolved}</span></li>
          </ul>
        </div>
      </div>
    `;
  },

  exportStudents() {
    const students = DB.getData(DB.KEYS.students);
    Utils.csvExport('students_report.csv', ['ID','Name','Email','Phone','Department','Hostel ID','Room ID','Status'],
      students.map(s => [s.id, s.name, s.email, s.phone, s.department, s.hostelId||'', s.roomId||'', s.status]));
  },
  exportRooms() {
    const rooms = DB.getData(DB.KEYS.rooms);
    Utils.csvExport('rooms_report.csv', ['Room','Hostel ID','Type','Capacity','Occupancy','Rent','Status'],
      rooms.map(r => [r.number, r.hostelId, r.type, r.capacity, r.occupancy, r.rent, r.status]));
  },
  exportPayments() {
    const payments = DB.getData(DB.KEYS.payments);
    Utils.csvExport('payments_report.csv', ['ID','Student','Month','Amount','Status','Payment Date'],
      payments.map(p => [p.id, p.studentName, p.month, p.amount, p.status, p.paymentDate||'']));
  },
  exportComplaints() {
    const complaints = DB.getData(DB.KEYS.complaints);
    Utils.csvExport('complaints_report.csv', ['ID','Student ID','Category','Subject','Priority','Status','Date'],
      complaints.map(c => [c.id, c.studentId, c.category, c.subject, c.priority, c.status, c.date]));
  }
};
