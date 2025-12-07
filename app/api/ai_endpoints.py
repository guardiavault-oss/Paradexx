#!/usr/bin/env python3
"""
Scarlette AI Assistant API Endpoints
Provides REST API and WebSocket for AI assistant functionality
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import structlog

# Import core modules
try:
    from app.core.scarlette_integration import get_scarlette_integration
    from config.settings import settings
except ImportError as e:
    print(f"Warning: Could not import Scarlette AI modules: {e}")
    get_scarlette_integration = None
    settings = None

# Import utilities
from app.core.utils import get_utc_timestamp

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/ai", tags=["ai"])


# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for AI chat"""
    message: str = Field(..., description="User message")
    user_id: Optional[str] = Field("anonymous", description="User ID")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous conversation messages")


class ChatResponse(BaseModel):
    """Response model for AI chat"""
    message: str = Field(..., description="AI response message")
    user_id: str = Field(..., description="User ID")
    session_id: Optional[str] = Field(None, description="Session ID")
    timestamp: str = Field(default_factory=get_utc_timestamp)


class TaskRequest(BaseModel):
    """Request model for AI task execution"""
    task_name: str = Field(..., description="Task name: analyze_contract, check_token_security, scan_address, etc.")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Task parameters")
    user_id: Optional[str] = Field("anonymous", description="User ID")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Chat with Scarlette AI assistant
    
    This endpoint provides intelligent responses using Scarlette AI,
    integrated with GuardianX security engines for blockchain-specific insights.
    """
    try:
        if not get_scarlette_integration or not settings:
            # Fallback to simple responses if Scarlette not available
            return ChatResponse(
                message=_generate_fallback_response(request.message),
                user_id=request.user_id or "anonymous",
                session_id=request.session_id
            )
        
        if not settings.enable_scarlette_ai:
            # Return fallback if AI is disabled
            return ChatResponse(
                message=_generate_fallback_response(request.message),
                user_id=request.user_id or "anonymous",
                session_id=request.session_id
            )
        
        scarlette = get_scarlette_integration()
        
        # Initialize if not already initialized
        if not scarlette._initialized:
            try:
                await scarlette.initialize()
            except Exception as e:
                logger.warning(f"Failed to initialize Scarlette AI: {e}")
                return ChatResponse(
                    message=_generate_fallback_response(request.message),
                    user_id=request.user_id or "anonymous",
                    session_id=request.session_id
                )
        
        # Build context from conversation history if provided
        context = request.context or {}
        if request.conversation_history:
            context["conversation_history"] = request.conversation_history
        
        # Call Scarlette AI
        try:
            response = await scarlette.chat(
                message=request.message,
                user_id=request.user_id or "anonymous",
                session_id=request.session_id,
                context=context,
                blockchain_focus="ethereum",  # Default, can be made configurable
                execute_tasks=True
            )
            
            # Extract message from response
            if isinstance(response, dict):
                message = response.get("message") or response.get("response") or response.get("content", "")
            else:
                message = str(response) if response else ""
            
            return ChatResponse(
                message=message,
                user_id=request.user_id or "anonymous",
                session_id=response.get("session_id") if isinstance(response, dict) else request.session_id
            )
        except Exception as e:
            logger.error(f"Scarlette AI chat error: {e}")
            return ChatResponse(
                message=_generate_fallback_response(request.message),
                user_id=request.user_id or "anonymous",
                session_id=request.session_id
            )
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"AI chat processing failed: {str(e)}"
        )


def _generate_fallback_response(message: str) -> str:
    """Generate fallback response when AI is not available"""
    lower_message = message.lower()
    
    if any(word in lower_message for word in ["safe", "address", "contract"]):
        return "I can analyze addresses and contracts for security. To check an address, paste it in the chat. GuardianX analyzes contracts for vulnerabilities, honeypots, and suspicious patterns."
    
    if any(word in lower_message for word in ["vault", "guardian", "inheritance"]):
        return "Vault features help secure your assets for inheritance. You can add guardians who can attest to trigger inheritance transfers, and set up beneficiaries who will receive your assets. Would you like help setting up a vault?"
    
    if any(word in lower_message for word in ["mev", "front-running", "sandwich"]):
        return "MEV protection shields your transactions from front-running and sandwich attacks. GuardianX routes transactions through private mempools (Flashbots, etc.) to prevent MEV extraction. Your protection is active by default."
    
    if any(word in lower_message for word in ["bridge", "cross-chain"]):
        return "Cross-chain bridging lets you transfer assets between different blockchains. GuardianX analyzes bridge security and provides recommendations. You can bridge assets using the Bridge feature in the dashboard."
    
    if any(word in lower_message for word in ["security", "protection", "safe"]):
        return "GuardianX provides multiple layers of security: (1) Transaction analysis and rewriting, (2) MEV protection via private mempools, (3) Contract analysis, (4) Threat detection, (5) Autonomous defense system. Your transactions are protected automatically."
    
    return "I'm your GuardianX AI assistant. I can help with security analysis, transaction reviews, vault management, and wallet questions. How can I help you today?"


@router.post("/task")
async def execute_ai_task(request: TaskRequest):
    """
    Execute a specific AI task
    
    Available tasks:
    - analyze_contract: Analyze a smart contract for security
    - check_token_security: Check if a token is safe
    - scan_address: Scan an address for threats
    - get_defi_risks: Get DeFi protocol risks
    - analyze_transaction: Analyze a transaction for threats
    """
    try:
        if not get_scarlette_integration or not settings:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please ensure Scarlette AI is configured."
            )
        
        if not settings.enable_scarlette_ai:
            raise HTTPException(
                status_code=503,
                detail="AI service is disabled. Enable it in settings."
            )
        
        scarlette = get_scarlette_integration()
        
        if not scarlette._initialized:
            await scarlette.initialize()
        
        result = await scarlette.execute_task(
            task_name=request.task_name,
            user_id=request.user_id or "anonymous",
            parameters=request.parameters or {}
        )
        
        return {
            "success": True,
            "task_name": request.task_name,
            "status": result.get("status", "completed"),
            "result": result,
            "timestamp": get_utc_timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing AI task: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Task execution failed: {str(e)}"
        )


@router.get("/health")
async def ai_health_check():
    """Check AI service health"""
    try:
        if not get_scarlette_integration or not settings:
            return {
                "status": "unavailable",
                "enabled": False,
                "message": "AI service not configured"
            }
        
        scarlette = get_scarlette_integration()
        
        return {
            "status": "healthy" if scarlette._initialized else "not_initialized",
            "enabled": settings.enable_scarlette_ai if settings else False,
            "initialized": scarlette._initialized,
            "ai_available": scarlette.scarlette_ai is not None,
            "knowledge_base_available": scarlette.knowledge_base is not None,
            "conversation_manager_available": scarlette.conversation_manager is not None
        }
    except Exception as e:
        logger.error(f"Error checking AI health: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@router.websocket("/ws")
async def ai_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time AI chat
    
    Message format:
    {
        "type": "chat",
        "message": "user message",
        "user_id": "user_id",
        "session_id": "session_id"
    }
    """
    await websocket.accept()
    
    try:
        if not get_scarlette_integration or not settings:
            await websocket.send_json({
                "type": "error",
                "message": "AI service not available"
            })
            await websocket.close()
            return
        
        if not settings.enable_scarlette_ai:
            await websocket.send_json({
                "type": "error",
                "message": "AI service is disabled"
            })
            await websocket.close()
            return
        
        scarlette = get_scarlette_integration()
        
        if not scarlette._initialized:
            await scarlette.initialize()
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Process the message
            if data.get("type") == "chat":
                try:
                    response = await scarlette.chat(
                        message=data.get("message", ""),
                        user_id=data.get("user_id", "anonymous"),
                        session_id=data.get("session_id"),
                        context=data.get("context"),
                        blockchain_focus=data.get("blockchain_focus", "ethereum"),
                        execute_tasks=data.get("execute_tasks", True)
                    )
                    
                    # Send response back to client
                    if isinstance(response, dict):
                        await websocket.send_json({
                            "type": "chat_response",
                            "message": response.get("message") or response.get("response") or "",
                            "session_id": response.get("session_id"),
                            **response
                        })
                    else:
                        await websocket.send_json({
                            "type": "chat_response",
                            "message": str(response) if response else "",
                            "session_id": data.get("session_id")
                        })
                except Exception as e:
                    logger.error(f"WebSocket chat error: {e}")
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
        logger.info("AI WebSocket client disconnected")
    except Exception as e:
        logger.error(f"AI WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass

