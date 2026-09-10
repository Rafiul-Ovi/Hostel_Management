/* ============================================================
   settings.js — Settings & Dark Mode
   ============================================================ */
const SettingsView = {
  render(container) {
    const user = Auth.getCurrentUser();
    const settings = DB.getData(DB.KEYS.settings);
    const theme = localStorage.getItem(DB.KEYS.theme) || 'light';
    container.innerHTML = `
      <div class="view-header"><div><h1>Settings</h1><p>Appearance and account preferences.</p></div></div>

      <div class="table-card p-6 mb-5">
        <h3 class="section-label">Appearance</h3>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="cell-primary">Dark Mode</p>
            <p class="cell-secondary">Switch between light and dark theme. Your preference is saved automatically.</p>
          </div>
          <label class="switch">
            <input type="checkbox" id="settings-dark-toggle" ${theme === 'dark' ? 'checked' : ''}>
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>

      ${user.role === 'admin' ? `
      <div class="table-card p-6 mb-5">
        <h3 class="section-label">Institution Settings</h3>
        <form id="settings-form" class="form-grid">
          <div class="form-field"><label>Hostel Management Name</label><input name="hostelName" value="${Utils.escapeHtml(settings.hostelName||'')}"></div>
          <div class="form-field"><label>Currency</label>
            <select name="currency">
              <option value="USD" ${settings.currency==='USD'?'selected':''}>USD ($)</option>
              <option value="EUR" ${settings.currency==='EUR'?'selected':''}>EUR (€)</option>
              <option value="GBP" ${settings.currency==='GBP'?'selected':''}>GBP (£)</option>
            </select>
          </div>
          <div class="form-actions col-span-2"><button type="submit" class="btn btn-primary">Save Settings</button></div>
        </form>
      </div>` : ''}

      <div class="table-card p-6">
        <h3 class="section-label">Account</h3>
        <p class="cell-secondary mb-3">Signed in as ${Utils.escapeHtml(user.name)} (${Utils.escapeHtml(user.email)})</p>
        <button class="btn btn-ghost" onclick="Auth.logout()"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
      </div>
    `;

    document.getElementById('settings-dark-toggle').addEventListener('change', (e) => {
      App.setTheme(e.target.checked ? 'dark' : 'light');
    });

    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        DB.saveData(DB.KEYS.settings, { ...settings, ...Object.fromEntries(fd.entries()) });
        Utils.showToast('Settings saved successfully.', 'success');
      });
    }
  }
};
