# Orgzilla - Context File for Claude Code

## 🦖 Project Overview

**Orgzilla** is a comprehensive team management system for organizations with dozens of teams and 100+ people. The system manages hierarchical team structures, career progression, salary tracking (LGPD compliant), project allocations, and comprehensive auditing.

**Mascot Theme:** Friendly dinosaur ("kaiju") with orange and blue brand colors.

**Current Status:** UI Phase complete with V0 - Ready for local development and bug fixes

---

## 🎨 Brand Identity

### Colors
- **Primary:** `#FF7A00` (Orange Kaiju) - mascot, CTAs, brand elements
- **Secondary:** `#1A2734` (Night Blue) - backgrounds, text, structure
- **Accent:** `#00C8FF` (Cyan Byte) - icons, hover states, highlights
- **Background:** `#F4F5F7` (Mist Gray) - page backgrounds
- **Error:** `#FF5A5F` (Coral Red) - alerts, validation errors

### Typography
- **Headings:** Outfit or Poppins (geometric sans-serif)
- **Body:** Inter (clean, readable)
- **Style:** Sentence case for titles (avoid ALL CAPS)

### Personality
- Smart, energetic, humorous, trustworthy
- Professional but approachable
- "The friendly corporate kaiju that organizes everything"
- Uses 🦖 emoji in success messages
- Friendly error messages: "Ops! Orgzilla tropeçou..."

---

## 🗃️ Architecture Principles

### ⚠️ CRITICAL: Clean Architecture

**100% of business logic in the application layer (Next.js/TypeScript)**

#### Database (Supabase/PostgreSQL)
- ✅ Only data structure (tables, indexes)
- ✅ Minimal RLS (basic authentication)
- ❌ NO business logic triggers
- ❌ NO complex functions
- ❌ NO views
- ❌ NO stored procedures

#### Application Layer (Next.js/TypeScript)
- ✅ ALL business logic
- ✅ ALL validations
- ✅ ALL permission rules
- ✅ ALL audit logging
- ✅ ALL calculations
- ✅ ALL history management

**Principle:** Database is "dumb" (only stores data). Application is "smart" (controls everything).

---

## 👥 User Types & Permissions

### 1. Administrator (Admin)
**Can:**
- Create/edit/deactivate users
- Create/edit/deactivate: Levels, Career Tracks, Positions
- Create/edit/deactivate ALL teams and people
- Move people between teams (all)
- Create projects/products and allocate people
- Create tags
- View audit logs (all)
- View annotations (all)

**Cannot:**
- View salary information (LGPD restriction)
- View salary adjustment history

### 2. Manager (Gestor)
**Can:**
- View entire hierarchy under their responsibility
- Create/edit teams within their hierarchy
- Create/edit people within their hierarchy
- Move people between teams (within hierarchy only)
- Create projects/products
- Allocate people (from hierarchy) to projects
- Create tags
- Create positions for their hierarchy
- Create/edit annotations about people/teams in hierarchy
- View salary information of their hierarchy
- View salary adjustment history of their hierarchy
- View audit logs of their hierarchy
- Export data (hierarchy only)

**Cannot:**
- Access data outside their hierarchy
- Create/edit: Levels, Career Tracks, Positions (system-wide)
- Manage system users

### 3. Viewer (Visualizador)
**Can:**
- View public (non-sensitive) information organization-wide
- View team structure
- View org charts
- Search people and teams
- View projects/products

**Cannot:**
- Edit any information
- View salary information
- Export data
- Create annotations

---

## 🗄️ Database Schema (16 Tables)

### Core Tables

1. **usuario** (User) - System users (login/authentication)
   - id, email, nome, tipo_perfil (admin|gestor|visualizador), ativo, pessoa_id, timestamps

2. **nivel** (Level) - Hierarchy levels L1-L16
   - id, nome (L1, L2, ..., L16), nivel_anterior_id (self-reference), ativo, timestamps
   - Forms sequential chain: L1 → L2 → L3 → ... → L16

3. **trilha_carreira** (CareerTrack) - Career paths
   - id, nome, descricao, ativo, timestamps
   - Examples: Engenharia de Software, Produto, Design, Dados

4. **cargo** (Position) - Job positions
   - id, nome, trilha_id, nivel_id, ativo, timestamps
   - One position = one track + one level

5. **time** (Team) - Teams/departments (hierarchical)
   - id, nome, descricao, time_pai_id (self-reference), gestor_id, ativo, timestamps
   - Recursive hierarchy: team can have parent team and child teams

6. **pessoa** (Person) - People/employees
   - id, nome, nome_social, email_corporativo, email_pessoal, telefone, foto_url
   - cargo_id (NULLABLE), time_id (NULLABLE)
   - salario_atual (NULLABLE, SENSITIVE), data_ultimo_reajuste, motivo_ultimo_reajuste
   - data_entrada (NULLABLE), data_inicio_cargo_atual (NULLABLE), data_desligamento
   - status (ativo|ferias|licenca|afastamento|desligado), ativo, timestamps
   - **Fields are nullable to allow incremental data entry**

7. **projeto_produto** (ProjectProduct) - Projects where people are allocated
   - id, nome, ativo, timestamps
   - **Simple:** Only name and active status (not a project management tool)

8. **pessoa_projeto_produto** (PersonProjectProduct) - N:N relationship
   - id, pessoa_id, projeto_produto_id, data_inicio, data_fim (null = current), ativo, created_at

9. **vaga_time** (TeamVacancy) - Open positions in teams
   - id, time_id, cargo_id, quantidade, ativo, timestamps

10. **tag** - Custom tags for categorization
    - id, nome, cor (hex color), ativo, created_at

11. **pessoa_tag** (PersonTag) - N:N relationship
    - id, pessoa_id, tag_id, created_at

12. **anotacao** (Note) - Notes about people or teams
    - id, tipo_entidade (pessoa|time), entidade_id, conteudo, criado_por_usuario_id, timestamps

### History Tables (managed by application)

13. **historico_mudanca** (ChangeHistory) - Audit log
    - id, tipo_entidade, entidade_id, tipo_mudanca (criacao|edicao|exclusao)
    - campo_alterado, valor_anterior (jsonb), valor_novo (jsonb), usuario_id, created_at

14. **historico_reajuste** (SalaryAdjustmentHistory) - Salary changes
    - id, pessoa_id, salario_anterior, salario_novo, percentual, data_reajuste, motivo, created_at
    - **SENSITIVE DATA - managers only**

15. **historico_time** (TeamHistory) - Team allocations
    - id, pessoa_id, time_id, data_inicio, data_fim (null = current), created_at

16. **historico_cargo** (PositionHistory) - Position history
    - id, pessoa_id, cargo_id, data_inicio, data_fim (null = current), created_at

---

## 🎯 Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **State:** React hooks (useState, useContext)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Hosting:** Vercel

### Development
- **Package Manager:** npm or pnpm
- **Code Quality:** ESLint, Prettier
- **Type Checking:** TypeScript strict mode

---

## 📂 Project Structure

```
orgzilla/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx                    # Login page
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                        # Main layout with sidebar
│   │   ├── page.tsx                          # Dashboard home
│   │   │
│   │   ├── pessoas/
│   │   │   ├── page.tsx                      # People list
│   │   │   ├── novo/page.tsx                 # Create person
│   │   │   └── [id]/page.tsx                 # Person detail
│   │   │
│   │   ├── times/
│   │   │   ├── page.tsx                      # Teams list
│   │   │   ├── novo/page.tsx                 # Create team
│   │   │   └── [id]/page.tsx                 # Team detail
│   │   │
│   │   ├── projetos/
│   │   │   ├── page.tsx                      # Projects list
│   │   │   ├── novo/page.tsx                 # Create project
│   │   │   └── [id]/page.tsx                 # Project detail
│   │   │
│   │   ├── organograma/page.tsx              # Org chart
│   │   ├── relatorios/page.tsx               # Reports
│   │   ├── busca/page.tsx                    # Global search
│   │   └── perfil/page.tsx                   # User profile
│   │
│   ├── configuracoes/
│   │   ├── usuarios/page.tsx                 # User management (admin)
│   │   ├── niveis/page.tsx                   # Levels management (admin)
│   │   ├── trilhas/page.tsx                  # Career tracks (admin)
│   │   ├── cargos/page.tsx                   # Positions (admin)
│   │   └── tags/page.tsx                     # Tags (admin/manager)
│   │
│   ├── not-found.tsx                         # 404 page
│   ├── error.tsx                             # 500 error boundary
│   └── layout.tsx                            # Root layout
│
├── components/
│   ├── shared/                               # Reusable components
│   │   ├── confirm-dialog.tsx
│   │   ├── toast.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-state.tsx
│   │   ├── page-header.tsx
│   │   ├── stats-card.tsx
│   │   ├── avatar-stack.tsx
│   │   ├── status-badge.tsx
│   │   ├── search-input.tsx
│   │   ├── filter-panel.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── user-menu.tsx
│   │   └── breadcrumb.tsx
│   │
│   ├── pessoas/
│   │   ├── pessoa-form.tsx
│   │   ├── pessoa-card.tsx
│   │   └── pessoa-table.tsx
│   │
│   ├── times/
│   │   ├── time-form.tsx
│   │   ├── time-card.tsx
│   │   └── time-tree.tsx
│   │
│   └── projetos/
│       ├── projeto-form.tsx
│       └── projeto-card.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         # Supabase client (when implemented)
│   │   ├── server.ts                         # Server-side client
│   │   └── types.ts                          # Database types
│   │
│   ├── services/                             # Business logic (when implemented)
│   │   ├── pessoa.service.ts
│   │   ├── time.service.ts
│   │   ├── projeto.service.ts
│   │   └── auth.service.ts
│   │
│   ├── types/
│   │   └── index.ts                          # TypeScript types
│   │
│   └── utils/
│       ├── format.ts                         # Date, currency formatters
│       └── validation.ts                     # Validation helpers
│
├── public/
│   ├── logo_fundo_claro.png                  # Logo for light backgrounds
│   └── logo_fundo_escuro.png                 # Logo for dark backgrounds (sidebar)
│
├── .env.local                                # Environment variables (when implemented)
├── claude.md                                 # This file
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎨 Design System (Tailwind Config)

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        primary: '#FF7A00',      // Orange Kaiju
        secondary: '#1A2734',    // Night Blue
        accent: '#00C8FF',       // Cyan Byte
        surface: '#F4F5F7',      // Mist Gray
        error: '#FF5A5F',        // Coral Red
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'Poppins', 'sans-serif'],
      },
    },
  },
}
```

---

## 🔐 LGPD Compliance (Sensitive Data)

### Sensitive Fields (restricted access):
- `pessoa.salario_atual`
- `pessoa.data_ultimo_reajuste`
- `pessoa.motivo_ultimo_reajuste`
- All records in `historico_reajuste`

### Access Rules (enforced by application):
- **Managers:** Can view salary data of their hierarchy
- **Admins:** CANNOT view salary data
- **Viewers:** CANNOT view salary data

### Implementation:
- Application must filter sensitive fields before returning data
- Never expose in APIs for non-authorized users
- Show placeholder or omit fields in UI

---

## 📋 Complete UI Pages List (31 Prompts Created)

### 🎨 Base (3)
1. **Design System** - Tailwind config with brand colors
2. **Layout Base + Sidebar** - Main navigation and structure
3. **Login Page** - Email/password + Google OAuth

### 📊 Dashboard & Visualization (2)
4. **Dashboard** - Metrics, charts, quick actions
8. **Organograma** - Interactive org chart with zoom/pan

### 👥 People Management (3)
5. **Lista de Pessoas** - People list with filters
6. **Formulário de Pessoa** - Create/edit person (tabbed)
15. **Visualização de Pessoa** - Person detail with tabs (info, history, projects, notes)

### 🏢 Team Management (3)
7. **Lista de Times** - Teams list hierarchical/flat view
11. **Formulário de Time** - Create/edit team
12. **Visualização de Time** - Team detail with members and structure

### 📦 Project Management (3) - SIMPLIFIED
9. **Lista de Projetos** - Projects list (name + team allocations only)
13. **Formulário de Projeto** - Create/edit project (name + allocations)
14. **Visualização de Projeto** - Project detail (name + team members)

### 📈 Reports (1)
10. **Relatórios** - Pre-built reports with filters and export

### ⚙️ Configuration Pages (6)
16. **Gestão de Usuários** - User management (admin only)
19. **Gestão de Cargos** - Position management (admin only)
25. **Submenu de Configurações** - Settings navigation
26. **Gestão de Níveis** - Level management (L1-L16, admin only)
27. **Gestão de Trilhas** - Career track management (admin only)
28. **Gestão de Tags** - Tag management (admin/manager)

### 🔧 Utilities (5)
24. **Componentes Compartilhados** - Reusable components (dialogs, toasts, empty states, etc)
29. **Busca Global** - Global search with filters across all entities
30. **Páginas de Erro** - 404, 500, 403 error pages
31. **Perfil do Usuário** - User profile (simplified: name + email only)

---

## 🚫 Common Mistakes to Avoid

### 1. Business Logic in Database
❌ **NEVER create triggers, functions, or views with business logic**
✅ **ALL logic in application layer (services)**

### 2. Direct Database Access
❌ **Don't query database directly in components**
✅ **Use services layer**

### 3. Hardcoded User IDs
❌ **Don't hardcode UUIDs**
✅ **Get current user from auth context**

### 4. Ignoring Permissions
❌ **Don't assume user can access data**
✅ **Always check permissions before queries**

### 5. Exposing Sensitive Data
❌ **Don't return salary fields to unauthorized users**
✅ **Filter sensitive fields based on user role**

### 6. Breaking Hierarchy
❌ **Don't let managers access outside their hierarchy**
✅ **Always filter by hierarchy recursively**

---

## 📝 Naming Conventions

### Files
- **Components:** PascalCase (`PessoaForm.tsx`, `TimeCard.tsx`)
- **Pages:** kebab-case (`page.tsx`, `[id]/page.tsx`)
- **Utils/Services:** camelCase (`format.ts`, `pessoa.service.ts`)

### Variables
- **Components:** PascalCase (`const PessoaForm = () => {}`)
- **Functions:** camelCase (`function fetchPessoas() {}`)
- **Constants:** UPPER_SNAKE_CASE (`const MAX_FILE_SIZE = 2048`)
- **Types/Interfaces:** PascalCase (`interface User {}`)

### Database
- **Tables:** snake_case (`pessoa`, `time`, `trilha_carreira`)
- **Columns:** snake_case (`nome_social`, `data_entrada`)
- **Foreign Keys:** snake_case with suffix (`cargo_id`, `time_pai_id`)

---

## 🐛 Known Issues (UI Phase - V0)

### Critical Modal Problems
1. **Modals not closing on outside click**
   - Backdrop click handler not working properly
   - Need to add proper onInteractOutside handler
   
2. **Modals not closing on ESC key**
   - ESC key listener missing or not working
   - Need to implement proper escape key detection

3. **Form validation not triggering in modals**
   - React Hook Form validation not working inside modals
   - Forms submitting without validation

4. **Modal state not resetting on close**
   - Form data persisting after modal closes
   - Need to reset form state on modal close

5. **Multiple modals issues**
   - Modal inside modal not working properly
   - Z-index conflicts

6. **Focus management**
   - Focus not returning to trigger element after modal closes
   - Tab navigation issues inside modals

7. **Body scroll not blocked**
   - Background scrolls when modal is open
   - Need to prevent body scroll on modal open

### Responsive Issues
- **Sidebar not collapsing properly on mobile**
  - Hamburger menu not working consistently
  - Sidebar overlay not covering full screen

- **Tables not responsive**
  - Some tables overflow on small screens
  - Need card view for mobile (< 768px)

- **Breadcrumbs cut off on small screens**
  - Need to truncate or make scrollable

### Component Inconsistencies
- **Button sizes inconsistent**
  - Some pages use different button sizes
  - Need to standardize (sm, md, lg)

- **Loading states missing**
  - Some lists don't show loading skeleton
  - Some forms don't show loading on submit

- **Empty states not showing**
  - Some lists show blank page when empty
  - Need to add EmptyState component

- **Link navigation incomplete**
  - Some links between related pages don't work
  - Breadcrumb links not all functional

### Form Issues
- **Validation messages inconsistent**
  - Different error message styles across forms
  - Need to standardize validation feedback

- **Date picker formats**
  - Some date pickers use different formats
  - Need to standardize (dd/MM/yyyy)

- **Required field indicators**
  - Some forms don't show asterisk on required fields
  - Need to add visual indicator

---

## 🎯 Development Phase Status

### ✅ Phase 1: UI with Mock Data (COMPLETE)
- [x] All 31 pages created in V0
- [x] All components designed
- [x] Mock data structure defined
- [x] Brand guidelines applied
- [x] Responsive layouts (desktop/tablet/mobile)
- [ ] **CURRENT:** Clone locally and fix UI issues
- [ ] **NEXT:** Test all interactions and flows

### ⏳ Phase 2: Backend Integration (NOT STARTED)
- [ ] Setup Supabase project
- [ ] Configure authentication (email/password + Google)
- [ ] Create database tables (run SQL scripts)
- [ ] Setup RLS policies
- [ ] Create API routes
- [ ] Implement services layer
  - [ ] pessoa.service.ts
  - [ ] time.service.ts
  - [ ] projeto.service.ts
  - [ ] auth.service.ts
  - [ ] audit.service.ts
- [ ] Replace mock data with real queries
- [ ] Implement business logic
  - [ ] Validations
  - [ ] Permission checks
  - [ ] Hierarchy calculations
  - [ ] History management
  - [ ] Audit logging
- [ ] Add permission middleware
- [ ] Test with real data

### ⏳ Phase 3: Advanced Features (NOT STARTED)
- [ ] Advanced search implementation
- [ ] Comprehensive reporting
- [ ] Data export (CSV, JSON)
- [ ] Audit log viewer
- [ ] Email notifications
- [ ] File upload (avatars, documents)
- [ ] Real-time updates (optional)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Production deployment

---

## 💬 Working with Claude Code

### When Fixing Modal Issues

**BE SPECIFIC:**
```
❌ "Fix the modal"
✅ "The modal in components/pessoas/pessoa-form.tsx doesn't close 
    when clicking outside. Add proper backdrop click handler 
    (onInteractOutside) and ESC key listener (onEscapeKeyDown). 
    Also make sure the form resets when modal closes."
```

### When Adding Features

**PROVIDE CONTEXT:**
```
✅ "Add a loading skeleton to the people list page 
    (app/pessoas/page.tsx) using the LoadingState component 
    from components/shared. Show 10 skeleton rows while data 
    loads. The skeleton should match the table structure 
    (avatar + name + position + team + actions)."
```

### When Refactoring

**EXPLAIN WHY:**
```
✅ "Extract the repeated person card component from 
    pessoas/page.tsx and times/[id]/page.tsx into a shared 
    component at components/shared/person-card.tsx. Both pages 
    render the same structure: avatar (48px), name (bold), 
    position badge, team (gray text), and action button. 
    The component should accept person data and optional 
    onAction callback."
```

### Example Commands for Common Tasks

```typescript
// Fix modal closing
"Claude, fix all modals to close properly on outside click and ESC key"

// Standardize buttons
"Claude, standardize all button sizes across the app. Use 'default' 
for primary actions, 'sm' for secondary, and 'lg' only for hero CTAs"

// Add loading states
"Claude, add LoadingState component to all list pages that don't have it yet"

// Fix responsive tables
"Claude, make all data tables responsive. On mobile (< 768px), 
switch to card view instead of table"

// Add empty states
"Claude, add EmptyState component to all list pages when data is empty. 
Use appropriate icon and message for each page type"

// Fix form validation
"Claude, ensure all forms show validation errors inline and prevent 
submission if invalid"
```

---

## 📚 Key Documents Reference

All project documentation is in `/mnt/project/`:
- `especificacao-sistema-gestao-times-v2.md` - Complete technical specification
- `orgzilla_brand_manual_v2.md` - Brand manual and design guidelines
- `claude.md` - This file (project context for Claude Code)

All 31 UI prompts created are documented in the recent conversation history of this project.

---

## 🦖 Project Personality

Remember: Orgzilla is friendly and approachable, not corporate and stiff.

**Use:**
- "🦖" emoji in success messages
- Friendly error messages: "Ops! Orgzilla tropeçou..."
- Helpful empty states: "Nenhuma pessoa encontrada. Adicione a primeira!"
- Clear, simple language

**Avoid:**
- Technical jargon in user messages
- Intimidating error codes without explanation
- ALL CAPS (except for emphasis in warnings)
- Cold, robotic tone

---

## ⚡ Quick Reference

### Color Variables (use in Tailwind)
```css
bg-primary     /* #FF7A00 - Orange Kaiju */
bg-secondary   /* #1A2734 - Night Blue */
bg-accent      /* #00C8FF - Cyan Byte */
bg-surface     /* #F4F5F7 - Mist Gray */
bg-error       /* #FF5A5F - Coral Red */
```

### Common Patterns
```typescript
// Success toast
toast.success("🦖 Pessoa salva com sucesso!")

// Error toast
toast.error("Ops! Erro ao salvar pessoa. Tente novamente.")

// Status badge
<StatusBadge status="ativo" /> // green
<StatusBadge status="ferias" /> // blue
<StatusBadge status="desligado" /> // red

// Empty state
<EmptyState 
  icon={Users}
  title="Nenhuma pessoa encontrada"
  description="Adicione a primeira pessoa ao sistema"
  action={{ label: "Adicionar Pessoa", href: "/pessoas/novo" }}
/>

// Loading state
<LoadingState count={10} />
```

### File Paths
- Logos: `/logo_fundo_escuro.png` (sidebar), `/logo_fundo_claro.png` (light bg)
- Shared components: `@/components/shared`
- Types: `@/lib/types`
- Utils: `@/lib/utils`

---

## 🚀 Next Steps (Priority Order)

### Immediate (Phase 1 - UI Fixes)
1. **Clone project locally** from V0
2. **Fix modal issues** (closing, validation, state reset)
3. **Fix responsive issues** (sidebar, tables, breadcrumbs)
4. **Standardize components** (buttons, forms, validation)
5. **Add missing states** (loading, empty, error)
6. **Test all user flows** (create, edit, delete, navigation)

### Short Term (Phase 2 - Backend)
1. Setup Supabase project
2. Run database migration scripts
3. Configure authentication
4. Create API routes
5. Implement services layer
6. Replace mock data

### Medium Term (Phase 3 - Features)
1. Advanced search
2. Reporting
3. Data export
4. Notifications
5. Performance optimization
6. Production deployment

---

**Last Updated:** November 16, 2025  
**Version:** 2.0  
**Status:** UI Phase Complete - Ready for Local Development & Bug Fixes

---

## 📞 Getting Help

When working with Claude Code, always:
1. **Provide file path** for context
2. **Describe expected behavior** clearly
3. **Show current behavior** (what's wrong)
4. **Reference brand guidelines** when relevant
5. **Mention related components** if applicable

Claude Code has access to this entire document and will use it to maintain consistency across the codebase.

Good luck! 🦖🚀