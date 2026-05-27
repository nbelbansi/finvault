import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { testIds } from "@finvault/shared";
import { api, setToken } from "../api/client";

export function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api<{ token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setToken(data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <form onSubmit={handleSubmit}>
          <label>
            First name
            <input
              data-testid={testIds.registerFirstName}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </label>
          <label>
            Last name
            <input
              data-testid={testIds.registerLastName}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              data-testid={testIds.registerEmail}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              data-testid={testIds.registerPassword}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" data-testid={testIds.registerSubmit}>
            Register
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Already have an account?</Link>
        </p>
      </div>
    </div>
  );
}
