import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"

import "./style.css"

function SidePanel() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // 1. Get the current window ID so we can identify ourselves
    chrome.windows.getCurrent().then((win) => {
      if (win.id) {
        // 2. Connect to background script
        // We name the port "sidepanel-{windowId}" so background knows who we are
        const port = chrome.runtime.connect({ name: `sidepanel-${win.id}` })

        // 3. Listen for the "close_panel" command from background
        port.onMessage.addListener((msg) => {
          if (msg.action === "close_panel") {
            window.close() // This closes the side panel
          }
        })

        // Cleanup on unmount
        return () => port.disconnect()
      }
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Attempting login...", { email })

      // Simulating a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (email === "admin" && password === "admin") {
        console.log("Login successful.")
        setIsLoggedIn(true)
      } else {
        console.warn("Invalid credentials")
        setError("Invalid email or password")
      }

    } catch (error) {
      console.error("Login failed", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setEmail("")
    setPassword("")
    setError("")
  }

  // --- Components for each page ---

  const HomePage = () => {
    const handleScrape = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.id) {
          const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape_products" })
          console.log("Scraped Products:", response)
        }
      } catch (error) {
        console.error("Scraping failed:", error)
      }
    }

    return (
      <div className="main-content">
        <h2 className="auth-title">Home</h2>
        <p style={{ textAlign: "center", color: "#666" }}>Welcome back!</p>
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <p>This is your main dashboard.</p>
          <p>You can add widgets or recent activity here.</p>
          <button
            onClick={handleScrape}
            className="auth-submit-btn"
            style={{ marginTop: "20px", width: "auto", padding: "10px 20px" }}
          >
            Scrape Products
          </button>
        </div>
      </div>
    )
  }

  const ProfilePage = () => (
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

  const SettingsPage = () => (
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

  const BottomNav = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname

    return (
      <div className="bottom-nav">
        <button
          className={`nav-item ${currentPath === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span className="nav-label">Home</span>
        </button>

        <button
          className={`nav-item ${currentPath === "/profile" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span className="nav-label">Profile</span>
        </button>

        <button
          className={`nav-item ${currentPath === "/settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span className="nav-label">Settings</span>
        </button>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="auth-wrapper">
        <MemoryRouter>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
          <BottomNav />
        </MemoryRouter>
      </div>
    )
  }

  return (
    <div className="auth-wrapper login-mode">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2 className="auth-title">Sign In</h2>

        {error && <div style={{ color: "red", fontSize: "14px", textAlign: "center" }}>{error}</div>}

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="text"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12C1 12 5 5 12 5C19 5 23 12 23 12C23 12 19 19 12 19C5 19 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  )
}

export default SidePanel

