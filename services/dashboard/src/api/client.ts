import axios, { AxiosInstance } from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

class ApiClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers : {
                'Content-Type': 'application/json',
            },
        })

        this.client.interceptors.request.use(
            (config) => {
                const auth = localStorage.getItem('auth')
                if (auth) {
                    const { username, password } = JSON.parse(auth)
                    config.auth = { username, password }
                }
                return config   
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/'
                    toast.error('Session expired. Please login again.')
                } else if (error.response?.data?.detail) {
                    toast.error(error.response.data.detail)
                } else if (error.message) {
                    toast.error(error.message)
                }
                return Promise.reject(error)
            }
        )
    }

    async testAuth(username: string, password: string): Promise<boolean> {
        try {
            const response = await this.client.get('/deployments', {
                auth: { username, password },
            })
            return response.status === 200
        } catch {
            return false
        }
    }

    async getDeployments(applicationId?: string, status?: string) {
        const params = new URLSearchParams()
        if (applicationId) params.append('applicationId', applicationId)
        if (status) params.append('status', status)

        const response = await this.client.get(`/deployments?${params}`)
        return response.data
    }

    async getDeployment(id: string) {
        const response = await this.client.get(`/deployments/${id}`)
        return response.data
    }

    async createDeployment(data: CreateDeploymentRequest) {
        const response = await this.client.post('/deployments', data)
        return response.data
    }

    async deleteDeployment(id: string) {
        await this.client.delete(`/deployments/${id}`)
    }

    async startDeployment(id: string) {
        const response = await this.client.post(`/deployments/${id}/start`)
        return response.data
    }

    async stopDeployment(id: string) {
        const response = await this.client.post(`/deployments/${id}/stop`)
        return response.data
    }

    async getApplications() {
        const response = await this.client.get('/applications')
        return response.data
    }

    async getApplication(id: string) {
        const response = await this.client.get(`/applications/${id}`)
        return response.data
    }

    async deleteApplication(id: string) {
        await this.client.delete(`/applications/${id}`)
    }
}

export const apiClient = new ApiClient()

export interface CreateDeploymentRequest {
    applicationName: string 
    description?: string 
    version: string 
    services: ServiceDefinition[]
}

export interface ServiceDefinition {
    name: string 
    language: string 
    port?: number 
    source: string 
    command?: string
    environment?: Record<string, string>
    limits?: {
        memory?: number 
        cpuShares?: number 
        pidsLimit?: number
    }
}

export interface Deployment {
    id: string
    applicationId: string 
    applicationName: string 
    version: string 
    status: DeploymentStatus 
    services: Service[] 
    createdAt: string 
    updatedAt: string 
}

export interface Service {
    id: string 
    name: string 
    processId?: string 
    nodeId?: string 
    status: ServiceStatus 
    language: string 
    port?: number 
    memoryLimit?: number 
    cpuShares?: number 
}

export enum DeploymentStatus {
    PENDING = 'PENDING',
    DEPLOYING = 'DEPLOYING',
    DEPLOYED = 'DEPLOYED',
    FAILED = 'FAILED',
    TERMINATING = 'TERMINATING',
    TERMINATED = 'TERMINATED',
}

export enum ServiceStatus {
    INIT = 'INIT',
    STARTING = 'STARTING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
    FAILED = 'FAILED',
    TERMINATED = 'TERMINATED',
}