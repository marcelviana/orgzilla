'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'
import { ChevronRight, Loader2 } from 'lucide-react'
import { DetailsSkeleton, PageHeader } from '@/components/shared'
import { getTimeById, updateTime } from '@/app/actions/times.actions'
import { getTimesParaFiltro, getPessoasParaGestor } from '@/app/actions/pessoas.actions'

export default function EditarTimePage() {
  const router = useRouter()
  const params = useParams()
  const timeId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // Real data from database
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; nome: string }>>([])
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: string; nome: string; cargo: string | null; time: string | null }>>([])

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    timePaiId: null as string | null,
    gestorId: null as string | null,
  })

  const [showParentSelect, setShowParentSelect] = useState(false)
  const [showManagerSelect, setShowManagerSelect] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [selectedGestor, setSelectedGestor] = useState<{ id: string; nome: string; cargo: string | null; time: string | null } | null>(null)
  const [selectedTimePai, setSelectedTimePai] = useState<{ id: string; nome: string } | null>(null)

  // Load data on mount
  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const [timeResult, timesResult, pessoasResult] = await Promise.all([
          getTimeById(timeId),
          getTimesParaFiltro(),
          getPessoasParaGestor(),
        ])

        if (controller.signal.aborted) return

        // Load time data
        if (timeResult.success && timeResult.data) {
          const t = timeResult.data as { nome?: string; descricao?: string; time_pai_id?: string | null; gestor_id?: string | null; gestor?: { id: string; nome: string } | null; time_pai?: { id: string; nome: string } | null }
          setFormData({
            nome: t.nome ?? '',
            descricao: t.descricao ?? '',
            timePaiId: t.time_pai_id ?? null,
            gestorId: t.gestor_id ?? null,
          })

          // Set selected gestor for display
          if (t.gestor) {
            setSelectedGestor({
              id: t.gestor.id,
              nome: t.gestor.nome,
              cargo: null,
              time: null,
            })
          }

          // Set selected time pai for display
          if (t.time_pai) {
            setSelectedTimePai({
              id: t.time_pai.id,
              nome: t.time_pai.nome,
            })
          }
        } else {
          toast.error(String(timeResult.error ?? 'Erro ao carregar time'))
          router.push('/times')
          return
        }

        // Load dropdown data
        if (timesResult.success && timesResult.data) {
          setAvailableTeams(timesResult.data.filter(t => t.id !== timeId))
        }

        if (pessoasResult.success && pessoasResult.data) {
          setAvailableManagers(pessoasResult.data)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        toast.error(handleError(error, 'database'))
        router.push('/times')
      } finally {
        if (!controller.signal.aborted) setDataLoading(false)
      }
    }

    void fetchData()
    return () => controller.abort()
  }, [timeId, router])

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!formData.nome || !formData.gestorId) {
      toast.error({ type: 'validation', message: 'Preencha todos os campos obrigatórios (*)' })
      return
    }

    setIsLoading(true)

    try {
      const timeData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        time_pai_id: formData.timePaiId,
        gestor_id: formData.gestorId,
        ativo: true,
      }

      const result = await updateTime(timeId, timeData)

      if (result.success) {
        toast.successDino('Time atualizado com sucesso!')
        setIsDirty(false)
        router.push(`/times/${timeId}`)
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao atualizar time'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Descartar alterações?')) {
        router.push(`/times/${timeId}`)
      }
    } else {
      router.push(`/times/${timeId}`)
    }
  }

  // Loading state
  if (dataLoading) {
    return (
      <DashboardShell>
        <div className="p-6">
          <DetailsSkeleton />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Editar Time"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Times", href: "/times" }, { label: formData.nome, href: `/times/${timeId}` }, { label: "Editar" }]}
          description="Atualize as informações do time"
        />

        {/* Form Card */}
        <div className="max-w-[800px] mx-auto bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* Section 1: Informações Básicas */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b pb-2">Informações Básicas</h2>

            {/* Nome do Time */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Time *</Label>
              <Input
                id="nome"
                placeholder="Ex: Engenharia de Software"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                maxLength={100}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground text-right">{formData.nome.length}/100 caracteres</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o propósito e responsabilidades do time..."
                rows={4}
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.descricao.length}/500 caracteres</p>
            </div>

            {/* Time Pai */}
            <div className="space-y-2">
              <Label>Time Pai</Label>
              <button
                type="button"
                onClick={() => setShowParentSelect(true)}
                className="w-full h-11 px-3 text-left border rounded-md hover:border-primary transition-colors flex items-center justify-between"
              >
                <span className={selectedTimePai ? 'text-foreground' : 'text-muted-foreground'}>
                  {selectedTimePai ? selectedTimePai.nome : 'Selecione um time (opcional)'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Gestor */}
            <div className="space-y-2">
              <Label>Gestor *</Label>
              <button
                type="button"
                onClick={() => setShowManagerSelect(true)}
                className="w-full h-11 px-3 text-left border rounded-md hover:border-primary transition-colors flex items-center justify-between"
              >
                {selectedGestor ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{selectedGestor.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-foreground text-sm">{selectedGestor.nome}</span>
                      {selectedGestor.cargo && (
                        <span className="text-xs text-muted-foreground">{selectedGestor.cargo}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Selecione o gestor do time</span>
                )}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={() => { void handleSave() }} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>

        {/* Parent Team Selector Modal */}
        <Dialog open={showParentSelect} onOpenChange={setShowParentSelect}>
          <DialogContent className="max-w-md w-full p-6">
            <DialogHeader>
              <DialogTitle>Selecionar Time Pai</DialogTitle>
              <DialogDescription>Escolha o time hierarquicamente superior</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <button
                onClick={() => {
                  handleInputChange('timePaiId', null)
                  setSelectedTimePai(null)
                  setShowParentSelect(false)
                }}
                className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
              >
                <div className="font-medium">Nenhum (Time raiz)</div>
                <div className="text-xs text-muted-foreground">Este time não terá um time pai</div>
              </button>
              {availableTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    handleInputChange('timePaiId', team.id)
                    setSelectedTimePai(team)
                    setShowParentSelect(false)
                  }}
                  className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
                >
                  <div className="font-medium">{team.nome}</div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Manager Selector Modal */}
        <Dialog open={showManagerSelect} onOpenChange={setShowManagerSelect}>
          <DialogContent className="max-w-md w-full p-6">
            <DialogHeader>
              <DialogTitle>Selecionar Gestor</DialogTitle>
              <DialogDescription>Escolha o gestor do time</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableManagers.length > 0 ? (
                availableManagers.map(manager => (
                  <button
                    key={manager.id}
                    onClick={() => {
                      handleInputChange('gestorId', manager.id)
                      setSelectedGestor(manager)
                      setShowManagerSelect(false)
                    }}
                    className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{manager.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{manager.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {manager.cargo || 'Sem cargo'} {manager.time ? `- ${manager.time}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma pessoa disponível para seleção
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
