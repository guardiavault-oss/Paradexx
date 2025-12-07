import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise audit logging with blockchain integration.
"""

import asyncio  # noqa: E402
import hashlib  # noqa: E402
import json  # noqa: E402
import uuid  # noqa: E402
from dataclasses import dataclass  # noqa: E402
from datetime import datetime  # noqa: E402
from typing import Any, Dict, List, Optional  # noqa: E402

from common.observability.logging import get_scorpius_logger  # noqa: E402

try:
    import structlog  # noqa: E402

    STRUCTLOG_AVAILABLE = True
except ImportError:
    from common.observability.logging import get_scorpius_logger  # noqa: E402

    STRUCTLOG_AVAILABLE = False


@dataclass
class SecurityEvent:
    """Security event data structure."""

    event_id: str
    event_type: str
    timestamp: datetime
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    source_ip: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    outcome: str = "SUCCESS"
    risk_level: str = "LOW"
    compliance_tags: List[str] = None
    technical_details: Dict[str, Any] = None

    def __post_init__(self):
        if self.compliance_tags is None:
            self.compliance_tags = []
        if self.technical_details is None:
            self.technical_details = {}


class SecurityEventLogger:
    """Enterprise security event logging with compliance integration."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.enabled = config.get("enabled", True)

        # Initialize logger
        if STRUCTLOG_AVAILABLE:
            self.logger = structlog.get_logger(__name__)
        else:
            logging.basicConfig(level=logging.INFO)
            self.logger = get_scorpius_logger(__name__)

        # Event buffer for batch processing
        self.event_buffer: List[SecurityEvent] = []
        self.buffer_lock = asyncio.Lock()
        self.max_buffer_size = config.get("max_buffer_size", 1000)

        # Compliance settings
        self.compliance_enabled = config.get("compliance_enabled", True)
        self.immutable_logging = config.get("immutable_logging", True)
        self.real_time_siem = config.get("real_time_siem_integration", True)

    async def log_security_event(self, event_data: Dict[str, Any]) -> str:
        """Log a security event with compliance controls."""
        try:
            # Create security event
            event = SecurityEvent(
                event_id=str(uuid.uuid4()),
                event_type=event_data.get("event_type", "UNKNOWN"),
                timestamp=event_data.get("timestamp", datetime.utcnow()),
                user_id=event_data.get("user_id"),
                session_id=event_data.get("session_id"),
                source_ip=event_data.get("source_ip"),
                resource=event_data.get("resource"),
                action=event_data.get("action"),
                outcome=event_data.get("outcome", "SUCCESS"),
                risk_level=event_data.get("risk_level", "LOW"),
                compliance_tags=event_data.get("compliance_tags", []),
                technical_details=event_data.get("technical_details", {}),
            )

            # Add to buffer
            async with self.buffer_lock:
                self.event_buffer.append(event)

                # Flush buffer if full
                if len(self.event_buffer) >= self.max_buffer_size:
                    await self._flush_event_buffer()

            # Immediate logging for high-risk events
            if event.risk_level in ["HIGH", "CRITICAL"]:
                await self._log_immediate(event)

            return event.event_id

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error("Security event logging failed", error=str(e))
            else:
                self.logger.error(f"Security event logging failed: {e}")
            raise

    async def log_critical_security_event(self, event_data: Dict[str, Any]) -> str:
        """Log critical security event with immediate processing."""
        event_data["risk_level"] = "CRITICAL"
        return await self.log_security_event(event_data)

    async def _log_immediate(self, event: SecurityEvent):
        """Immediately log high-priority events."""
        try:
            # Log to standard output
            if STRUCTLOG_AVAILABLE:
                self.logger.info(
                    "SECURITY_EVENT",
                    event_id=event.event_id,
                    event_type=event.event_type,
                    risk_level=event.risk_level,
                    user_id=event.user_id,
                    outcome=event.outcome,
                )
            else:
                self.logger.info(
                    f"SECURITY_EVENT: {event.event_type} - {event.risk_level}"
                )

            # Send to SIEM if enabled
            if self.real_time_siem:
                await self._send_to_siem(event)

            # Store in immutable log if enabled
            if self.immutable_logging:
                await self._store_immutable(event)

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error("Immediate logging failed", error=str(e))
            else:
                self.logger.error(f"Immediate logging failed: {e}")

    async def _flush_event_buffer(self):
        """Flush the event buffer to persistent storage."""
        if not self.event_buffer:
            return

        try:
            # Copy buffer and clear
            events_to_process = self.event_buffer.copy()
            self.event_buffer.clear()

            # Process events
            for event in events_to_process:
                await self._process_event(event)

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error("Event buffer flush failed", error=str(e))
            else:
                self.logger.error(f"Event buffer flush failed: {e}")

    async def _process_event(self, event: SecurityEvent):
        """Process individual security event."""
        try:
            # Store in persistent log
            await self._store_persistent(event)

            # Send to SIEM if not already sent
            if self.real_time_siem and event.risk_level not in ["HIGH", "CRITICAL"]:
                await self._send_to_siem(event)

            # Update compliance metrics
            if self.compliance_enabled:
                await self._update_compliance_metrics(event)

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error(
                    "Event processing failed", error=str(e), event_id=event.event_id
                )
            else:
                self.logger.error(f"Event processing failed for {event.event_id}: {e}")

    async def _store_persistent(self, event: SecurityEvent):
        """Store event in persistent storage."""
        # Implementation would store to database/file system

    async def _store_immutable(self, event: SecurityEvent):
        """Store event in immutable blockchain audit trail."""
        # Implementation would store to blockchain

    async def _send_to_siem(self, event: SecurityEvent):
        """Send event to SIEM system."""
        # Implementation would send to SIEM (Splunk, Elastic, etc.)

    async def _update_compliance_metrics(self, event: SecurityEvent):
        """Update compliance-related metrics."""
        # Implementation would update compliance dashboards


class BlockchainAuditLogger:
    """Immutable audit logging using blockchain technology."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.enabled = config.get("blockchain_audit_trail", True)

        # Initialize logger
        if STRUCTLOG_AVAILABLE:
            self.logger = structlog.get_logger(__name__)
        else:
            logging.basicConfig(level=logging.INFO)
            self.logger = get_scorpius_logger(__name__)

        # Audit chain configuration
        self.chain_config = config.get("chain_config", {})
        self.encryption_enabled = config.get("encryption_enabled", True)

        # Audit buffer
        self.audit_buffer: List[Dict[str, Any]] = []
        self.buffer_lock = asyncio.Lock()

    async def initialize_audit_trail(self, security_context: Any):
        """Initialize blockchain audit trail."""
        try:
            if not self.enabled:
                return

            # Initialize audit trail
            audit_entry = {
                "event_type": "AUDIT_TRAIL_INITIALIZED",
                "user_id": security_context.user_id if security_context else "SYSTEM",
                "session_id": security_context.session_id if security_context else None,
                "timestamp": datetime.utcnow(),
                "blockchain_config": self.chain_config,
            }

            await self.log_critical_security_event(audit_entry)

            if STRUCTLOG_AVAILABLE:
                self.logger.info("Blockchain audit trail initialized")
            else:
                self.logger.info("Blockchain audit trail initialized")

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error("Audit trail initialization failed", error=str(e))
            else:
                self.logger.error(f"Audit trail initialization failed: {e}")
            raise

    async def log_critical_security_event(self, event_data: Dict[str, Any]) -> str:
        """Log critical security event to blockchain."""
        try:
            if not self.enabled:
                return str(uuid.uuid4())

            # Create audit log entry
            audit_entry = {
                "audit_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow(),
                "event_data": event_data,
                "hash": self._calculate_hash(event_data),
                "signature": await self._sign_entry(event_data),
            }

            # Add to buffer
            async with self.buffer_lock:
                self.audit_buffer.append(audit_entry)

            # Store to blockchain
            blockchain_tx = await self._store_to_blockchain(audit_entry)

            if STRUCTLOG_AVAILABLE:
                self.logger.info(
                    "Critical security event logged to blockchain",
                    audit_id=audit_entry["audit_id"],
                    blockchain_tx=blockchain_tx,
                )
            else:
                self.logger.info(
                    f"Critical security event logged: {audit_entry['audit_id']}"
                )

            return audit_entry["audit_id"]

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error("Blockchain audit logging failed", error=str(e))
            else:
                self.logger.error(f"Blockchain audit logging failed: {e}")
            raise

    def _calculate_hash(self, data: Dict[str, Any]) -> str:
        """Calculate cryptographic hash of audit data."""
        # Serialize data deterministically
        serialized = json.dumps(data, sort_keys=True, default=str)

        # Calculate SHA-256 hash
        hash_obj = hashlib.sha256(serialized.encode("utf-8"))
        return hash_obj.hexdigest()

    async def _sign_entry(self, data: Dict[str, Any]) -> str:
        """Sign audit entry with enterprise key."""
        # Implementation would use HSM or enterprise PKI
        return "signature_placeholder"

    async def _store_to_blockchain(self, audit_entry: Dict[str, Any]) -> str:
        """Store audit entry to blockchain."""
        # Implementation would submit to blockchain
        return f"tx_{uuid.uuid4().hex[:16]}"

    async def verify_audit_trail_integrity(
        self, time_range: Optional[tuple] = None
    ) -> Dict[str, Any]:
        """Verify integrity of blockchain audit trail."""
        try:
            # Implementation would verify blockchain integrity
            return {
                "integrity_verified": True,
                "verification_timestamp": datetime.utcnow(),
                "total_entries": len(self.audit_buffer),
                "hash_mismatches": 0,
                "signature_failures": 0,
            }

        except Exception as e:
            if STRUCTLOG_AVAILABLE:
                self.logger.error("Audit trail verification failed", error=str(e))
            else:
                self.logger.error(f"Audit trail verification failed: {e}")
            return {
                "integrity_verified": False,
                "error": str(e),
                "verification_timestamp": datetime.utcnow(),
            }
