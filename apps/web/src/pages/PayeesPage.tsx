import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Payee { id: string; name: string; nickname?: string; accountNumber: string; }
interface Account { id: string; name: string; }
interface Bill { id: string; amount: number; status: string; createdAt: string; }

export function PayeesPage() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payeeForm, setPayeeForm] = useState({ name: "", accountNumber: "", routingNumber: "021000021" });
  const [billForm, setBillForm] = useState({ payeeId: "", fromAccountId: "", amount: "" });

  const load = () => {
    api<{ payees: Payee[] }>("/payees").then((d) => setPayees(d.payees));
    api<{ accounts: Account[] }>("/accounts").then((d) => setAccounts(d.accounts));
    api<{ bills: Bill[] }>("/bills/history").then((d) => setBills(d.bills));
  };
  useEffect(() => { load(); }, []);

  const addPayee = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/payees", { method: "POST", body: JSON.stringify(payeeForm) });
    setPayeeForm({ name: "", accountNumber: "", routingNumber: "021000021" });
    load();
  };

  const payBill = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/bills/pay", {
      method: "POST",
      body: JSON.stringify({
        payeeId: billForm.payeeId,
        fromAccountId: billForm.fromAccountId,
        amount: Number(billForm.amount),
      }),
    });
    setBillForm({ payeeId: "", fromAccountId: "", amount: "" });
    load();
  };

  return (
    <>
      <h1 className="page-title">Payees & Bill Pay</h1>
      <div className="grid grid-2">
        <div className="card">
          <h3>Add payee</h3>
          <form onSubmit={addPayee}>
            <label>Name<input data-testid={testIds.payeeName} value={payeeForm.name} onChange={(e) => setPayeeForm({ ...payeeForm, name: e.target.value })} required /></label>
            <label>Account<input data-testid={testIds.payeeAccount} value={payeeForm.accountNumber} onChange={(e) => setPayeeForm({ ...payeeForm, accountNumber: e.target.value })} required /></label>
            <label>Routing<input data-testid={testIds.payeeRouting} value={payeeForm.routingNumber} onChange={(e) => setPayeeForm({ ...payeeForm, routingNumber: e.target.value })} required /></label>
            <button type="submit" className="btn" data-testid={testIds.payeeSubmit}>Add payee</button>
          </form>
        </div>
        <div className="card">
          <h3>Pay bill</h3>
          <form onSubmit={payBill}>
            <label>Payee<select data-testid={testIds.billPayeeSelect} value={billForm.payeeId} onChange={(e) => setBillForm({ ...billForm, payeeId: e.target.value })} required>
              <option value="">Select…</option>
              {payees.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
            <label>From account<select data-testid={testIds.billFromAccount} value={billForm.fromAccountId} onChange={(e) => setBillForm({ ...billForm, fromAccountId: e.target.value })} required>
              <option value="">Select…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select></label>
            <label>Amount<input data-testid={testIds.billAmount} type="number" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} required /></label>
            <button type="submit" className="btn" data-testid={testIds.billSubmit}>Pay bill</button>
          </form>
        </div>
      </div>
      <div className="card" data-testid={testIds.payeesList}>
        <h3>Payees</h3>
        <ul>{payees.map((p) => <li key={p.id}>{p.name} — ****{p.accountNumber.slice(-4)}</li>)}</ul>
      </div>
      <div className="card">
        <h3>Payment history</h3>
        <table><thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{bills.map((b) => <tr key={b.id}><td>{new Date(b.createdAt).toLocaleDateString()}</td><td>${b.amount.toFixed(2)}</td><td>{b.status}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
