import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export interface ConnectedAccount {
  bank: string
  pixKey: string
  connectedAt: number
}

export interface UserData {
  nome: string
  email: string
  balance: { BRL: number; USD: number; EUR: number; GBP: number }
  pixKey?: string
  accounts?: ConnectedAccount[]
  cardBanned?: boolean
  cardApprovals?: number
  cardAttempts?: number[]
  dailyDeposited?: { date: string; total: number }
  createdAt: unknown
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (nome: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let unsubDoc: (() => void) | null = null

    // Segurança: se Firebase nunca responder, desbloqueia em 4s
    const timeout = setTimeout(() => setLoading(false), 4000)

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      clearTimeout(timeout)
      setUser(u)
      setLoading(false) // Firebase confirmou — libera a UI agora

      unsubDoc?.()
      unsubDoc = null

      if (u) {
        // onSnapshot: dados do Firestore em tempo real, atualiza automaticamente
        unsubDoc = onSnapshot(
          doc(db, 'users', u.uid),
          (snap) => { if (snap.exists()) setUserData(snap.data() as UserData) },
          () => {}
        )
      } else {
        setUserData(null)
      }
    })

    return () => {
      clearTimeout(timeout)
      unsubAuth()
      unsubDoc?.()
    }
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (nome: string, email: string, password: string) => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
    const data: UserData = {
      nome,
      email,
      balance: { BRL: 0, USD: 0, EUR: 0, GBP: 0 },
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', u.uid), data)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const refreshUserData = async () => {
    // onSnapshot mantém atualizado automaticamente
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, register, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
