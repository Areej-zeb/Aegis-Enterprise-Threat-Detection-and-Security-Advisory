import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import IDSPage from "./pages/IDSPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import MLDetectionPage from "./pages/MLDetectionPage";
import AppShell from "./components/layout/AppShell";
import { AlertTimeSeriesProvider } from "./state/AlertTimeSeriesContext";
import RequireAuth from "./routes/RequireAuth";

function useCursorGlow() {
  useEffect(() => {
    const glow = document.createElement("div");
    glow.className = "cursor-glow cursor-glow--idle";
    document.body.appendChild(glow);

    const setMode = (mode) => {
      glow.classList.remove(
        "cursor-glow--idle",
        "cursor-glow--action",
        "cursor-glow--danger"
      );
      glow.classList.add(`cursor-glow--${mode}`);
    };

    const handleMove = (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    };

    const handleOver = (e) => {
      const t = e.target;
      if (t.closest(".cursor-hotspot-danger, .sev-high, .aegis-alert-pill--high")) {
        setMode("danger");
        return;
      }
      if (
        t.closest(
          ".cursor-hotspot-action, .aegis-primary-btn, .ids-pentest-btn, .aegis-nav-item"
        )
      ) {
        setMode("action");
        return;
      }
      setMode("idle");
    };

    const handleOut = (e) => {
      const rel = e.relatedTarget;
      if (!rel) {
        setMode("idle");
        return;
      }
      if (
        !rel.closest(
          ".cursor-hotspot-danger, .sev-high, .aegis-alert-pill--high, .cursor-hotspot-action, .aegis-primary-btn, .ids-pentest-btn, .aegis-nav-item"
        )
      ) {
        setMode("idle");
      }
    };

    const handleDown = () => {
      glow.classList.add("cursor-glow--click");
    };

    const handleUp = () => {
      glow.classList.remove("cursor-glow--click");
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);
    window.addEventListener("mouseout", handleOut);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      window.removeEventListener("mouseout", handleOut);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      glow.remove();
    };
  }, []);
}

function App() {
  useCursorGlow();

  return (
    <AlertTimeSeriesProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route
            path="/"
            element={
              <AppShell>
                <DashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppShell>
                <DashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/ids"
            element={
              <AppShell>
                <IDSPage />
              </AppShell>
            }
          />
          <Route
            path="/settings"
            element={
              <AppShell>
                <SettingsPage />
              </AppShell>
            }
          />
          <Route
            path="/ml-detection"
            element={
              <AppShell>
                <MLDetectionPage />
              </AppShell>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AlertTimeSeriesProvider>
  );
}

export default App;
