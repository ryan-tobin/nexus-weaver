"""
Nexus Weaver CLI - Main entry point
"""

import click 
from rich.console import Console 
from rich.table import Table 
from rich.progress import Progress, SpinnerColumn, TextColumn

from weaver import __version__
from weaver.config import Config 
from weaver.client import NexusWeaverClient 
from weaver.manifest import Manifest
from weaver.exceptions import WeaverError

console = Console()
config = Config()

@click.group()
@click.version_option(version=__version__, prog_name="weaver")
@click.option('--api-url', envvar="WEAVER_API_URL", help='Control Plane API URL')
@click.option('--username', envvar="WEAVER_USERNAME", help='API username')
@click.option('--password', envvar="WEAVER_PASSWORD", help='API password')
@click.pass_context
def cli(ctx, api_url, username, password):
    """Nexus Weaver - Deploy apps with ease"""
    ctx.ensure_object(dict)

    if api_url:
        config.api_url = api_url 
    if username:
        config.username = username 
    if password:
        config.password = password 

    ctx.obj['config'] = config 
    ctx.obj['client'] = NexusWeaverClient(config)

@cli.command()
def init():
    """Initialize a new Nexus Weaver application"""
    console.print("[bold green]Initializing Nexus Weaver application...[/bold green]")

    import os 
    if os.path.exists("weaver.yml"):
        console.print("[yellow]weaver.yml alreadt exists.[/yellow]")
        if not click.confirm("Do you want to overwrite it?"):
            return 
        
    name = click.prompt("Application name", default="my-app")
    description = click.prompt("Description", default="")

    manifest_content = f"""# Nexus Weaver Application Manifest
name: {name}
description: {description}

services:
  # Example service - modify as needed
  api:
    language: python
    port: 8000
    source: ./api
    command: python app.py
    limits:
      memory: 512M  # 512 MB
      cpu_shares: 1024
"""
    with open("weaver.yml", "w") as f:
        f.write(manifest_content)

    console.print("[green]✓[/green] Created weaver.yml")
    console.print("\nNext steps:")
    console.print("1. Edit weaver.yml to define your services")
    console.print("2. Run [bold]weaver deploy[/bold] to deploy your application")

@cli.command()
@click.option('--file', '-f', default='weaver.yml', help='Path to manifest file')
@click.option('--version', '-v', help="Deployment version")
@click.pass_context
def deploy(ctx, file, version):
    """Deploy an application from a manifest file"""
    client = ctx.obj['client']

    try:
        console.print(f"[cyan]Loading manifet from {file}...[/cyan]")
        manifest = Manifest.from_file(file)

        if version:
            manifest.version = version 

        console.print("\n[bold]Deployment Preview:[/bold]")
        console.print(f"  Application: {manifest.name}")
        console.print(f"  Version: {manifest.version}")
        console.print(f"  Services: {len(manifest.services)}")

        for service in manifest.services:
            console.print(f"    - {service['name']} ({service['language']})")

        if not click.confirm("\nProceed with deployment?"):
            return 
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Deployinh application...", total=None)
            
            deployment = client.create_deployment(manifest)

            progress.update(task, completed=True)
        
        console.print(f"\n[green]✓[/green] Deployment successful!")
        console.print(f"  ID: {deployment['id']}")
        console.print(f"  Status: {deployment['status']}")
    except WeaverError as e:
        console.print(f"[red]Error:[/red]")
        raise click.Abort()
    
@cli.command()
@click.option('--app', '-a', help='Filter by application name')
@click.option('--status', '-s', help='Filter by status')
@click.pass_context
def list(ctx, app, status):
    """List all deployments"""
    client = ctx.obj['client']
    
    try:
        deployments = client.list_deployments(app_name=app, status=status)
        
        if not deployments:
            console.print("[yellow]No deployments found[/yellow]")
            return
        
        # Create table
        table = Table(title="Deployments")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Application", style="magenta")
        table.add_column("Version", style="blue")
        table.add_column("Status", style="green")
        table.add_column("Services")
        table.add_column("Created", style="dim")
        
        for dep in deployments:
            services = f"{len(dep.get('services', []))} service(s)"
            created = dep.get('createdAt', 'Unknown')[:19]  # Trim microseconds
            
            status_style = "green" if dep['status'] == "DEPLOYED" else "yellow"
            table.add_row(
                dep['id'][:8],  # Short ID
                dep.get('applicationName', 'Unknown'),
                dep.get('version', 'Unknown'),
                f"[{status_style}]{dep['status']}[/{status_style}]",
                services,
                created
            )
        
        console.print(table)
        
    except WeaverError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
@click.argument('deployment_id')
@click.pass_context
def status(ctx, deployment_id):
    """Get detailed status of a deployment"""
    client = ctx.obj['client']
    
    try:
        deployment = client.get_deployment(deployment_id)
        
        console.print(f"\n[bold]Deployment Details[/bold]")
        console.print(f"  ID: {deployment['id']}")
        console.print(f"  Application: {deployment['applicationName']}")
        console.print(f"  Version: {deployment['version']}")
        console.print(f"  Status: {deployment['status']}")
        console.print(f"  Created: {deployment['createdAt']}")
        
        if deployment.get('services'):
            console.print(f"\n[bold]Services:[/bold]")
            
            for service in deployment['services']:
                status_icon = "✓" if service['status'] == "RUNNING" else "✗"
                console.print(f"  [{status_icon}] {service['name']}")
                console.print(f"      Language: {service['language']}")
                console.print(f"      Status: {service['status']}")
                if service.get('nodeId'):
                    console.print(f"      Node: {service['nodeId']}")
                if service.get('port'):
                    console.print(f"      Port: {service['port']}")
        
    except WeaverError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
@click.argument('deployment_id')
@click.option('--follow', '-f', is_flag=True, help='Follow log output')
@click.option('--tail', '-n', type=int, default=100, help='Number of lines to show')
@click.pass_context
def logs(ctx, deployment_id, follow, tail):
    """View logs from a deployment"""
    client = ctx.obj['client']
    
    console.print(f"[cyan]Fetching logs for deployment {deployment_id}...[/cyan]")
    console.print("[yellow]Note: Log streaming not yet implemented[/yellow]")
    
    # TODO: Implement log streaming
    # This will require adding a logs endpoint to the Control Plane


@cli.command()
@click.argument('deployment_id')
@click.option('--force', '-f', is_flag=True, help='Force stop without confirmation')
@click.pass_context
def stop(ctx, deployment_id, force):
    """Stop a running deployment"""
    client = ctx.obj['client']
    
    if not force:
        if not click.confirm(f"Stop deployment {deployment_id}?"):
            return
    
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Stopping deployment...", total=None)
            
            result = client.stop_deployment(deployment_id)
            
            progress.update(task, completed=True)
        
        console.print(f"[green]✓[/green] Deployment stopped")
        
    except WeaverError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
@click.argument('deployment_id')
@click.option('--force', '-f', is_flag=True, help='Force delete without confirmation')
@click.pass_context
def delete(ctx, deployment_id, force):
    """Delete a deployment"""
    client = ctx.obj['client']
    
    if not force:
        if not click.confirm(f"Delete deployment {deployment_id}? This cannot be undone."):
            return
    
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Deleting deployment...", total=None)
            
            client.delete_deployment(deployment_id)
            
            progress.update(task, completed=True)
        
        console.print(f"[green]✓[/green] Deployment deleted")
        
    except WeaverError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@cli.command()
@click.pass_context
def config_cmd(ctx):
    """Show current configuration"""
    cfg = ctx.obj['config']
    
    console.print("[bold]Current Configuration:[/bold]")
    console.print(f"  API URL: {cfg.api_url}")
    console.print(f"  Username: {cfg.username}")
    console.print(f"  Password: {'*' * len(cfg.password) if cfg.password else '(not set)'}")


if __name__ == '__main__':
    cli()