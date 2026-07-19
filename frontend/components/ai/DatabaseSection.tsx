'use client'

import React from 'react'
import { Database, Terminal } from 'lucide-react'
import { DatabaseDesignResponse } from '@/services/ai'

interface DatabaseSectionProps {
  databaseDesign: DatabaseDesignResponse
}

export function DatabaseSection({ databaseDesign }: DatabaseSectionProps) {
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Database className="h-4.5 w-4.5 text-primary" /> Database Design
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {databaseDesign.tables?.map((table, tIdx) => (
          <div key={tIdx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary" /> {table.name}
              </h4>
              <p className="text-xs text-muted-foreground">{table.description}</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Columns Schema</span>
              <div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.005] text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="p-2 font-semibold text-muted-foreground">Column</th>
                      <th className="p-2 font-semibold text-muted-foreground">Type</th>
                      <th className="p-2 font-semibold text-muted-foreground text-center">Attributes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns?.map((c, cIdx) => (
                      <tr key={cIdx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.01]">
                        <td className="p-2 font-mono text-white">{c.name}</td>
                        <td className="p-2 font-mono text-muted-foreground">{c.type}</td>
                        <td className="p-2 text-center flex items-center justify-center gap-1">
                          {c.primary_key && <span className="text-[9px] px-1 py-0.25 rounded bg-amber-500/10 text-amber-500 font-bold">PK</span>}
                          {c.unique && <span className="text-[9px] px-1 py-0.25 rounded bg-blue-500/10 text-blue-500 font-bold">UQ</span>}
                          {!c.nullable && <span className="text-[9px] px-1 py-0.25 rounded bg-red-500/10 text-red-500 font-bold">NN</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {databaseDesign.relationships?.length > 0 && (
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Table Relationships</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {databaseDesign.relationships.map((rel, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-white/5 bg-black/20 flex items-center justify-between">
                <span className="font-mono text-white">{rel.from_table}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase shrink-0">{rel.relationship_type}</span>
                <span className="font-mono text-white">{rel.to_table}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
