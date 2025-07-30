import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Loader2, RefreshCw } from 'lucide-react'
import { apiClient, Deployment } from '@/api/client'
import DeploymentCard from '@/components/DeploymentCard'
import StatusFilter from '@/components/StatusFilter'
import { useState } from 'react'

export default function DeploymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: deployments, isLoading, refetch } = useQuery({
    queryKey: ['deployments', statusFilter],
    queryFn: () => apiClient.getDeployments(undefined, statusFilter),
  })

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and monitor your application deployments
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/deployments/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Deployment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center justify-between">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Deployments Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : deployments && deployments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deployments.map((deployment: Deployment) => (
              <DeploymentCard key={deployment.id} deployment={deployment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deployments</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new deployment.
            </p>
            <div className="mt-6">
              <Link
                to="/deployments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Deployment
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}