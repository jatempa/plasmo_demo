import cssText from "data-text:./style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["http://localhost:5500/*"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const FloatingButton = () => {
  // State to hold the message received from the side panel
  const [pageText, setPageText] = useState("Waiting for input...")

  useEffect(() => {
    // 1. Define the listener
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.action === "update_page_text") {
        setPageText(message.payload)
      }
    }

    // 2. Add the listener
    chrome.runtime.onMessage.addListener(messageListener)

    // 3. Cleanup listener on unmount
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  const toggleSidePanel = () => {
    chrome.runtime.sendMessage({ action: "toggle_side_panel" })
  }

  return (
    <div className="plasmo-container">
      {/* A small bubble to show the text received */}
      <div className="plasmo-message-bubble">Received: {pageText}</div>

      <button onClick={toggleSidePanel} className="plasmo-floating-btn">
        {/* You could even change this text based on state if you listen to messages */}
        Toggle Panel
      </button>
    </div>
  )
}

export default FloatingButton
