// API client for the Mesa admin panel.
// Talks to the FastAPI backend (default http://localhost:8000).

function normalizeUrl(u: string | undefined): string {
  if (!u) return "http://localhost:8000";
  // Render's fromService injects a bare hostname; ensure a scheme is present.
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export const API_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL);

const TOKEN_KEY = "mesa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

// --- Types -----------------------------------------------------------------

export interface Agent {
  key: string;
  name: string;
  mandatory: boolean;
  enabled: boolean;
}

export interface RiskPolicy {
  max_risk_per_trade_pct: number;
  max_position_size_pct: number;
  max_daily_loss_pct: number;
  max_weekly_loss_pct: number;
  max_open_positions: number;
  max_total_exposure_pct: number;
  allow_short: boolean;
  allow_options: boolean;
  allow_crypto: boolean;
  allow_leverage: boolean;
  paper_trading_default: boolean;
  live_trading_default: boolean;
}

export interface AdminState {
  live_trading_enabled: boolean;
  execution_mode: string;
  universe_size: number;
  agents: Agent[];
  risk_policy: RiskPolicy;
}

export interface CycleResult {
  counts: Record<string, number>;
  paper_orders: {
    symbol: string;
    quantity: number;
    fill_price: number;
    notional: number;
  }[];
  portfolio: {
    equity: number;
    cash: number;
    open_positions: number;
    gross_exposure_pct: number;
    unrealized_pnl: number;
    commissions_paid: number;
  };
}

// --- Calls -----------------------------------------------------------------

export async function login(username: string, password: string): Promise<string> {
  const data = await request<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data.token;
}

export const getState = () => request<AdminState>("/admin/state");

export const toggleAgent = (key: string, enabled: boolean) =>
  request<Agent>(`/admin/agents/${key}`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });

export const updateRiskPolicy = (patch: Partial<RiskPolicy>) =>
  request<RiskPolicy>("/admin/risk-policy", {
    method: "PUT",
    body: JSON.stringify(patch),
  });

export const runCycle = (seed = 42, days = 180) =>
  request<CycleResult>("/admin/run-cycle", {
    method: "POST",
    body: JSON.stringify({ seed, days }),
  });
