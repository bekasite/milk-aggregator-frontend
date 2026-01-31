'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from './login/page'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Log environment info (development only)
  
    // Check if user is already logged in
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      // Redirect based on role
      if (userData.role === 'Admin') router.push('/admin')
      else if (userData.role === 'Delivery') router.push('/delivery')
      else router.push('/customer')
    }
  }, [router])

  return <Login />
}