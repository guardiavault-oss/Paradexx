"""
Command Line Interface for Scarlette AI Service
"""

import click
import uvicorn


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """Scarlette AI Service CLI"""


@cli.command()
@click.option("--host", default="0.0.0.0", help="Host to bind to")
@click.option("--port", default=8000, help="Port to bind to")
@click.option("--reload", is_flag=True, help="Enable auto-reload")
@click.option("--log-level", default="info", help="Log level")
def serve(host, port, reload, log_level):
    """Start the Scarlette AI service"""
    click.echo("🚀 Starting Scarlette AI Service...")
    uvicorn.run(
        "scarlette_ai.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
    )


@cli.command()
def health():
    """Check service health"""
    import httpx

    try:
        response = httpx.get("http://localhost:8000/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            click.echo("✅ Service is healthy")
            click.echo(f"Status: {data.get('status', 'unknown')}")
            click.echo(f"AI Ready: {data.get('ai_model_ready', False)}")
            click.echo(f"Redis Connected: {data.get('redis_connected', False)}")
        else:
            click.echo("❌ Service is not healthy")
            click.echo(f"Status Code: {response.status_code}")
    except Exception as e:
        click.echo(f"❌ Could not connect to service: {e}")


@cli.command()
@click.argument("message")
@click.option("--user-id", default="cli-user", help="User ID")
@click.option("--blockchain", help="Blockchain to focus on")
def chat(message, user_id, blockchain):
    """Chat with Scarlette AI"""
    import httpx

    data = {
        "message": message,
        "user_id": user_id,
    }

    if blockchain:
        data["blockchain_focus"] = blockchain

    try:
        response = httpx.post("http://localhost:8000/chat", json=data, timeout=30)

        if response.status_code == 200:
            result = response.json()
            click.echo("🤖 Scarlette:")
            click.echo(result.get("response", "No response"))

            if result.get("suggestions"):
                click.echo("\n💡 Suggestions:")
                for suggestion in result["suggestions"]:
                    click.echo(f"  • {suggestion}")
        else:
            click.echo(f"❌ Error: {response.status_code}")
            click.echo(response.text)

    except Exception as e:
        click.echo(f"❌ Could not connect to service: {e}")


@cli.command()
def version():
    """Show version information"""
    click.echo("Scarlette AI Service v1.0.0")
    click.echo("Advanced Blockchain Security AI Assistant")


if __name__ == "__main__":
    cli()
