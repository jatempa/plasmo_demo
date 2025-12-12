import { useEffect } from "react"

function SidePanel() {
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
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: 16 }}>
      <h2>Control Panel</h2>
      <p>Use the floating button on the page to toggle the side panel.</p>
    </div>
  )
}

export default SidePanel
