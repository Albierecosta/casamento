# Casamento — SaaS para organizar o grande dia

Aplicação web moderna para casais planejarem tudo do casamento em um só lugar: orçamento, convidados, padrinhos, fornecedores, checklist por fase e cronograma.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Radix UI · Supabase (Auth + Postgres + Storage) · Stripe · Recharts
- **Deploy-ready:** Vercel + Supabase + Stripe
- **Multiusuário:** cada casal tem seus próprios dados, isolados por RLS
- **Monetização automatizada:** plano Grátis com limites + Premium via Stripe

---

## 1. Pré-requisitos

- Node 18+ (recomendado Node 20)
- Conta gratuita em [Supabase](https://supabase.com)
- Conta na [Stripe](https://stripe.com)
- Conta na [Vercel](https://vercel.com) para deploy (opcional)

## 2. Configurar o Supabase

1. Crie um projeto no Supabase
2. **SQL Editor** → rode `supabase/schema.sql` (cria tabelas, RLS, storage)
3. **SQL Editor** → rode `supabase/migrations/002_plans.sql` (adiciona colunas de plano)
4. **Authentication → Providers** → habilite **Email**
5. **Settings → API** → copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **publishable key** (ou *anon*) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nunca expor no frontend

## 3. Configurar a Stripe

1. Crie conta em stripe.com e faça o onboarding (CPF/CNPJ, dados bancários)
2. **Products → + Add product**
   - Name: *Casamento Premium*
   - Price: `R$ 149,00` (one-time, BRL)
   - Copie o **Price ID** (`price_...`) → `STRIPE_PRICE_ID`
3. **Developers → API keys**
   - Copie a **Secret key** (`sk_test_...` em teste / `sk_live_...` em produção) → `STRIPE_SECRET_KEY`
4. **Developers → Webhooks → + Add endpoint**
   - URL: `https://seu-dominio.com/api/webhooks/stripe`
   - Events: selecione `checkout.session.completed`
   - Copie o **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`
5. (Opcional) **Settings → Payment methods** — ative Pix/Boleto pra clientes BR

### Testar webhook localmente

```bash
npm i -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copia o whsec_... temporário → coloca em STRIPE_WEBHOOK_SECRET
```

Teste com cartão `4242 4242 4242 4242`, qualquer data futura, qualquer CVC.

## 4. Rodar localmente

```bash
npm install
cp .env.example .env.local
# preencha .env.local com suas credenciais
npm run dev
```

Acesse http://localhost:3000.

## 5. Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Supabase → Settings → API → service_role
STRIPE_SECRET_KEY=sk_test_...           # Stripe → API keys
STRIPE_WEBHOOK_SECRET=whsec_...         # Stripe → Webhooks
STRIPE_PRICE_ID=price_...               # Stripe → Products
```

## 6. Deploy na Vercel

1. Push do projeto pro GitHub
2. Importe o repo em vercel.com/new
3. Adicione **todas** as env vars (incluindo as da Stripe)
4. Deploy
5. Atualize no Supabase: **Authentication → URL Configuration**
   - Site URL: `https://seu-app.vercel.app`
   - Redirect URL: `https://seu-app.vercel.app/auth/callback`
6. Atualize o webhook da Stripe apontando pra `https://seu-app.vercel.app/api/webhooks/stripe`

## 7. Monetização (Grátis × Premium)

### Limites do plano Grátis

- Até **20 convidados**
- **Sem** export CSV
- **Sem** export PDF do orçamento
- **Sem** upload de contratos

### Premium (R$ 149, pagamento único)

- Convidados ilimitados
- Todos os exports desbloqueados
- Upload de contratos
- Acesso até a data do casamento + 30 dias (mínimo 18 meses)

### Fluxo automatizado

1. Casal clica em **Pagar R$ 149** em `/planos`
2. Redireciona para Stripe Checkout (cartão/Pix/Boleto)
3. Pagamento confirmado → Stripe chama `/api/webhooks/stripe`
4. Webhook verifica assinatura e upa o plano com o service role (bypassa RLS)
5. Casal volta em `/planos/sucesso` com auto-refresh e vê Premium ativo

### Como destivar / estender manualmente

SQL Editor do Supabase:

```sql
-- ativar
update public.weddings set plan='premium',
  plan_expires_at = now() + interval '18 months',
  plan_updated_at = now()
where id = 'wedding-uuid';

-- desativar
update public.weddings set plan='free', plan_expires_at=null where id='wedding-uuid';
```

## 8. Estrutura

```
casamento/
├── middleware.ts
├── supabase/
│   ├── schema.sql
│   ├── migrations/002_plans.sql
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── checkout/route.ts         # Cria sessão Stripe
│   │   │   └── webhooks/stripe/route.ts  # Recebe pagamento e libera
│   │   ├── (auth)/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── convidados/
│   │   │   ├── padrinhos/
│   │   │   ├── orcamento/
│   │   │   ├── checklist/
│   │   │   ├── fornecedores/
│   │   │   ├── planos/
│   │   │   │   ├── page.tsx
│   │   │   │   └── sucesso/              # Pós-checkout com auto-refresh
│   │   │   └── configuracoes/
│   │   └── onboarding/
│   ├── components/ui/                    # shadcn-like
│   └── lib/
│       ├── supabase/{client,server,admin,middleware}.ts
│       ├── stripe.ts
│       ├── plan.ts                       # Limites, isPremium
│       ├── types.ts
│       └── wedding.ts
```

## 9. Scripts

```bash
npm run dev         # desenvolvimento
npm run build       # build de produção
npm run start       # servir build
npm run lint        # lint
npm run typecheck   # tsc --noEmit
```

## 10. Próximos passos sugeridos

- Login social (Google)
- Página pública de RSVP
- Invites por email (Resend / Supabase)
- Importação CSV de convidados
- Multi-seat (noivo + noiva logam na mesma conta)

---

Feito com carinho 💍
