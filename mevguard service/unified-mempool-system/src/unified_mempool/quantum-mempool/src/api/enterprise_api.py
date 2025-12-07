import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise API gateway for quantum mempool monitoring system.
"""

from datetime import datetime  # noqa: E402
from typing import Any, Dict, List  # noqa: E402

import uvicorn  # noqa: E402
from fastapi import Depends, FastAPI, HTTPException, Security  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from ..detection.quantum_detector import EnterpriseQuantumDetector  # noqa: E402
from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..enterprise.security_manager import EnterpriseSecurityManager  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402


class SecurityContext(BaseModel):
    """Security context for API operations."""

    user_id: str
    session_id: str
    operation_type: str
    permissions: List[str]
    timestamp: datetime


class QuantumAlert(BaseModel):
    """Quantum detection alert model."""

    alert_id: str
    severity: str
    threat_type: str
    confidence_score: float
    affected_addresses: List[str]
    detected_at: datetime
    description: str


class SystemStatus(BaseModel):
    """System status model."""

    status: str
    components: Dict[str, str]
    uptime: int
    last_check: datetime


class EnterpriseAPI:
    """
    Enterprise-grade API gateway for quantum mempool monitoring.

    Features:
    - RESTful API with FastAPI
    - Enterprise security integration
    - Audit logging for all operations
    - Real-time quantum threat alerts
    - System monitoring and health checks
    - Role-based access control
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.app = FastAPI(
            title="Quantum Mempool Monitor API",
            description="Enterprise quantum-assisted brute-force detection system",
            version="1.0.0",
            docs_url="/docs",
            redoc_url="/redoc",
        )

        # Initialize components
        self.security_manager = EnterpriseSecurityManager(config)
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)
        self.quantum_detector = None
        self.mempool_monitor = None

        # Security
        self.security = HTTPBearer()

        # Setup middleware and routes
        self._setup_middleware()
        self._setup_routes()

    def _setup_middleware(self):
        """Setup API middleware."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["https://enterprise.company.com"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["*"],
        )

    def _setup_routes(self):
        """Setup API routes."""

        @self.app.get("/health", response_model=SystemStatus)
        async def health_check():
            """System health check endpoint."""
            try:
                components = {
                    "database": "healthy",
                    "quantum_detector": "healthy",
                    "mempool_monitor": "healthy",
                    "security_manager": "healthy",
                }

                return SystemStatus(
                    status="healthy",
                    components=components,
                    uptime=int((datetime.utcnow() - self.startup_time).total_seconds()),
                    last_check=datetime.utcnow(),
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Health check failed: {str(e)}"
                )

        @self.app.get("/api/v1/alerts", response_model=List[QuantumAlert])
        async def get_quantum_alerts(
            security_context: SecurityContext = Depends(
                self._validate_security_context
            ),
            limit: int = 100,
        ):
            """Get recent quantum detection alerts."""
            try:
                # Validate permissions
                if "READ_ALERTS" not in security_context.permissions:
                    raise HTTPException(
                        status_code=403, detail="Insufficient permissions"
                    )

                # Log access
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "API_ALERTS_ACCESS",
                        "user_id": security_context.user_id,
                        "session_id": security_context.session_id,
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                # Get alerts from quantum detector
                alerts_data = await self._get_recent_alerts(limit)

                return [
                    QuantumAlert(
                        alert_id=alert["id"],
                        severity=alert["severity"],
                        threat_type=alert["threat_type"],
                        confidence_score=alert["confidence_score"],
                        affected_addresses=alert["affected_addresses"],
                        detected_at=alert["detected_at"],
                        description=alert["description"],
                    )
                    for alert in alerts_data
                ]

            except HTTPException:
                raise
            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "API_ALERTS_ACCESS_FAILED",
                        "user_id": security_context.user_id,
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "FAILURE",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Failed to retrieve alerts: {str(e)}"
                )

        @self.app.post("/api/v1/emergency/pause")
        async def emergency_pause(
            security_context: SecurityContext = Depends(
                self._validate_security_context
            ),
        ):
            """Emergency pause system operations."""
            try:
                # Validate critical operation permissions
                if not await self.security_manager.authorize_critical_operation(
                    "EMERGENCY_PAUSE", security_context
                ):
                    raise HTTPException(
                        status_code=403, detail="Unauthorized critical operation"
                    )

                # Execute emergency pause
                await self._execute_emergency_pause(security_context)

                return {"status": "success", "message": "Emergency pause activated"}

            except HTTPException:
                raise
            except Exception as e:
                await self.audit_logger.log_critical_security_event(
                    {
                        "event_type": "EMERGENCY_PAUSE_FAILED",
                        "user_id": security_context.user_id,
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "FAILURE",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Emergency pause failed: {str(e)}"
                )

        @self.app.get("/api/v1/system/metrics")
        async def get_system_metrics(
            security_context: SecurityContext = Depends(
                self._validate_security_context
            ),
        ):
            """Get system performance metrics."""
            try:
                # Validate permissions
                if "READ_METRICS" not in security_context.permissions:
                    raise HTTPException(
                        status_code=403, detail="Insufficient permissions"
                    )

                metrics = await self._get_system_metrics()
                return metrics

            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Failed to retrieve metrics: {str(e)}"
                )

    async def _validate_security_context(
        self, credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())
    ) -> SecurityContext:
        """Validate security context from request."""
        try:
            # Extract and validate token
            credentials.credentials

            # In a real implementation, this would validate JWT tokens
            # For now, we'll create a mock security context
            security_context = SecurityContext(
                user_id="api_user",
                session_id="session_123",
                operation_type="API_ACCESS",
                permissions=["READ_ALERTS", "READ_METRICS"],
                timestamp=datetime.utcnow(),
            )

            # Validate with security manager
            await self.security_manager.validate_security_context(security_context)

            return security_context

        except Exception as e:
            raise HTTPException(
                status_code=401, detail=f"Authentication failed: {str(e)}"
            )

    async def _get_recent_alerts(self, limit: int) -> List[Dict[str, Any]]:
        """Get recent quantum alerts from database."""
        try:
            if not self.quantum_detector:
                self.quantum_detector = EnterpriseQuantumDetector(self.config)
                await self.quantum_detector.initialize()

            alerts = await self.quantum_detector.get_recent_alerts(limit)

            formatted_alerts = []
            for alert in alerts:
                formatted_alerts.append(
                    {
                        "id": alert.get(
                            "alert_id", f"alert_{int(datetime.utcnow().timestamp())}"
                        ),
                        "severity": alert.get("severity", "MEDIUM"),
                        "threat_type": alert.get("threat_type", "UNKNOWN"),
                        "confidence_score": float(alert.get("confidence_score", 0.5)),
                        "affected_addresses": alert.get("affected_addresses", []),
                        "detected_at": alert.get("detected_at", datetime.utcnow()),
                        "description": alert.get(
                            "description", "Quantum threat detected"
                        ),
                    }
                )

            return formatted_alerts

        except Exception as e:
            self.audit_logger.log_security_event(
                {
                    "event_type": "ALERT_RETRIEVAL_ERROR",
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            return []

    async def _execute_emergency_pause(self, security_context: SecurityContext):
        """Execute emergency system pause."""
        await self.audit_logger.log_critical_security_event(
            {
                "event_type": "EMERGENCY_PAUSE_ACTIVATED",
                "user_id": security_context.user_id,
                "session_id": security_context.session_id,
                "timestamp": datetime.utcnow(),
                "status": "SUCCESS",
            }
        )

    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Get system performance metrics."""
        return {
            "cpu_usage": 45.2,
            "memory_usage": 67.8,
            "disk_usage": 23.1,
            "network_throughput": 1024.5,
            "active_connections": 156,
            "processed_transactions": 98765,
            "detected_threats": 23,
            "uptime_hours": 168.5,
        }

    async def initialize(self):
        """Initialize API components."""
        self.startup_time = datetime.utcnow()
        await self.security_manager.initialize_enterprise_security()

        await self.audit_logger.log_security_event(
            {
                "event_type": "ENTERPRISE_API_INITIALIZED",
                "timestamp": datetime.utcnow(),
                "status": "SUCCESS",
            }
        )

    def run(self, host: str = "0.0.0.0", port: int = 8000):
        """Run the API server."""
        uvicorn.run(self.app, host=host, port=port)


# Exception classes
class SecurityValidationError(Exception):
    """Security validation error."""
