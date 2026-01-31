import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Allows cookies to be sent
  timeout: 15000,
})

// REMOVE the entire development block - it's breaking production!
// if (process.env.NODE_ENV === 'development') {
//   console.log('🔧 DEVELOPMENT MODE: Enhanced API handling')
//   ... rest of the override code
// }

// Instead, use a proper interceptor
api.interceptors.request.use(
  (config) => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          // If you're using token-based auth
          if (userData.token) {
            config.headers.Authorization = `Bearer ${userData.token}`
          }
          // If you're using basic auth (not recommended)
          else if (userData.username && userData.password) {
            config.auth = {
              username: userData.username,
              password: userData.password
            }
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Keep your response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication failed, redirecting...')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('cart')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user:', error)
    return null
  }
}

// Helper functions WITHOUT development overrides
export const authGet = async (url) => {
  const user = getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  
  return api.get(url) // Interceptor will add auth
}

export const authPost = async (url, data = {}) => {
  const user = getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  
  return api.post(url, data) // Interceptor will add auth
}

export default api