# 🦖 Orgzilla

Sistema de gestão de pessoas, times, cargos e projetos — com hierarquia de times, progressão de carreira, controle de remuneração (LGPD) e auditoria.

> **Estado atual do projeto:** este README descreve **o que o Orgzilla é e como rodá-lo**. Para saber **em que pé o projeto está** (o que funciona, o que está incompleto, débito técnico e roadmap), consulte **[`STATUS.md`](./STATUS.md)** — essa é a fonte de verdade sobre o estado. Para as regras e a arquitetura que orientam o desenvolvimento, veja **[`CLAUDE.md`](./CLAUDE.md)**.

---

## O que é

Aplicação web para organizações com dezenas de times e 100+ pessoas. Permite:

- Cadastro de pessoas, times (hierárquicos), cargos, trilhas de carreira e níveis.
- Alocação de pessoas em projetos.
- Controle de remuneração com acesso restrito por perfil (LGPD).
- Dashboard com métricas e filtragem por hierarquia.
- Auditoria de mudanças.

Perfis de acesso: **admin** (administração de sistema, sem acesso a salários), **gestor** (gere sua hierarquia, vê/edita salários dela) e **visualizador** (leitura, sem salários).

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **Supabase** — PostgreSQL, Auth, Storage
- **Tailwind CSS** + Radix/shadcn · Lucide · Recharts
- **React Hook Form** + Zod
- Deploy na **Vercel**

---

## Pré-requisitos

- Node.js compatível com Next 16
- Conta no Supabase
- Um gerenciador de pacotes — **escolha apenas um** (npm **ou** pnpm). O repo tem lockfiles conflitantes; ver `STATUS.md` §3.4 antes de instalar.

---

## Setup rápido

### 1. Instalar dependências
```bash
npm install        # ou: pnpm install
```

### 2. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha com as credenciais do seu projeto Supabase (Settings → API):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[seu-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
> Ao publicar na Vercel, configure as **mesmas variáveis** no painel do projeto. Esquecer isso é a causa nº 1 de "funciona local, quebra em produção".

### 3. Criar o banco
No **SQL Editor** do Supabase, rode nesta ordem:

1. `db/orgzilla_schema.sql` — cria as tabelas, índices e **RLS** (Row Level Security) por perfil.
2. `db/orgzilla_seed.sql` — popula dados de teste (~140 pessoas, hierarquia, projetos, etc.).

> ⚠️ **Não** use o antigo `CONFIGURAR-SUPABASE.md`: o script dele cria o banco **sem RLS** e expõe dados sensíveis. Ele está substituído pelos scripts acima.

### 4. Criar os usuários de login
Os usuários ficam em `auth.users` (Supabase) e são criados pelo painel, não pelo seed:

1. Authentication → Users → Add user (marque *Auto Confirm*). Copie o UUID.
2. No SQL Editor, vincule na tabela `usuario` (exemplo no fim de `db/orgzilla_seed.sql`).
3. Se usar login com Google, configure o provedor OAuth e o redirect URI do novo projeto.

### 5. Rodar
```bash
npm run dev        # http://localhost:3000
```

---

## Scripts

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run lint     # lint
```

---

## Estrutura do projeto

```
app/
  (auth)/            # login e fluxo de autenticação
  (dashboard)/       # área autenticada (pessoas, times, projetos, etc.)
  actions/           # Server Actions (orquestração)
lib/
  types/             # tipos do banco (fonte: database.ts)
  repositories/      # acesso a dados (CRUD, queries)
  services/          # lógica de negócio, permissões, auditoria
  middleware/        # proteção de rotas / sessão
  errors/            # tratamento de erro centralizado
  ui/                # config de toast e helpers de UI
components/          # componentes de UI (kebab-case)
db/                  # scripts de schema e seed (recriação do banco)
```

---

## Arquitetura

Fluxo em camadas, numa direção:

```
UI → Server Actions → Services → Repositories → Supabase/PostgreSQL
```

- **Services** concentram a lógica de negócio, permissões e auditoria.
- **Repositories** só acessam dados.
- O banco aplica **RLS** como defesa em profundidade (em especial nos dados sensíveis de salário).

As regras completas (incluindo segurança de dados sensíveis e convenções) estão em **[`CLAUDE.md`](./CLAUDE.md)**. Há débito conhecido nessa arquitetura — ver `STATUS.md` §3.3.

---

## Documentação

| Arquivo | Para quê |
|---|---|
| [`STATUS.md`](./STATUS.md) | **Estado atual** do projeto: o que funciona, débito, roadmap. Comece por aqui ao retomar. |
| [`CLAUDE.md`](./CLAUDE.md) | Regras, arquitetura-alvo, segurança e convenções (guia para devs e para o Claude Code). |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Identidade visual, cores, tipografia e padrões de componente. |
| [`PADROES-ERRO.md`](./PADROES-ERRO.md) | Padrão centralizado de tratamento de erros e toasts. |

> Docs marcados como históricos/desatualizados (ex.: `CONFIGURAR-SUPABASE.md`, READMEs de camada) estão listados em `STATUS.md` §0 — não use como referência atual.

---

## Convenções rápidas

- Mensagens de UI em **português (Brasil)**, com a personalidade Orgzilla (🦖, tom amigável).
- Arquivos de componente em **kebab-case**; identificadores de componente em PascalCase.
- Erros via `handleError` + toasts de `lib/ui/toast-config.ts`.
- Sem dados mock em código novo; sem dependências fixadas em `"latest"`.

Detalhes em `CLAUDE.md`.