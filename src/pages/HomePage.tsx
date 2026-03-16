import React from "react"

import { CircularProgress } from "../components/CircularProgress"

interface HomePageProps {
  scrapedProducts: any[]
  timeLeft: number
  savedProducts: any[]
  handleAddProduct: (product: any, index: number) => void
  waitingTime: number
}

export const HomePage = ({
  scrapedProducts,
  timeLeft,
  savedProducts,
  handleAddProduct,
  waitingTime
}: HomePageProps) => {
  return (
    <div className="main-content">
      <h2 className="auth-title">Home</h2>

      <div style={{ padding: "20px 0", textAlign: "center" }}>
        {/* Automatic scraping active (15s delay) */}
        {scrapedProducts.length === 0 && timeLeft > 0 && (
          <CircularProgress seconds={timeLeft} waitingTime={waitingTime} />
        )}

        {scrapedProducts.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              textAlign: "left"
            }}>
            <h3 style={{ fontSize: "16px", margin: "10px 0" }}>
              Found Products ({scrapedProducts.length})
            </h3>
            {scrapedProducts.map((product, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center"
                }}>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                      borderRadius: "4px"
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                    {product.title || "Unknown Product"}
                  </div>
                  {product.price && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {product.price}
                    </div>
                  )}
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
                  }}>
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
          <div
            style={{
              marginTop: "30px",
              borderTop: "1px solid #eee",
              paddingTop: "10px"
            }}>
            <h4 style={{ fontSize: "14px", color: "#666" }}>
              Saved Items: {savedProducts.length}
            </h4>
          </div>
        )}
      </div>
    </div>
  )
}
