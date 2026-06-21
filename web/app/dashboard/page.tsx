"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminState,
  CycleResult,
  RiskPolicy,
  clearToken,
  getState,
  getToken,
  runCycle,
  toggleAgent,
  updateRiskPolicy,
} from "@/lib/api";

const RISK_FIELDS: { key: keyof RiskPolicy; label: string }[] = [
  { key: "max_risk_per_trade_pct", label: "Risco máx. por trade (%)" },
  { key: "max_position_size_pct", label: "Tamanho máx. da posição (%)" },
  { key: "max_daily_loss_pct", label: "Perda máx. diária (%)" },
  { key: "max_weekly_loss_pct", label: "Perda máx. semanal (%)" },
  { key: "max_open_positions", label: "Máx. posições abertas" },
  { key: "max_total_exposure_pct", label: "Exposição total máx. (%)" },
];

export default function Dashboard() {
  const router = useRouter();
  const [state, setState] = useState<AdminState | null>(null);
  const [policy, setPolicy] = useState<Partial<RiskPolicy>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CycleResult | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      const s = await getState();
      setState(s);
      setPolicy(s.risk_policy);
    } catch (err) {
      handleError(err);
    }
  }

  function handleError(err: unknown) {
    const m = err instanceof Error ? err.message : "Erro";
    setError(m);
    if (m.includes("Sessão")) router.push("/");
  }

  async function onToggle(key: string, enabled: boolean) {
    setError("");
    try {
      await toggleAgent(key, enabled);
      await refresh();
    } catch (err) {
      handleError(err);
    }
  }

  async function onSavePolicy() {
    setError("");
    setMsg("");
    try {
      const patch: Partial<RiskPolicy> = {};
      RISK_FIELDS.forEach(({ key }) => {
        const v = policy[key];
        if (typeof v === "number") (patch as Record<string, number>)[key] = v;
      });
      await updateRiskPolicy(patch);
      setMsg("Limites de risco atualizados.");
      await refresh();
    } catch (err) {
      handleError(err);
    }
  }

  async function onRun() {
    setError("");
    setMsg("");
    setRunning(true);
    setResult(null);
    try {
      const r = await runCycle(42, 180);
      setResult(r);
      setMsg("Ciclo executado (paper).");
    } catch (err) {
      handleError(err);
    } finally {
      setRunning(false);
    }
  }

  function logout() {
    clearToken();
    router.push("/");
  }

  if (!state) {
    return (
      <div className="container">
        <p className="muted">Carregando…</p>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 8 }}>
        <h1>Mesa Proprietária com IA — Admin</h1>
        <button className="secondary" onClick={logout}>Sair</button>
      </div>

      <div className="banner">
        🔒 Segurança: operação ao vivo <b>desligada</b> ·
        modo de execução <b>{state.execution_mode}</b> ·
        a IA propõe, o motor de risco decide · universo de {state.universe_size} ativos.
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      {msg && <div className="banner">{msg}</div>}

      {/* Agentes */}
      <div className="card">
        <h2>Agentes de pesquisa</h2>
        <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
          Ligue/desligue os analistas. Cético, Analista de Risco e Orquestrador são
          obrigatórios (não podem ser desligados).
        </p>
        {state.agents.map((a) => (
          <div className="agent" key={a.key}>
            <div>
              <b>{a.name}</b>{" "}
              {a.mandatory && <span className="pill mandatory">obrigatório</span>}
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={a.enabled}
                disabled={a.mandatory}
                onChange={(e) => onToggle(a.key, e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
        ))}
      </div>

      {/* Limites de risco */}
      <div className="card">
        <h2>Limites de risco</h2>
        <div className="grid">
          {RISK_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label>{label}</label>
              <input
                type="number"
                step="0.1"
                value={(policy[key] as number) ?? ""}
                onChange={(e) =>
                  setPolicy({ ...policy, [key]: parseFloat(e.target.value) })
                }
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={onSavePolicy}>Salvar limites</button>
        </div>
      </div>

      {/* Rodar ciclo */}
      <div className="card">
        <h2>Executar ciclo (paper)</h2>
        <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
          Roda o pipeline: dados → agentes → memo → sinal → backtest → risco →
          ordem em papel, usando os agentes e limites configurados acima.
        </p>
        <button className="run" onClick={onRun} disabled={running}>
          {running ? "Rodando…" : "▶ Rodar ciclo"}
        </button>

        {result && (
          <div style={{ marginTop: 20 }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <div className="metric">
                <div className="v">${Math.round(result.portfolio.equity).toLocaleString()}</div>
                <div className="k">Patrimônio (paper)</div>
              </div>
              <div className="metric">
                <div className="v">{result.portfolio.open_positions}</div>
                <div className="k">Posições abertas</div>
              </div>
              <div className="metric">
                <div className="v">{result.portfolio.gross_exposure_pct.toFixed(1)}%</div>
                <div className="k">Exposição</div>
              </div>
            </div>

            <h2 style={{ marginTop: 20 }}>Resultado por etapa</h2>
            <table>
              <tbody>
                {Object.entries(result.counts).map(([stage, n]) => (
                  <tr key={stage}>
                    <td>{stage}</td>
                    <td style={{ textAlign: "right" }}>{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.paper_orders.length > 0 && (
              <>
                <h2 style={{ marginTop: 20 }}>Ordens em papel</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Símbolo</th><th>Qtd</th><th>Preço</th><th>Nocional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.paper_orders.map((o) => (
                      <tr key={o.symbol}>
                        <td>{o.symbol}</td>
                        <td>{o.quantity}</td>
                        <td>${o.fill_price.toFixed(2)}</td>
                        <td>${Math.round(o.notional).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
