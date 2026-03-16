import React from "react"

interface ProfileUser {
  name?: string
  email?: string
  picture?: string
}

interface ProfilePageProps {
  user?: ProfileUser
  handleLogout: () => void
}

export const ProfilePage = ({ user, handleLogout }: ProfilePageProps) => (
  <div className="main-content">
    <h2 className="auth-title">Profile</h2>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        marginTop: "20px"
      }}>
      {user?.picture ? (
        <img
          src={user.picture}
          alt={user.name}
          style={{ width: "80px", height: "80px", borderRadius: "50%" }}
        />
      ) : (
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            color: "#888"
          }}>
          👤
        </div>
      )}
      <h3 style={{ margin: 0 }}>{user?.name || "User"}</h3>
      <p style={{ margin: 0, color: "#888" }}>{user?.email || "No email"}</p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          background: "none",
          border: "none",
          color: "#f44336",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          padding: "8px 0",
          textDecoration: "underline"
        }}>
        Sign Out
      </button>
    </div>
  </div>
)
