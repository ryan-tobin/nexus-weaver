import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient, CreateDeploymentRequest, ServiceDefinition } from '@/api/client'

export default function CreateDeploymentPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState<CreateDeploymentRequest>({
        applicationName: '',
        description: '',
        version: '1.0.0',
        services: [
            {
                name: '',
                language: 'python',
                port: 8000,
                source: './',
                command: '',
                limits: {
                    memory: 536870912, 
                    cpuShares: 1024,
                    pidsLimit: 100,
                },
            },
        ],
    })

    const createMutation = useMutation({
        mutationFn: (data: CreateDeploymentRequest) => apiClient.createDeployment(data),
        onSuccess: (deployment) => {
            toast.success('Deployment created successfully!')
            navigate(`/deployments/${deployment.id}`)
        },
        onError: () => {
            toast.error('Failed to create deployment')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMutation.mutate(formData)
    }

    const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        {
          name: '',
          language: 'python',
          port: 8000,
          source: './',
          command: '',
          limits: {
            memory: 536870912,
            cpuShares: 1024,
            pidsLimit: 100,
          },
        },
      ],
    })
  }

  const removeService = (index: number) => {
    setFormData({
        ...formData,
        services: formData.services.filter((_, i) => i !== index),
    })
  }

  const updateService = (index: number, updates: Partial<ServiceDefinition>) => {
    const newServices = [...formData.services]
    newServices[index] = { ...newServices[index], ...updates }
    setFormData({ ...formData, services: newServices })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Deployment</h1>
        <p className="mt-2 text-sm text-gray-700">
          Deploy a new application or version to your cluster
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Application Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Application Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="applicationName" className="block text-sm font-medium text-gray-700">
                Application Name
              </label>
              <input
                type="text"
                id="applicationName"
                required
                value={formData.applicationName}
                onChange={(e) => setFormData({ ...formData, applicationName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="my-app"
              />
            </div>

            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                type="text"
                id="version"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="1.0.0"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Brief description of your application"
              />
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Services</h2>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </button>
          </div>

          <div className="space-y-4">
            {formData.services.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Service {index + 1}</h3>
                  {formData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Service Name
                    </label>
                    <input
                      type="text"
                      required
                      value={service.name}
                      onChange={(e) => updateService(index, { name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="api"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      value={service.language}
                      onChange={(e) => updateService(index, { language: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="python">Python</option>
                      <option value="node">Node.js</option>
                      <option value="java">Java</option>
                      <option value="go">Go</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Port
                    </label>
                    <input
                      type="number"
                      value={service.port}
                      onChange={(e) => updateService(index, { port: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Source Directory
                    </label>
                    <input
                      type="text"
                      required
                      value={service.source}
                      onChange={(e) => updateService(index, { source: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="./"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Command (optional)
                    </label>
                    <input
                      type="text"
                      value={service.command}
                      onChange={(e) => updateService(index, { command: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="python app.py"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Memory Limit (MB)
                    </label>
                    <input
                      type="number"
                      value={Math.floor((service.limits?.memory || 536870912) / 1048576)}
                      onChange={(e) => updateService(index, {
                        limits: {
                          ...service.limits,
                          memory: parseInt(e.target.value) * 1048576,
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CPU Shares
                    </label>
                    <input
                      type="number"
                      value={service.limits?.cpuShares || 1024}
                      onChange={(e) => updateService(index, {
                        limits: {
                          ...service.limits,
                          cpuShares: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/deployments')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Deployment'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}