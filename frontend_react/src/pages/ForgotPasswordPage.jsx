import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import "../index.css";

import AuthCardLayout from "../components/layout/AuthCardLayout.jsx";
import FormField from "../components/form/FormField.jsx";
import TextInput from "../components/form/TextInput.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { value } = e.target;
    setEmail(value);
    // Clear error and success when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Call your forgot password API endpoint
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset link sent to your email. Check your inbox.");
        setSubmitted(true);
        setEmail("");
      } else {
        setError(data.message || "Unable to process your request. Please try again.");
      }
    } catch (err) {
      setError("Unable to reach the server. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  }

  const mailIcon = <Mail size={18} aria-hidden="true" />;
  const canSubmit = email.trim() !== "" && !loading;

  return (
    <AuthCardLayout
      title="Reset Your Password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
    >
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
        {success && (
          <div style={{
            padding: "12px",
            marginBottom: "16px",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "8px",
            color: "#22c55e",
            fontSize: "14px"
          }}>
            {success}
          </div>
        )}

        {!submitted ? (
          <>
            <FormField label="Email address">
              <TextInput
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="you@company.com"
                icon={mailIcon}
                required
              />
            </FormField>

            <PrimaryButton type="submit" disabled={!canSubmit}>
              {loading ? "Sending..." : "Send Reset Link"}
            </PrimaryButton>
          </>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "20px 0"
          }}>
            <p style={{
              color: "#6b7280",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </p>
            <PrimaryButton 
              type="button"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </PrimaryButton>
          </div>
        )}

        <div className="aegis-login-footer">
          <button
            type="button"
            className="aegis-link"
            onClick={() => navigate("/login")}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Login
          </button>
        </div>
      </form>
    </AuthCardLayout>
  );
}

export default ForgotPasswordPage;
