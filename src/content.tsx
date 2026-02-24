import { Storage } from "@plasmohq/storage"
import cssText from "data-text:./style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useRef, useState } from "react"

const scrapeProducts = () => {
  // Generic selector strategy - can be customized based on specific site structure
  // Looking for common product container patterns
  const products: any[] = []

  // Try to find product cards
  const potentialProducts = document.querySelectorAll("article, .product, .product-card, .item, li")

  potentialProducts.forEach((el) => {
    const title = el.querySelector("h1, h2, h3, h4, .title, .name")?.textContent?.trim()
    const price = el.querySelector(".price, .amount, span")?.textContent?.trim()
    const image = el.querySelector("img")?.src

    if (title && (price || image)) {
      products.push({
        title,
        price,
        image,
        element: el.tagName
      })
    }
  })

  return products.length > 0 ? products : ["No products found with generic selectors"]
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scrape_products") {
    const data = scrapeProducts()
    new Storage().set("scraped_data", data)
    sendResponse(data)
  }
})

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const FloatingButton = () => {
  // Position state: percentage from top (0-100)
  const [positionTop, setPositionTop] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)



  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const container = containerRef.current
        if (!container) return

        const { height } = container.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Prevent dragging off screen
        // element is centered by transform: translateY(-50%)
        // so `positionTop` corresponds to the center of the element.
        // We want (center - height/2) >= 0 and (center + height/2) <= windowHeight
        const minTop = height / 2
        const maxTop = windowHeight - height / 2

        const clampedY = Math.min(Math.max(e.clientY, minTop), maxTop)

        // Calculate percentage from top
        const newTop = (clampedY / windowHeight) * 100

        setPositionTop(newTop)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging])

  const toggleSidePanel = () => {
    setIsOpen((prev) => !prev)
    chrome.runtime.sendMessage({ action: "toggle_side_panel" })
  }

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  return (
    <div
      ref={containerRef}
      className="plasmo-container"
      style={{ top: `${positionTop}%` }}
    >


      <div className="plasmo-floating-btn">
        <button
          onClick={toggleSidePanel}
          className="plasmo-btn-toggle"
          title="Toggle Side Panel"
        >
          {isOpen ? (
            // Icon for "Close" (Right chevron)
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          ) : (
            // Icon for "Open" (Left chevron)
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          )}
        </button>
        <div
          onMouseDown={startDrag}
          className="plasmo-btn-drag"
          title="Drag to move"
        >
          {/* Drag Handle Icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="16" y2="6"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
            <line x1="8" y1="18" x2="16" y2="18"></line>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default FloatingButton
