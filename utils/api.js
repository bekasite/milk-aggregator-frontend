import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

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

// DEVELOPMENT MODE OVERRIDES
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 DEVELOPMENT MODE: Enhanced API handling')
  
  const originalGet = api.get
  api.get = function(url, config = {}) {
    console.log(`🌐 GET ${url}`)
    
    const user = getCurrentUser()
    
    // Add auth credentials based on endpoint
    let authUrl = url
    
    if (user) {
      if (url.includes('/orders/my-orders')) {
        authUrl = `${url}?username=${user.username}&password=${user.password}`
        console.log(`   👤 Customer auth: ${user.username}`)
      }
      else if (url.includes('/orders/delivery')) {
        authUrl = `${url}?username=${user.username}&password=${user.password}`
        console.log(`   🚚 Delivery auth: ${user.username}`)
      }
      else if (url.includes('/orders') && !url.includes('/my-orders') && !url.includes('/delivery')) {
        // For admin orders, use admin credentials
        authUrl = `${url}?username=admin&password=admin123`
        console.log(`   👑 Admin auth for orders list`)
      }
      else if (url.includes('/auth/users')) {
        authUrl = `${url}?username=admin&password=admin123`
        console.log(`   👑 Admin auth for users`)
      }
      else if (url.includes('/delivery/')) {
        authUrl = `${url}?username=admin&password=admin123`
        console.log(`   👑 Admin auth for delivery management`)
      }
    }
    
    return originalGet.call(this, authUrl, config)
  }
// In api.js, update the PUT interceptor:

const originalPut = api.put
api.put = function(url, data = {}, config = {}) {
  console.log(`🔄 PUT ${url}`)
  console.log('📦 Original data:', data)
  
  const user = getCurrentUser()
  
  // SPECIAL HANDLING FOR ORDER ASSIGNMENT
  if (url.includes('/orders/') && url.includes('/assign')) {
    console.log('👑 Order assignment detected')
    
    // Extract deliveryId - it might come as deliveryId or deliveryPersonId
    const deliveryId = data.deliveryId || data.deliveryPersonId
    
    if (!deliveryId) {
      console.error('❌ No deliveryId provided for assignment')
      toast.error('Please select a delivery person')
      return Promise.reject(new Error('Delivery person ID is required'))
    }
    
    // CRITICAL: Send ONLY deliveryId, nothing else
    const assignmentData = { deliveryId }
    
    console.log('   🚚 Sending to backend:', assignmentData)
    return originalPut.call(this, url, assignmentData, config)
  }
  
  // For order status updates, add auth
  else if (url.includes('/orders/') && url.includes('/status')) {
    if (user) {
      data = {
        ...data,
        username: user.username,
        password: user.password
      }
      console.log(`   👤 Status update for: ${user.username}`)
      return originalPut.call(this, url, data, config)
    }
  }
  
  // For product updates, add admin auth
  else if (url.includes('/products/')) {
    data = {
      ...data,
      username: 'admin',
      password: 'admin123'
    }
    console.log('   👑 Using admin credentials for product update')
    return originalPut.call(this, url, data, config)
  }
  
  // For all other PUT requests, pass through as-is
  return originalPut.call(this, url, data, config)
}

  // Override POST for orders
  const originalPost = api.post
  api.post = function(url, data = {}, config = {}) {
    console.log(`📮 POST ${url}`)
    
    // Add auth to order placement
    if (url.includes('/orders') && !url.includes('/my-orders') && !url.includes('/delivery')) {
      const user = getCurrentUser()
      if (user) {
        data = {
          ...data,
          username: user.username,
          password: user.password
        }
        console.log(`   👤 Added auth for order placement: ${user.username}`)
      }
    }
    
    return originalPost.call(this, url, data, config)
  }
}

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    if (error.response) {
      console.error(`❌ API Error ${error.response.status}:`, error.config?.url)
      console.error('Error details:', error.response.data)
      
      if (error.response.status === 401) {
        console.log('Authentication failed, redirecting...')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          localStorage.removeItem('cart')
          window.location.href = '/login'
        }
      }
    } else if (error.request) {
      console.error('❌ No response received:', error.config?.url)
    } else {
      console.error('❌ Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export const authGet = async (url) => {
  const user = getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  
  const authUrl = `${url}?username=${user.username}&password=${user.password}`
  return api.get(authUrl)
}

export const authPost = async (url, data = {}) => {
  const user = getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  
  const requestData = {
    ...data,
    username: user.username,
    password: user.password
  }
  
  return api.post(url, requestData)
}


export default api