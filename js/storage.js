/* ============================================================
   storage.js — LocalStorage data layer (mock database)
   Collections: students, hostels, rooms, allocations, payments,
                complaints, notices, users, settings
   ============================================================ */

const DB = {
  KEYS: {
    students: 'hms_students',
    hostels: 'hms_hostels',
    rooms: 'hms_rooms',
    allocations: 'hms_allocations',
    payments: 'hms_payments',
    complaints: 'hms_complaints',
    notices: 'hms_notices',
    users: 'hms_users',
    settings: 'hms_settings',
    currentUser: 'hms_currentUser',
    theme: 'hms_theme'
  },

  getData(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : parsed;
    } catch (e) {
      console.error('DB.getData error for', key, e);
      return [];
    }
  },

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('DB.saveData error for', key, e);
      Utils.showToast('Storage error — data may not have been saved.', 'error');
      return false;
    }
  },

  insert(key, record) {
    const arr = this.getData(key);
    arr.push(record);
    this.saveData(key, arr);
    return record;
  },

  updateData(key, id, updates, idField = 'id') {
    const arr = this.getData(key);
    const idx = arr.findIndex(r => r[idField] === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates };
    this.saveData(key, arr);
    return arr[idx];
  },

  deleteData(key, id, idField = 'id') {
    const arr = this.getData(key);
    const next = arr.filter(r => r[idField] !== id);
    this.saveData(key, next);
    return next.length !== arr.length;
  },

  findById(key, id, idField = 'id') {
    return this.getData(key).find(r => r[idField] === id) || null;
  },

  generateId(prefix) {
    const n = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${Date.now().toString().slice(-6)}${n}`;
  }
};

/* ------------------------------------------------------------
   Demo data seeding — runs once, only if collections are empty
   ------------------------------------------------------------ */
function seedDemoData() {
  if (localStorage.getItem('hms_seeded')) return;

  const hostels = [
    { id: 'H-001', name: 'Ashford Hall', type: 'Boys', gender: 'Male', floors: 4, totalRooms: 8, totalCapacity: 24, warden: 'Mr. Daniel Reyes', wardenPhone: '555-0110', address: '12 College Ave', status: 'Active' },
    { id: 'H-002', name: 'Marigold House', type: 'Girls', gender: 'Female', floors: 3, totalRooms: 7, totalCapacity: 21, warden: 'Mrs. Patricia Ng', wardenPhone: '555-0122', address: '4 Elm Court', status: 'Active' },
    { id: 'H-003', name: 'Founders Lodge', type: 'Co-ed', gender: 'Co-ed', floors: 3, totalRooms: 5, totalCapacity: 15, warden: 'Mr. Samuel Okoro', wardenPhone: '555-0134', address: '9 University Rd', status: 'Active' }
  ];

  const roomTypes = ['Single', 'Double', 'Triple', 'Four Bed'];
  const capByType = { Single: 1, Double: 2, Triple: 3, 'Four Bed': 4 };
  const rentByType = { Single: 420, Double: 300, Triple: 240, 'Four Bed': 190 };
  let rooms = [];
  let roomCounter = 1;
  // Deterministic generation to guarantee >=20 rooms total across hostels
  hostels.forEach((h, hi) => {
    for (let floor = 1; floor <= h.floors; floor++) {
      for (let r = 1; r <= 2; r++) {
        if (rooms.filter(rm => rm.hostelId === h.id).length >= h.totalRooms) continue;
        const type = roomTypes[(roomCounter + floor) % roomTypes.length];
        const capacity = capByType[type];
        rooms.push({
          id: `R-${String(roomCounter).padStart(3, '0')}`,
          number: `${floor}${String(r).padStart(2, '0')}`,
          hostelId: h.id,
          floor,
          type,
          capacity,
          occupancy: 0,
          rent: rentByType[type],
          status: 'Available'
        });
        roomCounter++;
      }
    }
  });
  rooms = rooms.slice(0, 22);

  const firstNames = ['Emma','Liam','Olivia','Noah','Ava','Ethan','Sophia','Mason','Isabella','Lucas','Mia','Elijah','Amelia','James','Harper','Benjamin','Evelyn','Henry','Abigail','Sebastian'];
  const lastNames = ['Carter','Bennett','Reyes','Nguyen','Patel','Okoro','Fischer','Rossi','Kowalski','Dubois','Andersson','Silva','Kim','Haddad','Morales','Lindqvist','Osei','Novak','Petrov','Ahmed'];
  const departments = ['Computer Science','Business Admin','Mechanical Eng.','Biology','Economics','Architecture','Psychology','Electrical Eng.'];

  let students = [];
  for (let i = 1; i <= 20; i++) {
    const fn = firstNames[i - 1];
    const ln = lastNames[i - 1];
    const gender = i % 2 === 0 ? 'Female' : 'Male';
    const eligible = hostels.filter(h => h.gender === 'Co-ed' || h.gender === gender);
    const hostel = eligible[i % eligible.length];
    students.push({
      id: `STU-${String(1000 + i)}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@campus.edu`,
      phone: `555-02${String(10 + i).padStart(2,'0')}`,
      department: departments[i % departments.length],
      session: '2025-2026',
      gender,
      dob: `200${3 + (i % 5)}-0${1 + (i % 9) % 9}-1${i % 9}`,
      address: `${i} Willow Street`,
      guardianName: `${lastNames[(i + 4) % lastNames.length]} Family Guardian`,
      guardianPhone: `555-03${String(10 + i).padStart(2,'0')}`,
      hostelId: null,
      roomId: null,
      admissionDate: '2025-08-15',
      status: 'Active'
    });
  }

  // Allocate first 15 students to rooms, respecting capacity & gender
  let allocations = [];
  let allocCount = 0;
  for (const student of students) {
    if (allocCount >= 15) break;
    const candidateRooms = rooms.filter(r => {
      const h = hostels.find(h => h.id === r.hostelId);
      const genderOk = h.gender === 'Co-ed' || h.gender === student.gender;
      return genderOk && r.occupancy < r.capacity;
    });
    if (candidateRooms.length === 0) continue;
    const room = candidateRooms[0];
    room.occupancy += 1;
    room.status = room.occupancy >= room.capacity ? 'Full' : 'Partially Occupied';
    student.hostelId = room.hostelId;
    student.roomId = room.id;
    allocations.push({
      id: DB.generateId('ALC'),
      studentId: student.id,
      hostelId: room.hostelId,
      roomId: room.id,
      bedNumber: room.occupancy,
      allocationDate: '2025-08-20',
      checkoutDate: '2026-06-30',
      status: 'Active'
    });
    allocCount++;
  }
  rooms.forEach(r => { r.availableBeds = r.capacity - r.occupancy; if (r.occupancy === 0) r.status = 'Available'; });

  const months = ['Sep 2025','Oct 2025','Nov 2025','Dec 2025'];
  const methods = ['Bank Transfer','Card','Cash','Mobile Wallet'];
  let payments = [];
  let payCounter = 1;
  students.filter(s => s.roomId).forEach((s, idx) => {
    const room = rooms.find(r => r.id === s.roomId);
    months.forEach((month, mi) => {
      const statusRoll = (idx + mi) % 5;
      const status = statusRoll === 0 ? 'Overdue' : (statusRoll === 1 ? 'Pending' : 'Paid');
      payments.push({
        id: `PAY-${String(1000 + payCounter)}`,
        studentId: s.id,
        studentName: s.name,
        month,
        amount: room.rent,
        paymentDate: status === 'Paid' ? `2025-${String(9 + mi).padStart(2,'0')}-05` : null,
        method: status === 'Paid' ? methods[payCounter % methods.length] : null,
        transactionId: status === 'Paid' ? `TXN${100000 + payCounter}` : null,
        status
      });
      payCounter++;
    });
  });
  payments = payments.slice(0, 26);

  const categories = ['Electricity','Water','Internet','Cleaning','Food','Maintenance','Security','Other'];
  const priorities = ['Low','Medium','High'];
  const statuses = ['Pending','In Progress','Resolved','Rejected'];
  let complaints = [];
  const allocatedStudents = students.filter(s => s.roomId);
  for (let i = 0; i < 10; i++) {
    const s = allocatedStudents[i % allocatedStudents.length];
    complaints.push({
      id: `CMP-${String(2000 + i)}`,
      studentId: s.id,
      roomId: s.roomId,
      category: categories[i % categories.length],
      subject: `${categories[i % categories.length]} issue in room ${rooms.find(r=>r.id===s.roomId)?.number || ''}`,
      description: `Reported an issue related to ${categories[i % categories.length].toLowerCase()} that needs attention from hostel staff.`,
      date: `2025-11-${String(1 + i).padStart(2,'0')}`,
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length]
    });
  }

  const notices = [
    { id: 'NTC-001', title: 'Hostel Fee Payment Deadline', description: 'All students must clear pending hostel fees by the 10th of each month to avoid late penalties.', date: '2025-09-01', author: 'Admin Office', priority: 'High', audience: 'All Students', status: 'Published' },
    { id: 'NTC-002', title: 'Water Supply Maintenance', description: 'Water supply will be interrupted in Ashford Hall on Saturday from 9 AM to 1 PM for scheduled maintenance.', date: '2025-09-10', author: 'Mr. Daniel Reyes', priority: 'Medium', audience: 'Specific Hostel', status: 'Published' },
    { id: 'NTC-003', title: 'Fire Safety Drill', description: 'A mandatory fire safety drill will be held across all hostels. Please cooperate with wardens.', date: '2025-09-15', author: 'Admin Office', priority: 'High', audience: 'All Students', status: 'Published' },
    { id: 'NTC-004', title: 'Wi-Fi Upgrade Completed', description: 'Internet speeds have been upgraded across all hostel blocks. Report any connectivity issues to the front desk.', date: '2025-09-18', author: 'IT Support', priority: 'Low', audience: 'All Students', status: 'Published' },
    { id: 'NTC-005', title: 'Guest Visiting Hours Update', description: 'Visiting hours are now restricted to 4 PM – 8 PM on weekdays and 10 AM – 8 PM on weekends.', date: '2025-09-20', author: 'Admin Office', priority: 'Medium', audience: 'All Students', status: 'Published' },
    { id: 'NTC-006', title: 'Manager Meeting Reminder', description: 'Monthly hostel manager sync will be held in the admin office conference room.', date: '2025-09-22', author: 'Admin Office', priority: 'Low', audience: 'Managers', status: 'Published' },
    { id: 'NTC-007', title: 'Room Inspection Schedule', description: 'Routine room inspections will take place next week. Please ensure rooms are tidy and accessible.', date: '2025-09-25', author: 'Mrs. Patricia Ng', priority: 'Medium', audience: 'Specific Hostel', status: 'Published' },
    { id: 'NTC-008', title: 'Cultural Night Announcement', description: 'Join us for the annual hostel cultural night in the Founders Lodge courtyard, featuring food and performances.', date: '2025-09-28', author: 'Admin Office', priority: 'Low', audience: 'All Students', status: 'Published' }
  ];

  const users = [
    { id: 'USR-001', name: 'Admin User', email: 'admin@hostel.com', password: 'admin123', role: 'admin', hostelId: null },
    { id: 'USR-002', name: 'Daniel Reyes', email: 'manager@hostel.com', password: 'manager123', role: 'manager', hostelId: 'H-001' },
    { id: 'USR-003', name: students[0].name, email: 'student@hostel.com', password: 'student123', role: 'student', studentId: students[0].id }
  ];
  // link first student record's email to the demo login so profile matches
  students[0].email = 'student@hostel.com';

  const settings = { hostelName: 'Campus Hostel Management', currency: 'USD', theme: 'light' };

  DB.saveData(DB.KEYS.hostels, hostels);
  DB.saveData(DB.KEYS.rooms, rooms);
  DB.saveData(DB.KEYS.students, students);
  DB.saveData(DB.KEYS.allocations, allocations);
  DB.saveData(DB.KEYS.payments, payments);
  DB.saveData(DB.KEYS.complaints, complaints);
  DB.saveData(DB.KEYS.notices, notices);
  DB.saveData(DB.KEYS.users, users);
  DB.saveData(DB.KEYS.settings, settings);
  localStorage.setItem('hms_seeded', 'true');
}
