---
name: debitos-arquiteturais-pendentes
description: Débitos 🟡 identificados pelo revisor-camadas e registrados em §3.3 do STATUS.md — padrão de como registrar e onde colocar débitos pendentes
metadata:
  type: project
---

Débitos pendentes registrados em §3.3 após revisão do commit c6b4e97 (2026-06-01):

1. `pessoas.actions.ts` linhas 262–296: `anexarRemuneracaoLista` — lógica LGPD de negócio fora do Service.
2. `dashboard.actions.ts` linhas 124/185/238/336: `console.error` em vez de `handleError`.
3. `times.actions.ts` linhas 628–671: `buildTimeHierarchy` recursiva sem proteção a ciclos, duplicata fora do `TimeService`.

**Why:** o revisor-camadas detecta débitos mas não corrige código; o sincronizador-docs os registra em §3.3 com símbolo 🟡 e referência de arquivo:linha para que o mantenedor possa priorizar e corrigir.

**How to apply:** ao receber achados do revisor-camadas, adicionar cada débito como item 🟡 na subseção "Débitos pendentes" de §3.3, com arquivo, linhas e descrição do problema. Não confundir com itens ✅ (resolvidos) que ficam na lista numerada acima. Manter os 🟡 até que sejam corrigidos e confirmados.
