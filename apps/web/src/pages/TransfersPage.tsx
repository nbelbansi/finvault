import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Account { id: string; name: string; balance: number; }
interface Transfer { id: string; amount: number; status: string; memo?: string; createdAt: string; }

export function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [form, setForm] = useState({ fromAccountId: "", toAccountId: "", amount: "", memo: "", external: false, externalAccount: "", externalRouting: "" });

  const load = () => {
    api<{ accounts: Account[] }>("/accounts").then((d) => setAccounts(d.accounts));
    api<{ transfers: Transfer[] }>("/transfers").then((d) => setTransfers(d.transfers));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      fromAccountId: form.fromAccountId,
      amount: Number(form.amount),
      memo: form.memo || undefined,
    };
    if (form.external) {
      body.externalAccountNumber = form.externalAccount;
      body.externalRoutingNumber = form.externalRouting;
    } else {
      body.toAccountId = form.toAccountId;
    }
    await api("/transfers", { method: "POST", body: JSON.stringify(body) });
    setForm({ ...form, amount: "", memo: "" });
    load();
  };

  const cancel = async (id: string) => {
    await api(`/transfers/${id}/cancel`, { method: "POST" });
    load();
  };

  return (
    <>
      <h1 className="page-title">Transfers</h1>
      <div className="card">
        <form onSubmit={submit}>
          <label>
            From account
            <select data-testid={testIds.transferFrom} value={form.fromAccountId} onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })} required>
              <option value="">Select…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>)}
            </select>
          </label>
          <label>
            <input type="checkbox" checked={form.external} onChange={(e) => setForm({ ...form, external: e.target.checked })} />
            External transfer
          </label>
          {form.external ? (
            <>
              <label>Account number<input data-testid={testIds.transferExternalAccount} value={form.externalAccount} onChange={(e) => setForm({ ...form, externalAccount: e.target.value })} /></label>
              <label>Routing number<input data-testid={testIds.transferExternalRouting} value={form.externalRouting} onChange={(e) => setForm({ ...form, externalRouting: e.target.value })} /></label>
            </>
          ) : (
            <label>
              To account
              <select data-testid={testIds.transferTo} value={form.toAccountId} onChange={(e) => setForm({ ...form, toAccountId: e.target.value })} required={!form.external}>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          )}
          <label>Amount<input data-testid={testIds.transferAmount} type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
          <label>Memo<input data-testid={testIds.transferMemo} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} /></label>
          <button type="submit" className="btn" data-testid={testIds.transferSubmit}>Transfer</button>
        </form>
      </div>
      <div className="card" data-testid={testIds.transferList}>
        <h3>Transfer history</h3>
        <table>
          <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Memo</th><th></th></tr></thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td>${t.amount.toFixed(2)}</td>
                <td>{t.status}</td>
                <td>{t.memo ?? "—"}</td>
                <td>{t.status === "PENDING" && <button type="button" className="btn btn-danger" data-testid={testIds.transferCancel(t.id)} onClick={() => cancel(t.id)}>Cancel</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
