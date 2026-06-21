# Deploy — Mesa Proprietária com IA (paper, sem live)

Dois serviços gratuitos: **backend (API)** no Render e **painel (frontend)** na
Vercel. Você faz alguns cliques (conectar suas contas é uma barreira de
segurança que só você pode passar); a configuração já está pronta no repositório.

> Segurança: operação ao vivo permanece **desligada** (`LIVE_TRADING_ENABLED=false`).
> O painel não liga live trading. A senha do admin fica só nas variáveis de
> ambiente da hospedagem — nunca no código.

---

## A) Backend (API) no Render

1. Acesse **https://render.com** → **Sign in with GitHub**.
2. **New +** → **Blueprint** → conecte o repositório `lecorreia40/meu-projeto-web`
   (branch `claude/fundo-yf0a90`). O Render lê o `render.yaml` e cria o serviço
   **mesa-api**.
3. Antes de finalizar, em **Environment**, defina:
   - `ADMIN_PASSWORD` = **uma senha sua** (essa é a senha de login do painel).
   - `CORS_ORIGINS` = deixe **vazio** por enquanto (preenchemos no passo C).
   - `AUTH_SECRET` já é gerado automaticamente; `LIVE_TRADING_ENABLED` já vem `false`.
4. **Apply / Deploy**. Em ~2 minutos você recebe uma URL, ex.:
   `https://mesa-api.onrender.com`.
   - Teste abrindo `…/health` (deve responder ok) e `…/docs` (a API).
   - Obs.: no plano gratuito o serviço "dorme" sem uso; a 1ª chamada após ocioso
     leva ~30s pra acordar.

## B) Painel (frontend) na Vercel

1. Acesse **https://vercel.com** → **Sign in with GitHub**.
2. **Add New… → Project** → importe `lecorreia40/meu-projeto-web`
   (branch `claude/fundo-yf0a90`).
3. Em **Root Directory**, selecione **`web`** (o Next.js é detectado sozinho).
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_API_URL` = a URL do backend do passo A (ex.:
     `https://mesa-api.onrender.com`).
5. **Deploy**. Você recebe a URL do painel, ex.: `https://mesa-xxxx.vercel.app`.

## C) Conectar os dois (liberar o painel a chamar a API)

1. Volte ao **Render** → serviço **mesa-api** → **Environment**.
2. Defina `CORS_ORIGINS` = a URL da Vercel do passo B (ex.:
   `https://mesa-xxxx.vercel.app`) → **Save** (redeploy automático).

## Pronto — como acessar

- Abra a **URL da Vercel** no navegador.
- Faça login: usuário **`owner`** + a senha que você pôs em `ADMIN_PASSWORD`.
- Você já pode ligar/desligar agentes, ajustar limites e rodar ciclos em papel.

---

## Variáveis de ambiente (resumo)

| Serviço | Variável | Valor |
|---|---|---|
| Render (API) | `LIVE_TRADING_ENABLED` | `false` (fixo) |
| Render (API) | `ADMIN_USERNAME` | `owner` |
| Render (API) | `ADMIN_PASSWORD` | *sua senha* |
| Render (API) | `AUTH_SECRET` | *gerado pelo Render* |
| Render (API) | `CORS_ORIGINS` | URL da Vercel |
| Vercel (painel) | `NEXT_PUBLIC_API_URL` | URL do Render |

## Alternativa: Docker (um servidor seu)

```bash
docker build -t mesa-api .
docker run -p 8000:8000 -e ADMIN_PASSWORD=suaSenha mesa-api
# API em http://localhost:8000 ; rode o painel em web/ apontando NEXT_PUBLIC_API_URL pra ela
```
