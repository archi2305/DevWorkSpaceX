'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function InteractiveBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-background select-none">
      {/* Light Mesh grids */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating ambient gradients */}
      <motion.div
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.15, 0.85, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/10 left-1/10 w-[45rem] h-[45rem] rounded-full bg-gradient-to-br from-indigo-500/20 via-primary/15 to-purple-500/10 blur-[130px] opacity-80"
      />

      <motion.div
        animate={{
          x: [0, -70, 40, 0],
          y: [0, 50, -40, 0],
          scale: [1, 0.85, 1.15, 1]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute bottom-1/10 right-1/10 w-[50rem] h-[50rem] rounded-full bg-gradient-to-tr from-purple-500/15 via-blue-500/15 to-emerald-400/15 blur-[140px] opacity-80"
      />
    </div>
  )
}
