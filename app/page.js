'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait a bit to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const userStr = localStorage.getItem('user')
        
        if (!userStr) {
          console.log('No user found, redirecting to login')
          router.push('/login')
          return
        }
        
        const userData = JSON.parse(userStr)
        console.log('User found:', userData.role)
        
        // Define your routes clearly
        const roleRoutes = {
          'Admin': '/admin/dashboard',
          'Delivery': '/delivery/dashboard', 
          'Customer': '/customer/dashboard'
        }
        
        // Default to customer if role not recognized
        const targetRoute = roleRoutes[userData.role] || '/customer/dashboard'
        
        console.log(`Redirecting ${userData.role} to ${targetRoute}`)
        router.push(targetRoute)
        
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('user')
        router.push('/login')
      } finally {
        setIsChecking(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    )
  }

  return null
}