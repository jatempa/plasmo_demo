import cssText from "data-text:./style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useState } from "react"

// 1. Configure where this script runs
export const config: PlasmoCSConfig = {
  matches: ["http://localhost:5500/*"]
}

// 2. Inject styles (Optional, but recommended for clean UI)
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// 3. The React Component
const FloatingButton = () => {
  // Function to toggle the side panel
  const toggleSidePanel = () => {
    // We send a message to the background service worker to open the panel
    // Note: window.open won't work for side panels from a content script directly
    chrome.runtime.sendMessage({ action: "open_side_panel" })
  }

  return (
    <button onClick={toggleSidePanel} className="plasmo-floating-btn">
      Open Panel
    </button>
  )
}

export default FloatingButton
