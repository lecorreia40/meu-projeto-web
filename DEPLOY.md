# Deploy — tudo no Render (paper, sem live)

Um único Blueprint sobe **os dois serviços**: a API (Python) e o painel (Next.js).
Uma conta, uma conexão ao GitHub. A ligação entre painel e API e o CORS são
**automáticos** — você só define a sua senha.

> Segurança: operação ao vivo permanece **desligada** (`LIVE_TRADING_ENABLED=false`).
> A senha do admin fica só nas variáveis de ambiente — nunca no código.

## Passo a passo

1. Acesse **https://render.com** → **Sign in with GitHub**.
2. **New +** → **Blueprint**.
3. Conecte o repositório **`lecorreia40/meu-projeto-web`**. Em **Branch**, escolha
   **`claude/fundo-yf0a90`**. O Render lê o `render.yaml` e mostra 2 serviços:
   **mesa-api** e **mesa-panel**.
4. Antes de aplicar, no serviço **mesa-api** defina:
   - **`ADMIN_PASSWORD`** = uma senha sua (é a senha de login do painel).
   - (O resto já vem pronto: `AUTH_SECRET` gerado, CORS automático, live desligado.)
5. **Apply**. Em ~3–5 minutos os dois sobem. Você recebe duas URLs:
   - **API:** `https://mesa-api.onrender.com` → teste abrindo `…/health`.
   - **Painel:** `https://mesa-panel.onrender.com` ← **é aqui que você acessa**.
6. Abra a **URL do painel**, faça login: usuário **`owner`** + a senha do passo 4.

Pronto — ligue/desligue agentes, ajuste limites e rode ciclos em papel, de
qualquer lugar.

> Plano gratuito: os serviços "dormem" sem uso; a 1ª visita depois de ociosos
> leva ~30–60s pra acordar. Normal.

## Variáveis (já configuradas pelo Blueprint)

| Serviço | Variável | Valor |
|---|---|---|
| mesa-api | `LIVE_TRADING_ENABLED` | `false` (fixo) |
| mesa-api | `ADMIN_USERNAME` | `owner` |
| mesa-api | `ADMIN_PASSWORD` | *você define* |
| mesa-api | `AUTH_SECRET` | *gerado pelo Render* |
| mesa-api | `CORS_ORIGIN_REGEX` | `https://.*\.onrender\.com` (automático) |
| mesa-panel | `NEXT_PUBLIC_API_URL` | *ligado automaticamente à mesa-api* |

## Alternativa: Docker (um servidor seu)

```bash
docker build -t mesa-api .
docker run -p 8000:8000 -e ADMIN_PASSWORD=suaSenha mesa-api
# painel: rode web/ apontando NEXT_PUBLIC_API_URL para a API
```
