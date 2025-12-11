export {}

// Listen for the message from the content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "open_side_panel") {
    console.log(message)
    // Open the side panel for the current window
    // sender.tab.windowId ensures it opens in the window where the button was clicked
    if (sender.tab && sender.tab.windowId) {
      chrome.sidePanel
        .open({ windowId: sender.tab.windowId })
        .catch((error) => console.error("Failed to open panel:", error))
    }
  }
})

// Optional: Ensure the side panel behaves correctly on icon click too
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
