import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('cms_token')
      const cached = localStorage.getItem('cms_user')
      // dummy token গুলো reject করো
      if (token && !token.startsWith('dummy_') && cached && cached !== 'undefined' && cached !== 'null') {
        return { ...JSON.parse(cached), token }
      }
    } catch (e) {
      console.error('Failed to parse cached user:', e)
    }
    // পুরনো dummy token থাকলে মুছে দাও
    localStorage.removeItem('cms_token')
    localStorage.removeItem('cms_user')
    return null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('cms_token')
      if (token && !token.startsWith('dummy_') && token !== 'undefined' && token !== 'null') {
        try {
          const res = await api.get('/auth/me')
          const validData = res.data
          setUser({ ...validData, token })
          localStorage.setItem('cms_user', JSON.stringify(validData))
        } catch (err) {
          // token invalid বা expire হয়ে গেছে — session মুছে দাও
          console.warn('Token invalid or expired, clearing session')
          localStorage.removeItem('cms_token')
          localStorage.removeItem('cms_user')
          setUser(null)
        }
      } else {
        // dummy token বা নেই — মুছে দাও
        localStorage.removeItem('cms_token')
        localStorage.removeItem('cms_user')
        setUser(null)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const login = (userData, token) => {
    const validToken = token || 'dummy_token_super'
    const validUser = userData || FALLBACK_USER
    localStorage.setItem('cms_token', validToken)
    localStorage.setItem('cms_user', JSON.stringify(validUser))
    setUser({ ...validUser, token: validToken })
  }

  const logout = () => {
    localStorage.removeItem('cms_token')
    localStorage.removeItem('cms_user')
    localStorage.removeItem('cms_assignments_cache')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
