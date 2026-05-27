import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  memo?: string;
  createdAt: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);

  useEffect(() => {
    api<{ accounts: Account[] }>("/accounts").then((d) => {
      setAccounts(d.accounts);
      if (d.accounts[0]) {
        api<{ transactions: Transaction[] }>(`/accounts/${d.accounts[0].id}/transactions?limit=5`).then(
          (t) => setRecentTx(t.transactions)
        );
      }
    });
  }, []);

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <h1 className="page-title" data-testid={testIds.dashboardWelcome}>
        Welcome, {user?.firstName}
      </h1>
      <div className="grid grid-3">
        <div className="card">
          <h3>Total balance</h3>
          <div className="stat-value" data-testid={testIds.dashboardTotalBalance}>
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card">
          <h3>Accounts</h3>
          <div className="stat-value">{accounts.length}</div>
        </div>
      </div>
      <div className="card" data-testid={testIds.dashboardRecentTx}>
        <h3>Recent transactions</h3>
        {recentTx.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No transactions yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.type}</td>
                  <td>${Math.abs(tx.amount).toFixed(2)}</td>
                  <td>{tx.memo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
