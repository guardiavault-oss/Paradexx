import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Security API endpoints for authentication and authorization.
"""

from datetime import datetime, timedelta  # noqa: E402
from typing import Any, Dict, Optional  # noqa: E402

from fastapi import APIRouter, Depends, HTTPException  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..enterprise.security_manager import EnterpriseSecurityManager, User  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402


class LoginRequest(BaseModel):
    """Login request model."""

    username: str
    password: str
    mfa_code: Optional[str] = None


class LoginResponse(BaseModel):
    """Login response model."""

    access_token: str
    token_type: str
    expires_in: int
    user_info: Dict[str, Any]


class PermissionRequest(BaseModel):
    """Permission validation request."""

    user_id: str
    resource: str
    operation: str


class SecurityAPI:
    """
    Security-focused API endpoints for authentication and authorization.

    Features:
    - User authentication with MFA
    - JWT token management
    - Permission validation
    - Session management
    - Security audit logging
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.router = APIRouter(prefix="/api/v1/security", tags=["security"])
        self.security_manager = EnterpriseSecurityManager(config)
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)

        self._setup_routes()

    def _setup_routes(self):
        """Setup security API routes."""

        @self.router.post("/login", response_model=LoginResponse)
        async def login(request: LoginRequest):
            """Authenticate user and return access token."""
            try:
                # Validate credentials
                user = await self._authenticate_user(request.username, request.password)
                if not user:
                    await self.audit_logger.log_security_event(
                        {
                            "event_type": "LOGIN_FAILED",
                            "username": request.username,
                            "reason": "INVALID_CREDENTIALS",
                            "timestamp": datetime.utcnow(),
                            "status": "FAILURE",
                        }
                    )
                    raise HTTPException(status_code=401, detail="Invalid credentials")

                # Validate MFA if required
                if self.config.rbac_config.multi_factor_auth and not request.mfa_code:
                    raise HTTPException(status_code=401, detail="MFA code required")

                if request.mfa_code and not await self._validate_mfa(
                    user, request.mfa_code
                ):
                    await self.audit_logger.log_security_event(
                        {
                            "event_type": "MFA_VALIDATION_FAILED",
                            "user_id": user.id,
                            "username": request.username,
                            "timestamp": datetime.utcnow(),
                            "status": "FAILURE",
                        }
                    )
                    raise HTTPException(status_code=401, detail="Invalid MFA code")

                # Generate access token
                access_token = await self._generate_access_token(user)

                # Create session
                session_id = await self._create_session(user)

                # Log successful login
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "LOGIN_SUCCESS",
                        "user_id": user.id,
                        "username": request.username,
                        "session_id": session_id,
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                return LoginResponse(
                    access_token=access_token,
                    token_type="Bearer",
                    expires_in=3600,
                    user_info={
                        "user_id": user.id,
                        "username": user.username,
                        "roles": user.roles,
                        "permissions": user.permissions,
                    },
                )

            except HTTPException:
                raise
            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "LOGIN_ERROR",
                        "username": request.username,
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

        @self.router.post("/logout")
        async def logout(session_id: str = Depends(self._get_session_id)):
            """Logout user and invalidate session."""
            try:
                # Invalidate session
                await self._invalidate_session(session_id)

                # Log logout
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "LOGOUT_SUCCESS",
                        "session_id": session_id,
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                return {"status": "success", "message": "Logged out successfully"}

            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "LOGOUT_ERROR",
                        "session_id": session_id,
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")

        @self.router.post("/validate-permission")
        async def validate_permission(
            request: PermissionRequest, session_id: str = Depends(self._get_session_id)
        ):
            """Validate user permission for specific operation."""
            try:
                # Validate session
                session = await self._get_session(session_id)
                if not session or session["user_id"] != request.user_id:
                    raise HTTPException(status_code=401, detail="Invalid session")

                # Check permission
                has_permission = await self._check_permission(
                    request.user_id, request.resource, request.operation
                )

                # Log permission check
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "PERMISSION_CHECK",
                        "user_id": request.user_id,
                        "resource": request.resource,
                        "operation": request.operation,
                        "result": has_permission,
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                return {
                    "has_permission": has_permission,
                    "user_id": request.user_id,
                    "resource": request.resource,
                    "operation": request.operation,
                }

            except HTTPException:
                raise
            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "PERMISSION_CHECK_ERROR",
                        "user_id": request.user_id,
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Permission validation failed: {str(e)}"
                )

    async def _authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user credentials against database."""
        try:
            user_data = await self.security_manager.authenticate_user(
                username, password
            )
            if user_data:
                return User(
                    id=user_data["id"],
                    username=user_data["username"],
                    roles=user_data["roles"],
                    permissions=user_data["permissions"],
                )
            return None
        except Exception as e:
            self.audit_logger.log_security_event(
                {
                    "event_type": "AUTH_ERROR",
                    "username": username,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                }
            )
            return None

    async def _validate_mfa(self, user: User, mfa_code: str) -> bool:
        """Validate MFA code against authentication service."""
        try:
            return await self.security_manager.validate_mfa_token(user.id, mfa_code)
        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "MFA_ERROR",
                    "user_id": user.id,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                }
            )
            return False

    async def _generate_access_token(self, user: User) -> str:
        """Generate JWT access token."""
        try:
            return await self.security_manager.generate_jwt_token(
                user_id=user.id,
                username=user.username,
                roles=user.roles,
                permissions=user.permissions,
                expires_in=3600,
            )
        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "TOKEN_GENERATION_ERROR",
                    "user_id": user.id,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                }
            )
            raise

    async def _create_session(self, user: User) -> str:
        """Create user session in database."""
        try:
            session_data = {
                "user_id": user.id,
                "username": user.username,
                "roles": user.roles,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=24),
            }
            return await self.security_manager.create_user_session(session_data)
        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "SESSION_CREATION_ERROR",
                    "user_id": user.id,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                }
            )
            raise

    async def _get_session_id(self) -> str:
        """Extract session ID from request."""

        from ..utils.session_manager import SessionManager  # noqa: E402

        session_manager = SessionManager()
        return await session_manager.extract_session_id_from_request()

    async def _invalidate_session(self, session_id: str):
        """Invalidate user session."""
        # Mock implementation - would remove from database

    async def _get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session information."""
        # Mock implementation - would query session database
        return {"user_id": "user_001", "created_at": datetime.utcnow()}

    async def _check_permission(
        self, user_id: str, resource: str, operation: str
    ) -> bool:
        """Check user permission for resource/operation."""
        # Mock implementation - would check RBAC system
        return True
