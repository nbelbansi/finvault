import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Loan { id: string; type: string; amount: number; balance: number; rate: number; status: string; termMonths: number; }

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [applyForm, setApplyForm] = useState({ type: "PERSONAL", amount: "10000", termMonths: "36" });
  const [paymentAmt, setPaymentAmt] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<string>("");

  const load = () => api<{ loans: Loan[] }>("/loans").then((d) => setLoans(d.loans));
  useEffect(() => { load(); }, []);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/loans/apply", {
      method: "POST",
      body: JSON.stringify({
        type: applyForm.type,
        amount: Number(applyForm.amount),
        termMonths: Number(applyForm.termMonths),
      }),
    });
    load();
  };

  const pay = async () => {
    if (!selectedLoan) return;
    await api(`/loans/${selectedLoan}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount: Number(paymentAmt) }),
    });
    setPaymentAmt("");
    load();
  };

  return (
    <>
      <h1 className="page-title">Loans</h1>
      <div className="grid grid-2">
        <div className="card">
          <h3>Apply for loan</h3>
          <form onSubmit={apply}>
            <label>Type<select data-testid={testIds.loanType} value={applyForm.type} onChange={(e) => setApplyForm({ ...applyForm, type: e.target.value })}>
              <option value="PERSONAL">Personal</option>
              <option value="AUTO">Auto</option>
              <option value="MORTGAGE">Mortgage</option>
            </select></label>
            <label>Amount<input data-testid={testIds.loanAmount} type="number" value={applyForm.amount} onChange={(e) => setApplyForm({ ...applyForm, amount: e.target.value })} /></label>
            <label>Term (months)<input data-testid={testIds.loanTerm} type="number" value={applyForm.termMonths} onChange={(e) => setApplyForm({ ...applyForm, termMonths: e.target.value })} /></label>
            <button type="submit" className="btn" data-testid={testIds.loanApplySubmit}>Apply</button>
          </form>
        </div>
        <div className="card">
          <h3>Make payment</h3>
          <label>Loan<select value={selectedLoan} onChange={(e) => setSelectedLoan(e.target.value)}>
            <option value="">Select…</option>
            {loans.filter((l) => l.balance > 0).map((l) => <option key={l.id} value={l.id}>{l.type} — ${l.balance.toFixed(0)} remaining</option>)}
          </select></label>
          <label>Amount<input data-testid={testIds.loanPaymentAmount} type="number" value={paymentAmt} onChange={(e) => setPaymentAmt(e.target.value)} /></label>
          <button type="button" className="btn" data-testid={testIds.loanPaymentSubmit} onClick={pay}>Pay</button>
        </div>
      </div>
      <div className="card" data-testid={testIds.loansList}>
        <table>
          <thead><tr><th>Type</th><th>Original</th><th>Balance</th><th>Rate</th><th>Status</th></tr></thead>
          <tbody>{loans.map((l) => (
            <tr key={l.id}><td>{l.type}</td><td>${l.amount.toFixed(0)}</td><td>${l.balance.toFixed(0)}</td><td>{l.rate}%</td><td>{l.status}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
