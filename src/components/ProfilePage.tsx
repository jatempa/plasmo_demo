import React from 'react'

export const ProfilePage = () => (
  <div className="main-content">
    <h2 className="auth-title">Profile</h2>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "20px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", color: "#888" }}>
        👤
      </div>
      <h3 style={{ margin: 0 }}>Admin User</h3>
      <p style={{ margin: 0, color: "#888" }}>admin@example.com</p>
    </div>
  </div>
)
