import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", theme: "light" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      api<{ firstName: string; lastName: string; preferences: { theme?: string } }>("/auth/me").then((d) => {
        setForm({ firstName: d.firstName, lastName: d.lastName, theme: d.preferences?.theme ?? "light" });
      });
    }
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        preferences: { theme: form.theme },
      }),
    });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <div className="card">
        <form onSubmit={save}>
          <label>First name<input data-testid={testIds.settingsFirstName} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
          <label>Last name<input data-testid={testIds.settingsLastName} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
          <label>Theme<select data-testid={testIds.settingsTheme} value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select></label>
          <button type="submit" className="btn" data-testid={testIds.settingsSave}>Save changes</button>
        </form>
        {saved && <p style={{ color: "var(--success)", marginTop: "1rem" }}>Settings saved</p>}
      </div>
    </>
  );
}
