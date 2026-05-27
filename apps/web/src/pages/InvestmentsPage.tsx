import { useEffect, useState } from "react";
import { testIds } from "@finvault/shared";
import { api } from "../api/client";

interface Portfolio { id: string; name: string; holdings: { symbol: string; quantity: number; avgCost: number }[]; }
interface Order { id: string; symbol: string; side: string; quantity: number; status: string; }
interface WatchItem { symbol: string; price: number; change: number; }

export function InvestmentsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [form, setForm] = useState({ portfolioId: "", symbol: "AAPL", side: "BUY", quantity: "1", orderType: "MARKET" });

  const load = () => {
    api<{ portfolios: Portfolio[] }>("/portfolios").then((d) => {
      setPortfolios(d.portfolios);
      if (d.portfolios[0] && !form.portfolioId) setForm((f) => ({ ...f, portfolioId: d.portfolios[0].id }));
    });
    api<{ orders: Order[] }>("/orders").then((d) => setOrders(d.orders));
    api<{ watchlist: WatchItem[] }>("/watchlist").then((d) => setWatchlist(d.watchlist));
  };
  useEffect(() => { load(); }, []);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/orders", {
      method: "POST",
      body: JSON.stringify({
        portfolioId: form.portfolioId,
        symbol: form.symbol,
        side: form.side,
        quantity: Number(form.quantity),
        orderType: form.orderType,
      }),
    });
    load();
  };

  return (
    <>
      <h1 className="page-title">Investments</h1>
      <div className="grid grid-2">
        <div className="card" data-testid={testIds.portfolioList}>
          <h3>Portfolios</h3>
          {portfolios.map((p) => (
            <div key={p.id}>
              <strong>{p.name}</strong>
              <ul>{p.holdings.map((h) => <li key={h.symbol}>{h.symbol}: {h.quantity} @ ${h.avgCost}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Place order</h3>
          <form onSubmit={placeOrder}>
            <label>Symbol<input data-testid={testIds.orderSymbol} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} /></label>
            <label>Side<select data-testid={testIds.orderSide} value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
              <option value="BUY">Buy</option><option value="SELL">Sell</option>
            </select></label>
            <label>Quantity<input data-testid={testIds.orderQuantity} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
            <button type="submit" className="btn" data-testid={testIds.orderSubmit}>Submit order</button>
          </form>
        </div>
      </div>
      <div className="card" data-testid={testIds.ordersList}>
        <h3>Orders</h3>
        <table><thead><tr><th>Symbol</th><th>Side</th><th>Qty</th><th>Status</th></tr></thead>
          <tbody>{orders.map((o) => <tr key={o.id}><td>{o.symbol}</td><td>{o.side}</td><td>{o.quantity}</td><td>{o.status}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card">
        <h3>Watchlist</h3>
        <ul>{watchlist.map((w) => <li key={w.symbol}>{w.symbol}: ${w.price.toFixed(2)} ({w.change > 0 ? "+" : ""}{w.change.toFixed(2)}%)</li>)}</ul>
      </div>
    </>
  );
}
