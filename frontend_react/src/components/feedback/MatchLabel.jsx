import React from "react";
import "../../index.css";

function MatchLabel({ ok, showWhenEmpty = false }) {
  if (!showWhenEmpty && ok == null) return null;

  if (ok === null) return null;

  return (
    <span
      className={
        "aegis-match-label " +
        (ok ? "aegis-match-label--ok" : "aegis-match-label--error")
      }
    >
      {ok ? "Passwords Match" : "Passwords do not match"}
    </span>
  );
}

export default MatchLabel;


