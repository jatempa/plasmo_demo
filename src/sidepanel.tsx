import { useEffect, useState } from "react"

function SidePanel() {
  const [message, setMessage] = useState("")

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

  const sendToPage = async () => {
    // 1. Get the active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (tab?.id) {
      // 2. Send a message to the content script in that tab
      await chrome.tabs.sendMessage(tab.id, {
        action: "update_page_text",
        payload: message
      })
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: 16 }}>
      <h2>Control Panel</h2>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message for the page..."
        rows={4}
        style={{ width: "100%", marginBottom: 10, padding: 5 }}
      />

      <button
        onClick={sendToPage}
        style={{
          padding: "10px",
          backgroundColor: "#007AFF",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}>
        Send to Page
      </button>
    </div>
  )
}

export default SidePanel
