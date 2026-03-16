import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { useStorage } from "@plasmohq/storage/hook"

import { BottomNav } from "./components/BottomNav"
import { ProfileDropdown } from "./components/ProfileDropdown"
import { HomePage } from "./pages/HomePage"
import { MyProductsPage } from "./pages/MyProductsPage"
import {
  getAuth0RedirectUri,
  isAuthSessionValid,
  loginWithAuth0,
  logoutFromAuth0,
  parseAuthError,
  type AuthSession,
  type AuthUser
} from "./services/auth0"

import "./style.css"

const WAITING_TIME = 15

function SidePanel() {
  const [authSession, setAuthSession] = useStorage<AuthSession | null>(
    "auth_session",
    null
  )
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | undefined>()

  // Product State
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([])
  const [savedProducts, setSavedProducts] = useStorage<any[]>(
    "saved_products",
    []
  )

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

  useEffect(() => {
    if (!isAuthSessionValid(authSession)) {
      setAuthSession(null)
      setIsAuthenticated(false)
      setUser(undefined)
      return
    }

    setIsAuthenticated(true)
    setUser(authSession.user)
  }, [authSession, setAuthSession])

  const handleLogout = async () => {
    setScrapedProducts([])
    setSavedProducts([])
    setAuthSession(null)
    setIsAuthenticated(false)
    setUser(undefined)
    setAuthError(null)

    try {
      await logoutFromAuth0()
    } catch (error) {
      console.error("Auth0 logout failed:", error)
    }
  }

  const handleLogin = async () => {
    try {
      setAuthLoading(true)
      setAuthError(null)
      const session = await loginWithAuth0()
      const profile = session.user as AuthUser | undefined

      setAuthSession(session)
      setIsAuthenticated(true)
      setUser(profile)
    } catch (error) {
      console.error("Auth flow failed:", error)
      setAuthError(parseAuthError(error))
      setIsAuthenticated(false)
      setUser(undefined)
      setAuthSession(null)
    } finally {
      setAuthLoading(false)
    }
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
      setScrapingSessionId((prev) => prev + 1)
    }

    const handleTabUpdated = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      // Only care about the current tab and if it's loading (navigation started)
      if (tabId === currentTabId && changeInfo.status === "loading") {
        console.log("Tab updated (navigation), resetting...", tabId)
        setScrapedProducts([])
        setTimeLeft(WAITING_TIME)
        setScrapingSessionId((prev) => prev + 1)
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
    if (!isAuthenticated) return

    // If we switched tabs or updated URL, we want to restart the timer.
    console.log(
      "Starting countdown for tab:",
      currentTabId,
      "Session:",
      scrapingSessionId
    )

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
  }, [isAuthenticated, currentTabId, scrapingSessionId]) // Added scrapingSessionId to force restart

  const triggerScrape = async () => {
    console.log("Auto-scraping triggered")
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "scrape_products"
        })
        console.log("Auto-Scrape Response:", response)

        if (Array.isArray(response) && response.length > 0) {
          if (typeof response[0] !== "string") {
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

  if (isAuthenticated) {
    return (
      <div className="auth-wrapper">
        <MemoryRouter>
          <div style={{ padding: "8px 0 0 0" }}>
            <ProfileDropdown user={user} onLogout={handleLogout} />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    scrapedProducts={scrapedProducts}
                    timeLeft={timeLeft}
                    savedProducts={savedProducts}
                    handleAddProduct={handleAddProduct}
                    waitingTime={WAITING_TIME}
                  />
                }
              />
              <Route
                path="/my-products"
                element={<MyProductsPage savedProducts={savedProducts} />}
              />
            </Routes>
          </div>
          <BottomNav />
        </MemoryRouter>
      </div>
    )
  }

  return (
    <div className="auth-wrapper login-mode">
      <div
        className="auth-form"
        style={{ textAlign: "center", padding: "40px 20px" }}>
        <h2 className="auth-title">Welcome</h2>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          Please sign in to continue
        </p>

        {authError && (
          <div
            style={{
              color: "white",
              backgroundColor: "#d32f2f",
              fontSize: "14px",
              marginBottom: "20px",
              padding: "10px",
              borderRadius: "4px"
            }}>
            <strong>Auth Error:</strong> {authError || "Failed to authenticate"}
            <br />
            <small>
              Add {getAuth0RedirectUri()} as an allowed callback URL in Auth0
            </small>
          </div>
        )}

        <button
          onClick={() => {
            handleLogin()
          }}
          className="auth-submit-btn"
          disabled={authLoading}
          style={{
            opacity: authLoading ? 0.6 : 1,
            cursor: authLoading ? "not-allowed" : "pointer"
          }}>
          {authLoading ? "Loading..." : "Sign In with Auth0"}
        </button>
      </div>
    </div>
  )
}

export default SidePanel
