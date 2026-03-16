import React from 'react'

interface SettingsPageProps {
  handleLogout: () => void
}

export const SettingsPage = ({ handleLogout }: SettingsPageProps) => (
  <div className="main-content">
    <h2 className="auth-title">Settings</h2>

    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Dark Mode</span>
          <input type="checkbox" />
        </label>
      </div>
      <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Notifications</span>
          <input type="checkbox" defaultChecked />
        </label>
      </div>

      <button onClick={handleLogout} className="auth-submit-btn" style={{ backgroundColor: "#f44336", marginTop: "20px" }}>
        Sign Out
      </button>
    </div>
  </div>
)
