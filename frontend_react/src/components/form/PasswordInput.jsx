import React, { useState } from "react";
import "../../index.css";

function PasswordInput({
  name,
  value,
  onChange,
  icon,
  placeholder,
  showToggleLabel = true,
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="aegis-input-wrapper">
      {icon && <span className="aegis-input-icon">{icon}</span>}
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={
          "aegis-input aegis-input-with-toggle" +
          (icon ? " aegis-input-with-icon" : "")
        }
        {...rest}
      />
      {showToggleLabel && (
        <button
          type="button"
          className="aegis-toggle-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}

export default PasswordInput;


