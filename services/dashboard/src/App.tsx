import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DeploymentsPage from '@/pages/DeploymentsPage'
import DeploymentDetailPage from '@/pages/DeploymentDetailPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import CreateDeploymentPage from '@/pages/CreateDeploymentPage' 
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import PageTransition from '@/components/PageTransition'
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
        <PageTransition>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                <Route path="/signin" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
                <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
                <Route path="/reset-password" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
                
                {/* Protected routes */}
                {user ? (
                    <>
                        <Route path="/dashboard" element={<Layout><Navigate to="/deployments" replace /></Layout>} />
                        <Route path="/deployments" element={<Layout><DeploymentsPage /></Layout>} />
                        <Route path="/deployments/new" element={<Layout><CreateDeploymentPage /></Layout>} />
                        <Route path="/deployments/:id" element={<Layout><DeploymentDetailPage /></Layout>} />
                        <Route path="/applications" element={<Layout><ApplicationsPage /></Layout>} />
                    </>
                ) : (
                    <>
                        <Route path="/dashboard" element={<Navigate to="/signin" replace />} />
                        <Route path="/deployments" element={<Navigate to="/signin" replace />} />
                        <Route path="/deployments/*" element={<Navigate to="/signin" replace />} />
                        <Route path="/applications" element={<Navigate to="/signin" replace />} />
                    </>
                )}
            </Routes>
        </PageTransition>
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