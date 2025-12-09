import React from "react";
import "../../index.css";
import AegisLogo from "./AegisLogo.jsx";

function AuthCardLayout({ title, subtitle, children }) {
  return (
    <div className="aegis-auth-root">
      <AegisLogo />
      <div className="aegis-auth-card">
        <div className="aegis-auth-header">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthCardLayout;


