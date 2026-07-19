'use client'

import React from 'react'

interface BlueprintTabsProps {
  activeTab: 'planner' | 'blueprint'
  setActiveTab: (tab: 'planner' | 'blueprint') => void
  hasBlueprint: boolean
}

export function BlueprintTabs({ activeTab, setActiveTab, hasBlueprint }: BlueprintTabsProps) {
  return (
    <div className="flex border-b border-white/5 space-x-6 text-sm font-semibold">
      <button
        onClick={() => setActiveTab('planner')}
        className={`pb-3 transition-colors ${
          activeTab === 'planner'
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-white'
        }`}
      >
        Project Planner
      </button>
      <button
        onClick={() => {
          if (hasBlueprint) setActiveTab('blueprint')
        }}
        disabled={!hasBlueprint}
        className={`pb-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          activeTab === 'blueprint'
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-white'
        }`}
      >
        Blueprint
      </button>
    </div>
  )
}
