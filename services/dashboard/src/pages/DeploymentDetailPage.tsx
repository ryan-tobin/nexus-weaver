import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Play,
    Square,
    Trash2,
    RefreshCw,
    Server,
    Activity,
    Clock,
    AlertCircle,
    CheckCircle,
    Loader2,
    Terminal,
    Cpu,
    MemoryStick,
    ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient, DeploymentStatus, ServiceStatus } from '@/api/client'
import { cn } from "@/lib/utils";
import { format } from 'date-fns'

export default function DeploymentDetailPage() {
    const { id } = useParams<{id:string}>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [selectedService, setSelectedService] = useState<string | null>(null)

    const { data: deployment, isLoading, error } = useQuery({
        queryKey: ['deployment', id],
        queryFn: () => apiClient.getDeployment(id!),
        refetchInterval: 5000, // Refresh every 5 seconds
    })

    const startMutation = useMutation({
        mutationFn: () => apiClient.startDeployment(id!),
        onSuccess: () => {
        toast.success('Deployment started successfully')
        queryClient.invalidateQueries({ queryKey: ['deployment', id] })
        },
        onError: () => {
        toast.error('Failed to start deployment')
        },
    })

    const stopMutation = useMutation({
        mutationFn: () => apiClient.stopDeployment(id!),
        onSuccess: () => {
        toast.success('Deployment stopped successfully')
        queryClient.invalidateQueries({ queryKey: ['deployment', id] })
        },
        onError: () => {
        toast.error('Failed to stop deployment')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => apiClient.deleteDeployment(id!),
        onSuccess: () => {
        toast.success('Deployment deleted successfully')
        navigate('/deployments')
        },
        onError: () => {
        toast.error('Failed to delete deployment')
        },
    })

    if (isLoading) {
        return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
        )
    }

    if (error || !deployment) {
        return (
        <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading deployment</h3>
                <p className="mt-2 text-sm text-red-700">
                {error ? 'Failed to fetch deployment details' : 'Deployment not found'}
                </p>
            </div>
            </div>
        </div>
        )
    }
    
    const statusConfig = {
        [DeploymentStatus.PENDING]: {
            color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
            icon: Clock,
            label: 'Pending'
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

    const status = statusConfig[deployment.status as keyof typeof statusConfig]
    const StatusIcon = status.icon

    return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/deployments"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to deployments
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deployment.applicationName}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-sm text-gray-500">Version: {deployment.version}</span>
              <span className="text-sm text-gray-500">ID: {deployment.id}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                status.color
              )}
            >
              <StatusIcon 
                className={cn(
                  'mr-1.5 h-4 w-4',
                  'animate' in status && status.animate ? 'animate-spin' : undefined
                )} 
              />
              {status.label}
            </span>

            {deployment.status === DeploymentStatus.DEPLOYED && (
              <button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Square className="mr-1.5 h-4 w-4" />
                Stop
              </button>
            )}

            {deployment.status === DeploymentStatus.TERMINATED && (
              <>
                <button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Play className="mr-1.5 h-4 w-4" />
                  Start
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this deployment?')) {
                      deleteMutation.mutate()
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </button>
              </>
            )}

            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['deployment', id] })}
              className="p-1.5 rounded-md hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {format(new Date(deployment.createdAt), 'MMMM d, yyyy h:mm a')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {format(new Date(deployment.updatedAt), 'MMMM d, yyyy h:mm a')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Services</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {deployment.services.length} service{deployment.services.length !== 1 ? 's' : ''}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Running Services</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {deployment.services.filter((s: any) => s.status === ServiceStatus.RUNNING).length} of {deployment.services.length}
            </dd>
          </div>
        </dl>
      </div>

      {/* Services */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Services</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {deployment.services.map((service: any) => (
            <ServiceRow 
              key={service.id} 
              service={service}
              isSelected={selectedService === service.id}
              onSelect={() => setSelectedService(selectedService === service.id ? null : service.id)}
            />
          ))}
        </div>
      </div>

      {/* Selected Service Details */}
      {selectedService && (
        <ServiceDetails 
          service={deployment.services.find((s: any) => s.id === selectedService)!}
          deploymentId={deployment.id}
        />
      )}
    </div>
  )
}

function ServiceRow({
    service,
    isSelected,
    onSelect
}: {
    service: any,
    isSelected: boolean,
    onSelect: () => void 
}) {
    const statusColors = {
        [ServiceStatus.INIT]: 'text-gray-500 bg-gray-100',
        [ServiceStatus.STARTING]: 'text-blue-500 bg-blue-100',
        [ServiceStatus.RUNNING]: 'text-green-500 bg-green-100',
        [ServiceStatus.STOPPING]: 'text-orange-500 bg-orange-100',
        [ServiceStatus.STOPPED]: 'text-gray-500 bg-gray-100',
        [ServiceStatus.FAILED]: 'text-red-500 bg-red-100',
        [ServiceStatus.TERMINATED]: 'text-gray-500 bg-gray-100',
    }

    return (
    <div 
      className={cn(
        "px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors",
        isSelected && "bg-gray-50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Server className="h-5 w-5 text-gray-400" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.language}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            statusColors[service.status as keyof typeof statusColors] || 'text-gray-500 bg-gray-100'
          )}>
            {service.status}
          </span>
          {service.port && (
            <span className="text-sm text-gray-500">Port: {service.port}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ServiceDetails({ service, deploymentId: _deploymentId }: { service: any, deploymentId: string }) {
  return (
    <div className="mt-6 bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Service Details: {service.name}</h3>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Terminal className="mr-1.5 h-4 w-4" />
            View Logs
          </button>
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Open
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Process ID</dt>
          <dd className="mt-1 text-sm text-gray-900">{service.processId || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Node ID</dt>
          <dd className="mt-1 text-sm text-gray-900">{service.nodeId || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Language</dt>
          <dd className="mt-1 text-sm text-gray-900">{service.language}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Port</dt>
          <dd className="mt-1 text-sm text-gray-900">{service.port || 'N/A'}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Resource Limits</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center space-x-2">
            <MemoryStick className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">Memory</p>
              <p className="text-sm text-gray-900">
                {service.memoryLimit ? `${Math.round(service.memoryLimit / 1048576)} MB` : 'No limit'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">CPU Shares</p>
              <p className="text-sm text-gray-900">{service.cpuShares || 'Default'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-sm text-gray-900">{service.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}