import axios from 'axios'

// Resolve the backend URL dynamically or default to port 8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Inject JWT token from localStorage into outgoing HTTP headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Intercept 401 Unauthorized errors to wipe local tokens and force login redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        const currentPath = window.location.pathname
        
        // Auto-redirect if token is invalid and we are not on public auth pages
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
