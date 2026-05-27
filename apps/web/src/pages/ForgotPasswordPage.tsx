import { useState } from "react";
import { Link } from "react-router-dom";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await api<{ message: string; resetToken?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setMessage(data.resetToken ? `Reset token (dev): ${data.resetToken}` : data.message);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset password</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              data-testid={testIds.forgotEmail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn" data-testid={testIds.forgotSubmit}>
            Send reset link
          </button>
        </form>
        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
        <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
