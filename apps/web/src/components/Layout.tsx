import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { testIds } from "@finvault/shared";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", testId: testIds.navDashboard },
  { to: "/accounts", label: "Accounts", testId: testIds.navAccounts },
  { to: "/transfers", label: "Transfers", testId: testIds.navTransfers },
  { to: "/payees", label: "Payees & Bills", testId: testIds.navPayees },
  { to: "/cards", label: "Cards", testId: testIds.navCards },
  { to: "/budgets", label: "Budgets", testId: testIds.navBudgets },
  { to: "/investments", label: "Investments", testId: testIds.navInvestments },
  { to: "/loans", label: "Loans", testId: testIds.navLoans },
  { to: "/notifications", label: "Notifications", testId: testIds.navNotifications },
  { to: "/settings", label: "Settings", testId: testIds.navSettings },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">FinVault</div>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} data-testid={item.testId}>
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" data-testid={testIds.navAdmin}>
            Admin
          </NavLink>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="nav-link"
          data-testid={testIds.navLogout}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out ({user?.firstName})
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
