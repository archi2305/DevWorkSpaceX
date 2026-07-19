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
          x: [0, 40, -20, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/5 blur-[120px] opacity-70"
      />

      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] rounded-full bg-gradient-to-tr from-purple-500/5 to-primary/10 blur-[130px] opacity-70"
      />
    </div>
  )
}
