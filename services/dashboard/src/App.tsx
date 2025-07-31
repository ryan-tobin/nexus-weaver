import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DeploymentsPage from '@/pages/DeploymentsPage'
import DeploymentDetailPage from '@/pages/DeploymentDetailPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import CreateDeploymentPage from '@/pages/CreateDeploymentPage' 
import LandingPage from '@/pages/LandingPage'
import { SupabaseAuthProvider, useAuth } from '@/api/contexts/SupabaseAuthContext'
import { Loader2 } from 'lucide-react'

function ProtectedApp() {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
            
            {/* Protected routes */}
            {user ? (
                <Route path="/dashboard" element={<Layout><Navigate to="/deployments" replace /></Layout>} />
            ) : (
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
            )}
            
            <Route 
                path="/deployments" 
                element={user ? <Layout><DeploymentsPage /></Layout> : <Navigate to="/" replace />} 
            />
            <Route 
                path="/deployments/new" 
                element={user ? <Layout><CreateDeploymentPage /></Layout> : <Navigate to="/" replace />} 
            />
            <Route 
                path="/deployments/:id" 
                element={user ? <Layout><DeploymentDetailPage /></Layout> : <Navigate to="/" replace />} 
            />
            <Route 
                path="/applications" 
                element={user ? <Layout><ApplicationsPage /></Layout> : <Navigate to="/" replace />} 
            />
        </Routes>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <SupabaseAuthProvider>
                <ProtectedApp />
            </SupabaseAuthProvider>
        </BrowserRouter>
    )
}