import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import "../index.css";

import AuthCardLayout from "../components/layout/AuthCardLayout.jsx";
import FormField from "../components/form/FormField.jsx";
import TextInput from "../components/form/TextInput.jsx";
import PasswordInput from "../components/form/PasswordInput.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";
import StatusBar from "../components/common/StatusBar.jsx";
import { useAuth } from "../context/AuthContext.tsx";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state?.from?.pathname) || "/dashboard";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      // Login successful, redirect to intended destination or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      // Login failed, show error message
      const errorMessage = err instanceof Error ? err.message : "Invalid credentials or server error.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  const mailIcon = <Mail size={18} aria-hidden="true" />;

  const lockIcon = <LockKeyhole size={18} aria-hidden="true" />;

  const canSubmit = form.email.trim() !== "" && form.password.trim() !== "" && !loading;

  return (
    <AuthCardLayout
      title="Welcome back to AEGIS"
      subtitle="Log in to access your dashboard"
    >
      <StatusBar env="Demo" ids="Healthy" />
      <form className="aegis-auth-form" onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: "12px",
            marginBottom: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        <FormField label="Email address">
          <TextInput
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            icon={mailIcon}
            required
          />
        </FormField>

        <FormField label="Password">
          <PasswordInput
            name="password"
            value={form.password}
            onChange={handleChange}
            icon={lockIcon}
            required
          />
          <div className="aegis-forgot-row">
            <button
              type="button"
              className="aegis-link aegis-forgot-link"
              onClick={() => console.log("Forgot password clicked")}
            >
              Forgot your password?
            </button>
          </div>
        </FormField>

        <PrimaryButton type="submit" disabled={!canSubmit}>
          {loading ? "Signing in..." : "Sign In"}
        </PrimaryButton>

        <div className="aegis-login-footer">
          <span>Don&apos;t have an account? </span>
          <button
            type="button"
            className="aegis-link"
            onClick={() => navigate("/signup")}
          >
            Create one
          </button>
        </div>
      </form>
    </AuthCardLayout>
  );
}

export default LoginPage;


