import { useState, useEffect, useContext, createContext, ReactNode, createElement } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session) {
        await fetchUser(session.user.id)
      } else {
        setUser(null)
        // If there's an OAuth code in the URL, Supabase is still exchanging it —
        // keep loading=true so guards don't redirect before SIGNED_IN fires.
        const hasOAuthCode = new URLSearchParams(window.location.search).has('code')
        if (!hasOAuthCode) {
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUser(id: string) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('fetchUser timeout')), 8000)
      )
      const query = supabase.from('users').select('*').eq('id', id).single()
      const { data, error } = await Promise.race([query, timeout])

      if (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } else {
        setUser(data as User)
      }
    } catch (err) {
      console.error('Unexpected error fetching user:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    console.log('Attempting Google OAuth sign in...')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL}/`,
      },
    })
    if (error) {
      console.error('OAuth error:', error)
    } else {
      console.log('OAuth sign in initiated')
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error)
  }

  return createElement(AuthContext.Provider, { value: { session, user, loading, signInWithGoogle, signOut } }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

