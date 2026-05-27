import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Card { id: string; lastFour: string; brand: string; status: string; dailyLimit: number; }

export function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [limitValue, setLimitValue] = useState("5000");

  const load = () => api<{ cards: Card[] }>("/cards").then((d) => setCards(d.cards));
  useEffect(() => { load(); }, []);

  const freeze = async (id: string) => { await api(`/cards/${id}/freeze`, { method: "POST" }); load(); };
  const unfreeze = async (id: string) => { await api(`/cards/${id}/unfreeze`, { method: "POST" }); load(); };
  const setLimit = async (id: string) => {
    await api(`/cards/${id}/limits`, { method: "POST", body: JSON.stringify({ dailyLimit: Number(limitValue) }) });
    load();
  };
  const create = async () => { await api("/cards", { method: "POST", body: "{}" }); load(); };

  return (
    <>
      <h1 className="page-title">Cards</h1>
      <button type="button" className="btn" onClick={create}>Request new card</button>
      <div className="card" style={{ marginTop: "1rem" }} data-testid={testIds.cardsList}>
        <table>
          <thead><tr><th>Card</th><th>Status</th><th>Daily limit</th><th>Actions</th></tr></thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id}>
                <td>{c.brand} •••• {c.lastFour}</td>
                <td><span className={`badge badge-${c.status === "ACTIVE" ? "success" : "warning"}`}>{c.status}</span></td>
                <td>${c.dailyLimit.toFixed(0)}</td>
                <td>
                  {c.status === "ACTIVE" ? (
                    <button type="button" className="btn btn-danger" data-testid={testIds.cardFreeze(c.id)} onClick={() => freeze(c.id)}>Freeze</button>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => unfreeze(c.id)}>Unfreeze</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cards[0] && (
        <div className="card">
          <label>Daily limit<input data-testid={testIds.cardLimitDaily} type="number" value={limitValue} onChange={(e) => setLimitValue(e.target.value)} /></label>
          <button type="button" className="btn" onClick={() => setLimit(cards[0].id)}>Update limit</button>
        </div>
      )}
    </>
  );
}
