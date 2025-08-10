import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          navigate('/auth?error=callback_failed')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to dashboard or home
          navigate('/')
        } else {
          // No session found, redirect to auth page
          navigate('/auth')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        navigate('/auth?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}