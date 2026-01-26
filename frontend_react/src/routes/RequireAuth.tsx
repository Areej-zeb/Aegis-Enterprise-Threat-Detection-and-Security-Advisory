import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireAuth: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // full-screen loader while we check localStorage
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e2e8f0",
      }}>
        <div style={{
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          fontSize: "0.875rem",
          letterSpacing: "0.05em",
        }}>
          Checking Aegis session…
        </div>
      </div>
    );
  }

  if (!user) {
    // redirect to login, remember where we were heading
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;

