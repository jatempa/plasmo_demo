import React from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { HomeIcon, ProductsIcon } from "~src/utils/svgs"

export const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: <HomeIcon />
    },
    {
      path: "/my-products",
      label: "Products",
      icon: <ProductsIcon />
    }
  ]

  return (
    <div className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${currentPath === item.path ? "active" : ""}`}
          onClick={() => navigate(item.path)}>
          {item.icon}
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
