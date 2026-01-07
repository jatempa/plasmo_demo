import { useEffect, useState } from "react"

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
      // Logic to send user/password to Auth0 login methods
      // For Resource Owner Password Credentials Grant (not recommended for production but requested logic)
      // or simply a placeholder for where the Auth0 SDK 'loginWithCredentials' would go.

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

  if (isLoggedIn) {
    return (
      <div className="auth-wrapper">
        <div className="auth-form" style={{ textAlign: "center" }}>
          <h2 className="auth-title">Welcome!</h2>
          <p>You have successfully signed in.</p>
          <button onClick={handleLogout} className="auth-submit-btn" style={{ backgroundColor: "#f44336" }}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
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
