# Deploy do VisaOps

Caminho recomendado: banco PostgreSQL gerenciado (Supabase ou Neon) + app na Vercel.
Tempo total: cerca de 10 minutos.

## 1. Banco de dados (Supabase)

1. Acesse https://supabase.com/dashboard e crie um projeto (plano Free serve para comecar).
   Regiao sugerida: `us-east-1` (mesma regiao padrao da Vercel) ou `sa-east-1` (Brasil).
2. Anote a senha do banco definida na criacao.
3. Em Project Settings > Database > Connection string, copie as duas URLs:
   - Transaction pooler (porta 6543): sera o `DATABASE_URL` do app.
     Adicione `?pgbouncer=true&connection_limit=1` ao final.
   - Direct connection (porta 5432): use apenas para rodar as migracoes.

Aplique o schema e o seed a partir da sua maquina:

```bash
git clone https://github.com/lecorreia40/meu-projeto-web.git
cd meu-projeto-web
git checkout claude/visa-lifecycle-saas-platform-8pkjb7
npm install

# URL direta (porta 5432) apenas para migrar e seedar
export DATABASE_URL="postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres"
npx prisma migrate deploy
npm run db:seed
```

Alternativa sem terminal: cole o conteudo de `prisma/migrations/0001_init/migration.sql`
no SQL Editor do Supabase e execute; depois rode apenas o seed via
`npm run db:seed` localmente (o seed usa bcrypt, entao precisa do Node).

## 2. App (Vercel)

1. Acesse https://vercel.com/new e importe o repositorio `lecorreia40/meu-projeto-web`.
2. Em "Git Branch", selecione `claude/visa-lifecycle-saas-platform-8pkjb7`
   (ou faca merge para `main` antes e use `main`).
3. Framework: Next.js (detectado automaticamente). Build padrao. O `postinstall`
   ja roda `prisma generate`.
4. Environment Variables:

| Nome | Valor |
| --- | --- |
| `DATABASE_URL` | URL do Transaction pooler (porta 6543) com `?pgbouncer=true&connection_limit=1` |
| `AUTH_SECRET` | gere com `openssl rand -base64 32` |

5. Deploy. A URL publica aparece ao final (ex.: `visaops.vercel.app`).

## 3. Verificacao

- Abra `/login` e entre com `attorney@martinezlaw.dev` / `demo1234`.
- Confira o caso demo `MIL-2026-0001` em Cases.
- Teste o wizard publico em `/intake`.

## Limitacoes conhecidas em serverless

- Upload de documentos usa driver de disco local (`STORAGE_DIR`). Na Vercel o
  filesystem e efemero: uploads funcionam na demo, mas nao persistem entre
  deploys/instancias. Para producao real, trocar `src/lib/storage.ts` por um
  driver S3/Cloudflare R2 (a interface ja esta isolada para isso).
- Antes de uso real: trocar as senhas demo, definir `AUTH_SECRET` forte e
  revisar a politica de retencao por tenant.

## Producao em VPS/container (alternativa)

O projeto tambem roda como servidor Node convencional (sem limitacao de storage):

```bash
npm install && npm run build
DATABASE_URL=... AUTH_SECRET=... STORAGE_DIR=/var/visaops/storage npm start
```

Use o `docker-compose.yml` como base para o Postgres ou aponte para um gerenciado.
