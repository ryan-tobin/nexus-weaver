"""
Configuration management for Nexus Weaver CLI
"""

import os
import yaml
from pathlib import Path
from typing import Optional

class Config:
    """Configuration for the Nexus Weaver CLI"""

    def __init__(self):
        self.api_url = "http://localhost:8080"
        self.username = "admin"
        self.password = "admin"

        self._load_from_env()

        self._load_from_files()

    def _load_from_env(self):
        """Load config from env variables"""
        self.api_url = os.getenv("WEAVER_API_URL", self.api_url)
        self.username = os.getenv('WEAVER_USERNAME', self.username)
        self.password = os.getenv('WEAVER_PASSWORD', self.password)

    def _load_from_files(self):
        """Load configuration from files"""
        local_config = Path('.weaver.yml')
        if local_config.exists():
            self._load_file(local_config)
        
        home_config = Path.home() / '.weaver' / 'config.yml'
        if home_config.exists():
            self._load_file(home_config)

    def _load_file(self, path: Path):
        """Load configuration from a YAML file"""
        try:
            with open(path, 'r') as f:
                data = yaml.safe_load(f)
                if data:
                    self.api_url = data.get('api_url', self.api_url)
                    self.username = data.get('username', self.username)
                    self.password = data.get('password', self.password)
        except Exception:
            pass
    
    def save_to_file(self, path: Optional[Path] = None):
        """Save configuration to a file"""
        if path is None:
            path = Path.home() / '.weaver' / 'config.yml'
        
        path.parent.mkdir(parents=True, exist_ok=True)
        
        data = {
            'api_url': self.api_url,
            'username': self.username,
        }
        
        with open(path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False)