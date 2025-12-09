import React from "react";
import "../../index.css";

function CheckboxWithText({ name, checked, onChange, children, ...rest }) {
  return (
    <label className="aegis-terms">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        {...rest}
      />
      <span>{children}</span>
    </label>
  );
}

export default CheckboxWithText;


