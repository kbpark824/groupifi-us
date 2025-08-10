import { useContext } from 'react'
import { AuthContext, AuthProvider } from '../contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Re-export for convenience
export { AuthProvider }