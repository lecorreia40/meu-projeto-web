"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AccountsPayload,
  AdminState,
  CycleResult,
  DataSource,
  Decision,
  Ontology,
  RiskPolicy,
  clearToken,
  getAccounts,
  getDataSource,
  getOntology,
  getState,
  getToken,
  runCycle,
  toggleAgent,
  updateEvaluation,
  updateRiskPolicy,
} from "@/lib/api";

const STAGE_LABEL: Record<string, { label: string; color: string }> = {
  paper_filled: { label: "Ordem em papel", color: "#22c55e" },
  risk_blocked: { label: "Bloqueado (risco)", color: "#ef4444" },
  backtest_blocked: { label: "Bloqueado (backtest)", color: "#f59e0b" },
  memo_rejected: { label: "Rejeitado (tese fraca)", color: "#94a3b8" },
  signal_created: { label: "Sinal gerado", color: "#3b82f6" },
};

function stanceColor(stance: string): string {
  if (stance === "bullish") return "#22c55e";
  if (stance === "bearish") return "#ef4444";
  return "#94a3b8";
}

const STANCE_LABEL: Record<string, string> = {
  bullish: "alta", bearish: "baixa", neutral: "neutro",
};

function DecisionDetail({ d }: { d: Decision }) {
  return (
    <div style={{ padding: "8px 4px 16px" }}>
      <div className="muted" style={{ marginBottom: 10 }}>
        Direção: <b>{d.direction}</b> · confiança {d.confidence.toFixed(2)} ·
        net score {d.net_score?.toFixed(2) ?? "—"}
      </div>

      {/* Linhagem de dados: o que cada função trouxe + a validação */}
      {d.data_trace?.available && (
        <div style={{ marginBottom: 14 }}>
          <b>Dados de entrada (linhagem)</b>
          <p className="muted" style={{ marginTop: 4, marginBottom: 8 }}>
            O que cada função trouxe e de onde veio.
          </p>
          <table>
            <thead>
              <tr><th>Indicador</th><th>Valor</th><th>Fonte</th></tr>
            </thead>
            <tbody>
              {d.data_trace.inputs.map((i) => (
                <tr key={i.name}>
                  <td><b>{i.name}</b></td>
                  <td>{i.value === null ? "—" : String(i.value)}</td>
                  <td className="muted">{i.source}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10 }}>
            <b>Validação dos dados</b>{" "}
            <span className="pill" style={{
              background: (d.data_trace.all_passed ? "#22c55e" : "#f59e0b") + "22",
              color: d.data_trace.all_passed ? "var(--green)" : "var(--amber)",
            }}>
              {d.data_trace.all_passed ? "tudo validado" : "atenção"}
            </span>
          </div>
          {d.data_trace.validations.map((v) => (
            <div key={v.check} className="muted" style={{ marginTop: 6 }}>
              {v.passed ? "✅" : "🚫"} <b>{v.check}</b> — {v.detail}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <b>Agentes</b>
        {d.agents.length === 0 && <div className="muted">(sem opiniões registradas)</div>}
        {d.agents.map((a) => (
          <div key={a.agent} className="agent" style={{ display: "block" }}>
            <div className="row">
              <b>{a.agent}</b>
              <span className="pill" style={{ background: stanceColor(a.stance) + "22", color: stanceColor(a.stance) }}>
                {STANCE_LABEL[a.stance] ?? a.stance} · {a.confidence.toFixed(2)}
              </span>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>{a.rationale}</div>
          </div>
        ))}
      </div>

      <div className="banner" style={{ marginBottom: 12 }}>
        <b>Cético:</b> {d.skeptic_view}
      </div>

      {d.signal && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 12 }}>
          <div className="metric"><div className="v">{d.signal.entry.toFixed(2)}</div><div className="k">entrada</div></div>
          <div className="metric"><div className="v">{d.signal.stop.toFixed(2)}</div><div className="k">stop</div></div>
          <div className="metric"><div className="v">{d.signal.target.toFixed(2)}</div><div className="k">alvo</div></div>
          <div className="metric"><div className="v">{d.signal.reward_risk?.toFixed(1) ?? "—"}</div><div className="k">retorno/risco</div></div>
        </div>
      )}

      {d.backtest && (
        <div className="muted" style={{ marginBottom: 8 }}>
          <b>Backtest:</b> {d.backtest.passed ? "✅ passou" : "🚫 falhou"} — {d.backtest.reason}
          {" "}(trades {d.backtest.n_trades}, acerto {(d.backtest.win_rate * 100).toFixed(0)}%,
          expectativa {d.backtest.expectancy_r.toFixed(2)}R)
        </div>
      )}

      {d.risk && (
        <div className="muted">
          <b>Risco:</b>{" "}
          {d.risk.approved
            ? "✅ aprovado"
            : "🚫 bloqueado — " + d.risk.reasons.join(", ")}
        </div>
      )}
    </div>
  );
}

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
  const [threshold, setThreshold] = useState<number>(0.15);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountsPayload | null>(null);
  const [ontology, setOntology] = useState<Ontology | null>(null);
  const [showOntology, setShowOntology] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);

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
      setThreshold(s.confidence_threshold);
      const [acc, ont, ds] = await Promise.all([
        getAccounts(), getOntology(), getDataSource(),
      ]);
      setAccounts(acc);
      setOntology(ont);
      setDataSource(ds);
    } catch (err) {
      handleError(err);
    }
  }

  async function onSaveThreshold() {
    setError("");
    setMsg("");
    try {
      await updateEvaluation(threshold);
      setMsg(`Limiar de confiança ajustado para ${threshold}.`);
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

      {/* Fonte de dados */}
      {dataSource && (
        <div className="card">
          <div className="row">
            <h2 style={{ margin: 0 }}>Fonte de dados de mercado</h2>
            <span className="pill" style={{
              background:
                (dataSource.status === "live" ? "#22c55e"
                  : dataSource.status === "blocked" ? "#cb1010" : "#aa6b00") + "22",
              color:
                dataSource.status === "live" ? "var(--green)"
                  : dataSource.status === "blocked" ? "var(--red)" : "var(--amber)",
            }}>
              {dataSource.status === "live" ? "DADOS REAIS"
                : dataSource.status === "blocked" ? "TRAVADO (sem credenciais)"
                : "SIMULADO (mock)"}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 8, marginBottom: 12 }}>
            {dataSource.status === "mock" && (
              <>A mesa está usando o feed sintético determinístico — preços
              gerados localmente, ideal para testar o pipeline sem custo. Para
              usar dados reais, configure um provedor (ex.: Alpaca) por variáveis
              de ambiente.</>
            )}
            {dataSource.status === "blocked" && (
              <>Um provedor real (<b>{dataSource.provider}</b>) está selecionado,
              mas faltam credenciais. Por segurança a mesa <b>não inventa preços</b>:
              o feed fica travado até as chaves serem definidas.</>
            )}
            {dataSource.status === "live" && (
              <>Conectada a dados reais via <b>{dataSource.provider}</b>
              {dataSource.feed ? ` (feed ${dataSource.feed})` : ""}.</>
            )}
          </p>
          <div className="muted" style={{ marginBottom: 8 }}>
            Provedor atual: <b>{dataSource.label}</b>
          </div>
          <div style={{ marginTop: 4 }}>
            <b>Onde configurar</b> (somente variáveis de ambiente — nunca no código):
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            ⬚ <code>MARKET_DATA_PROVIDER</code> = <code>alpaca</code> (padrão: <code>mock</code>)
          </div>
          {dataSource.credential_slots.map((c) => (
            <div key={c.env_var} className="muted" style={{ marginTop: 4 }}>
              {c.present ? "✅" : "⬜"} <code>{c.env_var}</code> — {c.label}
              {c.present ? " (definida)" : " (não definida)"}
            </div>
          ))}
        </div>
      )}

      {/* Contas */}
      {accounts && (
        <div className="card">
          <h2>Contas</h2>
          <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
            Existem duas contas no ambiente: a de <b>teste (paper)</b>, ativa, e a
            <b> real (live)</b>, que fica travada por segurança.
          </p>
          {accounts.accounts.map((a) => {
            const active = a.status === "active";
            return (
              <div
                key={a.key}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 12,
                  background: active ? "#f3fbf8" : "#fff8f1",
                }}
              >
                <div className="row">
                  <div>
                    <b>{a.name}</b>{" "}
                    <span className="pill" style={{
                      background: (active ? "#22c55e" : "#cb1010") + "22",
                      color: active ? "var(--green)" : "var(--red)",
                    }}>
                      {active ? "ATIVA" : "TRAVADA"}
                    </span>
                  </div>
                  <span className="muted">corretora: {a.broker}</span>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>{a.description}</p>
                {active && (
                  <div className="muted">
                    Saldo inicial: ${Math.round(a.starting_balance).toLocaleString()} ·
                    pode operar: ✅
                  </div>
                )}
                {a.key === "live" && (
                  <>
                    <div style={{ marginTop: 10 }}>
                      <b>Onde entram as credenciais</b> (somente variáveis de ambiente — nunca no código):
                    </div>
                    {a.credential_slots.map((c) => (
                      <div key={c.env_var} className="muted" style={{ marginTop: 4 }}>
                        {c.present ? "✅" : "⬜"} <code>{c.env_var}</code> — {c.label}
                        {c.present ? " (definida)" : " (não definida)"}
                      </div>
                    ))}
                    {a.readiness && (
                      <div style={{ marginTop: 12 }}>
                        <b>Checklist de prontidão (live)</b>{" "}
                        <span className="pill" style={{ background: "#cb101022", color: "var(--red)" }}>
                          {a.readiness.ready ? "PRONTA" : "NÃO PRONTA"}
                        </span>
                        {a.readiness.checks.map((ck) => (
                          <div key={ck.name} className="muted" style={{ marginTop: 4 }}>
                            {ck.ready ? "✅" : "⛔"} <b>{ck.name}</b> — {ck.detail}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {/* Avaliação em tempo real */}
      <div className="card">
        <h2>Avaliação dos agentes (tempo real)</h2>
        <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
          Limiar de confiança: quanto maior, mais seletivo (menos teses viram
          sinal). Ajuste e rode de novo pra ver o efeito.
        </p>
        <div className="row" style={{ justifyContent: "flex-start", gap: 16 }}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <div className="metric" style={{ minWidth: 90, textAlign: "center" }}>
            <div className="v">{threshold.toFixed(2)}</div>
            <div className="k">limiar</div>
          </div>
          <button onClick={onSaveThreshold}>Aplicar</button>
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

            <h2 style={{ marginTop: 24 }}>Decisões dos agentes (por ativo)</h2>
            <p className="muted" style={{ marginTop: -8, marginBottom: 10 }}>
              Clique num ativo para ver o raciocínio de cada agente, a visão do
              cético e por que foi aprovado ou bloqueado.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Ativo</th><th>Etapa</th><th>Confiança</th>
                  <th>Net</th><th>Risco</th>
                </tr>
              </thead>
              <tbody>
                {result.decisions.map((d) => {
                  const st = STAGE_LABEL[d.stage] ?? { label: d.stage, color: "#94a3b8" };
                  const open = expanded === d.symbol;
                  return (
                    <Fragment key={d.symbol}>
                      <tr
                        onClick={() => setExpanded(open ? null : d.symbol)}
                        style={{ cursor: "pointer" }}
                      >
                        <td><b>{d.symbol}</b> {open ? "▾" : "▸"}</td>
                        <td>
                          <span className="pill" style={{ background: st.color + "22", color: st.color }}>
                            {st.label}
                          </span>
                        </td>
                        <td>{d.confidence.toFixed(2)}</td>
                        <td>{d.net_score?.toFixed(2) ?? "—"}</td>
                        <td>
                          {d.risk
                            ? d.risk.approved
                              ? "✅"
                              : "🚫 " + d.risk.reasons.join(", ")
                            : "—"}
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={5} style={{ background: "var(--panel-2)" }}>
                            <DecisionDetail d={d} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ontologia */}
      {ontology && (
        <div className="card">
          <div className="row">
            <h2 style={{ margin: 0 }}>Camada ontológica</h2>
            <button className="secondary" onClick={() => setShowOntology((v) => !v)}>
              {showOntology ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <p className="muted" style={{ marginTop: 8, marginBottom: showOntology ? 14 : 0 }}>
            Modelo formal do domínio: {ontology.entity_count} entidades e{" "}
            {ontology.relation_count} relações — cada conceito que a mesa usa, seus
            campos, validações e como se conectam.
          </p>

          {showOntology && (
            <>
              {ontology.entities.map((e) => (
                <div key={e.name} style={{
                  border: "1px solid var(--border)", borderRadius: 10,
                  padding: 14, marginBottom: 10,
                }}>
                  <div className="row">
                    <b>{e.name}</b>
                    <span className="pill" style={{ background: "#009fd922", color: "var(--blue)" }}>
                      {e.layer}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: "6px 0 8px" }}>{e.description}</p>
                  <table>
                    <thead>
                      <tr><th>Campo</th><th>Tipo</th><th>Validação</th></tr>
                    </thead>
                    <tbody>
                      {e.fields.map((f) => (
                        <tr key={f.name}>
                          <td><b>{f.name}</b></td>
                          <td className="muted">{f.type}</td>
                          <td className="muted">{f.validation || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <h2 style={{ marginTop: 18 }}>Relações</h2>
              <table>
                <thead>
                  <tr><th>De</th><th>Relação</th><th>Para</th><th>Descrição</th></tr>
                </thead>
                <tbody>
                  {ontology.relations.map((r, i) => (
                    <tr key={i}>
                      <td><b>{r.src}</b></td>
                      <td className="muted">{r.kind}</td>
                      <td><b>{r.dst}</b></td>
                      <td className="muted">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
