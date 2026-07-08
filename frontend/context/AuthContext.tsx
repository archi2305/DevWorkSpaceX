'use client'

import React, { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService, UserLoginInput, UserResponse } from '../services/auth'

export interface AuthContextType {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: UserLoginInput) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const profile = await authService.getCurrentUser()
      setUser(profile)
    } catch (error) {
      // Clear invalid credentials
      localStorage.removeItem('token')
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
      setUser(null)
    }
  }

  // Load session from localStorage on start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        await refreshUser()
      }
      setIsLoading(false)
    }
    initializeAuth()
  }, [])

  const login = async (credentials: UserLoginInput) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      localStorage.setItem('token', response.access_token)
      // Set session cookie for middleware route protection (expires in 1 hour)
      document.cookie = `token=${response.access_token}; path=/; max-age=3600; SameSite=Lax`
      await refreshUser()
      router.push('/') // Redirect to dashboard
    } catch (error) {
      localStorage.removeItem('token')
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch (error) {
      console.warn("Logout endpoint failed, clearing local session anyway.", error)
    } finally {
      localStorage.removeItem('token')
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
      setUser(null)
      setIsLoading(false)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
