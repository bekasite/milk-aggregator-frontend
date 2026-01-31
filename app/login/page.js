'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import api from '../../utils/api'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Customer'
  })
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
  
    console.log('🔄 Attempting login with:', {
      username: formData.username,
      password: formData.password
    })
  
    try {
      console.log('📞 Making API call to /auth/login')
      const response = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password
      })
  
      console.log('✅ Login response:', response.data)
      console.log('📦 Full response structure:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      })
  
      const userData = response.data.user
      
      if (!userData) {
        console.error('❌ No user data in response:', response.data)
        toast.error('Invalid response from server')
        return
      }
      
      // IMPORTANT: Save the password in localStorage for future authenticated requests
      userData.password = formData.password
      
      localStorage.setItem('user', JSON.stringify(userData))
      console.log('💾 Saved to localStorage:', userData)
      
      toast.success('Login successful!')
  
      // Redirect based on role
      if (userData.role === 'Admin') router.push('/admin')
      else if (userData.role === 'Delivery') router.push('/delivery')
      else router.push('/customer')
  
    } catch (error) {
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response,
        config: error.config
      })
      
      if (error.response) {
        // Server responded with error
        console.log('📊 Error response data:', error.response.data)
        console.log('📊 Error response status:', error.response.status)
        toast.error(error.response.data?.error || `Login failed (${error.response.status})`)
      } else if (error.request) {
        // Request made but no response
        console.log('📡 No response received. Check CORS/network.')
        toast.error('Cannot connect to server. Check your connection.')
      } else {
        // Something else
        console.log('⚙️ Request setup error:', error.message)
        toast.error('Login failed: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/register', formData)
      toast.success('Registration successful! Please login.')
      setShowRegister(false)
      setFormData({
        username: '',
        password: '',
        role: 'Customer'
      })
    } catch (error) {
      console.error('Register error:', error)
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob ${isMounted ? 'opacity-70' : 'opacity-0'} transition-opacity duration-1000`}></div>
        <div className={`absolute top-1/3 right-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 ${isMounted ? 'opacity-70' : 'opacity-0'} transition-opacity duration-1000`}></div>
        <div className={`absolute -bottom-8 left-1/2 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 ${isMounted ? 'opacity-70' : 'opacity-0'} transition-opacity duration-1000`}></div>
      </div>

      <div className={`relative max-w-md w-full space-y-8 p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-100/50 border border-white/20 transition-all duration-700 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">RM</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              REAL Milk
            </h1>
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {showRegister ? 'Create your account' : 'Welcome back!'}
          </p>
        </div>

        {/* Form Container */}
        <div className="space-y-6">
          {showRegister ? (
            <form className="space-y-5" onSubmit={handleRegister}>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-400"
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-400"
                  placeholder="Create a password"
                />
              </div>

              

              {(formData.role === 'Customer' || formData.role === 'Delivery') && (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Enter your address"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-400"
                  placeholder="Enter phone number"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 active:scale-[0.99] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 active:scale-[0.99] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Toggle between Login/Register */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-center text-gray-600">
              {showRegister ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => setShowRegister(!showRegister)}
                className="ml-2 text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-300"
              >
                {showRegister ? 'Sign in here' : 'Create one here'}
              </button>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center pt-6">
          <p className="text-xs text-gray-400">
            By continuing, you agree to REAL Milk's <span className="text-blue-500 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}