# Casamento — SaaS para organizar o grande dia

Aplicação web moderna para casais planejarem tudo do casamento em um só lugar: orçamento, convidados, padrinhos, fornecedores, checklist por fase e cronograma.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Radix UI · Supabase (Auth + Postgres + Storage) · Recharts
- **Deploy-ready:** Vercel + Supabase
- **Multiusuário:** cada casal tem seus próprios dados, isolados por RLS

---

## 1. Pré-requisitos

- Node 18+ (recomendado Node 20)
- Conta gratuita em [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com) para deploy (opcional)

## 2. Configurar o Supabase

1. Crie um novo projeto no Supabase.
2. Em **SQL Editor**, cole e rode o conteúdo de `supabase/schema.sql`. Isso cria:
   - Tabelas: `weddings`, `guests`, `wedding_party_members`, `vendors`, `budget_items`, `checklist_items`
   - Triggers de `updated_at`
   - Políticas de RLS isolando cada casal
   - Bucket de Storage `contracts` (para anexo de contratos)
3. Em **Authentication → Providers**, habilite **Email** (o único necessário para começar).
4. (Opcional) Em **Authentication → URL Configuration**, adicione as URLs de redirect para produção:
   - `https://seu-dominio.com/auth/callback`
5. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Seed opcional de demonstração

Se quiser popular um casamento de exemplo:

```sql
-- Descubra o ID do usuário
select id from auth.users where email = 'voces@email.com';

-- Substitua o UUID em supabase/seed.sql e rode o script
```

## 3. Rodar localmente

```bash
# 1. Instale dependências
npm install

# 2. Configure variáveis
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 3. Rode em modo dev
npm run dev
```

Acesse http://localhost:3000.

## 4. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Em produção, configure as mesmas variáveis na Vercel (Settings → Environment Variables).

## 5. Deploy na Vercel

```bash
# 1. Faça push do repo no GitHub
# 2. No painel da Vercel: New Project → importe o repo
# 3. Framework preset: Next.js (detectado automaticamente)
# 4. Adicione as variáveis de ambiente
# 5. Deploy!
```

Após o deploy:

- Atualize o **Site URL** no Supabase (Authentication → URL Configuration) para o domínio da Vercel.
- Adicione o domínio em **Redirect URLs**: `https://seu-dominio.com/auth/callback`.

## 6. Estrutura do projeto

```
casamento/
├── middleware.ts               # Sessão Supabase + proteção de rotas
├── supabase/
│   ├── schema.sql              # Tabelas, triggers, RLS, storage
│   └── seed.sql                # Seed opcional para demo
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login e cadastro
│   │   ├── (app)/              # Área logada
│   │   │   ├── dashboard/      # Visão geral
│   │   │   ├── convidados/     # Gestão de convidados
│   │   │   ├── padrinhos/      # Padrinhos e madrinhas
│   │   │   ├── orcamento/      # Orçamento + gráficos
│   │   │   ├── checklist/      # Checklist por fase
│   │   │   ├── fornecedores/   # Fornecedores + contratos
│   │   │   └── configuracoes/  # Dados do casamento
│   │   ├── onboarding/         # Onboarding inicial
│   │   ├── auth/callback/      # Callback OAuth/magic link
│   │   └── page.tsx            # Landing pública
│   ├── components/
│   │   ├── ui/                 # Components tipo shadcn (button, card, dialog...)
│   │   ├── layout/             # Sidebar, mobile nav
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   └── lib/
│       ├── supabase/           # Clients (browser, server, middleware)
│       ├── types.ts            # Tipos compartilhados
│       ├── utils.ts            # Helpers (formatters, countdown)
│       ├── wedding.ts          # Helpers de auth/wedding
│       └── checklist-templates.ts
├── tailwind.config.ts
└── next.config.js
```

## 7. Funcionalidades

- **Autenticação** via e-mail/senha (Supabase Auth)
- **Multi-tenant** com RLS: cada casal só enxerga os próprios dados
- **Dashboard** com contagem regressiva, stats financeiros, próximos vencimentos e próximas tarefas
- **Convidados** com busca, filtros por status/grupo, RSVP inline, VIP, mesas e **export CSV**
- **Padrinhos/Madrinhas** com toggles rápidos de roupa, presente e confirmação
- **Orçamento** com gráficos (barra previsto × realizado e pizza de distribuição), alerta de estouro, **export PDF** via print nativo
- **Checklist** com seed automático por fase (24m, 18m, 12m, 6m, 3m, 1m, 1w) e tarefas personalizadas
- **Fornecedores** com status de negociação, nota, links rápidos e **upload de contrato** no Storage
- **Configurações** para atualizar dados do casamento
- **Modo escuro** (toggle no cabeçalho)
- **Onboarding** guiado na primeira entrada
- **Design responsivo** — sidebar no desktop, drawer no mobile

## 8. Scripts disponíveis

```bash
npm run dev         # Desenvolvimento (http://localhost:3000)
npm run build       # Build de produção
npm run start       # Servir build de produção
npm run lint        # Lint com ESLint
npm run typecheck   # Checagem de tipos (tsc --noEmit)
```

## 9. Próximos passos sugeridos

- Login social (Google) via Supabase Auth
- Página pública de RSVP para convidados
- Envio de convites por e-mail
- App mobile (Expo + Supabase)
- Importação de convidados por CSV
- Integrações com calendários (Google/Apple)

---

Feito com carinho para tornar a organização do casamento mais leve.
