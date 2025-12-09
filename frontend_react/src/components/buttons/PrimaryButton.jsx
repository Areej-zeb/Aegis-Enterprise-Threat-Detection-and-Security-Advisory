import React from "react";
import "../../index.css";

function PrimaryButton({ children, disabled, showArrow = true, ...rest }) {
  return (
    <button
      type="button"
      className="aegis-primary-btn"
      disabled={disabled}
      {...rest}
    >
      <span>{children}</span>
      {showArrow && <span className="aegis-primary-btn-arrow">➜</span>}
    </button>
  );
}

export default PrimaryButton;


