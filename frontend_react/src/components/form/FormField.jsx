import React from "react";
import "../../index.css";

function FormField({ label, children }) {
  return (
    <label className="aegis-field">
      {label && <span className="aegis-field-label">{label}</span>}
      {children}
    </label>
  );
}

export default FormField;


