import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'light'
}

export const NexusWeaverLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'full' 
}) => {
  const sizes = {
    sm: { height: 32, fontSize: 'text-lg' },
    md: { height: 40, fontSize: 'text-xl' },
    lg: { height: 48, fontSize: 'text-2xl' },
    xl: { height: 64, fontSize: 'text-3xl' }
  }

  const { height, fontSize } = sizes[size]

  if (variant === 'icon') {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Hexagon background */}
        <path
          d="M32 4L54 18V46L32 60L10 46V18L32 4Z"
          fill="url(#gradient1)"
          fillOpacity="0.1"
          stroke="url(#gradient1)"
          strokeWidth="2"
        />
        
        {/* Center nexus point */}
        <circle cx="32" cy="32" r="6" fill="url(#gradient1)" />
        
        {/* Connecting lines - creating a weaver pattern */}
        <path
          d="M32 26V14M32 38V50M38 29L48 22M26 29L16 22M38 35L48 42M26 35L16 42"
          stroke="url(#gradient2)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Outer connection points */}
        <circle cx="32" cy="14" r="3" fill="#3b82f6" />
        <circle cx="48" cy="22" r="3" fill="#3b82f6" />
        <circle cx="48" cy="42" r="3" fill="#3b82f6" />
        <circle cx="32" cy="50" r="3" fill="#3b82f6" />
        <circle cx="16" cy="42" r="3" fill="#3b82f6" />
        <circle cx="16" cy="22" r="3" fill="#3b82f6" />
        
        {/* Additional weaving lines for depth */}
        <path
          d="M16 22L32 26M48 22L32 26M16 42L32 38M48 42L32 38"
          stroke="url(#gradient2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg
        width={height}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hexagon background */}
        <path
          d="M32 4L54 18V46L32 60L10 46V18L32 4Z"
          fill="url(#gradient1)"
          fillOpacity="0.1"
          stroke="url(#gradient1)"
          strokeWidth="2"
        />
        
        {/* Center nexus point */}
        <circle cx="32" cy="32" r="6" fill="url(#gradient1)" />
        
        {/* Connecting lines - creating a weaver pattern */}
        <path
          d="M32 26V14M32 38V50M38 29L48 22M26 29L16 22M38 35L48 42M26 35L16 42"
          stroke="url(#gradient2)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Outer connection points */}
        <circle cx="32" cy="14" r="3" fill="#3b82f6" />
        <circle cx="48" cy="22" r="3" fill="#3b82f6" />
        <circle cx="48" cy="42" r="3" fill="#3b82f6" />
        <circle cx="32" cy="50" r="3" fill="#3b82f6" />
        <circle cx="16" cy="42" r="3" fill="#3b82f6" />
        <circle cx="16" cy="22" r="3" fill="#3b82f6" />
        
        {/* Additional weaving lines for depth */}
        <path
          d="M16 22L32 26M48 22L32 26M16 42L32 38M48 42L32 38"
          stroke="url(#gradient2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-bold ${variant === 'light' ? 'text-white' : 'text-gray-900'} ${fontSize}`}>Nexus Weaver</span>
    </div>
  )
}