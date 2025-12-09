import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

import AuthCardLayout from "../components/layout/AuthCardLayout.jsx";
import FormField from "../components/form/FormField.jsx";
import TextInput from "../components/form/TextInput.jsx";
import PasswordInput from "../components/form/PasswordInput.jsx";
import CheckboxWithText from "../components/form/CheckboxWithText.jsx";
import PasswordStrengthBar from "../components/feedback/PasswordStrengthBar.jsx";
import MatchLabel from "../components/feedback/MatchLabel.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";
import authService from "../utils/authService.js";

function getPasswordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function SignUpPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accepted: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordScore = useMemo(
    () => getPasswordScore(form.password),
    [form.password]
  );

  const passwordsMatch =
    form.password && form.confirmPassword
      ? form.password === form.confirmPassword
      : null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      const result = await authService.register(form.email, form.password);
      
      if (result.success) {
        // Registration successful, show success message and redirect to login
        setSuccess("Account created successfully! Redirecting to login...");
        // Clear the token since we want them to login manually
        authService.logout();
        // Redirect to login after 1.5 seconds
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        // Registration failed, show backend error message
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      // Unexpected error
      setError("Unable to reach the server. Please try again.");
      console.error("Registration error:", err);
      setLoading(false);
    }
  }

  const submitDisabled = !form.accepted || passwordsMatch !== true || loading;

  const mailIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.01L12 13l8-6.99V6H4zm0 3.236V18h16V9.236l-7.382 5.75a1.5 1.5 0 0 1-1.836 0L4 9.236z"
        fill="currentColor"
      />
    </svg>
  );

  const lockIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <AuthCardLayout
      title="Create a Secure AEGIS Account"
      subtitle="Access our enterprise security dashboard, alerts & advisory tools."
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
        <FormField label="Name">
          <TextInput
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </FormField>

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
          <PasswordStrengthBar score={passwordScore} />
        </FormField>

        <FormField label="Confirm Password">
          <PasswordInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            icon={lockIcon}
            required
          />
          <MatchLabel ok={passwordsMatch} />
        </FormField>

        <CheckboxWithText
          name="accepted"
          checked={form.accepted}
          onChange={handleChange}
          required
        >
          By creating an account, I agree to our{" "}
          <button
            type="button"
            className="aegis-link"
            onClick={() => console.log("Terms of use clicked")}
          >
            Terms of use
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="aegis-link"
            onClick={() => console.log("Privacy policy clicked")}
          >
            Privacy Policy
          </button>
        </CheckboxWithText>

        <PrimaryButton
          type="submit"
          disabled={submitDisabled}
          showArrow={true}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </PrimaryButton>
      </form>
    </AuthCardLayout>
  );
}

export default SignUpPage;


