import React from "react";
import "../../index.css";

function TextInput({
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  icon,
  ...rest
}) {
  return (
    <div className="aegis-input-wrapper">
      {icon && <span className="aegis-input-icon">{icon}</span>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={"aegis-input" + (icon ? " aegis-input-with-icon" : "")}
        {...rest}
      />
    </div>
  );
}

export default TextInput;


