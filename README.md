# envio_documentos

Sistema Next.js para envio em lote de documentos via Autentique, com monitoramento em tempo real e download dos PDFs assinados. Banco de dados PostgreSQL no Supabase.

## Setup em 5 passos

### 1. Criar tabela no Supabase
- app.supabase.com → projeto `envio_documentos` → SQL Editor → cole o arquivo `supabase-schema.sql` → Run

### 2. Pegar a Service Role Key
- Supabase → Settings → API → `service_role` (Secret)
- Cole em `.env.local` no campo `SUPABASE_SERVICE_ROLE_KEY`

### 3. Clonar e rodar localmente
```bash
git clone https://github.com/carlosigorchaves/envio_documentos
cd envio_documentos
npm install
cp .env.example .env.local   # edite e preencha SUPABASE_SERVICE_ROLE_KEY
npm run dev
# Acesse http://localhost:3000
```

### 4. Deploy no Vercel
```bash
# Conecte o repositório GitHub no Vercel e configure as variáveis de ambiente:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# SUPABASE_SERVICE_ROLE_KEY
# AUTENTIQUE_API_TOKEN
# AUTENTIQUE_SANDBOX  (true = testes | false = produção)
```

### 5. Webhook (monitoramento em tempo real)
painel.autentique.com.br → Perfil → API → Webhooks
- URL: `https://SEU-PROJETO.vercel.app/api/webhook`
- Formato: JSON

## Formato do Excel
| nome | email | cpf | cargo |
|---|---|---|---|
| João Silva | joao@empresa.com | 000.000.000-00 | Analista |

Colunas extras são salvas automaticamente em `extras` (JSONB).
