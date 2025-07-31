import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { 
  Package, 
  Clock, 
  Server,
  Play,
  Square,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Deployment, DeploymentStatus } from '@/api/client'
import { cn } from '@/lib/utils'

interface DeploymentCardProps {
  deployment: Deployment
}

export default function DeploymentCard({ deployment }: DeploymentCardProps) {
  const statusConfig = {
    [DeploymentStatus.PENDING]: {
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      icon: Clock,
      label: 'Pending',
    },
    [DeploymentStatus.DEPLOYING]: {
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      icon: Loader2,
      label: 'Deploying',
      animate: true,
    },
    [DeploymentStatus.DEPLOYED]: {
      color: 'text-green-700 bg-green-50 border-green-200',
      icon: CheckCircle,
      label: 'Deployed',
    },
    [DeploymentStatus.FAILED]: {
      color: 'text-red-700 bg-red-50 border-red-200',
      icon: AlertCircle,
      label: 'Failed',
    },
    [DeploymentStatus.TERMINATING]: {
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      icon: Loader2,
      label: 'Terminating',
      animate: true,
    },
    [DeploymentStatus.TERMINATED]: {
      color: 'text-gray-700 bg-gray-50 border-gray-200',
      icon: Square,
      label: 'Terminated',
    },
  }

  const status = statusConfig[deployment.status]
  const StatusIcon = status.icon

  const runningServices = deployment.services.filter(s => s.status === 'RUNNING').length
  const totalServices = deployment.services.length

  return (
    <Link
      to={`/deployments/${deployment.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                {deployment.applicationName}
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Version: {deployment.version}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
              status.color
            )}
          >
            <StatusIcon 
              className={cn(
                'mr-1 h-3 w-3',
                'animate' in status && status.animate ? 'animate-spin' : undefined
              )} 
            />
            {status.label}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Server className="h-4 w-4 mr-2" />
            <span>
              {runningServices}/{totalServices} services running
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              Created {format(new Date(deployment.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>

        {deployment.status === DeploymentStatus.DEPLOYED && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                // Handle stop action
              }}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Square className="mr-1 h-3 w-3" />
              Stop
            </button>
          </div>
        )}

        {deployment.status === DeploymentStatus.TERMINATED && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                // Handle start action
              }}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Play className="mr-1 h-3 w-3" />
              Start
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                // Handle delete action
              }}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}