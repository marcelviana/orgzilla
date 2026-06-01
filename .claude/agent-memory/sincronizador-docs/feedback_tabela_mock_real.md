---
name: feedback-tabela-mock-real
description: Convenções para atualizar a tabela §3.1 de migração mock → real no STATUS.md
metadata:
  type: feedback
---

Quando uma página tem comportamentos distintos em rotas diferentes (ex.: `pessoas/[id]` detalhe vs. `pessoas/[id]/editar`), cada rota recebe sua própria linha na tabela.

Ao marcar ✅ uma entrada, detalhar brevemente o que foi conectado — ex.: `✅ Dados reais (projetos e tags via getProjetosParaFiltro/getTagsParaFiltro)` — para que fique claro o que "real" significa naquela linha.

**Why:** a tabela é usada como referência rápida; linhas vagas como "Formulário real" sem especificar o que foi migrado repetem o erro de mocks residuais passarem despercebidos.

**How to apply:** ao atualizar qualquer linha da tabela, incluir o nome da action/service/repository que passou a alimentar a UI.

Mocks recorrentes identificados:
- `MOCK_PROJECTS`, `MOCK_TAGS` — formulários de criação/edição de pessoa
- `PERSON_DATA_MOCK`, `MOCK_NOTES` — detalhe de pessoa (`pessoas/[id]`)
- `mockPeople` — painéis de cargos e trilhas em configurações
- `mockPositions` — seção de posições em configurações/trilhas
- `mockLevels`, `mockTrilhas`, `mockTags`, `mockLoginActivity` — landing de configurações
