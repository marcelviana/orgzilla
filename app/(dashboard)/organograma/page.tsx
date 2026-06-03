"use client"

import { useState, useCallback, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MiniMap,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { ZoomIn, ZoomOut, Minimize2, Maximize, ChevronDown, ChevronRight, Search, Mail, Briefcase, Users, X, ArrowUpDown, ArrowRightLeft } from 'lucide-react'
import { getOrganograma } from "@/app/actions/times.actions"
import type { TimeHierarquico } from "@/lib/services/time.service"
import { handleError } from "@/lib/errors/error-handler"
import { toast } from "@/lib/ui/toast-config"

interface TimeNodeData extends Record<string, unknown> {
  nomeTime: string
  nomeGestor: string | null
  emailGestor: string | null
  membros: number
  reportsCount: number
  isExpanded: boolean
  isHighlighted: boolean
  isSelected: boolean
  childrenVisible: boolean
  onClick: () => void
  onToggle: () => void
}

function TimeNodeComponent({ data }: { data: TimeNodeData }) {
  const isExpanded = data.isExpanded
  const hasReports = data.reportsCount > 0

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 border-2 ${
        data.isHighlighted ? "border-accent" : "border-transparent"
      } ${data.isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      onClick={data.onClick}
    >
      <div className="p-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-secondary" />
          </div>
          {hasReports && !isExpanded && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              +{data.reportsCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-secondary">
            {data.nomeTime}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {data.nomeGestor ?? "Sem gestor"}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
              {data.membros} {data.membros === 1 ? "membro" : "membros"}
            </span>
          </div>
          {isExpanded && data.emailGestor && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{data.emailGestor}</span>
              </div>
            </div>
          )}
        </div>
        {hasReports && (
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation()
              data.onToggle()
            }}
          >
            {data.childrenVisible ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

const nodeTypes = {
  person: TimeNodeComponent,
}

export default function OrganogramaPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [timesRaiz, setTimesRaiz] = useState<TimeHierarquico[]>([])
  const [selectedTime, setSelectedTime] = useState<TimeHierarquico | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  useEffect(() => {
    async function carregarOrganograma() {
      setIsLoading(true)
      const resultado = await getOrganograma()
      if (!resultado.success || !resultado.data) {
        const appError = handleError(new Error(resultado.error ?? "Erro desconhecido"), "database")
        toast.error(appError)
        setIsLoading(false)
        return
      }
      setTimesRaiz(resultado.data)
      setIsLoading(false)
    }
    void carregarOrganograma()
  }, [])

  useEffect(() => {
    if (timesRaiz.length > 0) {
      setExpandedNodes(new Set(timesRaiz.map((t) => t.id)))
    }
  }, [timesRaiz])

  const buildTree = useCallback(
    (
      time: TimeHierarquico,
      _parentId: string | null = null,
      level = 0,
      xOffset = 0
    ): { nodes: Node[]; edges: Edge[]; width: number } => {
      const nodeId = time.id
      const isExpanded = expandedNodes.has(nodeId)
      const childrenVisible = isExpanded || level === 0
      const reportsCount = time.filhos?.length ?? 0
      const isHighlighted = searchQuery
        ? time.nome.toLowerCase().includes(searchQuery.toLowerCase())
        : false

      const horizontalSpacing = 280
      const verticalSpacing = layoutDirection === "TB" ? 150 : 200

      const node: Node = {
        id: nodeId,
        type: "person",
        position:
          layoutDirection === "TB"
            ? { x: xOffset, y: level * verticalSpacing }
            : { x: level * verticalSpacing, y: xOffset },
        data: {
          nomeTime: time.nome,
          nomeGestor: time.gestor?.nome ?? null,
          emailGestor: time.gestor?.email_corporativo ?? null,
          membros: time.membros,
          isExpanded,
          isSelected: selectedTime?.id === nodeId,
          isHighlighted,
          childrenVisible,
          reportsCount,
          onClick: () => {
            setSelectedTime(time)
            setExpandedNodes((prev) => {
              const next = new Set(prev)
              if (next.has(nodeId)) next.delete(nodeId)
              else next.add(nodeId)
              return next
            })
          },
          onToggle: () => {
            setExpandedNodes((prev) => {
              const next = new Set(prev)
              if (next.has(nodeId)) next.delete(nodeId)
              else next.add(nodeId)
              return next
            })
          },
        },
      }

      let allNodes = [node]
      let allEdges: Edge[] = []
      let currentOffset = xOffset

      if (childrenVisible && time.filhos && time.filhos.length > 0) {
        const childResults = time.filhos.map((child) => {
          const result = buildTree(child, nodeId, level + 1, currentOffset)
          currentOffset += result.width + horizontalSpacing
          return result
        })

        childResults.forEach((result) => {
          allNodes = [...allNodes, ...result.nodes]
          allEdges = [...allEdges, ...result.edges]
        })

        time.filhos.forEach((child) => {
          allEdges.push({
            id: `${nodeId}-${child.id}`,
            source: nodeId,
            target: child.id,
            type: ConnectionLineType.Step,
            style: { stroke: "#1A2734", strokeWidth: 2 },
            animated: false,
          })
        })

        const totalWidth = currentOffset - xOffset - horizontalSpacing
        const centerOffset = (totalWidth - 280) / 2
        node.position.x += centerOffset

        return { nodes: allNodes, edges: allEdges, width: totalWidth }
      }

      return { nodes: allNodes, edges: allEdges, width: 280 }
    },
    [expandedNodes, selectedTime, searchQuery, layoutDirection]
  )

  useEffect(() => {
    if (timesRaiz.length === 0) return
    let allNodes: Node[] = []
    let allEdges: Edge[] = []
    let xOffset = 0
    for (const raiz of timesRaiz) {
      const { nodes: n, edges: e, width } = buildTree(raiz, null, 0, xOffset)
      allNodes = [...allNodes, ...n]
      allEdges = [...allEdges, ...e]
      xOffset += width + 100
    }
    setNodes(allNodes)
    setEdges(allEdges)
    setTimeout(() => void fitView({ padding: 0.2, duration: 400 }), 100)
  }, [timesRaiz, buildTree, setNodes, setEdges, fitView])

  const handleExpandAll = () => {
    const allIds = new Set<string>()
    const traverse = (time: TimeHierarquico) => {
      allIds.add(time.id)
      time.filhos?.forEach(traverse)
    }
    timesRaiz.forEach(traverse)
    setExpandedNodes(allIds)
  }

  const handleCollapseAll = () => {
    setExpandedNodes(new Set(timesRaiz.map((t) => t.id)))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query) {
      const findAndExpandPath = (time: TimeHierarquico, path: string[] = []): boolean => {
        if (time.nome.toLowerCase().includes(query.toLowerCase())) {
          path.forEach((id) => {
            setExpandedNodes((prev) => new Set([...prev, id]))
          })
          return true
        }
        if (time.filhos) {
          for (const child of time.filhos) {
            if (findAndExpandPath(child, [...path, time.id])) return true
          }
        }
        return false
      }
      timesRaiz.forEach((raiz) => findAndExpandPath(raiz))
    }
  }

  const getBreadcrumb = (target: TimeHierarquico | null): string[] => {
    if (!target) return []
    const path: string[] = []
    const findPath = (time: TimeHierarquico, currentPath: string[] = []): boolean => {
      if (time.id === target.id) {
        path.push(...currentPath, time.nome)
        return true
      }
      if (time.filhos) {
        for (const child of time.filhos) {
          if (findPath(child, [...currentPath, time.nome])) return true
        }
      }
      return false
    }
    timesRaiz.forEach((raiz) => findPath(raiz))
    return path
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando organograma... 🦖</p>
        </div>
      </DashboardShell>
    )
  }

  if (timesRaiz.length === 0) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum time encontrado. Crie o primeiro time!</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className={`flex flex-col h-screen ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-secondary">Organograma</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar time..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Alternar direção"
            >
              {layoutDirection === "TB" ? (
                <ArrowUpDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ArrowRightLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <button onClick={handleExpandAll} className="px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
              Expandir tudo
            </button>
            <button onClick={handleCollapseAll} className="px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
              Recolher tudo
            </button>

            <div className="flex items-center gap-1 border-l pl-2">
              <button onClick={() => void zoomIn({ duration: 400 })} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Aumentar zoom">
                <ZoomIn className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => void zoomOut({ duration: 400 })} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Diminuir zoom">
                <ZoomOut className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => void fitView({ padding: 0.2, duration: 400 })} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ajustar à tela">
                <Minimize2 className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Tela cheia">
                <Maximize className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ type: ConnectionLineType.Step }}
          >
            <Background color="#1A2734" gap={20} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                if (node.data.isSelected) return "#FF7A00"
                if (node.data.isHighlighted) return "#00C8FF"
                return "#1A2734"
              }}
              maskColor="rgba(244, 245, 247, 0.6)"
            />
          </ReactFlow>
        </div>

        {/* Time Detail Sidebar */}
        {selectedTime && (
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary">Detalhes do time</h2>
                <button onClick={() => setSelectedTime(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="w-12 h-12 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-secondary text-center">{selectedTime.nome}</h3>
                <p className="text-sm text-gray-600 text-center">{selectedTime.gestor?.nome ?? "Sem gestor"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {selectedTime.membros} {selectedTime.membros === 1 ? "membro" : "membros"}
                  </span>
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Caminho hierárquico</div>
                <div className="text-sm text-secondary">{getBreadcrumb(selectedTime).join(" → ")}</div>
              </div>

              {/* Gestor info */}
              {selectedTime.gestor && (
                <div className="space-y-3 mb-6">
                  {selectedTime.gestor.email_corporativo && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-5 h-5 text-accent" />
                      <span className="text-gray-700">{selectedTime.gestor.email_corporativo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-5 h-5 text-accent" />
                    <span className="text-gray-700">Gestor: {selectedTime.gestor.nome}</span>
                  </div>
                </div>
              )}

              {/* Subtimes */}
              {selectedTime.filhos && selectedTime.filhos.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-secondary">
                      Subtimes ({selectedTime.filhos.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedTime.filhos.map((filho) => (
                      <div
                        key={filho.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => setSelectedTime(filho)}
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-secondary truncate">{filho.nome}</div>
                          <div className="text-xs text-gray-600 truncate">
                            {filho.gestor?.nome ?? "Sem gestor"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
