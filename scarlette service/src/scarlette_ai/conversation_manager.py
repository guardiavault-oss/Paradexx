"""
Conversation Manager for Scarlette AI Service
Handles conversation state, context, and session management.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

import redis.asyncio as redis

logger = logging.getLogger(__name__)


class ConversationManager:
    """
    Manages conversation context, sessions, and chat history.
    Provides memory and continuity across interactions.
    """

    def __init__(self, redis_client: redis.Redis | None = None):
        self.redis_client = redis_client
        self.session_timeout = 3600  # 1 hour
        self._initialized = False

    async def initialize(self):
        """Initialize the conversation manager."""
        logger.info("Initializing Conversation Manager...")

        # Test Redis connection if available
        if self.redis_client:
            try:
                await self.redis_client.ping()
                logger.info("✅ Redis connection verified for conversation storage")
            except Exception as e:
                logger.warning(f"⚠️ Redis not available for conversation storage: {e}")
                self.redis_client = None

        self._initialized = True
        logger.info("✅ Conversation Manager initialized")

    async def create_session(self, user_id: str) -> str:
        """Create a new conversation session."""
        session_id = f"{user_id}_{uuid4().hex[:8]}"

        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "message_count": 0,
            "context": {},
            "conversation_history": [],
        }

        if self.redis_client:
            try:
                await self.redis_client.hset(
                    f"session:{session_id}",
                    mapping={
                        k: json.dumps(v) if isinstance(v, dict | list) else v
                        for k, v in session_data.items()
                    },
                )
                await self.redis_client.expire(f"session:{session_id}", self.session_timeout)
                logger.debug(f"Session {session_id} created and stored in Redis")
            except Exception as e:
                logger.exception(f"Failed to store session in Redis: {e}")

        return session_id

    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        """Retrieve a conversation session."""
        if not self.redis_client:
            return None

        try:
            session_data = await self.redis_client.hgetall(f"session:{session_id}")
            if not session_data:
                return None

            # Parse JSON fields
            for key in ["context", "conversation_history"]:
                if key in session_data:
                    try:
                        session_data[key] = json.loads(session_data[key])
                    except (json.JSONDecodeError, TypeError):
                        session_data[key] = {} if key == "context" else []

            # Convert message_count to int
            if "message_count" in session_data:
                try:
                    session_data["message_count"] = int(session_data["message_count"])
                except (ValueError, TypeError):
                    session_data["message_count"] = 0

            return session_data
        except Exception as e:
            logger.exception(f"Failed to retrieve session from Redis: {e}")
            return None

    async def update_session(
        self,
        session_id: str,
        message: str,
        response: str,
        context: dict[str, Any] | None = None,
    ):
        """Update session with new message and response."""
        session_data = await self.get_session(session_id)
        if not session_data:
            logger.warning(f"Session {session_id} not found, creating new one")
            # Extract user_id from session_id (format: user_id_hash)
            user_id = session_id.split("_")[0] if "_" in session_id else "anonymous"
            await self.create_session(user_id)
            session_data = await self.get_session(session_id)
            if not session_data:
                return

        # Update conversation history
        conversation_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            "response": response,
        }

        if "conversation_history" not in session_data:
            session_data["conversation_history"] = []

        session_data["conversation_history"].append(conversation_entry)

        # Keep only last 10 messages to manage memory
        if len(session_data["conversation_history"]) > 10:
            session_data["conversation_history"] = session_data["conversation_history"][-10:]

        # Update context if provided
        if context:
            if "context" not in session_data:
                session_data["context"] = {}
            session_data["context"].update(context)

        # Update metadata
        session_data["last_activity"] = datetime.utcnow().isoformat()
        session_data["message_count"] = session_data.get("message_count", 0) + 1

        # Store updated session
        if self.redis_client:
            try:
                await self.redis_client.hset(
                    f"session:{session_id}",
                    mapping={
                        k: json.dumps(v) if isinstance(v, dict | list) else str(v)
                        for k, v in session_data.items()
                    },
                )
                await self.redis_client.expire(f"session:{session_id}", self.session_timeout)
            except Exception as e:
                logger.exception(f"Failed to update session in Redis: {e}")

    async def get_conversation_context(self, session_id: str) -> str:
        """Get formatted conversation context for AI processing."""
        session_data = await self.get_session(session_id)
        if not session_data or not session_data.get("conversation_history"):
            return ""

        context_lines = []
        history = session_data["conversation_history"]

        # Include last few exchanges for context
        for entry in history[-3:]:  # Last 3 exchanges
            context_lines.append(f"User: {entry['message']}")
            context_lines.append(f"Assistant: {entry['response']}")

        return "\n".join(context_lines)

    async def cleanup_expired_sessions(self):
        """Clean up expired sessions (if not using Redis TTL)."""
        if not self.redis_client:
            return

        try:
            # Get all session keys
            session_keys = []
            async for key in self.redis_client.scan_iter(match="session:*"):
                session_keys.append(key)

            expired_count = 0
            for key in session_keys:
                session_data = await self.redis_client.hgetall(key)
                if session_data and "last_activity" in session_data:
                    last_activity = datetime.fromisoformat(session_data["last_activity"])
                    if datetime.utcnow() - last_activity > timedelta(seconds=self.session_timeout):
                        await self.redis_client.delete(key)
                        expired_count += 1

            if expired_count > 0:
                logger.info(f"Cleaned up {expired_count} expired sessions")

        except Exception as e:
            logger.exception(f"Failed to cleanup expired sessions: {e}")

    async def get_user_sessions(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        """Get recent sessions for a user."""
        if not self.redis_client:
            return []

        try:
            sessions = []
            async for key in self.redis_client.scan_iter(match=f"session:{user_id}_*"):
                session_data = await self.redis_client.hgetall(key)
                if session_data:
                    # Parse basic fields
                    session_info = {
                        "session_id": session_data.get("session_id", ""),
                        "created_at": session_data.get("created_at", ""),
                        "last_activity": session_data.get("last_activity", ""),
                        "message_count": int(session_data.get("message_count", 0)),
                    }
                    sessions.append(session_info)

            # Sort by last activity and return most recent
            sessions.sort(key=lambda x: x["last_activity"], reverse=True)
            return sessions[:limit]

        except Exception as e:
            logger.exception(f"Failed to get user sessions: {e}")
            return []
