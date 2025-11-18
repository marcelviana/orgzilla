'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tag, TrendingUp, Users, Plus, Search, ArrowUpDown, Pencil, X, Upload, Download, ShieldAlert, Trash2, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Mock data
const mockTags = [
  { id: 'tag1', nome: 'Frontend', cor: '#FF7A00', pessoas: 18, ativo: true },
  { id: 'tag2', nome: 'Backend', cor: '#1A2734', pessoas: 22, ativo: true },
  { id: 'tag3', nome: 'Full Stack', cor: '#00C8FF', pessoas: 8, ativo: true },
  { id: 'tag4', nome: 'Leadership', cor: '#9333EA', pessoas: 12, ativo: true },
  { id: 'tag5', nome: 'Mentor', cor: '#10B981', pessoas: 15, ativo: true },
  { id: 'tag6', nome: 'React', cor: '#61DAFB', pessoas: 16, ativo: true },
  { id: 'tag7', nome: 'Node.js', cor: '#339933', pessoas: 14, ativo: true },
  { id: 'tag8', nome: 'Python', cor: '#3776AB', pessoas: 11, ativo: true },
  { id: 'tag9', nome: 'TypeScript', cor: '#3178C6', pessoas: 20, ativo: true },
  { id: 'tag10', nome: 'AWS', cor: '#FF9900', pessoas: 9, ativo: true },
  { id: 'tag11', nome: 'Kubernetes', cor: '#326CE5', pessoas: 6, ativo: true },
  { id: 'tag12', nome: 'Mobile', cor: '#A4C639', pessoas: 5, ativo: true },
  { id: 'tag13', nome: 'iOS', cor: '#000000', pessoas: 3, ativo: true },
  { id: 'tag14', nome: 'Android', cor: '#3DDC84', pessoas: 4, ativo: true },
  { id: 'tag15', nome: 'Machine Learning', cor: '#FF6F00', pessoas: 7, ativo: true },
  { id: 'tag16', nome: 'Data Analysis', cor: '#4285F4', pessoas: 10, ativo: true },
  { id: 'tag17', nome: 'UX Design', cor: '#E91E63', pessoas: 6, ativo: true },
  { id: 'tag18', nome: 'Product Management', cor: '#FF5722', pessoas: 8, ativo: true },
  { id: 'tag19', nome: 'Agile', cor: '#00BCD4', pessoas: 25, ativo: true },
  { id: 'tag20', nome: 'Scrum Master', cor: '#009688', pessoas: 4, ativo: true },
  { id: 'tag21', nome: 'DevOps', cor: '#607D8B', pessoas: 8, ativo: true },
  { id: 'tag22', nome: 'Security', cor: '#F44336', pessoas: 5, ativo: true },
  { id: 'tag23', nome: 'Technical Writer', cor: '#9C27B0', pessoas: 0, ativo: true },
  { id: 'tag24', nome: 'Tester', cor: '#CDDC39', pessoas: 0, ativo: true },
]

const colorPresets = [
  { name: 'Orange Kaiju', color: '#FF7A00' },
  { name: 'Night Blue', color: '#1A2734' },
  { name: 'Cyan Byte', color: '#00C8FF' },
  { name: 'Purple', color: '#9333EA' },
  { name: 'Green', color: '#10B981' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Yellow', color: '#F59E0B' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Teal', color: '#14B8A6' },
]

const mockPeople = [
  { id: '1', nome: 'Maria Santos', avatar: '/diverse-woman-portrait.png' },
  { id: '2', nome: 'João Silva', avatar: '/man.jpg' },
  { id: '3', nome: 'Ana Costa', avatar: '/tech-woman.png' },
  { id: '4', nome: 'Pedro Lima', avatar: '/engineer-man.png' },
  { id: '5', nome: 'Carla Mendes', avatar: '/developer-woman.png' },
]

export default function TagsPage() {
  const { toast } = useToast()
  const [tags, setTags] = useState(mockTags)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [filterBy, setFilterBy] = useState<'all' | 'used' | 'unused'>('all')

  // Modal states
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bulkRemoveModalOpen, setBulkRemoveModalOpen] = useState(false)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)

  const [selectedTag, setSelectedTag] = useState<typeof mockTags[0] | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#FF7A00',
  })
  const [removeFromAll, setRemoveFromAll] = useState(false)

  // Stats
  const totalTags = tags.length
  const usedTags = tags.filter((t) => t.pessoas > 0).length
  const unusedTags = tags.filter((t) => t.pessoas === 0).length
  const mostUsedTag = tags.reduce((prev, current) =>
    prev.pessoas > current.pessoas ? prev : current
  )
  const totalPeopleWithTags = 89

  // Filtering and sorting
  const filteredAndSortedTags = tags
    .filter((tag) => {
      const matchesSearch = tag.nome.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter =
        filterBy === 'all' ||
        (filterBy === 'used' && tag.pessoas > 0) ||
        (filterBy === 'unused' && tag.pessoas === 0)
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.nome.localeCompare(b.nome)
        case 'name-desc':
          return b.nome.localeCompare(a.nome)
        case 'usage-asc':
          return a.pessoas - b.pessoas
        case 'usage-desc':
          return b.pessoas - a.pessoas
        default:
          return 0
      }
    })

  const handleCreateEdit = () => {
    console.log('[v0] Create/Edit tag:', formData)
    toast({
      title: editMode ? 'Tag atualizada!' : 'Tag criada!',
      description: `🦖 ${formData.nome} foi ${editMode ? 'atualizada' : 'criada'} com sucesso!`,
    })
    setCreateEditModalOpen(false)
    setFormData({ nome: '', cor: '#FF7A00' })
    setEditMode(false)
  }

  const handleDelete = () => {
    console.log('[v0] Delete tag:', selectedTag, 'Remove from all:', removeFromAll)
    toast({
      title: 'Tag excluída!',
      description: `Tag removida${selectedTag?.pessoas ? ` de ${selectedTag.pessoas} pessoas` : ''}`,
    })
    setDeleteModalOpen(false)
    setRemoveFromAll(false)
  }

  const handleBulkRemove = () => {
    console.log('[v0] Bulk remove tag:', selectedTag)
    toast({
      title: 'Tag removida de todos!',
      description: `${selectedTag?.pessoas} pessoas afetadas`,
    })
    setBulkRemoveModalOpen(false)
  }

  const handleMerge = () => {
    console.log('[v0] Merge tags:', selectedTag)
    toast({
      title: 'Tags mescladas!',
      description: 'Tags foram mescladas com sucesso',
    })
    setMergeModalOpen(false)
  }

  const openCreateModal = () => {
    setFormData({ nome: '', cor: '#FF7A00' })
    setEditMode(false)
    setCreateEditModalOpen(true)
  }

  const openEditModal = (tag: typeof mockTags[0]) => {
    setSelectedTag(tag)
    setFormData({ nome: tag.nome, cor: tag.cor })
    setEditMode(true)
    setCreateEditModalOpen(true)
  }

  const openDetailsModal = (tag: typeof mockTags[0]) => {
    setSelectedTag(tag)
    setDetailsModalOpen(true)
  }

  const openDeleteModal = (tag: typeof mockTags[0]) => {
    setSelectedTag(tag)
    setDeleteModalOpen(true)
  }

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>{'>'}</span>
            <Link href="/configuracoes" className="hover:text-foreground">
              Configurações
            </Link>
            <span>{'>'}</span>
            <span className="text-foreground">Tags</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Tags</h1>
              <ShieldAlert className="h-5 w-5 text-error" />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Por Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Por Nome (Z-A)</SelectItem>
                  <SelectItem value="usage-desc">Mais Usadas</SelectItem>
                  <SelectItem value="usage-asc">Menos Usadas</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={openCreateModal} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90">
                <Plus className="h-4 w-4 mr-2" />
                Criar Tag
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Tags</p>
                <p className="text-3xl font-bold mt-1">{totalTags}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {usedTags} em uso, {unusedTags} não usadas
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                <Tag className="h-6 w-6 text-[#FF7A00]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mais Usada</p>
                <p className="text-3xl font-bold mt-1">{mostUsedTag.nome}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  em {mostUsedTag.pessoas} pessoas
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#00C8FF]/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#00C8FF]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pessoas com Tags</p>
                <p className="text-3xl font-bold mt-1">{totalPeopleWithTags}</p>
                <p className="text-xs text-muted-foreground mt-1">70% do time</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#10B981]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          <Button
            variant={filterBy === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBy('all')}
          >
            Todas
          </Button>
          <Button
            variant={filterBy === 'used' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBy('used')}
          >
            Em Uso
          </Button>
          <Button
            variant={filterBy === 'unused' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBy('unused')}
          >
            Não Usadas
          </Button>
        </div>

        {/* Tags Grid */}
        {filteredAndSortedTags.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `Nenhuma tag encontrada para "${searchQuery}"`
                : 'Comece criando sua primeira tag'}
            </p>
            {!searchQuery && (
              <Button onClick={openCreateModal} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tag
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedTags.map((tag) => (
              <div
                key={tag.id}
                className="group relative rounded-lg border-2 px-6 py-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                style={{
                  backgroundColor: hexToRgba(tag.cor, 0.1),
                  borderColor: tag.cor,
                  opacity: tag.pessoas === 0 ? 0.5 : 1,
                }}
                onClick={() => openDetailsModal(tag)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.cor }}
                  />
                  <span className="text-lg font-semibold">{tag.nome}</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {tag.pessoas > 0 ? `em ${tag.pessoas} pessoas` : 'Não usada'}
                </p>

                {tag.pessoas === 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Não usada
                  </Badge>
                )}

                {/* Action buttons on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(tag)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {tag.pessoas === 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteModal(tag)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Menu */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-[#FF7A00] hover:bg-[#FF7A00]/90 shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Tag Rápida
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('[v0] Import tags')}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('[v0] Export tags')}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Lista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={createEditModalOpen} onOpenChange={setCreateEditModalOpen}>
        <DialogContent 
          onInteractOutside={() => setCreateEditModalOpen(false)}
          onEscapeKeyDown={() => setCreateEditModalOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>{editMode ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Nome da Tag */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome da Tag <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Frontend, React, Leadership"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.nome.length}/30 caracteres
              </p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Cor da Tag</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    className="h-12 rounded-lg border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: preset.color,
                      borderColor:
                        formData.cor === preset.color ? '#1A2734' : 'transparent',
                    }}
                    onClick={() => setFormData({ ...formData, cor: preset.color })}
                    title={preset.name}
                  />
                ))}
              </div>

              <div className="flex gap-2 items-center mt-2">
                <Input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <Label>Preview</Label>
              <div className="flex flex-wrap gap-3">
                {/* Small preview */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
                  style={{
                    backgroundColor: hexToRgba(formData.cor, 0.1),
                    borderColor: formData.cor,
                    color: formData.cor,
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: formData.cor }}
                  />
                  {formData.nome || 'Tag'}
                </div>

                {/* Medium preview */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold border-2"
                  style={{
                    backgroundColor: hexToRgba(formData.cor, 0.15),
                    borderColor: formData.cor,
                    color: formData.cor,
                  }}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: formData.cor }}
                  />
                  {formData.nome || 'Tag'}
                </div>

                {/* Large preview */}
                <div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-bold border-2"
                  style={{
                    backgroundColor: hexToRgba(formData.cor, 0.2),
                    borderColor: formData.cor,
                  }}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: formData.cor }}
                  />
                  <span style={{ color: formData.cor }}>{formData.nome || 'Tag'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateEdit}
              disabled={!formData.nome}
              className="bg-[#FF7A00] hover:bg-[#FF7A00]/90"
            >
              Salvar Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: selectedTag?.cor }}
              />
              {selectedTag?.nome} - Detalhes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tag Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Informações da Tag</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedTag?.nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cor</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: selectedTag?.cor }}
                    />
                    <span className="font-mono">{selectedTag?.cor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Criação</p>
                  <p className="font-medium">15 de jan. de 2024</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Último Uso</p>
                  <p className="font-medium">há 2 dias</p>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-3">
              <h3 className="font-semibold">Estatísticas de Uso</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-2xl font-bold">{selectedTag?.pessoas}</p>
                  <p className="text-sm text-muted-foreground">Total de pessoas</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Times usando</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-2xl font-bold">React</p>
                  <p className="text-sm text-muted-foreground">Mais comum com</p>
                </div>
              </div>
            </div>

            {/* People with this Tag */}
            <div className="space-y-3">
              <h3 className="font-semibold">Pessoas com esta Tag</h3>
              <div className="flex items-center gap-2">
                {mockPeople.map((person) => (
                  <Avatar key={person.id} className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={person.avatar || "/placeholder.svg"} alt={person.nome} />
                    <AvatarFallback>{person.nome[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {selectedTag && selectedTag.pessoas > mockPeople.length && (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    +{selectedTag.pessoas - mockPeople.length}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => console.log('[v0] View all people with tag')}
              >
                Ver Todas as Pessoas
              </Button>
              {selectedTag && selectedTag.pessoas > 0 && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setDetailsModalOpen(false)
                    setBulkRemoveModalOpen(true)
                  }}
                >
                  Remover de Todos
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailsModalOpen(false)
                  if (selectedTag) openEditModal(selectedTag)
                }}
              >
                Editar Tag
              </Button>
              <Button onClick={() => setDetailsModalOpen(false)}>Fechar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Tag?</DialogTitle>
            <DialogDescription>
              {selectedTag && selectedTag.pessoas > 0 ? (
                <div className="space-y-4 pt-4">
                  <p className="text-yellow-600 font-medium">
                    ⚠️ Tag usada em {selectedTag.pessoas} pessoas. Remover automaticamente
                    de todos?
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="removeFromAll"
                      checked={removeFromAll}
                      onCheckedChange={(checked) => setRemoveFromAll(checked as boolean)}
                    />
                    <label htmlFor="removeFromAll" className="text-sm cursor-pointer">
                      Sim, remover de todas as pessoas
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              ) : (
                <p className="pt-4">Tag não está em uso. Confirmar exclusão?</p>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={selectedTag && selectedTag.pessoas > 0 && !removeFromAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Modal */}
      <Dialog open={bulkRemoveModalOpen} onOpenChange={setBulkRemoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover &apos;{selectedTag?.nome}&apos; de Todos?</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 pt-4">
                <p className="text-yellow-600 font-medium">
                  Esta tag será removida de {selectedTag?.pessoas} pessoas
                </p>

                <div className="max-h-32 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {mockPeople.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={person.avatar || "/placeholder.svg"} alt={person.nome} />
                        <AvatarFallback>{person.nome[0]}</AvatarFallback>
                      </Avatar>
                      <span>{person.nome}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground font-medium">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRemoveModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkRemove}>
              Remover de Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Tags Modal */}
      <Dialog open={mergeModalOpen} onOpenChange={setMergeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesclar Tags</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 pt-4">
                <p>Mesclar esta tag com outra existente</p>

                <div className="space-y-2">
                  <Label>Tag de Origem</Label>
                  <Input value={selectedTag?.nome} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Tag de Destino</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tags
                        .filter((t) => t.id !== selectedTag?.id)
                        .map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: tag.cor }}
                              />
                              {tag.nome}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p>
                    Todas as pessoas com &apos;{selectedTag?.nome}&apos; receberão a tag
                    de destino. &apos;{selectedTag?.nome}&apos; será excluída.
                  </p>
                  <p className="font-medium mt-2">
                    {selectedTag?.pessoas} pessoas serão afetadas
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMerge} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90">
              Mesclar Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
