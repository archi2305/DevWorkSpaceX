import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-[#0d0d0e]/60 space-y-4 text-left">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4.5 w-1/3" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="border-t border-white/5 pt-3 flex justify-between">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3.5 w-1/5" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-[#0d0d0e]/80 space-y-6 text-left">
      <div className="border-b border-white/5 pb-3">
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  )
}
