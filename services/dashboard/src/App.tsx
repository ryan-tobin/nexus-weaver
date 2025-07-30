import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DeploymentsPage from '@/pages/DeploymentsPage'
import DeploymentDetailPage from '@/pages/DeploymentDetailPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import CreateDeploymentPage from '@/pages/CreateDeploymentPage'
import { AuthProvider } from '@/api/contexts/AuthContext'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/deployments" replace />} />
                        <Route path="/deployments" element={<DeploymentsPage />} />
                        <Route path="/deployments/new" element={<CreateDeploymentPage />} />
                        <Route path="/deployments/:id" element={<DeploymentDetailPage />} />
                        <Route path="/applications" element={<ApplicationsPage />} />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    )
}