/* ============================================================
   auth.js — frontend-only demo authentication
   NOTE: This is NOT secure. Passwords are stored in plain text
   in LocalStorage purely for demonstration purposes.
   ============================================================ */

const Auth = {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(DB.KEYS.currentUser);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  login(email, password) {
    const users = DB.getData(DB.KEYS.users);
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password,
    );
    if (!user) return { ok: false, error: "Invalid email or password." };
    const { password: _pw, ...safeUser } = user;
    localStorage.setItem(DB.KEYS.currentUser, JSON.stringify(safeUser));
    return { ok: true, user: safeUser };
  },

  logout() {
    localStorage.removeItem(DB.KEYS.currentUser);
    App.renderAuthScreen();
  },

  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      App.renderAuthScreen();
      return null;
    }
    return user;
  },

  checkRole(roles) {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
  },

  register(payload) {
    const users = DB.getData(DB.KEYS.users);
    if (
      users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())
    ) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const students = DB.getData(DB.KEYS.students);
    const studentId = DB.generateId("STU");
    const newStudent = {
      id: studentId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "",
      department: payload.department || "",
      session: "2025-2026",
      gender: payload.gender || "",
      dob: "",
      address: "",
      guardianName: "",
      guardianPhone: "",
      hostelId: null,
      roomId: null,
      admissionDate: new Date().toISOString().slice(0, 10),
      status: "Active",
    };
    students.push(newStudent);
    DB.saveData(DB.KEYS.students, students);

    const newUser = {
      id: DB.generateId("USR"),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: "student",
      studentId,
    };
    users.push(newUser);
    DB.saveData(DB.KEYS.users, users);
    return { ok: true };
  },

  resetPassword(email, newPassword) {
    const users = DB.getData(DB.KEYS.users);
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (idx === -1)
      return { ok: false, error: "No account found with that email." };
    users[idx].password = newPassword;
    DB.saveData(DB.KEYS.users, users);
    return { ok: true };
  },
};
