#!/usr/bin/env python3
"""
Scarlette AI Service - Standalone Version
========================================

A sophisticated AI assistant designed for blockchain security and DeFi protocol analysis.
This standalone version can operate independently without the full Scorpius platform.

Features:
- Advanced Natural Language Processing
- Real-time Blockchain Intelligence
- Comprehensive Cybersecurity Analysis
- Multi-modal Interaction Support
- Proactive Security Monitoring

Author: Scarlette AI Team
Version: 1.0.0 (Standalone)
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel

from .ai_core import ScarletteAI

# Import local components
from .blockchain_knowledge_base import BlockchainKnowledgeBase
from .conversation_manager import ConversationManager

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global variables for service instances
scarlette_ai: ScarletteAI | None = None
knowledge_base: BlockchainKnowledgeBase | None = None
conversation_manager: ConversationManager | None = None
redis_client: redis.Redis | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    ai_model_ready: bool
    knowledge_base_ready: bool
    conversation_manager_ready: bool
    redis_connected: bool


class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"
    session_id: str | None = None
    context: dict[str, Any] | None = None
    blockchain_focus: str | None = None  # "ethereum", "polygon", "bsc", etc.
    execute_tasks: bool = True


class ChatResponse(BaseModel):
    response: str
    session_id: str
    confidence: float
    sources: list[str]
    suggestions: list[str]
    blockchain_context: dict[str, Any]
    task_executed: bool
    task_results: dict[str, Any] | None = None


class GreetingRequest(BaseModel):
    user_id: str = "anonymous"


class GreetingResponse(BaseModel):
    greeting: str
    user_id: str
    timestamp: str


class TaskRequest(BaseModel):
    task_name: str
    user_id: str = "anonymous"
    parameters: dict[str, Any] | None = None


class TaskResponse(BaseModel):
    task_name: str
    status: str
    result: dict[str, Any]
    timestamp: str


class TrainingRequest(BaseModel):
    user_id: str
    training_data: list[dict[str, Any]]
    focus_areas: list[str]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown."""
    global scarlette_ai, knowledge_base, conversation_manager, redis_client

    # Startup
    logger.info("Starting Scarlette AI Service...")

    # Initialize Redis connection (optional)
    redis_url = os.getenv("REDIS_URL")
    redis_password = os.getenv("REDIS_PASSWORD")

    if redis_url:
        try:
            redis_client = redis.from_url(
                redis_url,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
            )
            ping_result = await redis_client.ping()
            if ping_result:
                logger.info("✅ Redis connected successfully")
            else:
                logger.warning("⚠️ Redis ping returned unexpected result, continuing without Redis")
                redis_client = None
        except Exception as e:
            logger.warning(f"⚠️ Redis not available (optional): {e}")
            redis_client = None
    else:
        logger.info("ℹ️ Redis not configured - running without caching (optional)")
        redis_client = None

    # Initialize knowledge base
    try:
        knowledge_base = BlockchainKnowledgeBase(redis_client)
        await knowledge_base.initialize()
        logger.info("✅ Blockchain knowledge base initialized")
    except Exception as e:
        logger.exception(f"❌ Failed to initialize knowledge base: {e}")
        knowledge_base = None

    # Initialize conversation manager
    try:
        conversation_manager = ConversationManager(redis_client)
        await conversation_manager.initialize()
        logger.info("✅ Conversation manager initialized")
    except Exception as e:
        logger.exception(f"❌ Failed to initialize conversation manager: {e}")
        conversation_manager = None

    # Initialize Scarlette AI
    try:
        model_path = os.getenv("SCARLETTE_MODEL_PATH", "./models/scarlette")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        use_openai = os.getenv("USE_OPENAI", "true").lower() == "true"
        use_huggingface = os.getenv("USE_HUGGINGFACE", "false").lower() == "true"

        scarlette_ai = ScarletteAI(
            model_path=model_path,
            knowledge_base=knowledge_base,
            conversation_manager=conversation_manager,
            openai_api_key=openai_api_key,
            use_openai=use_openai,
            use_huggingface=use_huggingface,
        )
        await scarlette_ai.initialize()
        logger.info("✅ Scarlette AI initialized successfully!")

    except Exception as e:
        logger.exception(f"❌ Failed to initialize Scarlette AI: {e}")
        scarlette_ai = None

    yield

    # Shutdown
    logger.info("Shutting down Scarlette AI Service...")
    if redis_client:
        await redis_client.close()


# Create FastAPI app
app = FastAPI(
    title="Scarlette AI Service",
    description="""
    🤖 Advanced Blockchain Security AI Assistant

    A sophisticated AI assistant designed exclusively for blockchain security
    and DeFi protocol analysis. Features include:

    - Advanced Natural Language Processing
    - Real-time Blockchain Intelligence
    - Comprehensive Cybersecurity Analysis
    - Multi-modal Interaction Support
    - Proactive Security Monitoring
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Scarlette AI Service",
        "version": "1.0.0",
        "description": "Advanced Blockchain Security AI Assistant",
        "status": "active",
        "endpoints": {
            "health": "/health",
            "chat": "/chat",
            "greeting": "/greeting",
            "task": "/task",
            "websocket": "/ws",
        },
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    global scarlette_ai, knowledge_base, conversation_manager, redis_client

    redis_connected = False
    if redis_client:
        try:
            ping_result = await redis_client.ping()
            redis_connected = bool(ping_result)
        except Exception:
            redis_connected = False

    core_services_ready = all([
        scarlette_ai is not None,
        knowledge_base is not None,
        conversation_manager is not None,
    ])

    return HealthResponse(
        status="healthy" if core_services_ready else "degraded",
        service="Scarlette AI Service",
        version="1.0.0",
        ai_model_ready=scarlette_ai is not None,
        knowledge_base_ready=knowledge_base is not None,
        conversation_manager_ready=conversation_manager is not None,
        redis_connected=redis_connected,
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with Scarlette AI."""
    if not scarlette_ai:
        raise HTTPException(status_code=503, detail="Scarlette AI not available")

    try:
        response = await scarlette_ai.process_message(
            message=request.message,
            user_id=request.user_id,
            session_id=request.session_id,
            context=request.context,
            blockchain_focus=request.blockchain_focus,
            execute_tasks=request.execute_tasks,
        )

        return ChatResponse(**response)
    except Exception as e:
        logger.exception(f"Chat processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {e!s}")


@app.post("/greeting", response_model=GreetingResponse)
async def get_greeting(request: GreetingRequest):
    """Get a personalized greeting from Scarlette."""
    if not scarlette_ai:
        raise HTTPException(status_code=503, detail="Scarlette AI not available")

    try:
        greeting = await scarlette_ai.generate_greeting(request.user_id)
        return GreetingResponse(
            greeting=greeting,
            user_id=request.user_id,
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception(f"Greeting generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Greeting generation failed: {e!s}")


@app.post("/task", response_model=TaskResponse)
async def execute_task(request: TaskRequest):
    """Execute a specific task."""
    if not scarlette_ai:
        raise HTTPException(status_code=503, detail="Scarlette AI not available")

    try:
        result = await scarlette_ai.execute_task(
            task_name=request.task_name,
            user_id=request.user_id,
            parameters=request.parameters,
        )

        return TaskResponse(
            task_name=request.task_name,
            status="completed",
            result=result,
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception(f"Task execution error: {e}")
        return TaskResponse(
            task_name=request.task_name,
            status="failed",
            result={"error": str(e)},
            timestamp=datetime.utcnow().isoformat(),
        )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication."""
    await websocket.accept()

    if not scarlette_ai:
        await websocket.send_json({"error": "Scarlette AI not available"})
        await websocket.close()
        return

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            # Process the message
            if data.get("type") == "chat":
                response = await scarlette_ai.process_message(
                    message=data.get("message", ""),
                    user_id=data.get("user_id", "anonymous"),
                    session_id=data.get("session_id"),
                    context=data.get("context"),
                    blockchain_focus=data.get("blockchain_focus"),
                )

                # Send response back to client
                await websocket.send_json({"type": "chat_response", **response})
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": f"Unknown message type: {data.get('type')}",
                    },
                )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        await websocket.send_json({"error": str(e)})


def main():
    """Main entry point for the CLI."""
    uvicorn.run(
        "scarlette_ai.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
