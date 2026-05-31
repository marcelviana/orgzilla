-- =====================================================================
-- Orgzilla — Recriação completa do schema (com RLS)
-- =====================================================================
-- Gerado a partir do DDL real do projeto. As tabelas batem com o que
-- lib/types/database.ts, os repositories e as actions esperam — EXCETO
-- pela separação de remuneração (ver abaixo), que exige ajuste no código.
--
-- ORDEM DE EXECUÇÃO: cole tudo no SQL Editor do Supabase e rode de uma vez.
-- Depois rode orgzilla_seed.sql.
--
-- O QUE MUDOU em relação ao setup antigo:
--   - RLS HABILITADO em todas as tabelas (antes não havia).
--   - Policies por perfil (admin / gestor / visualizador).
--   - Dados sensíveis de salário movidos de `pessoa` para a tabela 1:1
--     `pessoa_remuneracao`, com RLS de acesso SOMENTE para gestor.
--     (RLS é por linha, não por coluna: manter salário em `pessoa` deixaria
--      o campo legível por qualquer autenticado. A tabela separada resolve.)
--   - historico_reajuste: leitura/escrita SOMENTE gestor.
--   - usuario.id referencia auth.users(id).
--   - Seed dos níveis L1–L16 fica no orgzilla_seed.sql.
--
-- ⚠️ O código do app PRECISA ser ajustado para ler/gravar salário na nova
--    tabela. Use o prompt do Claude Code que acompanha estes arquivos.
-- =====================================================================


-- =====================================================================
-- 1. EXTENSÕES E FUNÇÃO DE updated_at
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';


-- =====================================================================
-- 2. TABELAS (ordem de dependência)
-- =====================================================================

-- Níveis (L1–L16, cadeia sequencial)
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

-- Trilhas de carreira
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

-- Cargos (trilha + nível)
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

-- Times (hierárquicos). gestor_id sem FK (fiel ao schema original).
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

-- Pessoas. Campos nullable para entrada incremental.
-- NOTA: salário NÃO fica mais aqui — ver tabela pessoa_remuneracao.
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
    data_entrada DATE,
    data_inicio_cargo_atual DATE,
    data_desligamento DATE,
    status TEXT NOT NULL DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'ferias', 'licenca', 'afastamento', 'desligado')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_pessoa_updated_at BEFORE UPDATE ON pessoa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Remuneração (1:1 com pessoa) — DADO SENSÍVEL (LGPD).
-- RLS abaixo restringe TODO acesso ao perfil gestor.
CREATE TABLE pessoa_remuneracao (
    pessoa_id UUID PRIMARY KEY REFERENCES pessoa(id) ON DELETE CASCADE,
    salario_atual DECIMAL(10,2),
    data_ultimo_reajuste DATE,
    motivo_ultimo_reajuste TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_pessoa_remuneracao_updated_at BEFORE UPDATE ON pessoa_remuneracao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Projetos / produtos (simples)
CREATE TABLE projeto_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alocação pessoa ↔ projeto (N:N)
CREATE TABLE pessoa_projeto_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    projeto_produto_id UUID NOT NULL REFERENCES projeto_produto(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vagas em times
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

-- Tags
CREATE TABLE tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    cor TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags de pessoas (N:N)
CREATE TABLE pessoa_tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    tag_id UUID NOT NULL REFERENCES tag(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(pessoa_id, tag_id)
);

-- Anotações sobre pessoa ou time
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

-- Histórico de mudanças (auditoria)
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

-- Histórico de reajustes (SENSÍVEL — só gestor)
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

-- Histórico de times
CREATE TABLE historico_time (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    time_id UUID NOT NULL REFERENCES time(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Histórico de cargos
CREATE TABLE historico_cargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id),
    cargo_id UUID NOT NULL REFERENCES cargo(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários do sistema (vinculado ao auth.users do Supabase)
CREATE TABLE usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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


-- =====================================================================
-- 2b. FOREIGN KEYS DIFERIDAS
-- =====================================================================
-- time.gestor_id -> pessoa(id) não pode ser inline (time é criada antes
-- de pessoa). É obrigatória: o código embute `gestor:pessoa!gestor_id(*)`
-- e o PostgREST precisa da FK para resolver o relacionamento.
ALTER TABLE time
    ADD CONSTRAINT time_gestor_id_fkey
    FOREIGN KEY (gestor_id) REFERENCES pessoa(id);


-- =====================================================================
-- 3. ÍNDICES
-- =====================================================================
CREATE INDEX idx_pessoa_cargo   ON pessoa(cargo_id);
CREATE INDEX idx_pessoa_time    ON pessoa(time_id);
CREATE INDEX idx_pessoa_status  ON pessoa(status);
CREATE INDEX idx_cargo_nivel    ON cargo(nivel_id);
CREATE INDEX idx_cargo_trilha   ON cargo(trilha_id);
CREATE INDEX idx_time_pai       ON time(time_pai_id);
CREATE INDEX idx_historico_mudanca_entidade ON historico_mudanca(tipo_entidade, entidade_id);
CREATE INDEX idx_historico_reajuste_pessoa  ON historico_reajuste(pessoa_id);
CREATE INDEX idx_usuario_email  ON usuario(email);


-- =====================================================================
-- 4. HELPER DE PERFIL (SECURITY DEFINER p/ evitar recursão de RLS)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.current_tipo_perfil()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tipo_perfil FROM public.usuario
    WHERE id = auth.uid() AND ativo = true
$$;


-- =====================================================================
-- 5. HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================================
ALTER TABLE nivel                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilha_carreira        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE time                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoa                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoa_remuneracao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_produto        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoa_projeto_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaga_time              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoa_tag             ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacao               ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_mudanca      ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_reajuste     ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_time         ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_cargo        ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario                ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- 6. POLICIES
-- =====================================================================
-- Defesa em profundidade. O app aplica as regras finas de hierarquia em TS.
--   - Leitura: autenticado lê dados operacionais.
--   - Escrita: admin/gestor (visualizador nunca escreve).
--   - Config (níveis/trilhas/cargos): escrita só admin.
--   - pessoa_remuneracao e historico_reajuste: TUDO só gestor (salário).
--   - usuario: lê a própria linha; admin gerencia todas; auto-criação no 1º login.

-- ----- usuario -----
CREATE POLICY usuario_select ON usuario FOR SELECT
    USING (id = auth.uid() OR public.current_tipo_perfil() = 'admin');
CREATE POLICY usuario_insert ON usuario FOR INSERT
    WITH CHECK (id = auth.uid() OR public.current_tipo_perfil() = 'admin');
CREATE POLICY usuario_update ON usuario FOR UPDATE
    USING (id = auth.uid() OR public.current_tipo_perfil() = 'admin')
    WITH CHECK (id = auth.uid() OR public.current_tipo_perfil() = 'admin');
CREATE POLICY usuario_delete ON usuario FOR DELETE
    USING (public.current_tipo_perfil() = 'admin');

-- ----- Config (escrita só admin) -----
CREATE POLICY nivel_select ON nivel FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY nivel_write  ON nivel FOR ALL
    USING (public.current_tipo_perfil() = 'admin')
    WITH CHECK (public.current_tipo_perfil() = 'admin');
CREATE POLICY trilha_select ON trilha_carreira FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY trilha_write  ON trilha_carreira FOR ALL
    USING (public.current_tipo_perfil() = 'admin')
    WITH CHECK (public.current_tipo_perfil() = 'admin');
CREATE POLICY cargo_select ON cargo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY cargo_write  ON cargo FOR ALL
    USING (public.current_tipo_perfil() = 'admin')
    WITH CHECK (public.current_tipo_perfil() = 'admin');
CREATE POLICY tag_select ON tag FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY tag_write  ON tag FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));

-- ----- Operacionais (escrita admin/gestor) -----
CREATE POLICY time_select ON time FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY time_write  ON time FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY pessoa_select ON pessoa FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY pessoa_write  ON pessoa FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY projeto_select ON projeto_produto FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY projeto_write  ON projeto_produto FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY ppp_select ON pessoa_projeto_produto FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY ppp_write  ON pessoa_projeto_produto FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY vaga_select ON vaga_time FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY vaga_write  ON vaga_time FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY pessoa_tag_select ON pessoa_tag FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY pessoa_tag_write  ON pessoa_tag FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY anotacao_select ON anotacao FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY anotacao_write  ON anotacao FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));

-- ----- Históricos -----
CREATE POLICY hist_mudanca_select ON historico_mudanca FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY hist_mudanca_insert ON historico_mudanca FOR INSERT
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY hist_time_select ON historico_time FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY hist_time_write  ON historico_time FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));
CREATE POLICY hist_cargo_select ON historico_cargo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY hist_cargo_write  ON historico_cargo FOR ALL
    USING (public.current_tipo_perfil() IN ('admin','gestor'))
    WITH CHECK (public.current_tipo_perfil() IN ('admin','gestor'));

-- ----- SENSÍVEL: salário — TUDO só gestor -----
-- Admin NÃO vê salário (regra de negócio intencional). Visualizador também não.
CREATE POLICY remuneracao_all ON pessoa_remuneracao FOR ALL
    USING (public.current_tipo_perfil() = 'gestor')
    WITH CHECK (public.current_tipo_perfil() = 'gestor');
CREATE POLICY hist_reajuste_select ON historico_reajuste FOR SELECT
    USING (public.current_tipo_perfil() = 'gestor');
CREATE POLICY hist_reajuste_insert ON historico_reajuste FOR INSERT
    WITH CHECK (public.current_tipo_perfil() = 'gestor');


-- =====================================================================
-- 7. CRIAR O PRIMEIRO ADMIN (manual, após rodar schema + seed)
-- =====================================================================
-- 1) Authentication → Users → Add user (marque "Auto Confirm"). Copie o UUID.
-- 2) INSERT INTO usuario (id, email, nome, tipo_perfil, ativo)
--    VALUES ('[UUID]', 'admin@orgzilla.com', 'Admin Orgzilla', 'admin', true);