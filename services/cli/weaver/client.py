"""
HTTP client for communicating with the Nexus Weaver Control Plane
"""

import requests
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

from weaver.config import Config
from weaver.exceptions import WeaverError, AuthenticationError, NotFoundError


class NexusWeaverClient:
    """Client for the Nexus Weaver Control Plane API"""
    
    def __init__(self, config: Config):
        self.config = config
        self.session = requests.Session()
        self.session.auth = (config.username, config.password)
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def _url(self, path: str) -> str:
        """Build full URL for API endpoint"""
        return urljoin(self.config.api_url, path)
    
    def _handle_response(self, response: requests.Response) -> Any:
        """Handle API response and raise appropriate errors"""
        if response.status_code == 401:
            raise AuthenticationError("Invalid credentials")
        elif response.status_code == 404:
            raise NotFoundError("Resource not found")
        elif response.status_code >= 400:
            try:
                error_data = response.json()
                message = error_data.get('detail', response.text)
            except:
                message = response.text
            raise WeaverError(f"API error ({response.status_code}): {message}")
        
        try:
            return response.json()
        except:
            return response.text
    
    def create_deployment(self, manifest) -> Dict[str, Any]:
        """Create a new deployment"""
        # Convert manifest to deployment request
        deployment_request = {
            "applicationName": manifest.name,
            "description": manifest.description,
            "version": manifest.version,
            "services": []
        }
        
        for service_name, service_config in manifest.services.items():
            service = {
                "name": service_name,
                "language": service_config.get("language", "unknown"),
                "port": service_config.get("port"),
                "source": service_config.get("source", "."),
                "command": service_config.get("command"),
                "environment": service_config.get("environment", {}),
            }
            
            # Handle resource limits
            if "limits" in service_config:
                limits = service_config["limits"]
                service["limits"] = {
                    "memory": self._parse_memory(limits.get("memory", "512M")),
                    "cpuShares": limits.get("cpu_shares", 1024),
                    "pidsLimit": limits.get("pids_limit", 1000)
                }
            else:
                # Default limits
                service["limits"] = {
                    "memory": 536870912,  # 512MB
                    "cpuShares": 1024,
                    "pidsLimit": 1000
                }
            
            deployment_request["services"].append(service)
        
        response = self.session.post(
            self._url("/api/v1/deployments"),
            json=deployment_request
        )
        
        return self._handle_response(response)
    
    def list_deployments(self, app_name: Optional[str] = None, 
                        status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all deployments with optional filters"""
        params = {}
        if app_name:
            # Note: The API uses applicationId, but we'll need to handle this
            # For now, we'll just get all and filter client-side
            pass
        if status:
            params['status'] = status
        
        response = self.session.get(
            self._url("/api/v1/deployments"),
            params=params
        )
        
        deployments = self._handle_response(response)
        
        # Client-side filtering by app name if needed
        if app_name and isinstance(deployments, list):
            deployments = [d for d in deployments 
                          if d.get('applicationName', '').lower() == app_name.lower()]
        
        return deployments
    
    def get_deployment(self, deployment_id: str) -> Dict[str, Any]:
        """Get a specific deployment"""
        response = self.session.get(
            self._url(f"/api/v1/deployments/{deployment_id}")
        )
        
        return self._handle_response(response)
    
    def stop_deployment(self, deployment_id: str) -> Dict[str, Any]:
        """Stop a deployment"""
        response = self.session.post(
            self._url(f"/api/v1/deployments/{deployment_id}/stop")
        )
        
        return self._handle_response(response)
    
    def start_deployment(self, deployment_id: str) -> Dict[str, Any]:
        """Start a deployment"""
        response = self.session.post(
            self._url(f"/api/v1/deployments/{deployment_id}/start")
        )
        
        return self._handle_response(response)
    
    def delete_deployment(self, deployment_id: str) -> None:
        """Delete a deployment"""
        response = self.session.delete(
            self._url(f"/api/v1/deployments/{deployment_id}")
        )
        
        if response.status_code != 204:
            self._handle_response(response)
    
    def _parse_memory(self, memory_str: str) -> int:
        """Parse memory string (e.g., '512M', '1G') to bytes"""
        memory_str = memory_str.upper().strip()
        
        multipliers = {
            'K': 1024,
            'M': 1024 * 1024,
            'G': 1024 * 1024 * 1024,
        }
        
        for suffix, multiplier in multipliers.items():
            if memory_str.endswith(suffix):
                try:
                    value = float(memory_str[:-1])
                    return int(value * multiplier)
                except ValueError:
                    raise WeaverError(f"Invalid memory format: {memory_str}")
        
        # If no suffix, assume bytes
        try:
            return int(memory_str)
        except ValueError:
            raise WeaverError(f"Invalid memory format: {memory_str}")