import React from "react";
import "../../index.css";

function PasswordStrengthBar({ score = 0 }) {
  const segments = [0, 1, 2, 3];

  return (
    <div className="aegis-strength-wrapper">
      <div className="aegis-strength-bar">
        {segments.map((seg) => (
          <span
            key={seg}
            className={
              "aegis-strength-segment" +
              (seg < score ? " aegis-strength-segment--active" : "")
            }
          />
        ))}
      </div>
      <span className="aegis-strength-label">Password Strength</span>
    </div>
  );
}

export default PasswordStrengthBar;


