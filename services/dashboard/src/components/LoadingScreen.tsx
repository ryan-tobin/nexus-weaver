import { useEffect, useState } from 'react'
import { NexusWeaverLogo } from './NexusWeaverLogo'

export default function LoadingScreen() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        {/* Animated logo */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <NexusWeaverLogo size="xl" variant="icon" />
          </div>
          <div className="relative animate-spin-slow">
            <svg
              width={80}
              height={80}
              viewBox="0 0 80 80"
              fill="none"
              className="opacity-20"
            >
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5 5"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="mt-8">
          <p className="text-lg font-medium text-gray-700">
            Weaving your experience{dots}
          </p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}