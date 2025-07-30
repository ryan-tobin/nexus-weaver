import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/api/client'

interface AuthContextType {
    isAuthenticated: boolean 
    username: string | null 
    login: (username: string, password: string) => Promise<boolean>
    logout: () => void 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}:{children: ReactNode}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [username, setUsername] = useState<string | null>(null)

    useEffect(() => {
        const auth = localStorage.getItem('auth')
        if (auth) {
            const { username: user } = JSON.parse(auth)
            setUsername(user)
            setIsAuthenticated(true)
        }
    }, [])

    const login = async (username: string, password: string): Promise<boolean> => {
        const success = await apiClient.testAuth(username, password)
        if (success) {
            localStorage.setItem('auth', JSON.stringify({username, password}))
            setUsername(username)
            setIsAuthenticated(true)
            return true 
        }
        return false 
    }

    const logout = () => {
        localStorage.removeItem('auth')
        setUsername(null)
        setIsAuthenticated(false)
    }

    return (
        <AuthContext.Provider value={{isAuthenticated, username, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context == undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}