import React from "react";
import aegisLogo from "../../assets/aegis-logo.png";
import "../../index.css";

function AegisLogo() {
  return (
    <div className="aegis-logo">
      <img src={aegisLogo} alt="AEGIS logo" className="aegis-logo-img" />
    </div>
  );
}

export default AegisLogo;

