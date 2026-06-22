"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminState,
  CycleResult,
  DataSource,
  Decision,
  getDataSource,
  getState,
  getToken,
  runCycle,
} from "@/lib/api";
import "./control.css";

// Outcome palette — the spectacle is the verdict, not the P&L.
const STAGE = {
  paper_filled: { c: "#3fb950", label: "ordem em papel" },
  risk_blocked: { c: "#f85149", label: "bloqueado · risco" },
  backtest_blocked: { c: "#e3b341", label: "bloqueado · backtest" },
  memo_rejected: { c: "#6e7681", label: "tese fraca" },
  signal_created: { c: "#2bd4ff", label: "sinal" },
} as const;

function stageOf(s: string) {
  return (STAGE as Record<string, { c: string; label: string }>)[s] ?? { c: "#6e7681", label: s };
}
function stanceColor(s: string) {
  return s === "bullish" ? "#3fb950" : s === "bearish" ? "#f85149" : "#6e7681";
}

// ---- Conviction Lattice (SVG scatter: net_score x confidence) -------------
function ConvictionLattice({
  decisions, selected, onSelect,
}: { decisions: Decision[]; selected: string | null; onSelect: (s: string) => void }) {
  const W = 640, H = 380, PAD = 44;
  const pts = decisions.filter((d) => d.net_score !== null);
  const xs = pts.map((d) => d.net_score as number);
  const minX = Math.min(-0.2, ...xs), maxX = Math.max(0.2, ...xs);
  const sx = (v: number) => PAD + ((v - minX) / (maxX - minX || 1)) * (W - PAD * 2);
  const sy = (v: number) => H - PAD - v * (H - PAD * 2); // confidence 0..1

  const gridX = [0.25, 0.5, 0.75];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cr-svg" role="img" aria-label="Treliça de convicção">
        {/* grid */}
        {gridX.map((g) => (
          <line key={g} x1={PAD} x2={W - PAD} y1={sy(g)} y2={sy(g)} stroke="#16202f" />
        ))}
        <line x1={sx(0)} x2={sx(0)} y1={PAD} y2={H - PAD} stroke="#26344a" strokeDasharray="4 4" />
        <line x1={PAD} x2={W - PAD} y1={sy(0.15)} y2={sy(0.15)} stroke="#26344a" strokeDasharray="4 4" />
        {/* axes labels */}
        <text x={W - PAD} y={H - 16} fill="#8593a6" fontSize="11" textAnchor="end">net score → convicção de alta</text>
        <text x={PAD} y={H - 16} fill="#8593a6" fontSize="11">← baixa</text>
        <text x={14} y={PAD + 4} fill="#8593a6" fontSize="11">conf. alta</text>
        <text x={14} y={H - PAD} fill="#8593a6" fontSize="11">baixa</text>
        <text x={sx(0.15) + 6} y={PAD + 2} fill="#5e6b7e" fontSize="10">limiar p/ virar sinal</text>
        {/* points */}
        {pts.map((d) => {
          const st = stageOf(d.stage);
          const r = 6 + Math.min(8, (d.signal?.max_position_pct ?? 0) * 2.5);
          const on = selected === d.symbol;
          return (
            <g key={d.symbol} style={{ cursor: "pointer" }} onClick={() => onSelect(d.symbol)}>
              {on && <circle cx={sx(d.net_score as number)} cy={sy(d.confidence)} r={r + 6} fill="none" stroke={st.c} strokeWidth={1.5} opacity={0.7} />}
              <circle cx={sx(d.net_score as number)} cy={sy(d.confidence)} r={r}
                fill={st.c} fillOpacity={on ? 0.95 : 0.55} stroke={st.c} strokeWidth={1}>
                <title>{d.symbol} · {st.label} · conf {d.confidence.toFixed(2)} · net {(d.net_score as number).toFixed(2)}</title>
              </circle>
              <text x={sx(d.net_score as number)} y={sy(d.confidence) - r - 4} fill="#c9d4e0" fontSize="10" textAnchor="middle" className="cr-mono">{d.symbol}</text>
            </g>
          );
        })}
      </svg>
      <div className="cr-legend">
        {Object.entries(STAGE).map(([k, v]) => (
          <span key={k}><i style={{ background: v.c }} />{v.label}</span>
        ))}
      </div>
    </div>
  );
}

// ---- Decision Funnel ------------------------------------------------------
function DecisionFunnel({ decisions }: { decisions: Decision[] }) {
  const total = decisions.length;
  const steps = [
    { label: "Universo", n: total },
    { label: "Memo completo", n: decisions.filter((d) => d.memo_status === "complete").length },
    { label: "Sinal gerado", n: decisions.filter((d) => d.signal).length },
    { label: "Backtest ok", n: decisions.filter((d) => d.backtest?.passed).length },
    { label: "Risco aprovado", n: decisions.filter((d) => d.risk?.approved).length },
    { label: "Ordem (papel)", n: decisions.filter((d) => d.stage === "paper_filled").length },
  ];
  return (
    <div className="cr-funnel">
      {steps.map((s, i) => {
        const prev = i === 0 ? s.n : steps[i - 1].n;
        const drop = prev - s.n;
        return (
          <div className="cr-frow" key={s.label}>
            <div className="cr-flabel">{s.label}</div>
            <div className="cr-fbar-bg">
              <div className="cr-fbar" style={{ width: `${total ? (s.n / total) * 100 : 0}%` }} />
            </div>
            <div>
              <div className="cr-fcount cr-mono">{s.n}</div>
              {i > 0 && drop > 0 && <div className="cr-fdrop">−{drop}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Agent Influence (selected symbol) ------------------------------------
function AgentInfluence({ d }: { d: Decision | null }) {
  if (!d) return <div className="cr-empty">Selecione um ativo na treliça.</div>;
  if (d.agents.length === 0)
    return <div className="cr-empty"><b className="cr-mono">{d.symbol}</b> não chegou a rodar os analistas (tese fraca / dados insuficientes).</div>;
  const tilt = d.agents.reduce((a, x) => a + (x.stance === "bullish" ? x.confidence : x.stance === "bearish" ? -x.confidence : 0), 0);
  return (
    <div>
      <div className="cr-h" style={{ marginBottom: 10 }}>
        <h3 className="cr-mono">{d.symbol}</h3>
        <span className="hint" style={{ color: tilt >= 0 ? "#3fb950" : "#f85149" }}>
          tendência {tilt >= 0 ? "alta" : "baixa"} {tilt.toFixed(2)}
        </span>
      </div>
      {d.agents.map((a) => (
        <div className="cr-agent" key={a.agent}>
          <div className="top">
            <span className="name">{a.agent}</span>
            <span className="conf" style={{ color: stanceColor(a.stance) }}>
              {a.stance === "bullish" ? "alta" : a.stance === "bearish" ? "baixa" : "neutro"} · {a.confidence.toFixed(2)}
            </span>
          </div>
          <div className="cr-abar-bg">
            <div className="cr-abar" style={{ width: `${a.confidence * 100}%`, background: stanceColor(a.stance) }} />
          </div>
          <div className="why">{a.rationale}</div>
        </div>
      ))}
      <div className="why" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1d2738" }}>
        <b style={{ color: "#e3b341" }}>Cético:</b> <span style={{ color: "#8593a6" }}>{d.skeptic_view}</span>
      </div>
      {d.risk && (
        <div className="why" style={{ marginTop: 8 }}>
          <b style={{ color: d.risk.approved ? "#3fb950" : "#f85149" }}>
            Risco: {d.risk.approved ? "aprovado" : "bloqueado"}
          </b>
          {!d.risk.approved && <span style={{ color: "#8593a6" }}> — {d.risk.reasons.join(", ")}</span>}
        </div>
      )}
    </div>
  );
}

// ---- Risk/Reward (predictions for approved/filled) ------------------------
function RiskReward({ decisions }: { decisions: Decision[] }) {
  const rows = decisions.filter((d) => d.signal && (d.risk?.approved || d.stage === "paper_filled"));
  if (rows.length === 0) return <div className="cr-empty">Nenhum sinal aprovado neste ciclo.</div>;
  return (
    <div>
      {rows.map((d) => {
        const s = d.signal!;
        const span = s.target - s.stop || 1;
        const entryPct = ((s.entry - s.stop) / span) * 100;
        return (
          <div className="cr-rr" key={d.symbol}>
            <div className="top">
              <span className="sym cr-mono">{d.symbol}</span>
              <span style={{ color: "#8593a6" }}>R:R {s.reward_risk?.toFixed(1) ?? "—"}</span>
            </div>
            <div className="cr-rrbar">
              <div className="cr-rr-stop" style={{ width: `${entryPct}%` }} />
              <div className="cr-rr-tp" style={{ width: `${100 - entryPct}%` }} />
              <div className="cr-rr-entry" style={{ left: `${entryPct}%` }} />
            </div>
            <div className="top" style={{ marginTop: 4, fontSize: 11 }}>
              <span style={{ color: "#f85149" }} className="cr-mono">stop {s.stop.toFixed(2)}</span>
              <span style={{ color: "#2bd4ff" }} className="cr-mono">entrada {s.entry.toFixed(2)}</span>
              <span style={{ color: "#3fb950" }} className="cr-mono">alvo {s.target.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ControlRoom() {
  const router = useRouter();
  const [state, setState] = useState<AdminState | null>(null);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [result, setResult] = useState<CycleResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/"); return; }
    (async () => {
      try {
        const [s, ds] = await Promise.all([getState(), getDataSource()]);
        setState(s); setDataSource(ds);
        await run();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Erro";
        setError(m);
        if (m.includes("Sessão")) router.push("/");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    setRunning(true); setError("");
    try {
      const r = await runCycle(42, 180);
      setResult(r);
      const first = r.decisions.find((d) => d.stage === "paper_filled")
        ?? r.decisions.find((d) => d.agents.length > 0)
        ?? r.decisions[0];
      setSelected(first?.symbol ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  const selectedDecision = useMemo(
    () => result?.decisions.find((d) => d.symbol === selected) ?? null,
    [result, selected]
  );

  const pnl = result ? result.portfolio.equity - 100000 : 0;
  const dsStatus = dataSource?.status ?? "mock";

  return (
    <div className="control-room">
      <div className="cr-wrap">
        {/* Top bar */}
        <div className="cr-top">
          <div className="cr-brand">
            <div className="cr-logo">M</div>
            <div>
              <div className="cr-title">Mesa Proprietária · Sala de Controle</div>
              <div className="cr-sub">a IA propõe · o motor de risco decide · o herói aqui é o raciocínio, não o lucro</div>
            </div>
          </div>
          <div className="cr-badges">
            <span className="cr-badge paper"><i className="dot" />PAPER · SIMULAÇÃO</span>
            <span className="cr-badge safe"><i className="dot" />LIVE OFF</span>
            <span className={`cr-badge ${dsStatus === "live" ? "live" : dsStatus === "blocked" ? "blocked" : "mock"}`}>
              <i className="dot" />
              {dsStatus === "live" ? "DADOS REAIS" : dsStatus === "blocked" ? "DADOS TRAVADOS" : "DADOS MOCK"}
            </span>
            <button className="cr-btn" onClick={run} disabled={running}>
              {running ? "Processando…" : "↻ Rodar ciclo"}
            </button>
            <button className="cr-btn ghost" onClick={() => router.push("/dashboard")}>Admin</button>
          </div>
        </div>

        {error && <div className="cr-badge blocked" style={{ marginBottom: 14 }}>{error}</div>}

        {/* Hero */}
        <div className="cr-hero">
          <div className="cr-stat">
            <div className="k">Patrimônio (paper)</div>
            <div className="v cr-mono">${result ? Math.round(result.portfolio.equity).toLocaleString() : "—"}</div>
            <div className={`s cr-mono ${pnl >= 0 ? "cr-pos" : "cr-neg"}`}>
              {result ? `${pnl >= 0 ? "+" : ""}${Math.round(pnl).toLocaleString()} vs 100k` : ""}
            </div>
          </div>
          <div className="cr-stat">
            <div className="k">Posições abertas</div>
            <div className="v cr-mono">{result?.portfolio.open_positions ?? "—"}</div>
            <div className="s">de no máx. {state?.risk_policy.max_open_positions ?? "—"}</div>
          </div>
          <div className="cr-stat">
            <div className="k">Exposição</div>
            <div className="v cr-mono">{result ? result.portfolio.gross_exposure_pct.toFixed(1) + "%" : "—"}</div>
            <div className="s">teto {state?.risk_policy.max_total_exposure_pct ?? "—"}%</div>
          </div>
          <div className="cr-stat">
            <div className="k">Aprovados / universo</div>
            <div className="v cr-mono">
              {result ? `${result.decisions.filter((d) => d.risk?.approved).length}/${result.decisions.length}` : "—"}
            </div>
            <div className="s">taxa de aprovação do risco</div>
          </div>
          <div className="cr-stat">
            <div className="k">Limiar de convicção</div>
            <div className="v cr-mono">{state?.confidence_threshold.toFixed(2) ?? "—"}</div>
            <div className="s">ajustável no Admin</div>
          </div>
        </div>

        {!result ? (
          <div className="cr-loading">{running ? "Rodando o pipeline em todos os ativos…" : "Sem dados ainda."}</div>
        ) : (
          <>
            <div className="cr-grid">
              {/* Lattice */}
              <div className="cr-panel">
                <div className="cr-h">
                  <h3>Treliça de convicção</h3>
                  <span className="hint">net score × confiança · clique num ativo</span>
                </div>
                <ConvictionLattice decisions={result.decisions} selected={selected} onSelect={setSelected} />
              </div>

              {/* Agent influence */}
              <div className="cr-panel">
                <div className="cr-h">
                  <h3>Influência dos agentes</h3>
                  <span className="hint">postura × confiança</span>
                </div>
                <div className="cr-chips">
                  {result.decisions.filter((d) => d.agents.length > 0).slice(0, 12).map((d) => (
                    <span key={d.symbol}
                      className={`cr-chip cr-mono ${selected === d.symbol ? "active" : ""}`}
                      onClick={() => setSelected(d.symbol)}>{d.symbol}</span>
                  ))}
                </div>
                <AgentInfluence d={selectedDecision} />
              </div>

              {/* Funnel */}
              <div className="cr-panel">
                <div className="cr-h">
                  <h3>Funil de decisão</h3>
                  <span className="hint">onde cada portão barrou</span>
                </div>
                <DecisionFunnel decisions={result.decisions} />
              </div>

              {/* Risk/Reward */}
              <div className="cr-panel">
                <div className="cr-h">
                  <h3>Risco / retorno dos aprovados</h3>
                  <span className="hint">stop · entrada · alvo</span>
                </div>
                <RiskReward decisions={result.decisions} />
              </div>
            </div>

            <div className="cr-foot">
              Tudo nesta tela é <b>paper trading</b> sobre {result.decisions.length} ativos — sem dinheiro real, sem ordens ao vivo.
              {dsStatus === "mock" && " Dados de mercado: feed sintético (mock)."}
              {dsStatus === "live" && ` Dados de mercado: reais via ${dataSource?.provider}.`}
              {dsStatus === "blocked" && " Dados de mercado: provedor real selecionado mas sem credenciais — feed travado (fail-closed)."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
