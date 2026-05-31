-- =====================================================================
-- Orgzilla — Script de carga (dados de teste)
-- =====================================================================
-- Rode DEPOIS de orgzilla_schema.sql, no SQL Editor do Supabase.
-- O SQL Editor roda como dono das tabelas e IGNORA o RLS, então o seed
-- insere normalmente (inclusive em pessoa_remuneracao e historico_reajuste).
--
-- Volume gerado (aprox.):
--   16 níveis · 5 trilhas · ~40 cargos · ~34 times (hierarquia 3 níveis)
--   140 pessoas · ~120 registros de remuneração · 12 projetos
--   ~70 alocações · ~15 vagas · 8 tags · ~150 vínculos de tag
--   ~60 reajustes · históricos atuais
--
-- Idempotência: feito para rodar UMA vez sobre banco recém-criado.
-- Para repetir, use o bloco TRUNCATE comentado no fim.
--
-- ⚠️ Usuários de login NÃO são criados aqui (dependem de auth.users).
--    Veja instruções no fim do arquivo.
-- =====================================================================

DO $$
DECLARE
    v_fnames TEXT[] := ARRAY['Joao','Maria','Pedro','Ana','Lucas','Julia','Bruno','Carla',
        'Rafael','Beatriz','Felipe','Mariana','Gustavo','Camila','Thiago','Larissa',
        'Rodrigo','Fernanda','Diego','Patricia','Andre','Leticia','Marcelo','Renata'];
    v_lnames TEXT[] := ARRAY['Silva','Santos','Oliveira','Souza','Lima','Costa','Pereira',
        'Rodrigues','Almeida','Nascimento','Carvalho','Araujo','Ribeiro','Gomes','Martins',
        'Rocha','Barbosa','Alves','Monteiro','Cardoso'];
    v_trilhas TEXT[] := ARRAY['Engenharia de Software','Produto','Design','Dados','Negocios'];
    v_roles   TEXT[] := ARRAY['Engenheiro','Product Manager','Designer','Analista de Dados','Analista de Negocios'];
    v_diretorias TEXT[] := ARRAY['Tecnologia','Produto','Operacoes','Pessoas'];
    v_arealabels TEXT[] := ARRAY['Plataforma','Crescimento','Experiencia'];

    v_nivel_ids   UUID[] := '{}';
    v_trilha_ids  UUID[] := '{}';
    v_cargo_ids   UUID[] := '{}';
    v_cargo_lvl   INT[]  := '{}';
    v_time_ids    UUID[] := '{}';

    v_prev_nivel  UUID := NULL;
    v_tid UUID; v_aid UUID; v_did UUID; v_cid UUID; v_pid UUID;
    v_nivel_id UUID;
    i INT; j INT; k INT; lvl INT;
    v_fname TEXT; v_lname TEXT; v_nome TEXT; v_email TEXT;
    v_salario NUMERIC; v_status TEXT; v_ativo BOOLEAN; v_deslig DATE;
    v_entrada DATE; r NUMERIC;
BEGIN
    -- 1. NÍVEIS L1..L16
    FOR i IN 1..16 LOOP
        INSERT INTO nivel (nome, nivel_anterior_id)
        VALUES ('L' || i, v_prev_nivel) RETURNING id INTO v_nivel_id;
        v_prev_nivel := v_nivel_id;
        v_nivel_ids := array_append(v_nivel_ids, v_nivel_id);
    END LOOP;

    -- 2. TRILHAS
    FOR i IN 1 .. array_length(v_trilhas,1) LOOP
        INSERT INTO trilha_carreira (nome, descricao)
        VALUES (v_trilhas[i], 'Trilha de ' || v_trilhas[i]) RETURNING id INTO v_tid;
        v_trilha_ids := array_append(v_trilha_ids, v_tid);
    END LOOP;

    -- 3. CARGOS (cada trilha em L1..L8)
    FOR i IN 1 .. array_length(v_trilha_ids,1) LOOP
        FOR lvl IN 1..8 LOOP
            INSERT INTO cargo (nome, trilha_id, nivel_id)
            VALUES (v_roles[i] || ' L' || lvl, v_trilha_ids[i], v_nivel_ids[lvl])
            RETURNING id INTO v_cid;
            v_cargo_ids := array_append(v_cargo_ids, v_cid);
            v_cargo_lvl := array_append(v_cargo_lvl, lvl);
        END LOOP;
    END LOOP;

    -- 4. TIMES (diretoria -> area -> squad)
    FOR i IN 1 .. array_length(v_diretorias,1) LOOP
        INSERT INTO time (nome, descricao, time_pai_id)
        VALUES (v_diretorias[i], 'Diretoria de ' || v_diretorias[i], NULL)
        RETURNING id INTO v_did;
        v_time_ids := array_append(v_time_ids, v_did);

        FOR j IN 1 .. array_length(v_arealabels,1) LOOP
            INSERT INTO time (nome, descricao, time_pai_id)
            VALUES (v_diretorias[i] || ' - ' || v_arealabels[j], 'Area de ' || v_arealabels[j], v_did)
            RETURNING id INTO v_aid;
            v_time_ids := array_append(v_time_ids, v_aid);

            FOR k IN 1 .. (1 + floor(random()*2)::int) LOOP
                INSERT INTO time (nome, descricao, time_pai_id)
                VALUES (v_diretorias[i] || ' - ' || v_arealabels[j] || ' Squad ' || k, 'Squad operacional', v_aid)
                RETURNING id INTO v_tid;
                v_time_ids := array_append(v_time_ids, v_tid);
            END LOOP;
        END LOOP;
    END LOOP;

    -- 5. PESSOAS (140) + REMUNERAÇÃO (na tabela separada)
    FOR i IN 1..140 LOOP
        v_fname := v_fnames[1 + floor(random()*array_length(v_fnames,1))::int];
        v_lname := v_lnames[1 + floor(random()*array_length(v_lnames,1))::int];
        v_nome  := v_fname || ' ' || v_lname;
        v_email := lower(v_fname) || '.' || lower(v_lname) || i || '@empresa.com';

        j   := 1 + floor(random()*array_length(v_cargo_ids,1))::int;
        lvl := v_cargo_lvl[j];
        v_salario := ROUND((3000 + (lvl-1)*1900 + random()*1500)::numeric, 2);

        r := random();
        IF    r < 0.86 THEN v_status := 'ativo';
        ELSIF r < 0.91 THEN v_status := 'ferias';
        ELSIF r < 0.95 THEN v_status := 'licenca';
        ELSIF r < 0.98 THEN v_status := 'afastamento';
        ELSE                v_status := 'desligado';
        END IF;

        v_ativo  := (v_status <> 'desligado');
        v_deslig := CASE WHEN v_status = 'desligado' THEN CURRENT_DATE - (random()*400)::int ELSE NULL END;
        v_entrada := CURRENT_DATE - (180 + random()*2200)::int;

        INSERT INTO pessoa (
            nome, email_corporativo, telefone, cargo_id, time_id,
            data_entrada, data_inicio_cargo_atual, data_desligamento, status, ativo
        ) VALUES (
            v_nome, v_email, '11 9' || (10000000 + floor(random()*89999999)::int),
            v_cargo_ids[j],
            v_time_ids[1 + floor(random()*array_length(v_time_ids,1))::int],
            v_entrada, v_entrada + (random()*150)::int, v_deslig, v_status, v_ativo
        ) RETURNING id INTO v_pid;

        -- remuneração só para quem não está desligado
        IF v_status <> 'desligado' THEN
            INSERT INTO pessoa_remuneracao (pessoa_id, salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste)
            VALUES (v_pid, v_salario, CURRENT_DATE - (random()*330)::int, 'Reajuste anual');
        END IF;
    END LOOP;

    -- 6. GESTOR de cada time
    UPDATE time t SET gestor_id = (
        SELECT p.id FROM pessoa p
        WHERE p.time_id = t.id AND p.ativo = true ORDER BY random() LIMIT 1
    )
    WHERE EXISTS (SELECT 1 FROM pessoa p WHERE p.time_id = t.id AND p.ativo = true);

    RAISE NOTICE 'Seed base concluido.';
END $$;


-- =====================================================================
-- 7. HISTÓRICOS ATUAIS (set-based)
-- =====================================================================
INSERT INTO historico_time (pessoa_id, time_id, data_inicio)
SELECT id, time_id, COALESCE(data_entrada, CURRENT_DATE - 365)
FROM pessoa WHERE time_id IS NOT NULL;

INSERT INTO historico_cargo (pessoa_id, cargo_id, data_inicio)
SELECT id, cargo_id, COALESCE(data_inicio_cargo_atual, CURRENT_DATE - 200)
FROM pessoa WHERE cargo_id IS NOT NULL;

-- Reajustes para ~50% de quem tem remuneração (lê da tabela separada)
INSERT INTO historico_reajuste (pessoa_id, salario_anterior, salario_novo, percentual, data_reajuste, motivo)
SELECT r.pessoa_id, ROUND(r.salario_atual / 1.1, 2), r.salario_atual, 10.0,
       COALESCE(r.data_ultimo_reajuste, CURRENT_DATE - 90), 'Reajuste anual'
FROM pessoa_remuneracao r
WHERE r.salario_atual IS NOT NULL AND random() < 0.5;


-- =====================================================================
-- 8. PROJETOS E ALOCAÇÕES
-- =====================================================================
INSERT INTO projeto_produto (nome) VALUES
    ('Projeto Alpha'), ('Projeto Beta'), ('Projeto Gamma'), ('Portal do Cliente'),
    ('App Mobile'), ('Migracao Cloud'), ('Data Lake'), ('Onboarding 2.0'),
    ('Checkout v3'), ('Painel Analytics'), ('Integracao ERP'), ('Programa Mentoria');

INSERT INTO pessoa_projeto_produto (pessoa_id, projeto_produto_id, data_inicio, ativo)
SELECT p.id, pr.id, CURRENT_DATE - (random()*300)::int, true
FROM pessoa p
CROSS JOIN LATERAL (SELECT id FROM projeto_produto ORDER BY random() LIMIT 1) pr
WHERE p.ativo = true AND random() < 0.5;


-- =====================================================================
-- 9. VAGAS ABERTAS (~15)
-- =====================================================================
INSERT INTO vaga_time (time_id, cargo_id, quantidade)
SELECT t.id, c.id, 1 + floor(random()*2)::int
FROM (SELECT id FROM time ORDER BY random() LIMIT 15) t
CROSS JOIN LATERAL (SELECT id FROM cargo ORDER BY random() LIMIT 1) c;


-- =====================================================================
-- 10. TAGS E VÍNCULOS
-- =====================================================================
INSERT INTO tag (nome, cor) VALUES
    ('Alta Performance', '#22C55E'), ('Promovivel', '#3B82F6'),
    ('Risco de Saida', '#EF4444'), ('Novato', '#F59E0B'),
    ('Lideranca', '#8B5CF6'), ('Mentor', '#14B8A6'),
    ('Remoto', '#06B6D4'), ('Bilingue', '#EC4899');

INSERT INTO pessoa_tag (pessoa_id, tag_id)
SELECT p.id, tg.id FROM pessoa p, tag tg
WHERE random() < 0.15
ON CONFLICT (pessoa_id, tag_id) DO NOTHING;


-- =====================================================================
-- 11. ANOTAÇÕES (10) — usuario placeholder (sem FK)
-- =====================================================================
INSERT INTO anotacao (tipo_entidade, entidade_id, conteudo, criado_por_usuario_id)
SELECT 'pessoa', id, 'Anotacao de teste: acompanhar evolucao no proximo ciclo.',
       '00000000-0000-0000-0000-000000000000'
FROM pessoa ORDER BY random() LIMIT 10;


-- =====================================================================
-- 12. RESUMO
-- =====================================================================
SELECT 'nivel' AS tabela, COUNT(*) FROM nivel
UNION ALL SELECT 'trilha_carreira', COUNT(*) FROM trilha_carreira
UNION ALL SELECT 'cargo', COUNT(*) FROM cargo
UNION ALL SELECT 'time', COUNT(*) FROM time
UNION ALL SELECT 'pessoa', COUNT(*) FROM pessoa
UNION ALL SELECT 'pessoa (ativas)', COUNT(*) FROM pessoa WHERE ativo
UNION ALL SELECT 'pessoa_remuneracao', COUNT(*) FROM pessoa_remuneracao
UNION ALL SELECT 'projeto_produto', COUNT(*) FROM projeto_produto
UNION ALL SELECT 'pessoa_projeto_produto', COUNT(*) FROM pessoa_projeto_produto
UNION ALL SELECT 'vaga_time', COUNT(*) FROM vaga_time
UNION ALL SELECT 'tag', COUNT(*) FROM tag
UNION ALL SELECT 'pessoa_tag', COUNT(*) FROM pessoa_tag
UNION ALL SELECT 'historico_reajuste', COUNT(*) FROM historico_reajuste
UNION ALL SELECT 'historico_time', COUNT(*) FROM historico_time
UNION ALL SELECT 'historico_cargo', COUNT(*) FROM historico_cargo
ORDER BY 1;


-- =====================================================================
-- USUÁRIOS DE LOGIN (passo manual, fora deste script)
-- =====================================================================
-- Crie 3 usuarios em Authentication -> Users (marque "Auto Confirm"),
-- copie o UUID de cada um e vincule:
--
-- INSERT INTO usuario (id, email, nome, tipo_perfil, ativo) VALUES
--   ('[UUID-ADMIN]',  'admin@orgzilla.com',  'Admin Teste',  'admin', true),
--   ('[UUID-GESTOR]', 'gestor@orgzilla.com', 'Gestor Teste', 'gestor', true),
--   ('[UUID-VIEW]',   'view@orgzilla.com',   'Viewer Teste', 'visualizador', true);
--
-- Gestor de teste -> pessoa em time COM subtimes (para testar hierarquia):
--
-- UPDATE usuario SET pessoa_id = (
--     SELECT p.id FROM pessoa p
--     JOIN time t ON p.time_id = t.id
--     WHERE t.time_pai_id IS NOT NULL
--       AND EXISTS (SELECT 1 FROM time f WHERE f.time_pai_id = t.id)
--     LIMIT 1
-- ) WHERE email = 'gestor@orgzilla.com';


-- =====================================================================
-- LIMPEZA (para rodar de novo) — descomente se precisar
-- =====================================================================
-- TRUNCATE pessoa_tag, anotacao, historico_reajuste, historico_time,
--   historico_cargo, pessoa_projeto_produto, vaga_time, pessoa_remuneracao,
--   pessoa, cargo, tag, projeto_produto, trilha_carreira, nivel, time
--   RESTART IDENTITY CASCADE;