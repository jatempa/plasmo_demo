import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { BottomNav } from "./components/BottomNav"
import { HomePage } from "./components/HomePage"
import { MyProductsPage } from "./components/MyProductsPage"
import { ProfilePage } from "./components/ProfilePage"
import { SettingsPage } from "./components/SettingsPage"

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

  if (isLoggedIn) {
    return (
      <div className="auth-wrapper">
        <MemoryRouter>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Routes>
              <Route path="/" element={<HomePage scrapedProducts={scrapedProducts} timeLeft={timeLeft} savedProducts={savedProducts} handleAddProduct={handleAddProduct} waitingTime={WAITING_TIME} />} />
              <Route path="/my-products" element={<MyProductsPage savedProducts={savedProducts} />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage handleLogout={handleLogout} />} />
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

