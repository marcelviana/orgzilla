---
name: debitos-arquiteturais-pendentes
description: Padrão de como registrar débitos 🟡 em §3.3 e marcar como ✅ quando resolvidos; histórico dos débitos do commit c6b4e97
metadata:
  type: project
---

Débitos identificados pelo revisor-camadas no commit c6b4e97 e **resolvidos em 2026-06-01**:

1. `pessoas.actions.ts`: `anexarRemuneracaoLista` — extraída para `PessoaService.enriquecerListaComRemuneracao`. ✅
2. `dashboard.actions.ts`: `console.error` → `handleError`. ✅
3. `times.actions.ts`: `buildTimeHierarchy` → `TimeService.buscarHierarquiaComEstatisticas` (com proteção a ciclos via Set). ✅

**Why:** o revisor-camadas detecta débitos mas não corrige código; o sincronizador-docs os registra em §3.3 com símbolo 🟡 e referência de arquivo:linha. Quando corrigidos, os itens 🟡 viram ✅ com breve descrição do que foi feito — nunca removidos silenciosamente.

**How to apply:** débitos novos entram como 🟡 na subseção "Débitos pendentes" de §3.3. Quando resolvidos, reescrever o item como ✅ descrevendo a solução. Não apagar — manter o histórico visível na seção.

Novos tipos exportados por esta resolução: `TimeComEstatisticas` e `TimeHierarquico` em `lib/services/time.service.ts`, re-exportados via `lib/services/index.ts`.
