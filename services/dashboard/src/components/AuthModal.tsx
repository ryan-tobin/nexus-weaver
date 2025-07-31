import { useState } from 'react'
import { Loader2, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/api/contexts/SupabaseAuthContext'
import { NexusWeaverLogo } from '@/components/NexusWeaverLogo'

type AuthMode = 'signin' | 'signup' | 'reset'

export default function AuthModal() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        await signUp(email, password)
      } else if (mode === 'reset') {
        await resetPassword(email)
        setMode('signin')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back'
      case 'signup': return 'Create Account'
      case 'reset': return 'Reset Password'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Sign in to manage your deployments'
      case 'signup': return 'Create an account to get started'
      case 'reset': return 'Enter your email to reset your password'
    }
  }

  const getButtonText = () => {
    switch (mode) {
      case 'signin': return 'Sign In'
      case 'signup': return 'Create Account'
      case 'reset': return 'Send Reset Email'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <NexusWeaverLogo size="lg" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {getSubtitle()}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  getButtonText()
                )}
              </button>
            </div>

            <div className="flex flex-col space-y-2 text-center">
              {mode === 'signin' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Don't have an account? Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Forgot your password?
                  </button>
                </>
              )}
              
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Already have an account? Sign in
                </button>
              )}
              
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}