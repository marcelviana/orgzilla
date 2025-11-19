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
import { useToast } from '@/hooks/use-toast'
import { ChevronRight, Home, Loader2 } from 'lucide-react'
import { getTimeById, updateTime } from '@/app/actions/times.actions'
import { getTimesParaFiltro, getPessoasParaGestor } from '@/app/actions/pessoas.actions'
import { toast as sonnerToast } from 'sonner'

export default function EditarTimePage() {
  const { toast } = useToast()
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
    loadData()
  }, [timeId])

  async function loadData() {
    try {
      const [timeResult, timesResult, pessoasResult] = await Promise.all([
        getTimeById(timeId),
        getTimesParaFiltro(),
        getPessoasParaGestor(),
      ])

      // Load time data
      if (timeResult.success && timeResult.data) {
        const t = timeResult.data as any
        setFormData({
          nome: t.nome || '',
          descricao: t.descricao || '',
          timePaiId: t.time_pai_id || null,
          gestorId: t.gestor_id || null,
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
        sonnerToast.error(timeResult.error || 'Erro ao carregar time')
        router.push('/times')
        return
      }

      // Load dropdown data
      if (timesResult.success && timesResult.data) {
        // Filter out current time and its descendants from parent options
        setAvailableTeams(timesResult.data.filter(t => t.id !== timeId))
      }

      if (pessoasResult.success && pessoasResult.data) {
        setAvailableManagers(pessoasResult.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      sonnerToast.error('Erro inesperado ao carregar dados')
      router.push('/times')
    } finally {
      setDataLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!formData.nome || !formData.gestorId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios (*)',
        variant: 'destructive'
      })
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
        sonnerToast.success('🦖 Time atualizado com sucesso!')
        setIsDirty(false)
        router.push(`/times/${timeId}`)
      } else {
        toast({
          title: 'Erro ao atualizar time',
          description: result.error || 'Ocorreu um erro ao atualizar o time',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar time:', error)
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado ao atualizar o time',
        variant: 'destructive'
      })
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
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando formulário...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="w-4 h-4" />
          <a href="/times" className="hover:text-foreground">Times</a>
          <ChevronRight className="w-4 h-4" />
          <a href={`/times/${timeId}`} className="hover:text-foreground">{formData.nome}</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Editar</span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Time</h1>
          <p className="text-muted-foreground mt-1">Atualize as informações do time</p>
        </div>

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
            <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
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
