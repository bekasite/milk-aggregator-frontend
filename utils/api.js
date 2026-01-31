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
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          
          if (userData.username && userData.password) {
            // EXCLUDE registration endpoint from auth injection
            const isRegistrationEndpoint = config.url === '/auth/register' || 
                                         config.url.includes('/auth/register')
            
            // Don't add admin credentials to registration requests
            if (!isRegistrationEndpoint) {
              // FOR ADMIN ENDPOINTS: Use current admin user's credentials
              const isAdminEndpoint = config.url.includes('/auth/users') || 
                                     config.url.includes('/auth/users/') ||
                                     (config.url.includes('/orders') && 
                                      !config.url.includes('/my-orders') && 
                                      !config.url.includes('/delivery'))
              
              if (isAdminEndpoint) {
                console.log(`🔐 Using current admin (${userData.username}) for: ${config.url}`)
              }
              
              // Add credentials based on request type
              if (config.method === 'get' || config.method === 'delete') {
                config.params = {
                  ...config.params,
                  username: userData.username,
                  password: userData.password
                }
              } else if (config.method === 'post' || config.method === 'put') {
                if (config.data && typeof config.data === 'object') {
                  config.data = {
                    ...config.data,
                    username: userData.username,
                    password: userData.password
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing user:', error)
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Keep your response interceptor
// api.js - Add more detailed logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    console.log('❌ API Error Details:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    })
    
    if (error.response?.status === 401) {
      console.log('🔄 Authentication failed, redirecting to login...')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('cart')
        // Use replace instead of href to avoid redirect loops
        window.location.replace('/login')
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