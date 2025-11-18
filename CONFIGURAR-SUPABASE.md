# 🔧 Como Configurar o Supabase - Orgzilla

## ⚠️ Problema Atual

O login não está funcionando porque as variáveis de ambiente do Supabase **não estão configuradas corretamente**.

O arquivo `.env.local` contém placeholders, não credenciais reais:
```
NEXT_PUBLIC_SUPABASE_URL=https://tjkiwuhctveyyxcemtqu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_8yBi4MztiP8SUELrBWsWKQ_arSgdaY9
```

Essas **NÃO são chaves reais** do Supabase!

---

## 🚀 Passo a Passo para Configurar

### 1. Criar Conta no Supabase

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub ou Google
4. ✅ Conta criada

### 2. Criar Novo Projeto

1. No dashboard, clique em **"New Project"**
2. Preencha:
   - **Name:** `orgzilla` (ou o nome que preferir)
   - **Database Password:** Crie uma senha forte (guarde-a!)
   - **Region:** Escolha o mais próximo (ex: South America - São Paulo)
3. Clique em **"Create new project"**
4. ⏳ Aguarde 2-3 minutos (Supabase está criando o banco)

### 3. Obter as Credenciais

Quando o projeto estiver pronto:

1. No dashboard do projeto, clique em **"Settings"** (ícone de engrenagem no menu lateral)
2. Clique em **"API"** no submenu
3. Você verá duas informações importantes:

#### **Project URL**
```
https://[seu-project-id].supabase.co
```
Exemplo real: `https://xyzabcdefg123.supabase.co`

#### **Project API Keys**

Existem 2 chaves:

**a) `anon` / `public` key** (pode ser exposta no frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6a2l3dWhjdHZleXl4Y2VtdHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc...
```
(nota: é uma string MUITO longa, ~300 caracteres)

**b) `service_role` key** (NUNCA exponha no frontend!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6a2l3dWhjdHZleXl4Y2VtdHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNz...
```
(também muito longa)

### 4. Atualizar o `.env.local`

Abra o arquivo `.env.local` na raiz do projeto e substitua pelos valores REAIS:

```bash
# Supabase Configuration
# Obtenha suas credenciais em: https://supabase.com/dashboard/project/_/settings/api

# URL do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co

# Chave anônima (anon/public key) - usada nos clients
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...

# Service Role Key (secret) - NUNCA exponha no frontend!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

⚠️ **Dica:** As chaves reais começam com `eyJ...` e são muito longas (300+ caracteres).

### 5. Criar as Tabelas no Banco de Dados

Agora você precisa criar as tabelas do Orgzilla no Supabase.

1. No dashboard do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New Query"**
3. Cole o script SQL abaixo
4. Clique em **"Run"**

**Script SQL:**

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de níveis (L1-L16)
CREATE TABLE nivel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    nivel_anterior_id UUID REFERENCES nivel(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_nivel_updated_at BEFORE UPDATE ON nivel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de trilhas de carreira
CREATE TABLE trilha_carreira (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_trilha_carreira_updated_at BEFORE UPDATE ON trilha_carreira
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de cargos
CREATE TABLE cargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    trilha_id UUID REFERENCES trilha_carreira(id),
    nivel_id UUID REFERENCES nivel(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(nome, trilha_id)
);

CREATE TRIGGER update_cargo_updated_at BEFORE UPDATE ON cargo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de times
CREATE TABLE time (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    time_pai_id UUID REFERENCES time(id),
    gestor_id UUID,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_time_updated_at BEFORE UPDATE ON time
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de pessoas
CREATE TABLE pessoa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    nome_social TEXT,
    email_corporativo TEXT,
    email_pessoal TEXT,
    telefone TEXT,
    foto_url TEXT,
    cargo_id UUID REFERENCES cargo(id),
    time_id UUID REFERENCES time(id),
    salario_atual DECIMAL(10,2),
    data_ultimo_reajuste DATE,
    motivo_ultimo_reajuste TEXT,
    data_entrada DATE,
    data_inicio_cargo_atual DATE,
    data_desligamento DATE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'ferias', 'licenca', 'afastamento', 'desligado')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_pessoa_updated_at BEFORE UPDATE ON pessoa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de projetos/produtos
CREATE TABLE projeto_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de alocação pessoa-projeto
CREATE TABLE pessoa_projeto_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    projeto_produto_id UUID NOT NULL REFERENCES projeto_produto(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de vagas nos times
CREATE TABLE vaga_time (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_id UUID NOT NULL REFERENCES time(id),
    cargo_id UUID NOT NULL REFERENCES cargo(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_vaga_time_updated_at BEFORE UPDATE ON vaga_time
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de tags
CREATE TABLE tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    cor TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de tags de pessoas
CREATE TABLE pessoa_tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    tag_id UUID NOT NULL REFERENCES tag(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(pessoa_id, tag_id)
);

-- Tabela de anotações
CREATE TABLE anotacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_entidade TEXT NOT NULL CHECK (tipo_entidade IN ('pessoa', 'time')),
    entidade_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    criado_por_usuario_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_anotacao_updated_at BEFORE UPDATE ON anotacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de histórico de mudanças (auditoria)
CREATE TABLE historico_mudanca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_entidade TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    tipo_mudanca TEXT NOT NULL CHECK (tipo_mudanca IN ('criacao', 'edicao', 'exclusao')),
    campo_alterado TEXT,
    valor_anterior JSONB,
    valor_novo JSONB,
    usuario_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de reajustes
CREATE TABLE historico_reajuste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    salario_anterior DECIMAL(10,2),
    salario_novo DECIMAL(10,2) NOT NULL,
    percentual DECIMAL(5,2),
    data_reajuste DATE NOT NULL,
    motivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de times
CREATE TABLE historico_time (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    time_id UUID NOT NULL REFERENCES time(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de cargos
CREATE TABLE historico_cargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    cargo_id UUID NOT NULL REFERENCES cargo(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de usuários do sistema (vinculada ao auth.users do Supabase)
CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('admin', 'gestor', 'visualizador')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    pessoa_id UUID REFERENCES pessoa(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_usuario_updated_at BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_pessoa_cargo ON pessoa(cargo_id);
CREATE INDEX idx_pessoa_time ON pessoa(time_id);
CREATE INDEX idx_pessoa_status ON pessoa(status);
CREATE INDEX idx_cargo_nivel ON cargo(nivel_id);
CREATE INDEX idx_cargo_trilha ON cargo(trilha_id);
CREATE INDEX idx_time_pai ON time(time_pai_id);
CREATE INDEX idx_historico_mudanca_entidade ON historico_mudanca(tipo_entidade, entidade_id);
CREATE INDEX idx_usuario_email ON usuario(email);
```

### 6. Criar um Usuário Admin

Agora você precisa criar seu primeiro usuário admin:

1. No dashboard do Supabase, clique em **"Authentication"** no menu lateral
2. Clique em **"Users"**
3. Clique em **"Add user"** → **"Create new user"**
4. Preencha:
   - **Email:** `admin@orgzilla.com` (ou seu email real)
   - **Password:** Crie uma senha forte
   - ✅ Marque **"Auto Confirm User"** (para não precisar confirmar email)
5. Clique em **"Create user"**
6. **Copie o UUID do usuário criado** (primeira coluna da tabela)

Agora, adicione esse usuário na tabela `usuario`:

1. Volte para o **SQL Editor**
2. Execute o seguinte SQL (substitua `[UUID-DO-AUTH-USER]` pelo UUID copiado):

```sql
INSERT INTO usuario (id, email, nome, tipo_perfil, ativo)
VALUES (
    '[UUID-DO-AUTH-USER]',
    'admin@orgzilla.com',
    'Admin Orgzilla',
    'admin',
    true
);
```

### 7. Reiniciar o Servidor de Desenvolvimento

**IMPORTANTE:** As variáveis de ambiente só são carregadas quando o servidor inicia!

1. Pare o servidor Next.js (Ctrl + C no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   # ou
   pnpm dev
   ```

### 8. Testar o Login

1. Acesse: http://localhost:3000/login
2. Digite:
   - **Email:** `admin@orgzilla.com`
   - **Password:** A senha que você criou
3. Clique em **"Entrar"**
4. ✅ Deve logar e redirecionar para o dashboard

---

## 🐛 Troubleshooting

### Erro: "Supabase não configurado"

**Causa:** Variáveis de ambiente não configuradas ou servidor não reiniciado

**Solução:**
1. Verifique o `.env.local` (chaves devem começar com `eyJ...`)
2. Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Invalid login credentials"

**Causa:** Email ou senha incorretos

**Solução:**
1. Verifique se o email é exatamente o que você criou
2. Tente resetar a senha no Supabase Dashboard (Authentication → Users)

### Erro: "Email not confirmed"

**Causa:** Usuário não foi auto-confirmado

**Solução:**
1. No Supabase Dashboard → Authentication → Users
2. Clique no usuário
3. Clique em **"Confirm email"**

### Login funciona mas não cria usuário na tabela

**Causa:** Trigger automático não configurado ou usuário não inserido manualmente

**Solução:**
Execute o SQL manual (passo 6) para inserir na tabela `usuario`

### Erro no console: "Failed to fetch"

**Causa:** URL do Supabase incorreta ou projeto pausado

**Solução:**
1. Verifique se o projeto está ativo no Supabase Dashboard
2. Verifique se a URL está correta (sem espaços extras)

---

## 📝 Checklist Final

Antes de tentar fazer login, confirme:

- [ ] Projeto criado no Supabase
- [ ] `.env.local` atualizado com credenciais REAIS (chaves começam com `eyJ...`)
- [ ] Tabelas criadas no banco (executou o script SQL)
- [ ] Usuário criado no Supabase Auth
- [ ] Usuário inserido na tabela `usuario` com `tipo_perfil = 'admin'`
- [ ] Servidor Next.js reiniciado (`Ctrl+C` + `npm run dev`)
- [ ] Console do browser aberto (F12) para ver logs

---

## 🎉 Tudo Funcionando?

Depois de configurar corretamente:

1. ✅ Login deve funcionar
2. ✅ Dashboard deve aparecer com seu nome
3. ✅ Pode criar níveis, cargos, pessoas, etc
4. ✅ Todas as funcionalidades do Orgzilla estarão disponíveis!

---

**🦖 Orgzilla** - Sistema de Gestão de Times
