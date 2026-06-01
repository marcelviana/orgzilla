import { getNiveisComEstatisticas } from "@/app/actions/niveis.actions"
import { getTrilhasComEstatisticas } from "@/app/actions/trilhas.actions"
import { getTagsComEstatisticas } from "@/app/actions/tags.actions"
import ConfiguracoesClient from "./configuracoes-client"

export default async function ConfiguracoesPage() {
  const [niveisResult, trilhasResult, tagsResult] = await Promise.all([
    getNiveisComEstatisticas(),
    getTrilhasComEstatisticas(),
    getTagsComEstatisticas(),
  ])

  return (
    <ConfiguracoesClient
      niveis={niveisResult.data ?? []}
      trilhas={trilhasResult.data ?? []}
      tags={tagsResult.data ?? []}
    />
  )
}
