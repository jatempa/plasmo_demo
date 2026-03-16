import React from 'react'

interface CircularProgressProps {
  seconds: number;
  waitingTime: number;
}

export const CircularProgress = ({ seconds, waitingTime }: CircularProgressProps) => {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const progress = ((waitingTime - seconds) / waitingTime) * 100
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "20px 0" }}>
      <div style={{ position: "relative", width: "50px", height: "50px" }}>
        <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="25"
            cy="25"
            r={radius}
            stroke="#e6e6e6"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="25"
            cy="25"
            r={radius}
            stroke="#4CAF50"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "12px", fontWeight: "bold", color: "#666" }}>
          {seconds}s
        </div>
      </div>
      <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>Scanning...</div>
    </div>
  )
}
