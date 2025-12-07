#!/usr/bin/env python3
"""
Scarlette AI API Endpoints
Provides chat, analysis, and task execution endpoints for Scarlette AI integration
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
import structlog
import json

# Import integration module
try:
    from app.core.scarlette_integration import get_scarlette_integration, initialize_scarlette
    SCARLETTE_AVAILABLE = True
except ImportError as e:
    structlog.get_logger(__name__).warning(f"Scarlette integration not available: {e}")
    SCARLETTE_AVAILABLE = False
    get_scarlette_integration = None
    initialize_scarlette = None

# Import error handlers
from app.api.error_handlers import handle_endpoint_errors, create_service_unavailable_error
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/scarlette", tags=["scarlette"])


# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for chat messages"""
    message: str = Field(..., description="User message")
    user_id: Optional[str] = Field(None, description="User ID")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    blockchain_focus: Optional[str] = Field(None, description="Blockchain network focus")
    execute_tasks: bool = Field(True, description="Whether to execute detected tasks")


class ChatResponse(BaseModel):
    """Response model for chat"""
    response: str
    session_id: str
    confidence: float
    sources: List[Dict[str, Any]]
    suggestions: List[str]
    blockchain_context: Dict[str, Any]
    task_executed: bool
    task_results: Optional[Dict[str, Any]] = None
    local_ai_recommendation: Optional[Dict[str, Any]] = None


class TaskRequest(BaseModel):
    """Request model for task execution"""
    task_name: str = Field(..., description="Task name to execute")
    user_id: Optional[str] = Field(None, description="User ID")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Task parameters")


class TaskResponse(BaseModel):
    """Response model for task execution"""
    task: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    guardianx_enhanced: bool = False


@router.get("/health")
@handle_endpoint_errors("scarlette health check")
async def health_check():
    """Check Scarlette AI service health"""
    if not SCARLETTE_AVAILABLE:
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Scarlette AI",
                "message": "Scarlette integration not available"
            },
            timestamp=get_utc_timestamp()
        )
    
    try:
        integration = get_scarlette_integration()
        is_healthy = integration._initialized if integration else False
        
        return format_response(
            success=True,
            data={
                "healthy": is_healthy,
                "service": "Scarlette AI",
                "initialized": is_healthy
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Scarlette AI",
                "error": str(e)
            },
            timestamp=get_utc_timestamp()
        )


@router.post("/chat", response_model=dict)
@handle_endpoint_errors("scarlette chat")
async def chat(request: ChatRequest):
    """
    Chat with Scarlette AI assistant
    
    Enhanced with GuardianX security engines and LocalAIAgent intelligence
    """
    if not SCARLETTE_AVAILABLE or not get_scarlette_integration:
        raise create_service_unavailable_error("Scarlette AI service unavailable")
    
    integration = get_scarlette_integration()
    
    if not integration._initialized:
        # Try to initialize if not already done
        try:
            await integration.initialize()
        except Exception as e:
            logger.warning("Failed to initialize Scarlette", error=str(e))
            raise HTTPException(
                status_code=503,
                detail="Scarlette AI is not initialized. Please check configuration."
            )
    
    try:
        result = await integration.chat(
            message=request.message,
            user_id=request.user_id or "anonymous",
            session_id=request.session_id,
            context=request.context,
            blockchain_focus=request.blockchain_focus,
            execute_tasks=request.execute_tasks
        )
        
        return format_response(
            success=True,
            data=result,
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Chat processing failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat: {str(e)}"
        )


@router.post("/task", response_model=dict)
@handle_endpoint_errors("execute scarlette task")
async def execute_task(request: TaskRequest):
    """
    Execute an AI task using Scarlette
    
    Tasks are enhanced with GuardianX security analysis
    """
    if not SCARLETTE_AVAILABLE or not get_scarlette_integration:
        raise create_service_unavailable_error("Scarlette AI service unavailable")
    
    integration = get_scarlette_integration()
    
    if not integration._initialized:
        try:
            await integration.initialize()
        except Exception as e:
            logger.warning("Failed to initialize Scarlette", error=str(e))
            raise HTTPException(
                status_code=503,
                detail="Scarlette AI is not initialized"
            )
    
    try:
        result = await integration.execute_task(
            task_name=request.task_name,
            user_id=request.user_id or "anonymous",
            parameters=request.parameters or {}
        )
        
        return format_response(
            success=True,
            data=result,
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Task execution failed", error=str(e), task=request.task_name)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute task: {str(e)}"
        )


@router.get("/greeting")
@handle_endpoint_errors("get greeting")
async def get_greeting(user_id: Optional[str] = None):
    """Get a personalized greeting from Scarlette"""
    if not SCARLETTE_AVAILABLE or not get_scarlette_integration:
        return format_response(
            success=True,
            data={
                "greeting": "Hello! I'm Scarlette, your blockchain security AI assistant integrated with GuardianX."
            },
            timestamp=get_utc_timestamp()
        )
    
    integration = get_scarlette_integration()
    
    try:
        greeting = await integration.generate_greeting(user_id or "anonymous")
        return format_response(
            success=True,
            data={"greeting": greeting},
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.warning("Greeting generation failed", error=str(e))
        return format_response(
            success=True,
            data={
                "greeting": "Hello! I'm Scarlette, your blockchain security AI assistant. How can I help you today?"
            },
            timestamp=get_utc_timestamp()
        )


@router.post("/initialize")
@handle_endpoint_errors("initialize scarlette")
async def initialize():
    """Initialize Scarlette AI integration (admin endpoint)"""
    if not SCARLETTE_AVAILABLE or not initialize_scarlette:
        raise create_service_unavailable_error("Scarlette AI service unavailable")
    
    try:
        integration = await initialize_scarlette()
        return format_response(
            success=True,
            data={
                "initialized": integration._initialized,
                "message": "Scarlette AI initialized successfully"
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Initialization failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Scarlette: {str(e)}"
        )


@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for real-time Scarlette AI chat
    
    Message format:
    {
        "type": "chat",
        "message": "user message",
        "user_id": "user_id",
        "session_id": "session_id",
        "context": {},
        "blockchain_focus": "ethereum"
    }
    """
    await websocket.accept()
    
    if not SCARLETTE_AVAILABLE or not get_scarlette_integration:
        await websocket.send_json({
            "type": "error",
            "message": "Scarlette AI service unavailable"
        })
        await websocket.close()
        return
    
    integration = get_scarlette_integration()
    
    if not integration._initialized:
        try:
            await integration.initialize()
        except Exception as e:
            logger.warning("Failed to initialize Scarlette", error=str(e))
            await websocket.send_json({
                "type": "error",
                "message": "Scarlette AI initialization failed"
            })
            await websocket.close()
            return
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "chat":
                try:
                    response = await integration.chat(
                        message=data.get("message", ""),
                        user_id=data.get("user_id", "anonymous"),
                        session_id=data.get("session_id"),
                        context=data.get("context"),
                        blockchain_focus=data.get("blockchain_focus", "ethereum"),
                        execute_tasks=data.get("execute_tasks", True)
                    )
                    
                    await websocket.send_json({
                        "type": "chat_response",
                        "response": response.get("response") or response.get("message", ""),
                        "session_id": response.get("session_id") or data.get("session_id"),
                        "confidence": response.get("confidence", 0.0),
                        "sources": response.get("sources", []),
                        "suggestions": response.get("suggestions", []),
                        "blockchain_context": response.get("blockchain_context", {}),
                        "task_executed": response.get("task_executed", False),
                        "task_results": response.get("task_results"),
                        "local_ai_recommendation": response.get("local_ai_recommendation"),
                    })
                except Exception as e:
                    logger.error("WebSocket chat error", error=str(e))
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Chat processing failed: {str(e)}"
                    })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {data.get('type')}"
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass

