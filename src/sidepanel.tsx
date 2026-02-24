import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"

import "./style.css"

const WAITING_TIME = 15;

function SidePanel() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState("")

  // Product State
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([])
  const [savedProducts, setSavedProducts] = useStorage<any[]>("saved_products", [])

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
    setScrapedProducts([])
    setSavedProducts([])
  }

  const [timeLeft, setTimeLeft] = useState(WAITING_TIME)
  const [currentTabId, setCurrentTabId] = useState<number | null>(null)
  const [scrapingSessionId, setScrapingSessionId] = useState(0)

  // Listen for tab changes
  useEffect(() => {
    // Initial tab
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) setCurrentTabId(tab.id)
    })

    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      setCurrentTabId(activeInfo.tabId)
      // Reset state for new tab
      setScrapedProducts([])
      setTimeLeft(WAITING_TIME)
      setScrapingSessionId(prev => prev + 1)
    }

    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Only care about the current tab and if it's loading (navigation started)
      if (tabId === currentTabId && changeInfo.status === 'loading') {
        console.log("Tab updated (navigation), resetting...", tabId)
        setScrapedProducts([])
        setTimeLeft(WAITING_TIME)
        setScrapingSessionId(prev => prev + 1)
      }
    }

    chrome.tabs.onActivated.addListener(handleTabActivated)
    chrome.tabs.onUpdated.addListener(handleTabUpdated)

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated)
      chrome.tabs.onUpdated.removeListener(handleTabUpdated)
    }
  }, [currentTabId]) // Depend on currentTabId to closure captures correct ID for update check

  // Automatic scraping effect with progress
  useEffect(() => {
    if (!isLoggedIn) return

    // If we switched tabs or updated URL, we want to restart the timer. 
    console.log("Starting countdown for tab:", currentTabId, "Session:", scrapingSessionId)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Trigger scrape
          triggerScrape()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLoggedIn, currentTabId, scrapingSessionId]) // Added scrapingSessionId to force restart

  const triggerScrape = async () => {
    console.log("Auto-scraping triggered")
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape_products" })
        console.log("Auto-Scrape Response:", response)

        if (Array.isArray(response) && response.length > 0) {
          if (typeof response[0] !== 'string') {
            setScrapedProducts(response)
          } else {
            console.log("No products detected (received message string).")
          }
        }
      }
    } catch (error) {
      console.error("Auto-scraping failed:", error)
    }
  }

  const handleAddProduct = (product: any, index: number) => {
    setSavedProducts((prev) => [...prev, product])
    setScrapedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Components for each page ---

  const CircularProgress = ({ seconds }: { seconds: number }) => {
    const radius = 20
    const circumference = 2 * Math.PI * radius
    const progress = ((WAITING_TIME - seconds) / WAITING_TIME) * 100
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "20px 0" }}>
        <div style={{ position: "relative", width: "50px", height: "50px" }}>
          <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="25"
              cy="25"
              r={radius}
              stroke="#e6e6e6"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="25"
              cy="25"
              r={radius}
              stroke="#4CAF50"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "12px", fontWeight: "bold", color: "#666" }}>
            {seconds}s
          </div>
        </div>
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>Scanning...</div>
      </div>
    )
  }

  const HomePage = () => {
    return (
      <div className="main-content">
        <h2 className="auth-title">Home</h2>

        <div style={{ padding: "20px 0", textAlign: "center" }}>

          {/* Automatic scraping active (15s delay) */}
          {scrapedProducts.length === 0 && timeLeft > 0 && (
            <CircularProgress seconds={timeLeft} />
          )}

          {scrapedProducts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
              <h3 style={{ fontSize: "16px", margin: "10px 0" }}>Found Products ({scrapedProducts.length})</h3>
              {scrapedProducts.map((product, index) => (
                <div key={index} style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center"
                }}>
                  {product.image && (
                    <img src={product.image} alt={product.title} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {product.title || "Unknown Product"}
                    </div>
                    {product.price && <div style={{ fontSize: "12px", color: "#666" }}>{product.price}</div>}
                  </div>
                  <button
                    onClick={() => handleAddProduct(product, index)}
                    style={{
                      border: "none",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#888", fontSize: "14px", marginTop: "20px" }}>
              No products found yet. Wait for a moment.
            </div>
          )}

          {/* Debug/Visibility for Saved Products */}
          {savedProducts.length > 0 && (
            <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <h4 style={{ fontSize: "14px", color: "#666" }}>Saved Items: {savedProducts.length}</h4>
            </div>
          )}
        </div>
      </div>
    )
  }

  const MyProductsPage = () => (
    <div className="main-content">
      <h2 className="auth-title">My Products</h2>
      {savedProducts.length > 0 ? (
        <div style={{ marginTop: "20px", width: "100%" }}>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {savedProducts.map((p, i) => (
              <li key={i} style={{ padding: "10px", borderBottom: "1px solid #eee", fontSize: "14px", display: 'flex', gap: '10px', alignItems: 'center' }}>
                {p.image && <img src={p.image} alt={p.title} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />}
                <div>
                  <div style={{ fontWeight: '500' }}>{p.title}</div>
                  {p.price && <div style={{ fontSize: '12px', color: '#666' }}>{p.price}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#888" }}>
          <p>No products saved yet.</p>
          <p style={{ fontSize: "12px" }}>Scrape products from the Home tab to add them here.</p>
        </div>
      )}
    </div>
  )

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
          className={`nav-item ${currentPath === "/my-products" ? "active" : ""}`}
          onClick={() => navigate("/my-products")}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span className="nav-label">Products</span>
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
              <Route path="/my-products" element={<MyProductsPage />} />
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

