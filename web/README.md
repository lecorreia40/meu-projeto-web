# Mesa Admin — painel web (Next.js)

Painel de administração da **Mesa Proprietária com IA**: login, ligar/desligar
agentes, ajustar limites de risco e rodar ciclos em papel. Fala com o backend
FastAPI.

## Pré-requisitos
- Node.js 18+ e o backend rodando (`uvicorn app.main:app --reload` na raiz do projeto).

## Rodar
```bash
cd web
cp .env.local.example .env.local      # ajuste NEXT_PUBLIC_API_URL se preciso
npm install
npm run dev
```
Abre em **http://localhost:3000**.

## Login
Usuário/senha vêm do backend (`.env` na raiz): `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
Por padrão o usuário é `owner`; **defina uma senha** em `ADMIN_PASSWORD` antes de
expor o painel.

## Segurança
- Operação ao vivo permanece **desligada** — o painel não liga live trading.
- Apenas limites numéricos de risco são editáveis; capacidades perigosas
  (short/alavancagem/opções/cripto) não são alteráveis pelo painel.
