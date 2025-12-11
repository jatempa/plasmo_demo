import { useState } from "react"

function SidePanel() {
  const [data, setData] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width: "100%",
        height: "100vh",
        backgroundColor: "#f0f0f0"
      }}>
      <h2>My Side Panel</h2>
      <p>This panel was triggered by the floating button!</p>
      <p>{data}</p>

      <input
        onChange={(e) => setData(e.target.value)}
        value={data}
        placeholder="Type something..."
        style={{ padding: 8, marginTop: 10 }}
      />
    </div>
  )
}

export default SidePanel
