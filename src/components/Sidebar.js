// src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside style={{ width: "200px", background: "#f8f8f8", padding: "1rem" }}>
      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "1rem" }}>
            <Link to="/home">Home</Link>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <Link to="/control">Control</Link>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <Link to="/setup-mission">Set-Up Mission</Link>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <Link to="/report-page">Report</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;

