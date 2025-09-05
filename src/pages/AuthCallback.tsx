import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authHelpers } from '../lib/auth'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get OAuth callback parameters
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        
        if (code && state) {
          // Handle OAuth callback
          const { data, error } = await authHelpers.handleOAuthCallback(code, state)
          
          if (error) {
            console.error('OAuth callback error:', error)
            navigate('/auth?error=oauth_failed')
            return
          }

          if (data) {
            // Check for stored redirect URL
            const redirectUrl = localStorage.getItem('oauth_redirect')
            localStorage.removeItem('oauth_redirect')
            
            // Successfully authenticated, redirect to intended page or dashboard
            navigate(redirectUrl || '/')
          } else {
            navigate('/auth?error=no_session')
          }
        } else {
          // Check if user is already authenticated
          if (authHelpers.isAuthenticated()) {
            navigate('/')
          } else {
            navigate('/auth')
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        navigate('/auth?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}