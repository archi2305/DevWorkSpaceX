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
      await refreshUser()
      router.push('/') // Redirect to dashboard
    } catch (error) {
      localStorage.removeItem('token')
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
