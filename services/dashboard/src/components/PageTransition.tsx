import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingScreen from './LoadingScreen'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(true)
  const location = useLocation()
  const [prevLocation, setPrevLocation] = useState(location.pathname)

  useEffect(() => {
    // Only show loading if actually navigating to a different page
    if (location.pathname !== prevLocation) {
      setIsLoading(true)
      setDisplayChildren(false)

      // Simulate loading delay
      const timer = setTimeout(() => {
        setDisplayChildren(true)
        setIsLoading(false)
        setPrevLocation(location.pathname)
      }, 1200) // 1.2 second delay

      return () => clearTimeout(timer)
    }
  }, [location.pathname, prevLocation])

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className={`transition-all duration-500 ${displayChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {children}
      </div>
    </>
  )
}