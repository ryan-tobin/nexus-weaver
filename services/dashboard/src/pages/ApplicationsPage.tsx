import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Package, 
    Plus,
    Search,
    Filter,
    MoreVertical,
    Activity,
    AlertCircle, 
    Layers,
    GitBranch,
    Clock
} from 'lucide-react'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Application {
    id: string 
    name: string 
    description?: string 
    deploymentCount: number 
    activeDeployments: number
    lastDeployedAt?: string 
    createdAt: string 
    updatedAt: string 
    languages: string[] 
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLanguage, setFilterLanguage] = useState<string>('all')

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        try {
            setLoading(true)
            const response = await apiClient.getApplications()
            setApplications(response)
            setError(null)
        } catch (err) {
            setError('Failed to fetch applications')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesLanguage = filterLanguage === 'all' || app.languages.includes(filterLanguage)
        return matchesSearch && matchesLanguage
    })

    const allLanguages = Array.from(new Set(applications.flatMap(app => app.languages)))

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-[400px]'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className='rounded-md bg-red-50 p-4'>
                <div className='flex'>
                    <AlertCircle className='h-5 w-5 text-red-400' />
                    <div className='ml-3'>
                        <h3 className='text-sm font-medium text-red-800'>Error loading applications</h3>
                        <p className='mt-2 text-sm text-red-700'>{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your applications and view deployment history
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
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search applications..."
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="all">All Languages</option>
            {allLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="mt-6">
        {filteredApplications.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterLanguage !== 'all'
                ? 'Try adjusting your filters'
                : 'Deploy your first application to get started'}
            </p>
            {!searchTerm && filterLanguage === 'all' && (
              <div className="mt-6">
                <Link
                  to="/deployments/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Deployment
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({ application }: { application: Application}) {
    const hasActiveDeployments = application.activeDeployments > 0

    return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={cn(
              "p-2 rounded-lg",
              hasActiveDeployments ? "bg-green-100" : "bg-gray-100"
            )}>
              <Layers className={cn(
                "h-6 w-6",
                hasActiveDeployments ? "text-green-600" : "text-gray-600"
              )} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{application.name}</h3>
              {application.description && (
                <p className="mt-1 text-sm text-gray-500">{application.description}</p>
              )}
            </div>
          </div>
          <ApplicationMenu applicationId={application.id} />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="h-4 w-4 mr-2" />
            <span>
              {application.activeDeployments} active deployment{application.activeDeployments !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <GitBranch className="h-4 w-4 mr-2" />
            <span>
              {application.deploymentCount} total deployment{application.deploymentCount !== 1 ? 's' : ''}
            </span>
          </div>
          {application.lastDeployedAt && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                Last deployed {format(new Date(application.lastDeployedAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {application.languages.map(lang => (
            <span
              key={lang}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {lang}
            </span>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            to={`/deployments?applicationId=${application.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View deployments →
          </Link>
        </div>
      </div>
    </div>
  )
}

function ApplicationMenu({ applicationId }: { applicationId: string }) {
    const [isOpen, setIsOpen] = useState(false) 

    return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100"
      >
        <MoreVertical className="h-5 w-5 text-gray-400" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <Link
                to={`/deployments/new?applicationId=${applicationId}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                New deployment
              </Link>
              <Link
                to={`/deployments?applicationId=${applicationId}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                View deployments
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  // Handle application deletion
                  setIsOpen(false)
                }}
              >
                Delete application
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}