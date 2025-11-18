"use client"

import { ReactFlowProvider } from "@xyflow/react"

export default function OrganogramaLayout({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
