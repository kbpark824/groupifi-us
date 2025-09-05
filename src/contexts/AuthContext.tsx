import React, { createContext, useEffect, useState } from 'react'
import { pb } from '../lib/pocketbase'
import { authHelpers, type User } from '../lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, passwordConfirm: string, name?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (data: Partial<User>) => Promise<{ error: any }>
  refresh: () => Promise<{ error: any }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial auth state
    const initializeAuth = () => {
      const currentUser = authHelpers.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model as User | null)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signUp = async (email: string, password: string, passwordConfirm: string, name?: string) => {
    console.log('🔄 Attempting signup for:', email)
    const { data, error } = await authHelpers.signUp(email, password, passwordConfirm, name)
    console.log('📧 Signup response:', { data, error })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await authHelpers.signIn(email, password)
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await authHelpers.signInWithGoogle(`${window.location.origin}/auth/callback`)
    return { error }
  }

  const signOut = async () => {
    const { error } = await authHelpers.signOut()
    return { error }
  }

  const updateProfile = async (data: Partial<User>) => {
    const { error } = await authHelpers.updateProfile(data)
    return { error }
  }

  const refresh = async () => {
    const { error } = await authHelpers.refresh()
    return { error }
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refresh,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}