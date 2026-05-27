import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { testIds } from "@finvault/shared";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("alice@finvault.test");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in to FinVault</h1>
        <p>Banking simulator for test automation practice</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              data-testid={testIds.loginEmail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              data-testid={testIds.loginPassword}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="error" data-testid={testIds.loginError}>
              {error}
            </p>
          )}
          <button type="submit" className="btn" data-testid={testIds.loginSubmit} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/register">Create account</Link> · <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}
