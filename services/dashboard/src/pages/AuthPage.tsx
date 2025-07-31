import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/api/contexts/SupabaseAuthContext'
import { NexusWeaverLogo } from '@/components/NexusWeaverLogo'

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(
    location.pathname === '/signup' ? 'signup' : 'signin'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp, resetPassword, user } = useAuth()

  // Update mode based on route
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup')
    } else if (location.pathname === '/signin') {
      setMode('signin')
    } else if (location.pathname === '/reset-password') {
      setMode('reset')
    }
  }, [location])

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
        navigate('/dashboard')
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with back button */}
      <div className="p-6">
        <Link 
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
                    <Link
                      to="/signup"
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Don't have an account? Sign up
                    </Link>
                    <Link
                      to="/reset-password"
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Forgot your password?
                    </Link>
                  </>
                )}
                
                {mode === 'signup' && (
                  <Link
                    to="/signin"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Already have an account? Sign in
                  </Link>
                )}
                
                {mode === 'reset' && (
                  <Link
                    to="/signin"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Back to sign in
                  </Link>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}