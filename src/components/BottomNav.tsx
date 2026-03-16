import React from "react"
import { useLocation, useNavigate } from "react-router-dom"

export const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${currentPath === "/" ? "active" : ""}`}
        onClick={() => navigate("/")}>
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span className="nav-label">Home</span>
      </button>

      <button
        className={`nav-item ${currentPath === "/my-products" ? "active" : ""}`}
        onClick={() => navigate("/my-products")}>
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className="nav-label">Products</span>
      </button>

      <button
        className={`nav-item ${currentPath === "/profile" ? "active" : ""}`}
        onClick={() => navigate("/profile")}>
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span className="nav-label">Profile</span>
      </button>
    </div>
  )
}
