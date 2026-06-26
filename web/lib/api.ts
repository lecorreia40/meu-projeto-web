// API client for the Mesa admin panel.
// Talks to the FastAPI backend.

function withScheme(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

// Resolve the API base URL robustly:
//  1. NEXT_PUBLIC_API_URL if provided at build time;
//  2. otherwise, when served from Render, derive the API host from the panel's
//     own hostname (mesa-panel.* -> mesa-api.*);
//  3. otherwise local dev.
function resolveApiUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env && env.trim()) return withScheme(env.trim());
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("mesa-panel")) {
      return `https://${host.replace("mesa-panel", "mesa-api")}`;
    }
  }
  return "http://localhost:8000";
}

export const API_URL = resolveApiUrl();

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
  confidence_threshold: number;
}

export interface AgentOpinion {
  agent: string;
  stance: string;
  confidence: number;
  rationale: string;
  key_points: string[];
}

export interface DataTraceInput {
  name: string;
  value: number | string | null;
  source: string;
}

export interface DataTraceValidation {
  check: string;
  passed: boolean;
  detail: string;
}

export interface DataTrace {
  available: boolean;
  inputs: DataTraceInput[];
  validations: DataTraceValidation[];
  all_passed?: boolean;
}

export interface Decision {
  symbol: string;
  stage: string;
  data_trace: DataTrace;
  memo_status: string;
  direction: string;
  confidence: number;
  net_score: number | null;
  thesis: string;
  catalyst: string;
  skeptic_view: string;
  agents: AgentOpinion[];
  signal: {
    entry: number;
    stop: number;
    target: number;
    max_position_pct: number;
    max_risk_pct: number;
    time_horizon: string;
    reward_risk: number | null;
  } | null;
  backtest: {
    passed: boolean;
    reason: string;
    win_rate: number;
    expectancy_r: number;
    n_trades: number;
    reward_risk: number;
  } | null;
  risk: { approved: boolean; reasons: string[] } | null;
  notes: string;
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
  decisions: Decision[];
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

export const updateEvaluation = (confidence_threshold: number) =>
  request<{ confidence_threshold: number }>("/admin/evaluation", {
    method: "PUT",
    body: JSON.stringify({ confidence_threshold }),
  });

// --- Ontology --------------------------------------------------------------

export interface OntologyField {
  name: string;
  type: string;
  validation: string;
}

export interface OntologyEntity {
  name: string;
  layer: string;
  description: string;
  fields: OntologyField[];
}

export interface OntologyRelation {
  src: string;
  dst: string;
  kind: string;
  description: string;
}

export interface Ontology {
  entities: OntologyEntity[];
  relations: OntologyRelation[];
  entity_count: number;
  relation_count: number;
}

export const getOntology = () => request<Ontology>("/admin/ontology");

// --- Accounts --------------------------------------------------------------

export interface CredentialSlot {
  env_var: string;
  label: string;
  present: boolean;
}

export interface ReadinessCheck {
  name: string;
  ready: boolean;
  detail: string;
}

export interface TradingAccount {
  key: string;
  name: string;
  mode: string;
  status: string;
  broker: string;
  starting_balance: number;
  description: string;
  can_trade: boolean;
  credential_slots: CredentialSlot[];
  readiness: { ready: boolean; checks: ReadinessCheck[] } | null;
}

export interface AccountsPayload {
  accounts: TradingAccount[];
  live_trading_enabled: boolean;
  active_account: string;
}

export const getAccounts = () => request<AccountsPayload>("/admin/accounts");

// --- Data source -----------------------------------------------------------

export interface DataSource {
  provider: string;
  is_real: boolean;
  configured: boolean;
  feed: string | null;
  base_url: string | null;
  status: "mock" | "live" | "blocked";
  label: string;
  credential_slots: CredentialSlot[];
}

export const getDataSource = () => request<DataSource>("/admin/data-source");

// --- Equity curve ----------------------------------------------------------

export interface EquityPoint {
  day: number;
  equity: number;
  halted: boolean;
  pnl_pct: number;
}

export interface EquityCurve {
  start_equity: number;
  points: EquityPoint[];
  summary: {
    days_traded: number;
    n_entries: number;
    n_exits: number;
    halt_days: number;
    final_equity: number;
    total_return_pct: number;
    max_drawdown_pct: number;
  };
}

export const getEquityCurve = (seed = 42, days = 180, warmup = 60) =>
  request<EquityCurve>("/admin/equity-curve", {
    method: "POST",
    body: JSON.stringify({ seed, days, warmup }),
  });
