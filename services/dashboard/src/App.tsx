import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DeploymentsPage from '@/pages/DeploymentsPage'
import DeploymentDetailPage from '@/pages/DeploymentDetailPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import CreateDeploymentPage from '@/pages/CreateDeploymentPage' 
import AuthModal from '@/components/AuthModal'
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

    if (!user) {
        return <AuthModal />
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/deployments" replace />} />
                <Route path="/deployments" element={<DeploymentsPage />} />
                <Route path="/deployments/new" element={<CreateDeploymentPage />} />
                <Route path="/deployments/:id" element={<DeploymentDetailPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
            </Routes>
        </Layout>
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