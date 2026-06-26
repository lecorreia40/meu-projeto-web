"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h1>Mesa Proprietária com IA</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Painel de administração · paper trading (sem operação real)
      </p>
      <form className="card" onSubmit={onSubmit}>
        <h2>Entrar</h2>
        <div style={{ marginBottom: 14 }}>
          <label>Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="defina ADMIN_PASSWORD no .env"
          />
        </div>
        {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
