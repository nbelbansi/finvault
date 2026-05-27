import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

export function AdminPage() {
  const [users, setUsers] = useState<{ id: string; email: string; role: string; firstName: string }[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [logs, setLogs] = useState<{ action: string; resource: string; createdAt: string }[]>([]);

  useEffect(() => {
    api<{ users: typeof users }>("/admin/users").then((d) => setUsers(d.users));
    api<{ metrics: Record<string, number> }>("/admin/metrics").then((d) => setMetrics(d.metrics));
    api<{ logs: typeof logs }>("/admin/audit-logs").then((d) => setLogs(d.logs));
  }, []);

  return (
    <>
      <h1 className="page-title">Admin</h1>
      {metrics && (
        <div className="grid grid-3" data-testid={testIds.adminMetrics}>
          {Object.entries(metrics).map(([k, v]) => (
            <div className="card" key={k}><h3>{k}</h3><div className="stat-value">{typeof v === "number" ? v.toFixed?.(0) ?? v : v}</div></div>
          ))}
        </div>
      )}
      <div className="card" data-testid={testIds.adminUsersList}>
        <h3>Users</h3>
        <table><thead><tr><th>Email</th><th>Name</th><th>Role</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id}><td>{u.email}</td><td>{u.firstName}</td><td>{u.role}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card" data-testid={testIds.adminAuditLog}>
        <h3>Audit log</h3>
        <table><thead><tr><th>Action</th><th>Resource</th><th>Time</th></tr></thead>
          <tbody>{logs.slice(0, 20).map((l, i) => <tr key={i}><td>{l.action}</td><td>{l.resource}</td><td>{new Date(l.createdAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
