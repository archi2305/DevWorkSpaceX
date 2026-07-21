'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth'
import { formatApiError } from '@/lib/error'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await authService.register({
        email,
        full_name: fullName,
        password,
        profile_image: profileImage || undefined,
      })
      // Successful registration: Redirect to login page
      router.push('/login')
    } catch (err: any) {
      setError(formatApiError(err, 'Registration failed. Please check inputs and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] px-4 overflow-hidden">
      {/* Background blur decorative circles */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 shadow-2xl space-y-5">
          
          {/* Logo & Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 shadow-md shadow-primary/20 mb-1">
              <span className="text-base font-bold text-primary-foreground">DW</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Create an account
            </h2>
            <p className="text-sm text-[#a1a1aa]">
              Join DevWorkspace X to start engineering
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-xs font-medium text-[#e4e4e7]">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
                className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-[#e4e4e7]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[#e4e4e7]">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                disabled={loading}
                className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profileImage" className="text-xs font-medium text-[#e4e4e7]">
                Profile Image URL (Optional)
              </label>
              <input
                id="profileImage"
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                disabled={loading}
                className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder-[#52525b] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center text-xs text-[#71717a] pt-2 border-t border-white/5">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
