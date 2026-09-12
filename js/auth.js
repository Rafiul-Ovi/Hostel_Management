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

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) {
        return { ok: false, error: result.message || 'Invalid email or password.' };
      }
      const { user } = result;
      localStorage.setItem(DB.KEYS.currentUser, JSON.stringify(user));
      return { ok: true, user };
    } catch (error) {
      return { ok: false, error: 'Unable to reach the server.' };
    }
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

  async register(payload) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        return { ok: false, error: result.message || 'Registration failed.' };
      }
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, error: 'Unable to reach the server.' };
    }
  },

  async resetPassword(email, newPassword) {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
      });
      const result = await response.json();
      if (!response.ok) {
        return { ok: false, error: result.message || 'Password reset failed.' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Unable to reach the server.' };
    }
  },
};
