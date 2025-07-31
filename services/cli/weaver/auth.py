"""
Supabase authentication for Nexus Weaver CLI
"""

import os 
import json
from pathlib import Path
from typing import Optional, Dict, Any
from supabase import create_client, Client
from rich.console import Console

console = Console()

class SupabaseAuth:
    """Handles Supabase authentication for the CLI"""
    
    def __init__(self):
        self.supabase_url = os.getenv('WEAVER_SUPABASE_URL', 'https://rfpbxeyvqhhijphpspml.supabase.co')
        self.supabase_key = os.getenv('WEAVER_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGJ4ZXl2cWhoaWpwaHBzcG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTU4ODIsImV4cCI6MjA2OTQ5MTg4Mn0.vAgQxJ9mXb0V4ZVoFid4Whl-tN7EtEHZ-aKL0unMRdE')
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        self.session_file = Path.home() / '.weaver' / 'session.json'
        
        # Try to load existing session
        self._load_session()
    
    def _load_session(self):
        """Load saved session from file"""
        if self.session_file.exists():
            try:
                with open(self.session_file, 'r') as f:
                    session_data = json.load(f)
                    
                # Set the session in the client
                self.client.auth.set_session(
                    access_token=session_data.get('access_token'),
                    refresh_token=session_data.get('refresh_token')
                )
            except Exception as e:
                console.print(f"[yellow]Warning: Could not load saved session: {e}[/yellow]")
                self._clear_session()
    
    def _save_session(self, session_data: Dict[str, Any]):
        """Save session to file"""
        self.session_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Save only essential session data
        save_data = {
            'access_token': session_data.get('access_token'),
            'refresh_token': session_data.get('refresh_token'),
            'expires_at': session_data.get('expires_at'),
            'user': {
                'id': session_data.get('user', {}).get('id'),
                'email': session_data.get('user', {}).get('email'),
            }
        }
        
        with open(self.session_file, 'w') as f:
            json.dump(save_data, f, indent=2)
        
        # Make file readable only by user
        os.chmod(self.session_file, 0o600)
    
    def _clear_session(self):
        """Clear saved session"""
        if self.session_file.exists():
            self.session_file.unlink()
    
    def sign_up(self, email: str, password: str) -> bool:
        """Sign up a new user"""
        try:
            response = self.client.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if response.user:
                console.print(f"[green]✓[/green] Account created! Please check your email ({email}) for confirmation.")
                return True
            else:
                console.print("[red]✗[/red] Failed to create account")
                return False
                
        except Exception as e:
            console.print(f"[red]✗[/red] Sign up failed: {e}")
            return False
    
    def sign_in(self, email: str, password: str) -> bool:
        """Sign in with email and password"""
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.session:
                self._save_session(response.session.__dict__)
                console.print(f"[green]✓[/green] Successfully signed in as {email}")
                return True
            else:
                console.print("[red]✗[/red] Failed to sign in")
                return False
                
        except Exception as e:
            console.print(f"[red]✗[/red] Sign in failed: {e}")
            return False
    
    def sign_out(self) -> bool:
        """Sign out the current user"""
        try:
            self.client.auth.sign_out()
            self._clear_session()
            console.print("[green]✓[/green] Successfully signed out")
            return True
        except Exception as e:
            console.print(f"[red]✗[/red] Sign out failed: {e}")
            return False
    
    def reset_password(self, email: str) -> bool:
        """Send password reset email"""
        try:
            self.client.auth.reset_password_for_email(email)
            console.print(f"[green]✓[/green] Password reset email sent to {email}")
            return True
        except Exception as e:
            console.print(f"[red]✗[/red] Password reset failed: {e}")
            return False
    
    def is_authenticated(self) -> bool:
        """Check if user is currently authenticated"""
        try:
            session = self.client.auth.get_session()
            return session is not None and session.access_token is not None
        except:
            return False
    
    def get_user(self) -> Optional[Dict[str, Any]]:
        """Get current user information"""
        try:
            user = self.client.auth.get_user()
            return user.user.__dict__ if user.user else None
        except:
            return None
    
    def get_access_token(self) -> Optional[str]:
        """Get the current access token"""
        try:
            session = self.client.auth.get_session()
            return session.access_token if session else None
        except:
            return None
    
    def refresh_session(self) -> bool:
        """Refresh the current session"""
        try:
            response = self.client.auth.refresh_session()
            if response.session:
                self._save_session(response.session.__dict__)
                return True
            return False
        except:
            return False