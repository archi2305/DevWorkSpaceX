'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface FeaturesSectionProps {
  features: string[]
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Sparkles className="h-4.5 w-4.5 text-primary" /> Features
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, idx) => (
          <div key={idx} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
            <p className="text-sm font-semibold text-white leading-relaxed">{feature}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
