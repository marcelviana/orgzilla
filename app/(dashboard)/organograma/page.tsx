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
import { ZoomIn, ZoomOut, Minimize2, Maximize, ChevronDown, ChevronRight, Search, Mail, Phone, Briefcase, Users, X, ArrowUpDown, ArrowRightLeft } from 'lucide-react'
import Image from "next/image"

// Mock hierarchy data
const hierarchyData = {
  id: "ceo",
  nome: "Carlos Silva",
  cargo: "CEO",
  nivel: "L16",
  time: "Executivo",
  email: "carlos@orgzilla.com",
  telefone: "(11) 99999-0001",
  avatar: "/executive-man.png",
  relatorios: [
    {
      id: "cto",
      nome: "Maria Santos",
      cargo: "CTO",
      nivel: "L10",
      time: "Tecnologia",
      email: "maria@orgzilla.com",
      telefone: "(11) 99999-0002",
      avatar: "/tech-woman.png",
      relatorios: [
        {
          id: "eng-lead",
          nome: "João Silva",
          cargo: "Engineering Lead",
          nivel: "L6",
          time: "Engenharia",
          email: "joao@orgzilla.com",
          telefone: "(11) 99999-0003",
          avatar: "/engineer-man.png",
          relatorios: [
            {
              id: "eng1",
              nome: "Ana Costa",
              cargo: "Senior Engineer",
              nivel: "L4",
              time: "Frontend",
              email: "ana@orgzilla.com",
              telefone: "(11) 99999-0004",
              avatar: "/developer-woman.png",
              relatorios: [],
            },
            {
              id: "eng2",
              nome: "Pedro Lima",
              cargo: "Senior Engineer",
              nivel: "L4",
              time: "Backend",
              email: "pedro@orgzilla.com",
              telefone: "(11) 99999-0005",
              avatar: "/developer-man.png",
              relatorios: [
                {
                  id: "eng3",
                  nome: "Lucas Oliveira",
                  cargo: "Engineer II",
                  nivel: "L3",
                  time: "Backend",
                  email: "lucas@orgzilla.com",
                  telefone: "(11) 99999-0006",
                  avatar: "/young-developer.png",
                  relatorios: [],
                },
                {
                  id: "eng4",
                  nome: "Mariana Silva",
                  cargo: "Engineer I",
                  nivel: "L2",
                  time: "Backend",
                  email: "mariana@orgzilla.com",
                  telefone: "(11) 99999-0007",
                  avatar: "/junior-developer-woman.jpg",
                  relatorios: [],
                },
              ],
            },
          ],
        },
        {
          id: "data-lead",
          nome: "Julia Mendes",
          cargo: "Data Lead",
          nivel: "L5",
          time: "Dados",
          email: "julia@orgzilla.com",
          telefone: "(11) 99999-0008",
          avatar: "/data-scientist-woman.jpg",
          relatorios: [
            {
              id: "data1",
              nome: "Roberto Alves",
              cargo: "Data Analyst",
              nivel: "L2",
              time: "Dados",
              email: "roberto@orgzilla.com",
              telefone: "(11) 99999-0009",
              avatar: "/analyst-man.png",
              relatorios: [],
            },
          ],
        },
      ],
    },
    {
      id: "cpo",
      nome: "Sofia Oliveira",
      cargo: "CPO",
      nivel: "L10",
      time: "Produto",
      email: "sofia@orgzilla.com",
      telefone: "(11) 99999-0010",
      avatar: "/product-woman.jpg",
      relatorios: [
        {
          id: "pm1",
          nome: "Rafael Costa",
          cargo: "Product Manager",
          nivel: "L4",
          time: "Produto",
          email: "rafael@orgzilla.com",
          telefone: "(11) 99999-0011",
          avatar: "/product-manager-man.jpg",
          relatorios: [],
        },
        {
          id: "design-lead",
          nome: "Camila Santos",
          cargo: "Design Lead",
          nivel: "L5",
          time: "Design",
          email: "camila@orgzilla.com",
          telefone: "(11) 99999-0012",
          avatar: "/stylish-woman.png",
          relatorios: [
            {
              id: "designer1",
              nome: "Bruno Alves",
              cargo: "Designer",
              nivel: "L3",
              time: "Design",
              email: "bruno@orgzilla.com",
              telefone: "(11) 99999-0013",
              avatar: "/designer-man.jpg",
              relatorios: [],
            },
          ],
        },
      ],
    },
  ],
}

type PersonNode = typeof hierarchyData

interface PersonNodeData {
  nome: string
  cargo: string
  nivel: string
  time: string
  email: string
  telefone: string
  avatar?: string
  reportsCount: number
  isExpanded: boolean
  isHighlighted: boolean
  isSelected: boolean
  childrenVisible: boolean
  onClick: () => void
  onToggle: () => void
}

// Custom node component
function PersonNodeComponent({ data }: { data: PersonNodeData }) {
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
          <Image
            src={data.avatar || "/placeholder.svg"}
            alt={data.nome}
            width={isExpanded ? 64 : 48}
            height={isExpanded ? 64 : 48}
            className="rounded-full object-cover"
          />
          {hasReports && !isExpanded && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              +{data.reportsCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-secondary">
            {data.nome}
          </div>
          <div className="text-xs text-gray-600 truncate">{data.cargo}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded">
              {data.nivel}
            </span>
            <span className="text-xs text-gray-500">{data.time}</span>
          </div>
          {isExpanded && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{data.email}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{data.telefone}</span>
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
  person: PersonNodeComponent,
}

export default function OrganogramaPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["ceo"]))
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  // Build tree structure
  const buildTree = useCallback(
    (person: PersonNode, _parentId: string | null = null, level = 0, xOffset = 0): { nodes: Node[]; edges: Edge[]; width: number } => {
      const nodeId = person.id
      const isExpanded = expandedNodes.has(nodeId)
      const childrenVisible = isExpanded || level === 0
      const reportsCount = person.relatorios?.length || 0
      const isHighlighted = searchQuery && person.nome.toLowerCase().includes(searchQuery.toLowerCase())

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
          ...person,
          isExpanded: isExpanded,
          isSelected: selectedPerson?.id === nodeId,
          isHighlighted,
          childrenVisible,
          reportsCount,
          onClick: () => {
            setSelectedPerson(person)
            setExpandedNodes((prev) => {
              const newSet = new Set(prev)
              if (newSet.has(nodeId)) {
                newSet.delete(nodeId)
              } else {
                newSet.add(nodeId)
              }
              return newSet
            })
          },
          onToggle: () => {
            setExpandedNodes((prev) => {
              const newSet = new Set(prev)
              if (newSet.has(nodeId)) {
                newSet.delete(nodeId)
              } else {
                newSet.add(nodeId)
              }
              return newSet
            })
          },
        },
      }

      let nodes = [node]
      let edges: Edge[] = []
      let currentOffset = xOffset

      if (childrenVisible && person.relatorios && person.relatorios.length > 0) {
        const childResults = person.relatorios.map((child) => {
          const result = buildTree(child, nodeId, level + 1, currentOffset)
          currentOffset += result.width + horizontalSpacing
          return result
        })

        childResults.forEach((result) => {
          nodes = [...nodes, ...result.nodes]
          edges = [...edges, ...result.edges]
        })

        person.relatorios.forEach((child) => {
          edges.push({
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

        return { nodes, edges, width: totalWidth }
      }

      return { nodes, edges, width: 280 }
    },
    [expandedNodes, selectedPerson, searchQuery, layoutDirection]
  )

  // Update tree when dependencies change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildTree(hierarchyData)
    setNodes(newNodes)
    setEdges(newEdges)
    setTimeout(() => void fitView({ padding: 0.2, duration: 400 }), 100)
  }, [buildTree, setNodes, setEdges, fitView])

  const handleExpandAll = () => {
    const allNodeIds = new Set<string>()
    const traverse = (node: PersonNode) => {
      allNodeIds.add(node.id)
      node.relatorios?.forEach(traverse)
    }
    traverse(hierarchyData)
    setExpandedNodes(allNodeIds)
  }

  const handleCollapseAll = () => {
    setExpandedNodes(new Set(["ceo"]))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query) {
      // Auto-expand path to found node
      const findAndExpandPath = (node: PersonNode, path: string[] = []): boolean => {
        if (node.nome.toLowerCase().includes(query.toLowerCase())) {
          path.forEach((id) => {
            setExpandedNodes((prev) => new Set([...prev, id]))
          })
          return true
        }
        if (node.relatorios) {
          for (const child of node.relatorios) {
            if (findAndExpandPath(child, [...path, node.id])) {
              return true
            }
          }
        }
        return false
      }
      findAndExpandPath(hierarchyData)
    }
  }

  const getBreadcrumb = (person: PersonNode | null): string[] => {
    if (!person) return []
    const path: string[] = []
    const findPath = (node: PersonNode, target: PersonNode, currentPath: string[] = []): boolean => {
      if (node.id === target.id) {
        path.push(...currentPath, node.nome)
        return true
      }
      if (node.relatorios) {
        for (const child of node.relatorios) {
          if (findPath(child, target, [...currentPath, node.nome])) {
            return true
          }
        }
      }
      return false
    }
    findPath(hierarchyData, person)
    return path
  }

  return (
    <DashboardShell>
      <div className={`flex flex-col h-screen ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-secondary">Organograma</h1>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pessoa..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Layout direction */}
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

            {/* Expand/Collapse */}
            <button
              onClick={handleExpandAll}
              className="px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
            >
              Expandir tudo
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
            >
              Recolher tudo
            </button>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 border-l pl-2">
              <button
                onClick={() => void zoomIn({ duration: 400 })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => void zoomOut({ duration: 400 })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => void fitView({ padding: 0.2, duration: 400 })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ajustar à tela"
              >
                <Minimize2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tela cheia"
              >
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
            defaultEdgeOptions={{
              type: ConnectionLineType.Step,
            }}
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

        {/* Person Detail Sidebar */}
        {selectedPerson && (
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary">Detalhes</h2>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <Image
                  src={selectedPerson.avatar || "/placeholder.svg"}
                  alt={selectedPerson.nome}
                  width={96}
                  height={96}
                  className="rounded-full object-cover mb-4"
                />
                <h3 className="text-lg font-semibold text-secondary text-center">
                  {selectedPerson.nome}
                </h3>
                <p className="text-sm text-gray-600 text-center">{selectedPerson.cargo}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                    {selectedPerson.nivel}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {selectedPerson.time}
                  </span>
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Caminho hierárquico</div>
                <div className="text-sm text-secondary">
                  {getBreadcrumb(selectedPerson).join(" → ")}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-5 h-5 text-accent" />
                  <span className="text-gray-700">{selectedPerson.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-5 h-5 text-accent" />
                  <span className="text-gray-700">{selectedPerson.telefone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-5 h-5 text-accent" />
                  <span className="text-gray-700">{selectedPerson.time}</span>
                </div>
              </div>

              {/* Direct Reports */}
              {selectedPerson.relatorios && selectedPerson.relatorios.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-secondary">
                      Subordinados diretos ({selectedPerson.relatorios.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedPerson.relatorios.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => setSelectedPerson(report)}
                      >
                        <Image
                          src={report.avatar || "/placeholder.svg"}
                          alt={report.nome}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-secondary truncate">
                            {report.nome}
                          </div>
                          <div className="text-xs text-gray-600 truncate">{report.cargo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => console.log("View profile:", selectedPerson.id)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Ver perfil completo
                </button>
                <button
                  onClick={() => console.log("Send message:", selectedPerson.id)}
                  className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Enviar mensagem
                </button>
                <button
                  onClick={() => console.log("Edit:", selectedPerson.id)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Editar informações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
