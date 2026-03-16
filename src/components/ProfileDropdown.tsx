import React, { useEffect, useRef, useState } from "react"

import { ProfileIcon } from "~src/utils/svgs"

interface ProfileUser {
  name?: string
  email?: string
  picture?: string
}

interface ProfileDropdownProps {
  user?: ProfileUser
  onLogout: () => void
}

export const ProfileDropdown = ({ user, onLogout }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen])

  const handleLogout = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="profile-dropdown-container">
      <button
        ref={buttonRef}
        className="profile-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Profile menu">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="profile-avatar-img"
          />
        ) : (
          <ProfileIcon />
        )}
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="profile-dropdown-avatar"
              />
            ) : (
              <div className="profile-dropdown-avatar-placeholder">👤</div>
            )}
            <div className="profile-dropdown-info">
              <h3 className="profile-dropdown-name">{user?.name || "User"}</h3>
              <p className="profile-dropdown-email">
                {user?.email || "No email"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="profile-dropdown-logout-btn">
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
