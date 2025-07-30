"""
Manifest file parsing and validation
"""

import yaml
from pathlib import Path
from typing import Dict, Any
import time

from weaver.exceptions import WeaverError


class Manifest:
    """Represents a weaver.yml manifest file"""
    
    def __init__(self, data: Dict[str, Any]):
        self.data = data
        self._validate()
    
    @classmethod
    def from_file(cls, path: str) -> 'Manifest':
        """Load manifest from a YAML file"""
        file_path = Path(path)
        
        if not file_path.exists():
            raise WeaverError(f"Manifest file not found: {path}")
        
        try:
            with open(file_path, 'r') as f:
                data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise WeaverError(f"Invalid YAML in manifest: {e}")
        except Exception as e:
            raise WeaverError(f"Error reading manifest: {e}")
        
        return cls(data)
    
    def _validate(self):
        """Validate the manifest structure"""
        if not self.data:
            raise WeaverError("Empty manifest")
        
        if 'name' not in self.data:
            raise WeaverError("Manifest missing required field: name")
        
        if 'services' not in self.data:
            raise WeaverError("Manifest missing required field: services")
        
        if not isinstance(self.data['services'], dict):
            raise WeaverError("Services must be a dictionary")
        
        if not self.data['services']:
            raise WeaverError("At least one service must be defined")
        
        # Validate each service
        for service_name, service_config in self.data['services'].items():
            self._validate_service(service_name, service_config)
    
    def _validate_service(self, name: str, config: Dict[str, Any]):
        """Validate a service configuration"""
        if not isinstance(config, dict):
            raise WeaverError(f"Service '{name}' must be a dictionary")
        
        # Required fields
        if 'language' not in config:
            raise WeaverError(f"Service '{name}' missing required field: language")
        
        # Validate language
        supported_languages = ['python', 'node', 'nodejs', 'java', 'csharp', 'go','c','c++','typescript','javascript']
        if config['language'].lower() not in supported_languages:
            raise WeaverError(
                f"Service '{name}' has unsupported language: {config['language']}. "
                f"Supported languages: {', '.join(supported_languages)}"
            )
        
        # Validate port if specified
        if 'port' in config:
            port = config['port']
            if not isinstance(port, int) or port < 1 or port > 65535:
                raise WeaverError(f"Service '{name}' has invalid port: {port}")
        
        # Validate limits if specified
        if 'limits' in config:
            limits = config['limits']
            if not isinstance(limits, dict):
                raise WeaverError(f"Service '{name}' limits must be a dictionary")
    
    @property
    def name(self) -> str:
        """Get application name"""
        return self.data['name']
    
    @property
    def description(self) -> str:
        """Get application description"""
        return self.data.get('description', '')
    
    @property
    def version(self) -> str:
        """Get application version"""
        # If no version specified, use timestamp
        return self.data.get('version', f"v{int(time.time())}")
    
    @version.setter
    def version(self, value: str):
        """Set application version"""
        self.data['version'] = value
    
    @property
    def services(self) -> Dict[str, Any]:
        """Get services configuration"""
        return self.data['services']