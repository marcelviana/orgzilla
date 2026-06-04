import { redirect } from "next/navigation"
import { getUsuarioLogado } from "@/lib/middleware"
import { getNiveisComEstatisticas } from "@/app/actions/niveis.actions"
import { getTrilhasComEstatisticas } from "@/app/actions/trilhas.actions"
import { getTagsComEstatisticas } from "@/app/actions/tags.actions"
import ConfiguracoesClient from "./configuracoes-client"

export default async function ConfiguracoesPage() {
  const [usuario, niveisResult, trilhasResult, tagsResult] = await Promise.all([
    getUsuarioLogado(),
    getNiveisComEstatisticas(),
    getTrilhasComEstatisticas(),
    getTagsComEstatisticas(),
  ])

  // O layout do dashboard já protege a rota; reforça aqui para garantir a prop não-nula.
  if (!usuario) redirect("/login")

  return (
    <ConfiguracoesClient
      usuario={usuario}
      niveis={niveisResult.data ?? []}
      trilhas={trilhasResult.data ?? []}
      tags={tagsResult.data ?? []}
    />
  )
}
