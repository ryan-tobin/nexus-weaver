import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Cloud, 
  Globe, 
  Zap,
  Container,
  GitBranch,
  Shield,
  Menu,
  X
} from 'lucide-react'
import { Github, Twitter } from 'lucide-react'
import { NexusWeaverLogo } from '@/components/NexusWeaverLogo'
import { useAuth } from '@/api/contexts/SupabaseAuthContext'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <NexusWeaverLogo size="md" />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">How it Works</a>
              <a href="#tech-stack" className="text-gray-600 hover:text-gray-900 transition">Tech Stack</a>
              <a href="https://github.com/ryan-tobin/nexus-weaver" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition">
                <Github className="h-5 w-5" />
              </a>
              {user ? (
                <Link 
                  to="/deployments"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/signin"
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100">
            <div className="px-4 pt-2 pb-3 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 py-2">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">How it Works</a>
              <a href="#tech-stack" className="block text-gray-600 hover:text-gray-900 py-2">Tech Stack</a>
              <a href="https://github.com/ryan-tobin/nexus-weaver" target="_blank" rel="noopener noreferrer" className="block text-gray-600 hover:text-gray-900 py-2">
                GitHub
              </a>
              {user ? (
                <Link 
                  to="/deployments"
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/signin"
                    className="block w-full text-center text-gray-600 hover:text-gray-900 py-2"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup"
                    className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl">
            Deploy containers{' '}
            <span className="relative whitespace-nowrap text-primary-600">
              <span className="relative">at scale</span>
            </span>{' '}
            with ease
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Nexus Weaver is a cloud-native container orchestration platform that simplifies deploying and managing distributed applications across your infrastructure.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link 
              to="/signup"
              className="group inline-flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-lg font-semibold text-white hover:bg-primary-700 transition"
            >
              Start Deploying
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://github.com/ryan-tobin/nexus-weaver"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center rounded-md bg-gray-100 px-6 py-3 text-lg font-semibold text-gray-900 hover:bg-gray-200 transition"
            >
              View on GitHub
              <Github className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need for container orchestration
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built with modern cloud technologies for reliability and scale
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Container}
              title="Container Management"
              description="Deploy and manage containers with a simple CLI or web interface. Support for multiple languages and runtimes."
            />
            <FeatureCard
              icon={Cloud}
              title="Cloud Native"
              description="Built on Kubernetes with GKE Autopilot. Automatic scaling and self-healing infrastructure."
            />
            <FeatureCard
              icon={Shield}
              title="Secure by Default"
              description="Row-level security with Supabase. JWT authentication and fine-grained access controls."
            />
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Edge deployment with Vercel. Global CDN and optimized for performance."
            />
            <FeatureCard
              icon={GitBranch}
              title="GitOps Ready"
              description="Integrate with your CI/CD pipeline. Automated deployments from GitHub Actions."
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Region"
              description="Deploy across multiple regions with Cloud Run. Low latency for global users."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How Nexus Weaver Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Deploy your application in three simple steps
            </p>
          </div>

          <div className="mt-20 space-y-16">
            <Step
              number="1"
              title="Define Your Application"
              description="Create a simple YAML manifest that describes your services, dependencies, and resource requirements."
              code={`name: my-app
version: 1.0.0

services:
  api:
    language: node
    port: 3000
    source: ./api
    limits:
      memory: 512M
      cpu_shares: 1024`}
            />

            <Step
              number="2"
              title="Deploy with One Command"
              description="Use the Nexus Weaver CLI to deploy your application. We handle the container building, orchestration, and networking."
              code={`$ weaver deploy -f weaver.yml

✓ Building containers...
✓ Pushing to registry...
✓ Deploying to cluster...
✓ Application deployed!

URL: https://my-app.nexusweaver.tech`}
            />

            <Step
              number="3"
              title="Monitor and Scale"
              description="Use the web dashboard to monitor your deployments, view logs, and scale your services as needed."
              code={`$ weaver status my-app

Deployment: my-app
Status: RUNNING
Services:
  - api (3 instances) ✓ Healthy
  - worker (2 instances) ✓ Healthy
  
$ weaver scale api --replicas 5`}
            />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Built with Best-in-Class Technology
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Leveraging proven cloud services for reliability and scale
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
            <TechCard name="Supabase" description="Database & Auth" />
            <TechCard name="Vercel" description="Dashboard Hosting" />
            <TechCard name="Google Cloud Run" description="API Hosting" />
            <TechCard name="GKE Autopilot" description="Container Execution" />
            <TechCard name="Cloudflare R2" description="Artifact Storage" />
            <TechCard name="GitHub Actions" description="CI/CD Pipeline" />
            <TechCard name="Spring Boot" description="Control Plane" />
            <TechCard name="React + Vite" description="Web Dashboard" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to simplify your deployments?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join developers who are deploying containers with confidence.
          </p>
          <div className="mt-8">
            <Link 
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-lg font-semibold text-primary-600 hover:bg-gray-100 transition"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <NexusWeaverLogo size="sm" variant="light" />
              <span className="text-gray-400">© 2024 Nexus Weaver</span>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a 
                href="https://github.com/ryan-tobin/nexus-weaver" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { 
  icon: any, 
  title: string, 
  description: string 
}) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition"></div>
      <div className="relative bg-white p-6 rounded-lg">
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}

function Step({ number, title, description, code }: {
  number: string,
  title: string,
  description: string,
  code: string
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center">
      <div className="flex-1">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
            {number}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-lg text-gray-600">{description}</p>
      </div>
      <div className="flex-1 w-full">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm">{code}</code>
        </pre>
      </div>
    </div>
  )
}

function TechCard({ name, description }: { name: string, description: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition">
      <h4 className="font-semibold text-gray-900">{name}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  )
}