import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Notification { id: string; title: string; body: string; read: boolean; createdAt: string; }

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = () => api<{ notifications: Notification[] }>("/notifications").then((d) => setNotifications(d.notifications));
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    load();
  };

  const markAll = async () => {
    await api("/notifications/read-all", { method: "POST" });
    load();
  };

  return (
    <>
      <h1 className="page-title">Notifications</h1>
      <button type="button" className="btn btn-secondary" data-testid={testIds.notificationsMarkAll} onClick={markAll}>
        Mark all as read
      </button>
      <div className="card" style={{ marginTop: "1rem" }} data-testid={testIds.notificationsList}>
        {notifications.map((n) => (
          <div key={n.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)", opacity: n.read ? 0.6 : 1 }}>
            <strong>{n.title}</strong>
            <p>{n.body}</p>
            {!n.read && (
              <button type="button" className="btn btn-secondary" data-testid={testIds.notificationMarkRead(n.id)} onClick={() => markRead(n.id)}>
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
