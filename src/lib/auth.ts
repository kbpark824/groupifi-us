import { pb } from './pocketbase'
import type { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  email: string
  name?: string
  avatar?: string
  verified: boolean
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export const authHelpers = {
  // Get current user
  getCurrentUser: (): User | null => {
    return pb.authStore.model as User | null
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return pb.authStore.isValid
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, passwordConfirm: string, name?: string) => {
    try {
      console.log('🔄 Attempting signup for:', email)
      
      const data = {
        email,
        password,
        passwordConfirm,
        name: name || email.split('@')[0], // Use email prefix as default name
      }
      
      console.log('📤 Sending signup request with data:', { ...data, password: '[HIDDEN]', passwordConfirm: '[HIDDEN]' })
      
      const record = await pb.collection('users').create(data)
      
      console.log('✅ User created successfully:', { id: record.id, email: record.email })
      
      // Send verification email (optional - don't fail if this fails)
      try {
        await pb.collection('users').requestVerification(email)
        console.log('📧 Verification email sent')
      } catch (verifyError) {
        console.warn('⚠️ Could not send verification email:', verifyError)
        // Don't fail the signup if verification email fails
      }
      
      return { data: record, error: null }
    } catch (error: any) {
      console.error('❌ Signup failed:', error)
      return { data: null, error }
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      return { data: authData, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Sign in with Google OAuth
  signInWithGoogle: async (redirectTo?: string) => {
    try {
      // Get available OAuth providers
      const authMethods = await pb.collection('users').listAuthMethods()
      const googleProvider = (authMethods as any).authProviders?.find(
        (provider: any) => provider.name === 'google'
      )
      
      if (!googleProvider) {
        throw new Error('Google OAuth is not configured')
      }
      
      // Store redirect URL for after OAuth
      if (redirectTo) {
        localStorage.setItem('oauth_redirect', redirectTo)
      }
      
      // Redirect to Google OAuth
      const authUrl = googleProvider.authUrl + (redirectTo ? `&redirect_uri=${encodeURIComponent(redirectTo)}` : '')
      window.location.href = authUrl
      
      return { data: null, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Handle OAuth callback
  handleOAuthCallback: async (code: string, state: string) => {
    try {
      const authData = await pb.collection('users').authWithOAuth2Code(
        'google',
        code,
        state,
        window.location.origin + '/auth/callback'
      )
      return { data: authData, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      pb.authStore.clear()
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Update password
  updatePassword: async (oldPassword: string, newPassword: string, passwordConfirm: string) => {
    try {
      const user = pb.authStore.model
      if (!user) {
        throw new Error('No authenticated user')
      }
      
      const data = await pb.collection('users').update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm,
      })
      
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<User>) => {
    try {
      const user = pb.authStore.model
      if (!user) {
        throw new Error('No authenticated user')
      }
      
      const updatedUser = await pb.collection('users').update(user.id, data)
      return { data: updatedUser, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  },

  // Get user ID safely
  getUserId: (user: User | null = null): string | null => {
    const currentUser = user || pb.authStore.model
    return currentUser?.id || null
  },

  // Get user email safely
  getUserEmail: (user: User | null = null): string | null => {
    const currentUser = user || pb.authStore.model
    return currentUser?.email || null
  },

  // Get user name safely
  getUserName: (user: User | null = null): string | null => {
    const currentUser = user || pb.authStore.model
    return currentUser?.name || currentUser?.email?.split('@')[0] || null
  },

  // Refresh authentication
  refresh: async () => {
    try {
      if (pb.authStore.isValid) {
        await pb.collection('users').authRefresh()
        return { error: null }
      }
      return { error: new Error('No valid session to refresh') }
    } catch (error: any) {
      return { error }
    }
  }
}