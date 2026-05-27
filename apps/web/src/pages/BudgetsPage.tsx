import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Budget { id: string; name: string; category: string; monthlyLimit: number; spent: number; }

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [form, setForm] = useState({ name: "", category: "", monthlyLimit: "" });

  const load = () => api<{ budgets: Budget[] }>("/budgets").then((d) => setBudgets(d.budgets));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/budgets", {
      method: "POST",
      body: JSON.stringify({ name: form.name, category: form.category, monthlyLimit: Number(form.monthlyLimit) }),
    });
    setForm({ name: "", category: "", monthlyLimit: "" });
    load();
  };

  return (
    <>
      <h1 className="page-title">Budgets</h1>
      <div className="card">
        <form onSubmit={submit}>
          <label>Name<input data-testid={testIds.budgetName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Category<input data-testid={testIds.budgetCategory} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></label>
          <label>Monthly limit<input data-testid={testIds.budgetLimit} type="number" value={form.monthlyLimit} onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })} required /></label>
          <button type="submit" className="btn" data-testid={testIds.budgetSubmit}>Create budget</button>
        </form>
      </div>
      <div className="card" data-testid={testIds.budgetsList}>
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Spent</th><th>Limit</th><th>%</th></tr></thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.category}</td>
                <td>${b.spent.toFixed(2)}</td>
                <td>${b.monthlyLimit.toFixed(2)}</td>
                <td>{((b.spent / b.monthlyLimit) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
