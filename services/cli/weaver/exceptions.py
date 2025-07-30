"""
Custom exceptions for Nexus Weaver CLI
"""

class WeaverError(Exception):
    """Base exception for Weaver CLI errors"""
    pass 

class AuthenticationError(WeaverError):
    """Authentication failed"""
    pass

class NotFoundError(WeaverError):
    """Resource not found"""
    pass 

class ValidationError(WeaverError):
    """Validation error"""
    pass 

class ConfigError(WeaverError):
    """Configuration error"""
    pass