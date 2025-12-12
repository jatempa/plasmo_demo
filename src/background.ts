// Track open side panels by Window ID
// Key = Window ID, Value = Port object
const activePanels = new Map<number, chrome.runtime.Port>()

// 1. Listen for new connections from the Side Panel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name.startsWith("sidepanel-")) {
    const windowId = parseInt(port.name.split("-")[1])

    // Store the port so we can talk to this specific panel later
    activePanels.set(windowId, port)

    // If the panel is closed (e.g. by user clicking X), remove it from map
    port.onDisconnect.addListener(() => {
      activePanels.delete(windowId)
    })
  }
})

// 2. Handle the Toggle Message from Content Script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "toggle_side_panel") {
    const windowId = sender.tab?.windowId

    if (windowId) {
      // Check if we already have an active panel for this window
      if (activePanels.has(windowId)) {
        // SCENARIO A: Panel is OPEN -> Tell it to close
        const port = activePanels.get(windowId)
        port.postMessage({ action: "close_panel" })
      } else {
        // SCENARIO B: Panel is CLOSED -> Open it
        // Open the side panel for the current window
        // sender.tab.windowId ensures it opens in the window where the button was clicked
        chrome.sidePanel.open({ windowId }).catch((err) => {
          console.error("Failed to open side panel:", err)
        })
      }
    }
  }
})

// Ensure side panel opens on icon click too
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
