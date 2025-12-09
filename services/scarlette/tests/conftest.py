"""Test configuration and fixtures for Scarlette AI Service."""

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
from scarlette_ai.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def mock_scarlette_ai():
    """Mock Scarlette AI service for testing."""
    return {"status": "mocked"}
