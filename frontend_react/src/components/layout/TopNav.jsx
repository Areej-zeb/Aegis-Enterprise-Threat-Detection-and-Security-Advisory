import React from "react";
import { NavLink } from "react-router-dom";
import "../../index.css";

function TopNav() {
  return (
    <header style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #1f2933" }}>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Aegis Dashboard</span>
        <NavLink to="/" style={{ textDecoration: "none" }}>
          Overview
        </NavLink>
        <NavLink to="/alerts" style={{ textDecoration: "none" }}>
          Live Alerts
        </NavLink>
        <NavLink to="/detect" style={{ textDecoration: "none" }}>
          Detect
        </NavLink>
        <NavLink to="/metrics" style={{ textDecoration: "none" }}>
          Metrics
        </NavLink>
      </nav>
    </header>
  );
}

export default TopNav;


