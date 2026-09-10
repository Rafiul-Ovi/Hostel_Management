/* ============================================================
   app.js — Router, App Shell, Auth Screens, Init
   ============================================================ */
const App = {
  navConfig: {
    admin: [
      { key: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
      { key: "students", label: "Students", icon: "fa-user-graduate" },
      { key: "hostels", label: "Hostels", icon: "fa-building" },
      { key: "rooms", label: "Rooms", icon: "fa-door-closed" },
      { key: "allocations", label: "Room Allocation", icon: "fa-key" },
      { key: "payments", label: "Payments", icon: "fa-file-invoice-dollar" },
      {
        key: "complaints",
        label: "Complaints",
        icon: "fa-triangle-exclamation",
      },
      { key: "notices", label: "Notices", icon: "fa-bullhorn" },
      { key: "reports", label: "Reports", icon: "fa-chart-column" },
      { key: "users", label: "Users", icon: "fa-users-gear" },
      { key: "rules", label: "Hostel Rules", icon: "fa-scroll" },
      { key: "settings", label: "Settings", icon: "fa-gear" },
    ],
    manager: [
      { key: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
      { key: "students", label: "Students", icon: "fa-user-graduate" },
      { key: "rooms", label: "Rooms", icon: "fa-door-closed" },
      {
        key: "complaints",
        label: "Complaints",
        icon: "fa-triangle-exclamation",
      },
      { key: "payments", label: "Payments", icon: "fa-file-invoice-dollar" },
      { key: "notices", label: "Notices", icon: "fa-bullhorn" },
      { key: "rules", label: "Hostel Rules", icon: "fa-scroll" },
      { key: "settings", label: "Settings", icon: "fa-gear" },
    ],
    student: [
      { key: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
      { key: "profile", label: "My Profile", icon: "fa-id-card" },
      { key: "my-room", label: "My Room", icon: "fa-door-open" },
      {
        key: "my-payments",
        label: "My Payments",
        icon: "fa-file-invoice-dollar",
      },
      {
        key: "complaints",
        label: "Complaints",
        icon: "fa-triangle-exclamation",
      },
      { key: "notices", label: "Notices", icon: "fa-bullhorn" },
      { key: "rules", label: "Hostel Rules", icon: "fa-scroll" },
      { key: "settings", label: "Settings", icon: "fa-gear" },
    ],
  },

  currentView: "dashboard",

  init() {
    seedDemoData();
    const savedTheme = localStorage.getItem(DB.KEYS.theme) || "light";
    this.setTheme(savedTheme, false);
    const user = Auth.getCurrentUser();
    if (user) this.renderShell();
    else this.renderAuthScreen();
  },

  setTheme(theme, redrawCharts = true) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(DB.KEYS.theme, theme);
    if (
      redrawCharts &&
      this.currentView === "dashboard" &&
      window.DashboardView &&
      document.getElementById("chart-students-hostel")
    ) {
      DashboardView.renderCharts(Auth.getCurrentUser());
    }
  },

  /* ---------------------- AUTH SCREENS ---------------------- */
  renderAuthScreen(mode = "login") {
    const root = document.getElementById("app-root");
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-panel">
          <div class="auth-brand flex flex-col items-center justify-center text-center">
            <div class="auth-logo"><i class="fa-solid fa-building-columns"></i></div>
            <h1>RUET Hostel<br>Management System</h1>
            <p>Administration portal for RUET residence halls.</p>
          </div>
          <div id="auth-form-area"></div>
        </div>
        <div class="auth-side">
          <div class="auth-side-inner">
            <i class="fa-solid fa-shield-halved auth-side-icon"></i>
            <h2>Manage residents, rooms, and payments in one place.</h2>
            <p>Track allocations, collect fees, resolve complaints, and keep every hostel resident informed.</p>
          </div>
        </div>
      </div>
      <div id="toast-container" class="toast-container"></div>
      <div id="modal-root"></div>
    `;
    this.renderAuthForm(mode);
  },

  renderAuthForm(mode) {
    const area = document.getElementById("auth-form-area");
    if (mode === "login") {
      area.innerHTML = `
        <h2 class="auth-title">Sign In</h2>
        <form id="login-form" class="form-stack" novalidate>
          <div class="form-field"><label>Email</label><input name="email" type="email" required placeholder="admin@hostel.com"></div>
          <div class="form-field"><label>Password</label><input name="password" type="password" required placeholder="••••••••"></div>
          <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>
        <div class="auth-links">
          <a href="#" onclick="App.renderAuthForm('forgot');return false;">Forgot password?</a>
          <a href="#" onclick="App.renderAuthForm('register');return false;">Create a student account</a>
        </div>
        <!--- <div class="demo-accounts">
          <p>Demo accounts</p>
          <button type="button" onclick="App.fillDemo('admin@hostel.com','admin123')">Admin — admin@hostel.com / admin123</button>
          <button type="button" onclick="App.fillDemo('manager@hostel.com','manager123')">Manager — manager@hostel.com / manager123</button>
          <button type="button" onclick="App.fillDemo('student@hostel.com','student123')">Student — student@hostel.com / student123</button>
        </div> -->
      `;
      document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const result = Auth.login(fd.get("email"), fd.get("password"));
        if (!result.ok) return Utils.showToast(result.error, "error");
        Utils.showToast(
          `Welcome back, ${result.user.name.split(" ")[0]}!`,
          "success",
        );
        setTimeout(() => this.renderShell(), 300);
      });
    } else if (mode === "register") {
      area.innerHTML = `
        <h2 class="auth-title">Create Student Account</h2>
        <form id="register-form" class="form-stack" novalidate>
          <div class="form-field"><label>Full Name</label><input name="name" required></div>
          <div class="form-field"><label>Email</label><input name="email" type="email" required></div>
          <div class="form-field"><label>Phone</label><input name="phone"></div>
          <div class="form-field"><label>Department</label><input name="department"></div>
          <div class="form-field"><label>Gender</label>
            <select name="gender"><option value="Male">Male</option><option value="Female">Female</option></select>
          </div>
          <div class="form-field"><label>Password</label><input name="password" type="password" required minlength="6"></div>
          <button type="submit" class="btn btn-primary btn-block">Register</button>
        </form>
        <div class="auth-links"><a href="#" onclick="App.renderAuthForm('login');return false;">Back to Sign In</a></div>
      `;
      document
        .getElementById("register-form")
        .addEventListener("submit", (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = Object.fromEntries(fd.entries());
          if (!Utils.validateEmail(payload.email))
            return Utils.showToast("Enter a valid email.", "error");
          if (payload.password.length < 6)
            return Utils.showToast(
              "Password must be at least 6 characters.",
              "error",
            );
          const result = Auth.register(payload);
          if (!result.ok) return Utils.showToast(result.error, "error");
          Utils.showToast("Account created. Please sign in.", "success");
          this.renderAuthForm("login");
        });
    } else if (mode === "forgot") {
      area.innerHTML = `
        <h2 class="auth-title">Reset Password</h2>
        <p class="auth-disclaimer"><i class="fa-solid fa-circle-info"></i> Demo flow — resets the password directly without email verification.</p>
        <form id="forgot-form" class="form-stack" novalidate>
          <div class="form-field"><label>Account Email</label><input name="email" type="email" required></div>
          <div class="form-field"><label>New Password</label><input name="password" type="password" required minlength="6"></div>
          <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
        </form>
        <div class="auth-links"><a href="#" onclick="App.renderAuthForm('login');return false;">Back to Sign In</a></div>
      `;
      document.getElementById("forgot-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        if (fd.get("password").length < 6)
          return Utils.showToast(
            "Password must be at least 6 characters.",
            "error",
          );
        const result = Auth.resetPassword(fd.get("email"), fd.get("password"));
        if (!result.ok) return Utils.showToast(result.error, "error");
        Utils.showToast("Password reset. Please sign in.", "success");
        this.renderAuthForm("login");
      });
    }
  },

  fillDemo(email, password) {
    const form = document.getElementById("login-form");
    if (!form) return;
    form.email.value = email;
    form.password.value = password;
  },

  /* ---------------------- APP SHELL ---------------------- */
  renderShell() {
    const user = Auth.getCurrentUser();
    if (!user) return this.renderAuthScreen();
    const root = document.getElementById("app-root");
    const nav = this.navConfig[user.role] || [];
    root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand">
            <div class="auth-logo sidebar-logo"><i class="fa-solid fa-building-columns"></i></div>
            <span>Campus HMS</span>
          </div>
          <nav class="sidebar-nav">
            ${nav
              .map(
                (n) => `
              <button class="sidebar-link" data-view="${n.key}" onclick="App.navigate('${n.key}')">
                <i class="fa-solid ${n.icon}"></i><span>${n.label}</span>
              </button>`,
              )
              .join("")}
          </nav>
          <div class="sidebar-footer">
            <button class="sidebar-link" onclick="Auth.logout()"><i class="fa-solid fa-right-from-bracket"></i><span>Log Out</span></button>
          </div>
        </aside>

        <div class="main-col">
          <header class="topbar">
            <button class="icon-btn lg-hidden" id="menu-toggle"><i class="fa-solid fa-bars"></i></button>
            <div class="topbar-title" id="topbar-title">Dashboard</div>
            <div class="topbar-right">
              <button class="icon-btn" id="topbar-theme-toggle" title="Toggle dark mode"><i class="fa-solid fa-moon"></i></button>
              <div class="topbar-user">
                <div class="topbar-avatar">${Utils.escapeHtml(
                  user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2),
                )}</div>
                <div class="topbar-user-meta"><span>${Utils.escapeHtml(user.name)}</span><small>${Utils.escapeHtml(user.role)}</small></div>
              </div>
            </div>
          </header>
          <main class="view-container" id="view-container" data-view="dashboard"></main>
        </div>
      </div>
      <div id="toast-container" class="toast-container"></div>
      <div id="modal-root"></div>
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
    `;

    document.getElementById("menu-toggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("sidebar-open");
      document
        .getElementById("sidebar-backdrop")
        .classList.toggle("backdrop-show");
    });
    document
      .getElementById("sidebar-backdrop")
      .addEventListener("click", () => {
        document.getElementById("sidebar").classList.remove("sidebar-open");
        document
          .getElementById("sidebar-backdrop")
          .classList.remove("backdrop-show");
      });
    document
      .getElementById("topbar-theme-toggle")
      .addEventListener("click", () => {
        const isDark = document.documentElement.classList.contains("dark");
        this.setTheme(isDark ? "light" : "dark");
      });

    this.navigate("dashboard");
  },

  labelFor(key) {
    const user = Auth.getCurrentUser();
    const nav = this.navConfig[user.role] || [];
    const found = nav.find((n) => n.key === key);
    return found ? found.label : "Dashboard";
  },

  navigate(key) {
    if (!Auth.requireAuth()) return;
    this.currentView = key;
    document
      .querySelectorAll(".sidebar-link")
      .forEach((el) =>
        el.classList.toggle("sidebar-link-active", el.dataset.view === key),
      );
    const titleEl = document.getElementById("topbar-title");
    if (titleEl) titleEl.textContent = this.labelFor(key);
    const container = document.getElementById("view-container");
    container.dataset.view = key;
    container.classList.remove("no-print");

    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("sidebar-open");
    if (backdrop) backdrop.classList.remove("backdrop-show");

    const routes = {
      dashboard: () =>
        Auth.getCurrentUser().role === "student"
          ? PortalView.renderDashboard(container)
          : DashboardView.render(container),
      students: () => StudentsView.render(container),
      hostels: () => HostelsView.render(container),
      rooms: () => RoomsView.render(container),
      allocations: () => AllocationsView.render(container),
      payments: () => PaymentsView.render(container),
      complaints: () => ComplaintsView.render(container),
      notices: () => NoticesView.render(container),
      reports: () => ReportsView.render(container),
      users: () => UsersView.render(container),
      rules: () => PortalView.renderRules(container),
      settings: () => SettingsView.render(container),
      profile: () => PortalView.renderProfile(container),
      "my-room": () => PortalView.renderMyRoom(container),
      "my-payments": () => PortalView.renderMyPayments(container),
    };
    (routes[key] || routes.dashboard)();
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
