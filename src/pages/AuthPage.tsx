import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  
  // Check URL parameter for initial mode
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  // Handle error messages from URL params
  const error = searchParams.get('error')
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'callback_failed':
        return 'Authentication failed. Please try again.'
      case 'unexpected_error':
        return 'An unexpected error occurred. Please try again.'
      default:
        return null
    }
  }

  const handleAuthSuccess = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login' 
              ? 'Access your saved groups and constraints' 
              : 'Start organizing groups with saved data'
            }
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {getErrorMessage(error)}
            </div>
          )}

          <GoogleAuthButton onSuccess={handleAuthSuccess} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {mode === 'login' ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onSwitchToSignup={() => setMode('signup')}
            />
          ) : (
            <SignupForm 
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  )
}