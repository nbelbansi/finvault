import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  status: string;
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [form, setForm] = useState({ name: "", type: "CHECKING", initialDeposit: "" });
  const [toast, setToast] = useState("");

  const load = () => api<{ accounts: Account[] }>("/accounts").then((d) => setAccounts(d.accounts));
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        initialDeposit: form.initialDeposit ? Number(form.initialDeposit) : 0,
      }),
    });
    setShowForm(false);
    setForm({ name: "", type: "CHECKING", initialDeposit: "" });
    load();
    showToast("Account created");
  };

  const deposit = async () => {
    if (!selected) return;
    await api(`/accounts/${selected.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount: Number(depositAmt) }),
    });
    setDepositAmt("");
    load();
    showToast("Deposit successful");
  };

  const withdraw = async () => {
    if (!selected) return;
    await api(`/accounts/${selected.id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount: Number(withdrawAmt) }),
    });
    setWithdrawAmt("");
    load();
    showToast("Withdrawal successful");
  };

  return (
    <>
      <h1 className="page-title">Accounts</h1>
      <button type="button" className="btn" data-testid={testIds.accountOpenBtn} onClick={() => setShowForm(!showForm)}>
        Open new account
      </button>

      {showForm && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <form onSubmit={createAccount}>
            <label>
              Account name
              <input data-testid={testIds.accountNameInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Type
              <select data-testid={testIds.accountTypeSelect} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="CHECKING">Checking</option>
                <option value="SAVINGS">Savings</option>
                <option value="MONEY_MARKET">Money Market</option>
              </select>
            </label>
            <label>
              Initial deposit
              <input data-testid={testIds.accountInitialDeposit} type="number" step="0.01" value={form.initialDeposit} onChange={(e) => setForm({ ...form, initialDeposit: e.target.value })} />
            </label>
            <button type="submit" className="btn" data-testid={testIds.accountCreateSubmit}>Create</button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: "1rem" }} data-testid={testIds.accountsList}>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Balance</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} data-testid={testIds.accountRow(a.id)}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td>${a.balance.toFixed(2)}</td>
                <td><span className={`badge badge-${a.status === "ACTIVE" ? "success" : "warning"}`}>{a.status}</span></td>
                <td><button type="button" className="btn btn-secondary" onClick={() => setSelected(a)}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <h3>{selected.name}</h3>
          <p data-testid={testIds.accountDetailBalance}>Balance: ${selected.balance.toFixed(2)}</p>
          <div className="grid grid-2">
            <div>
              <label>Deposit amount<input data-testid={testIds.depositAmount} type="number" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} /></label>
              <button type="button" className="btn" data-testid={testIds.depositSubmit} onClick={deposit}>Deposit</button>
            </div>
            <div>
              <label>Withdraw amount<input data-testid={testIds.withdrawAmount} type="number" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)} /></label>
              <button type="button" className="btn" data-testid={testIds.withdrawSubmit} onClick={withdraw}>Withdraw</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast" data-testid={testIds.toast}>{toast}</div>}
    </>
  );
}
