import React from 'react'

interface MyProductsPageProps {
  savedProducts: any[]
}

export const MyProductsPage = ({ savedProducts }: MyProductsPageProps) => (
  <div className="main-content">
    <h2 className="auth-title">My Products</h2>
    {savedProducts.length > 0 ? (
      <div style={{ marginTop: "20px", width: "100%" }}>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {savedProducts.map((p, i) => (
            <li key={i} style={{ padding: "10px", borderBottom: "1px solid #eee", fontSize: "14px", display: 'flex', gap: '10px', alignItems: 'center' }}>
              {p.image && <img src={p.image} alt={p.title} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />}
              <div>
                <div style={{ fontWeight: '500' }}>{p.title}</div>
                {p.price && <div style={{ fontSize: '12px', color: '#666' }}>{p.price}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#888" }}>
        <p>No products saved yet.</p>
        <p style={{ fontSize: "12px" }}>Scrape products from the Home tab to add them here.</p>
      </div>
    )}
  </div>
)
