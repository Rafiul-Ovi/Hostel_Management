const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = [
  'students',
  'hostels',
  'rooms',
  'allocations',
  'payments',
  'complaints',
  'notices',
  'users',
  'settings',
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateDemoData() {
  const hostels = [
    {
      id: 'H-001',
      name: 'Ashford Hall',
      type: 'Boys',
      gender: 'Male',
      floors: 4,
      totalRooms: 8,
      totalCapacity: 24,
      warden: 'Mr. Daniel Reyes',
      wardenPhone: '555-0110',
      address: '12 College Ave',
      status: 'Active',
    },
    {
      id: 'H-002',
      name: 'Marigold House',
      type: 'Girls',
      gender: 'Female',
      floors: 3,
      totalRooms: 7,
      totalCapacity: 21,
      warden: 'Mrs. Patricia Ng',
      wardenPhone: '555-0122',
      address: '4 Elm Court',
      status: 'Active',
    },
    {
      id: 'H-003',
      name: 'Founders Lodge',
      type: 'Co-ed',
      gender: 'Co-ed',
      floors: 3,
      totalRooms: 5,
      totalCapacity: 15,
      warden: 'Mr. Samuel Okoro',
      wardenPhone: '555-0134',
      address: '9 University Rd',
      status: 'Active',
    },
  ];

  const roomTypes = ['Single', 'Double', 'Triple', 'Four Bed'];
  const capByType = { Single: 1, Double: 2, Triple: 3, 'Four Bed': 4 };
  const rentByType = { Single: 420, Double: 300, Triple: 240, 'Four Bed': 190 };

  let rooms = [];
  let roomCounter = 1;

  hostels.forEach((hostel, hostelIndex) => {
    for (let floor = 1; floor <= hostel.floors; floor += 1) {
      for (let roomIndex = 1; roomIndex <= 2; roomIndex += 1) {
        if (rooms.filter((room) => room.hostelId === hostel.id).length >= hostel.totalRooms) {
          continue;
        }

        const type = roomTypes[(roomCounter + floor + hostelIndex) % roomTypes.length];
        const capacity = capByType[type];
        rooms.push({
          id: `R-${String(roomCounter).padStart(3, '0')}`,
          number: `${floor}${String(roomIndex).padStart(2, '0')}`,
          hostelId: hostel.id,
          floor,
          type,
          capacity,
          occupancy: 0,
          rent: rentByType[type],
          status: 'Available',
          availableBeds: capacity,
        });
        roomCounter += 1;
      }
    }
  });

  rooms = rooms.slice(0, 22);

  const students = Array.from({ length: 20 }, (_, index) => {
    const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'Elijah', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'Henry', 'Abigail', 'Sebastian'];
    const lastNames = ['Carter', 'Bennett', 'Reyes', 'Nguyen', 'Patel', 'Okoro', 'Fischer', 'Rossi', 'Kowalski', 'Dubois', 'Andersson', 'Silva', 'Kim', 'Haddad', 'Morales', 'Lindqvist', 'Osei', 'Novak', 'Petrov', 'Ahmed'];
    const departments = ['Computer Science', 'Business Admin', 'Mechanical Eng.', 'Biology', 'Economics', 'Architecture', 'Psychology', 'Electrical Eng.'];
    const gender = index % 2 === 0 ? 'Male' : 'Female';
    const hostel = hostels[(index + 1) % hostels.length];

    return {
      id: `STU-${String(1000 + index + 1)}`,
      name: `${firstNames[index]} ${lastNames[index]}`,
      email: `${firstNames[index].toLowerCase()}.${lastNames[index].toLowerCase()}@campus.edu`,
      phone: `555-02${String(10 + index).padStart(2, '0')}`,
      department: departments[index % departments.length],
      session: '2025-2026',
      gender,
      dob: `200${3 + (index % 5)}-0${1 + (index % 9) % 9}-1${index % 9}`,
      address: `${index + 1} Willow Street`,
      guardianName: `${lastNames[(index + 4) % lastNames.length]} Family Guardian`,
      guardianPhone: `555-03${String(10 + index).padStart(2, '0')}`,
      hostelId: hostel.id,
      roomId: null,
      admissionDate: '2025-08-15',
      status: 'Active',
    };
  });

  const allocations = [];
  let roomCursor = 0;

  students.slice(0, 15).forEach((student, index) => {
    const room = rooms[roomCursor % rooms.length];
    roomCursor += 1;
    const targetRoom = rooms.find((candidate) => candidate.hostelId === student.hostelId && candidate.occupancy < candidate.capacity);
    const selectedRoom = targetRoom || room;
    selectedRoom.occupancy += 1;
    selectedRoom.availableBeds = selectedRoom.capacity - selectedRoom.occupancy;
    selectedRoom.status = selectedRoom.occupancy >= selectedRoom.capacity ? 'Full' : 'Partially Occupied';
    student.hostelId = selectedRoom.hostelId;
    student.roomId = selectedRoom.id;
    allocations.push({
      id: `ALC-${String(index + 1).padStart(4, '0')}`,
      studentId: student.id,
      hostelId: selectedRoom.hostelId,
      roomId: selectedRoom.id,
      bedNumber: selectedRoom.occupancy,
      allocationDate: '2025-08-20',
      checkoutDate: '2026-06-30',
      status: 'Active',
    });
  });

  const payments = students.filter((student) => student.roomId).flatMap((student, studentIndex) => {
    const room = rooms.find((candidate) => candidate.id === student.roomId);
    const months = ['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'];
    return months.map((month, monthIndex) => {
      const statusRoll = (studentIndex + monthIndex) % 5;
      const status = statusRoll === 0 ? 'Overdue' : statusRoll === 1 ? 'Pending' : 'Paid';
      return {
        id: `PAY-${String(1000 + studentIndex * 10 + monthIndex + 1)}`,
        studentId: student.id,
        studentName: student.name,
        month,
        amount: room ? room.rent : 300,
        paymentDate: status === 'Paid' ? `2025-${String(9 + monthIndex).padStart(2, '0')}-05` : null,
        method: status === 'Paid' ? ['Bank Transfer', 'Card', 'Cash', 'Mobile Wallet'][studentIndex % 4] : null,
        transactionId: status === 'Paid' ? `TXN${100000 + studentIndex * 10 + monthIndex}` : null,
        status,
      };
    });
  }).slice(0, 26);

  const complaints = Array.from({ length: 10 }, (_, index) => {
    const categories = ['Electricity', 'Water', 'Internet', 'Cleaning', 'Food', 'Maintenance', 'Security', 'Other'];
    const priorities = ['Low', 'Medium', 'High'];
    const statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
    const student = students[index % students.length];
    const category = categories[index % categories.length];

    return {
      id: `CMP-${String(2000 + index)}`,
      studentId: student.id,
      roomId: student.roomId,
      category,
      subject: `${category} issue in room ${student.roomId || 'N/A'}`,
      description: `Reported an issue related to ${category.toLowerCase()} that needs attention from hostel staff.`,
      date: `2025-11-${String(1 + index).padStart(2, '0')}`,
      priority: priorities[index % priorities.length],
      status: statuses[index % statuses.length],
    };
  });

  const notices = [
    { id: 'NTC-001', title: 'Hostel Fee Payment Deadline', description: 'All students must clear pending hostel fees by the 10th of each month to avoid penalties.', date: '2025-09-01', author: 'Admin Office', priority: 'High', audience: 'All Students', status: 'Published' },
    { id: 'NTC-002', title: 'Water Supply Maintenance', description: 'Water supply will be interrupted in Ashford Hall on Saturday from 9 AM to 1 PM for maintenance.', date: '2025-09-10', author: 'Mr. Daniel Reyes', priority: 'Medium', audience: 'Specific Hostel', status: 'Published' },
    { id: 'NTC-003', title: 'Fire Safety Drill', description: 'A mandatory fire safety drill will be held across all hostels. Please cooperate with wardens.', date: '2025-09-15', author: 'Admin Office', priority: 'High', audience: 'All Students', status: 'Published' },
  ];

  const users = [
    { id: 'USR-001', name: 'Admin User', email: 'admin@hostel.com', password: 'admin123', role: 'admin', hostelId: null },
    { id: 'USR-002', name: 'Daniel Reyes', email: 'manager@hostel.com', password: 'manager123', role: 'manager', hostelId: 'H-001' },
    { id: 'USR-003', name: students[0].name, email: 'student@hostel.com', password: 'student123', role: 'student', studentId: students[0].id },
  ];

  const settings = { hostelName: 'Campus Hostel Management', currency: 'USD', theme: 'light' };

  return { hostels, rooms, students, allocations, payments, complaints, notices, users, settings };
}

function loadDatabase() {
  ensureDataDir();

  if (!fs.existsSync(DB_PATH)) {
    const seeded = generateDemoData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2));
    return seeded;
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  if (!raw.trim()) {
    const seeded = generateDemoData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    const seeded = generateDemoData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2));
    return seeded;
  }
}

let database = loadDatabase();

function saveDatabase() {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
}

function getCollectionValue(collection) {
  if (!COLLECTIONS.includes(collection)) {
    return null;
  }
  return database[collection];
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function buildSummary() {
  const students = database.students || [];
  const rooms = database.rooms || [];
  const hostels = database.hostels || [];
  const payments = database.payments || [];
  const complaints = database.complaints || [];
  const occupiedRooms = rooms.filter((room) => room.occupancy > 0).length;
  const pendingPayments = payments.filter((payment) => payment.status !== 'Paid').length;

  return {
    totalStudents: students.length,
    totalHostels: hostels.length,
    totalRooms: rooms.length,
    occupiedRooms,
    pendingPayments,
    openComplaints: complaints.filter((complaint) => complaint.status !== 'Resolved').length,
    occupancyRate: rooms.length ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : '0.0',
  };
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(ROOT_DIR));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Hostel Management API is running', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/summary', (req, res) => {
  res.json(buildSummary());
});

app.get('/api/:collection', (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  return res.json(getCollectionValue(collection));
});

app.post('/api/:collection', (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  const list = database[collection];
  if (!Array.isArray(list)) {
    database[collection] = req.body;
    saveDatabase();
    return res.status(201).json(database[collection]);
  }

  const payload = req.body || {};
  const record = { ...payload };
  if (!record.id) {
    record.id = `AUTO-${Date.now()}`;
  }
  list.push(record);
  saveDatabase();
  return res.status(201).json(record);
});

app.put('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  const list = database[collection];
  if (!Array.isArray(list)) {
    database[collection] = { ...(list || {}), ...req.body };
    saveDatabase();
    return res.json(database[collection]);
  }

  const index = list.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Record not found' });
  }

  list[index] = { ...list[index], ...req.body };
  saveDatabase();
  return res.json(list[index]);
});

app.delete('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  const list = database[collection];
  if (!Array.isArray(list)) {
    return res.status(400).json({ message: 'This collection is not deletable as a list' });
  }

  const lengthBefore = list.length;
  const next = list.filter((item) => item.id !== id);
  if (next.length === lengthBefore) {
    return res.status(404).json({ message: 'Record not found' });
  }

  database[collection] = next;
  saveDatabase();
  return res.json({ success: true, deletedId: id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const matchedUser = (database.users || []).find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === String(password || '')
  );

  if (!matchedUser) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({ ok: true, user: sanitizeUser(matchedUser) });
});

app.post('/api/auth/register', (req, res) => {
  const payload = req.body || {};
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email || !payload.password || !payload.name) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  const existing = (database.users || []).find((user) => user.email.toLowerCase() === email);
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const studentId = `STU-${Date.now().toString().slice(-6)}`;
  const newStudent = {
    id: studentId,
    name: payload.name,
    email,
    phone: payload.phone || '',
    department: payload.department || '',
    session: '2025-2026',
    gender: payload.gender || 'Male',
    dob: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    hostelId: null,
    roomId: null,
    admissionDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
  };

  database.students.push(newStudent);

  const newUser = {
    id: `USR-${Date.now().toString().slice(-6)}`,
    name: payload.name,
    email,
    password: String(payload.password),
    role: 'student',
    studentId,
  };

  database.users.push(newUser);
  saveDatabase();
  return res.status(201).json({ ok: true, user: sanitizeUser(newUser) });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = (database.users || []).find((record) => record.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ message: 'No account found with that email.' });
  }

  user.password = String(password || '');
  saveDatabase();
  return res.json({ ok: true, message: 'Password reset successful.' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  return res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hostel Management API listening on http://localhost:${PORT}`);
});
