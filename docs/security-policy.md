# Security Policy — Mesa Proprietária com IA

**Status:** MVP / Authoritative
**Scope:** Single-owner proprietary AI trading desk operating only the owner's own capital.
**Classification:** Internal — Single-Owner Operation
**Last reviewed:** 2026-06-19

> This is a **single-owner** system. There are no external clients, no third-party funds, and minimal PII. The threat model centers on protecting broker credentials, preventing accidental real-money trades, and preserving an intact audit trail.

---

## 1. Secrets Management

| Rule | Detail |
|------|--------|
| No hardcoded keys | API keys, broker credentials, and tokens are **never** written in source code. |
| No secrets in repo | `.env` and credential files are git-ignored. Only `.env.example` (placeholders, no real values) is committed. |
| Environment variables | Secrets are injected via environment variables at runtime. |
| Future vault | Roadmap: migrate to a dedicated secrets manager/vault; the env-var interface stays compatible. |
| Rotation | Credentials can be rotated by changing env config only; no code change required. |

`.env.example` documents required variable **names** only — e.g.:

```
IBKR_ACCOUNT=
IBKR_API_KEY=
LIVE_TRADING_ENABLED=false
DATABASE_URL=
REDIS_URL=
LLM_API_KEY=
```

---

## 2. LIVE_TRADING_ENABLED Safeguard

- Default **false**. Live trading is disabled until a governed Phase-12 enablement (which stays disabled in MVP).
- Checked independently by the risk engine, order validator, and BrokerInterface (defense in depth).
- A stale/inconsistent gate state ⇒ block + alert. The flag cannot be set by any AI agent or LLM output — it is operator configuration only.

---

## 3. Broker Credentials Handling

| Control | Detail |
|---------|--------|
| Storage | Only via env vars / future vault; never in repo, logs, or AI prompts. |
| Scope | Paper account credentials in MVP. Live credentials are not provisioned until readiness checklist is satisfied. |
| Access path | Only the BrokerInterface adapter reads credentials; no other component handles them. |
| Logging | Credentials and tokens are redacted from all logs and error traces. |

---

## 4. Least-Privilege & Access Control

- Each service/component receives only the access it needs (database, broker, LLM provider).
- Database roles are scoped (e.g. append-only writer for audit logs vs read roles for dashboards).
- The Streamlit control room reads operational data; it does not hold broker credentials or trigger raw broker calls.
- Single operator: the owner. No multi-tenant access; no shared accounts.

---

## 5. API Security

| Control | Detail |
|---------|--------|
| Local-first | FastAPI services are intended to run locally / on a trusted host, not exposed publicly in MVP. |
| Authentication | API endpoints require authentication; no anonymous trading/control endpoints. |
| Input validation | Pydantic models validate all inbound payloads; reject on malformed/missing fields. |
| Surface minimization | Only necessary endpoints are exposed; control/kill-switch endpoints are authenticated and audited. |
| Transport | Use TLS where any non-loopback exposure exists. |

---

## 6. Data Protection & PII

- The system holds **minimal PII** (single owner, broker account identifiers). No customer data.
- Sensitive identifiers are kept out of logs and AI prompts.
- Market and trade data are operational, not personal; stored in PostgreSQL/TimescaleDB and Parquet with restricted access.

---

## 7. Dependency & Supply-Chain Hygiene

| Practice | Detail |
|----------|--------|
| Pinned dependencies | Versions pinned for reproducibility. |
| Vulnerability scanning | Periodic dependency audit for known CVEs. |
| Minimal footprint | Prefer few, well-maintained libraries; all external APIs behind interfaces. |
| Containment | Docker Compose isolates services; images built from trusted bases. |
| Review | New dependencies reviewed before adoption. |

---

## 8. Audit Trail Integrity

- Logs are **append-only**; no in-place edits or deletes of trading/AI/risk records.
- Every trading action and every AI decision is recorded (see observability-policy.md) with `timestamp, event_type, entity_id, severity`, and AI records include `model_version` and `prompt_version`.
- Dual sink: JSONL (immutable file stream) + PostgreSQL (queryable). Divergence between sinks is itself an alertable integrity signal.
- Risk decisions are reproducible from stored inputs, supporting after-the-fact verification.

---

## 9. Separation of Paper vs Live

| Control | Detail |
|---------|--------|
| Explicit mode tagging | Every order/log/record carries `mode = paper|live`. |
| Distinct adapters | `PaperTradingAdapter` / `IBKRPaperAdapter` vs the disabled live adapter. |
| Distinct credentials | Live credentials separate from paper and not provisioned in MVP. |
| Gate enforcement | Routing to live requires `LIVE_TRADING_ENABLED=true` plus risk-engine confirmation; otherwise blocked. |

---

## 10. Secure Defaults

- `paper_trading_default=true`, `live_trading_default=false`, `LIVE_TRADING_ENABLED=false`.
- Fail-closed everywhere: missing approval, missing data, broker/risk/LLM failure ⇒ NO TRADE.
- No leverage/short/options/crypto by default.
- Authentication required; secrets external; logging on by default.

---

## 11. Incident Response

| Step | Action |
|------|--------|
| 1. Detect | Alerting surfaces broker/data/risk/LLM failures, reconciliation mismatches, or unauthorized live-routing attempts. |
| 2. Contain | Engage kill switch → NO-TRADE; cancel working orders via BrokerInterface. |
| 3. Preserve | Audit logs are append-only and retained for investigation. |
| 4. Diagnose | Use logs/traces (entity_id correlation) to find root cause. |
| 5. Remediate | Rotate credentials if compromise suspected; fix config/code; re-run reconciliation. |
| 6. Resume | Only after gates verified green and owner approves. |

---

## 12. Threat Model Summary

| Threat | Vector | Mitigation |
|--------|--------|------------|
| Credential leak | Secrets in repo/logs/prompts | `.env.example` only; redaction; git-ignore; future vault. |
| Accidental live trade | Misconfig / code path | Default-false live gate checked in 3 places; mode tagging; readiness checklist. |
| AI executing orders | Agent calls broker directly | AI cannot reach broker; only risk-approved signals reach order layer; BrokerInterface choke point. |
| Tampered order | Altered qty/notional | Order validator tamper check vs approved size; idempotency keys. |
| Duplicate orders | Retry/timeout | Idempotency keys; dedup at validator and BrokerInterface. |
| Audit tampering | Edit/delete records | Append-only logs; dual JSONL+PostgreSQL sinks; divergence alerts. |
| Bad/poisoned data | Stale/corrupt feed | Data-quality gates fail closed → NO TRADE. |
| Dependency compromise | Vulnerable package | Pinning, scanning, minimal footprint, review. |
| Unauthorized API access | Exposed endpoint | Local-first, authentication, input validation, minimal surface. |
| Prompt injection | Malicious content in research inputs | AI output cannot execute; deterministic risk engine and validators are authoritative; confidence/thesis gate. |
