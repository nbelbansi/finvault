/** Stable selectors for Playwright/Cypress — use getByTestId() */
export const testIds = {
  // Auth
  loginEmail: "login-email",
  loginPassword: "login-password",
  loginSubmit: "login-submit",
  loginError: "login-error",
  registerEmail: "register-email",
  registerPassword: "register-password",
  registerFirstName: "register-first-name",
  registerLastName: "register-last-name",
  registerSubmit: "register-submit",
  forgotEmail: "forgot-email",
  forgotSubmit: "forgot-submit",

  // Nav
  navDashboard: "nav-dashboard",
  navAccounts: "nav-accounts",
  navTransfers: "nav-transfers",
  navPayees: "nav-payees",
  navCards: "nav-cards",
  navBudgets: "nav-budgets",
  navInvestments: "nav-investments",
  navLoans: "nav-loans",
  navNotifications: "nav-notifications",
  navSettings: "nav-settings",
  navAdmin: "nav-admin",
  navLogout: "nav-logout",
  userMenu: "user-menu",

  // Dashboard
  dashboardWelcome: "dashboard-welcome",
  dashboardTotalBalance: "dashboard-total-balance",
  dashboardRecentTx: "dashboard-recent-transactions",

  // Accounts
  accountsList: "accounts-list",
  accountOpenBtn: "account-open-btn",
  accountTypeSelect: "account-type-select",
  accountNameInput: "account-name-input",
  accountInitialDeposit: "account-initial-deposit",
  accountCreateSubmit: "account-create-submit",
  accountRow: (id: string) => `account-row-${id}`,
  accountDetailBalance: "account-detail-balance",
  depositAmount: "deposit-amount",
  depositSubmit: "deposit-submit",
  withdrawAmount: "withdraw-amount",
  withdrawSubmit: "withdraw-submit",

  // Transfers
  transferFrom: "transfer-from-account",
  transferTo: "transfer-to-account",
  transferAmount: "transfer-amount",
  transferMemo: "transfer-memo",
  transferSubmit: "transfer-submit",
  transferExternalAccount: "transfer-external-account",
  transferExternalRouting: "transfer-external-routing",
  transferList: "transfer-list",
  transferCancel: (id: string) => `transfer-cancel-${id}`,

  // Payees & bills
  payeeName: "payee-name",
  payeeAccount: "payee-account",
  payeeRouting: "payee-routing",
  payeeSubmit: "payee-submit",
  payeesList: "payees-list",
  billPayeeSelect: "bill-payee-select",
  billFromAccount: "bill-from-account",
  billAmount: "bill-amount",
  billSubmit: "bill-submit",

  // Cards
  cardsList: "cards-list",
  cardFreeze: (id: string) => `card-freeze-${id}`,
  cardLimitDaily: "card-limit-daily",

  // Budgets
  budgetsList: "budgets-list",
  budgetName: "budget-name",
  budgetCategory: "budget-category",
  budgetLimit: "budget-limit",
  budgetSubmit: "budget-submit",

  // Investments
  portfolioList: "portfolio-list",
  orderSymbol: "order-symbol",
  orderQuantity: "order-quantity",
  orderSide: "order-side",
  orderSubmit: "order-submit",
  ordersList: "orders-list",

  // Loans
  loansList: "loans-list",
  loanType: "loan-type",
  loanAmount: "loan-amount",
  loanTerm: "loan-term",
  loanApplySubmit: "loan-apply-submit",
  loanPaymentAmount: "loan-payment-amount",
  loanPaymentSubmit: "loan-payment-submit",

  // Notifications
  notificationsList: "notifications-list",
  notificationMarkRead: (id: string) => `notification-read-${id}`,
  notificationsMarkAll: "notifications-mark-all",

  // Settings
  settingsFirstName: "settings-first-name",
  settingsLastName: "settings-last-name",
  settingsSave: "settings-save",
  settingsTheme: "settings-theme",

  // Admin
  adminUsersList: "admin-users-list",
  adminAuditLog: "admin-audit-log",
  adminMetrics: "admin-metrics",

  // Common
  toast: "toast-message",
  loadingSpinner: "loading-spinner",
  confirmDialog: "confirm-dialog",
  confirmYes: "confirm-yes",
  confirmNo: "confirm-no",
  paginationNext: "pagination-next",
  paginationPrev: "pagination-prev",
  searchInput: "search-input",
  filterStatus: "filter-status",
} as const;
