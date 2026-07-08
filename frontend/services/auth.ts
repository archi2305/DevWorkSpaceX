import { api } from './api'

// Define interfaces matching backend schemas
export interface UserRegisterInput {
  email: string
  full_name: string
  password: string
  profile_image?: string
}

export interface UserLoginInput {
  email: string
  password: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string
  profile_image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const authService = {
  /**
   * Send registration request to the backend.
   */
  async register(data: UserRegisterInput): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/auth/register', data)
    return response.data
  },

  /**
   * Log in user and fetch access token.
   */
  async login(data: UserLoginInput): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  /**
   * Acknowledge logout with the backend.
   */
  async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/logout')
    return response.data
  },

  /**
   * Fetch authenticated user details.
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/users/me')
    return response.data
  },
}
