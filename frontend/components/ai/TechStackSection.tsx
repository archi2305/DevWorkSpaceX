'use client'

import React from 'react'
import { Server } from 'lucide-react'

interface TechStackSectionProps {
  frontend: string
  backend: string
  database: string
}

export function TechStackSection({ frontend, backend, database }: TechStackSectionProps) {
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Server className="h-4.5 w-4.5 text-primary" /> Tech Stack
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Frontend</span>
          <p className="text-base font-bold text-white mt-1">{frontend}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Backend</span>
          <p className="text-base font-bold text-white mt-1">{backend}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Database</span>
          <p className="text-base font-bold text-white mt-1">{database}</p>
        </div>
      </div>
    </div>
  )
}
