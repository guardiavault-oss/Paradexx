#!/usr/bin/env python3
"""
Security Orchestrator - Main security coordination system for cross-chain bridge monitoring
"""

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from .attack_detection import AttackDetectionSystem
from .attestation_monitor import AttestationMonitor
from .liveness_monitor import LivenessMonitor
from .proof_of_reserves import ProofOfReservesMonitor

logger = logging.getLogger(__name__)


class SecurityEventType(str, Enum):
    """Types of security events"""

    ATTESTATION_ANOMALY = "attestation_anomaly"
    QUORUM_DIVERSITY_ISSUE = "quorum_diversity_issue"
    ATTACK_DETECTED = "attack_detected"
    LIVENESS_GAP = "liveness_gap"
    RESERVE_VERIFICATION_FAILED = "reserve_verification_failed"
    VALIDATOR_COMPROMISE = "validator_compromise"
    BRIDGE_COMPROMISE = "bridge_compromise"


class SecurityEventSeverity(str, Enum):
    """Security event severity levels"""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class SecurityEvent:
    """Security event data structure"""

    event_id: str
    event_type: SecurityEventType
    severity: SecurityEventSeverity
    timestamp: datetime
    description: str
    source_component: str
    affected_bridge: str
    affected_network: str
    evidence: dict[str, Any]
    recommended_actions: list[str]
    status: str  # active, resolved, investigating
    correlation_id: str | None = None


@dataclass
class SecurityAlert:
    """Security alert for immediate action"""

    alert_id: str
    event_id: str
    priority: int
    title: str
    description: str
    timestamp: datetime
    requires_immediate_action: bool
    escalation_level: int
    assigned_to: str | None = None
    status: str = "open"  # open, acknowledged, investigating, resolved


class SecurityOrchestrator:
    """Main security orchestration system for cross-chain bridge monitoring"""

    def __init__(self):
        # Initialize monitoring components
        self.attestation_monitor = AttestationMonitor()
        self.proof_of_reserves = ProofOfReservesMonitor()
        self.attack_detection = AttackDetectionSystem()
        self.liveness_monitor = LivenessMonitor()

        # Security event management
        self.security_events: list[SecurityEvent] = []
        self.security_alerts: list[SecurityAlert] = []
        self.event_correlations: dict[str, list[str]] = defaultdict(list)

        # Configuration
        self.alert_thresholds = {
            "critical_events": 1,
            "high_events": 5,
            "medium_events": 10,
            "correlation_window": 300,  # 5 minutes
            "escalation_delay": 600,  # 10 minutes
        }

        # Monitoring state
        self.is_monitoring = False
        self.monitoring_tasks: list[asyncio.Task] = []

        logger.info("SecurityOrchestrator initialized")

    async def start_security_monitoring(self):
        """Start comprehensive security monitoring"""
        if self.is_monitoring:
            logger.warning("Security monitoring already running")
            return

        logger.info("Starting comprehensive security monitoring")
        self.is_monitoring = True

        # Start individual monitoring components
        self.monitoring_tasks = [
            asyncio.create_task(self._monitor_attestations()),
            asyncio.create_task(self._monitor_quorum_diversity()),
            asyncio.create_task(self._monitor_attack_detection()),
            asyncio.create_task(self._monitor_liveness()),
            asyncio.create_task(self._correlate_events()),
            asyncio.create_task(self._process_alerts()),
        ]

        try:
            await asyncio.gather(*self.monitoring_tasks)
        except Exception as e:
            logger.error(f"Security monitoring error: {e}")
            await self.stop_security_monitoring()

    async def stop_security_monitoring(self):
        """Stop security monitoring"""
        logger.info("Stopping security monitoring")
        self.is_monitoring = False

        # Cancel all monitoring tasks
        for task in self.monitoring_tasks:
            task.cancel()

        self.monitoring_tasks.clear()

    async def _monitor_attestations(self):
        """Monitor attestation anomalies"""
        while self.is_monitoring:
            try:
                # Get recent anomalies
                recent_anomalies = await self.attestation_monitor.get_recent_anomalies(hours=1)

                for anomaly_data in recent_anomalies:
                    # Create security event
                    event = SecurityEvent(
                        event_id=f"attestation_{anomaly_data['anomaly_id']}",
                        event_type=SecurityEventType.ATTESTATION_ANOMALY,
                        severity=self._map_anomaly_severity(anomaly_data["severity"]),
                        timestamp=datetime.fromisoformat(anomaly_data["detected_at"]),
                        description=f"Attestation anomaly detected: {anomaly_data['description']}",
                        source_component="attestation_monitor",
                        affected_bridge=anomaly_data.get("bridge_address", "unknown"),
                        affected_network=anomaly_data.get("network", "unknown"),
                        evidence=anomaly_data["evidence"],
                        recommended_actions=[anomaly_data["recommended_action"]],
                        status="active",
                    )

                    await self._process_security_event(event)

                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Attestation monitoring error: {e}")
                await asyncio.sleep(30)

    async def _monitor_quorum_diversity(self):
        """Monitor quorum diversity issues"""
        while self.is_monitoring:
            try:
                # Get quorum health summary
                quorum_health = await self.proof_of_reserves.get_quorum_health_summary()

                if quorum_health["status"] in ["poor", "fair"]:
                    event = SecurityEvent(
                        event_id=f"quorum_diversity_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                        event_type=SecurityEventType.QUORUM_DIVERSITY_ISSUE,
                        severity=(
                            SecurityEventSeverity.HIGH
                            if quorum_health["status"] == "poor"
                            else SecurityEventSeverity.MEDIUM
                        ),
                        timestamp=datetime.utcnow(),
                        description=f"Quorum diversity issue detected: {quorum_health['status']}",
                        source_component="proof_of_reserves",
                        affected_bridge="all",
                        affected_network="all",
                        evidence=quorum_health,
                        recommended_actions=[
                            "Review guardian selection criteria",
                            "Increase geographic diversity",
                            "Monitor validator behavior",
                        ],
                        status="active",
                    )

                    await self._process_security_event(event)

                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Quorum diversity monitoring error: {e}")
                await asyncio.sleep(60)

    async def _monitor_attack_detection(self):
        """Monitor attack detection system"""
        while self.is_monitoring:
            try:
                # Get recent attack detections
                recent_detections = await self.attack_detection.get_detection_history(hours=1)

                for detection_data in recent_detections:
                    event = SecurityEvent(
                        event_id=f"attack_{detection_data['detection_id']}",
                        event_type=SecurityEventType.ATTACK_DETECTED,
                        severity=self._map_threat_level(detection_data["threat_level"]),
                        timestamp=datetime.fromisoformat(detection_data["detected_at"]),
                        description=f"Attack detected: {detection_data['description']}",
                        source_component="attack_detection",
                        affected_bridge=detection_data.get("bridge_address", "unknown"),
                        affected_network=detection_data.get("network", "unknown"),
                        evidence=detection_data["evidence"],
                        recommended_actions=detection_data["recommended_actions"],
                        status="active",
                    )

                    await self._process_security_event(event)

                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Attack detection monitoring error: {e}")
                await asyncio.sleep(30)

    async def _monitor_liveness(self):
        """Monitor liveness gaps"""
        while self.is_monitoring:
            try:
                # Get recent liveness gaps
                recent_gaps = await self.liveness_monitor.get_liveness_gaps(hours=1)

                for gap_data in recent_gaps:
                    if gap_data["end_time"] is None:  # Active gap
                        event = SecurityEvent(
                            event_id=f"liveness_{gap_data['gap_id']}",
                            event_type=SecurityEventType.LIVENESS_GAP,
                            severity=(
                                SecurityEventSeverity.HIGH
                                if gap_data["severity"] == "high"
                                else SecurityEventSeverity.MEDIUM
                            ),
                            timestamp=datetime.fromisoformat(gap_data["start_time"]),
                            description=f"Liveness gap detected: {gap_data['description']}",
                            source_component="liveness_monitor",
                            affected_bridge="all",
                            affected_network=gap_data["network"],
                            evidence=gap_data["metrics"],
                            recommended_actions=gap_data["resolution_actions"],
                            status="active",
                        )

                        await self._process_security_event(event)

                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Liveness monitoring error: {e}")
                await asyncio.sleep(30)

    async def _correlate_events(self):
        """Correlate security events for pattern detection"""
        while self.is_monitoring:
            try:
                # Get recent events
                recent_events = [
                    event
                    for event in self.security_events
                    if event.timestamp > datetime.utcnow() - timedelta(minutes=5)
                ]

                # Group events by bridge and network
                events_by_bridge = defaultdict(list)
                for event in recent_events:
                    events_by_bridge[event.affected_bridge].append(event)

                # Check for correlated events
                for bridge, events in events_by_bridge.items():
                    if len(events) >= 3:  # Multiple events on same bridge
                        await self._create_correlated_event(bridge, events)

                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Event correlation error: {e}")
                await asyncio.sleep(30)

    async def _create_correlated_event(self, bridge: str, events: list[SecurityEvent]):
        """Create a correlated security event"""
        correlation_id = f"correlation_{bridge}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        # Determine highest severity
        severities = [event.severity for event in events]
        max_severity = max(
            severities, key=lambda s: ["info", "low", "medium", "high", "critical"].index(s.value)
        )

        # Create correlated event
        correlated_event = SecurityEvent(
            event_id=f"correlated_{correlation_id}",
            event_type=SecurityEventType.BRIDGE_COMPROMISE,
            severity=max_severity,
            timestamp=datetime.utcnow(),
            description=f"Multiple security events detected on bridge {bridge}",
            source_component="security_orchestrator",
            affected_bridge=bridge,
            affected_network="multiple",
            evidence={
                "correlated_events": [event.event_id for event in events],
                "event_count": len(events),
                "severity_breakdown": {s.value: severities.count(s) for s in set(severities)},
            },
            recommended_actions=[
                "Immediately investigate bridge security",
                "Consider pausing bridge operations",
                "Review all recent transactions",
                "Notify security team",
            ],
            status="active",
            correlation_id=correlation_id,
        )

        # Update correlation mapping
        for event in events:
            self.event_correlations[correlation_id].append(event.event_id)

        await self._process_security_event(correlated_event)

    async def _process_security_event(self, event: SecurityEvent):
        """Process a security event"""
        # Store event
        self.security_events.append(event)

        # Create alert if severity warrants it
        if event.severity in [SecurityEventSeverity.CRITICAL, SecurityEventSeverity.HIGH]:
            alert = SecurityAlert(
                alert_id=f"alert_{event.event_id}",
                event_id=event.event_id,
                priority=self._get_alert_priority(event.severity),
                title=f"Security Alert: {event.description}",
                description=event.description,
                timestamp=event.timestamp,
                requires_immediate_action=event.severity == SecurityEventSeverity.CRITICAL,
                escalation_level=1 if event.severity == SecurityEventSeverity.CRITICAL else 0,
            )

            self.security_alerts.append(alert)
            logger.warning(f"Security alert created: {alert.alert_id}")

        # Log event
        logger.info(f"Security event processed: {event.event_id} - {event.severity.value}")

    async def _process_alerts(self):
        """Process security alerts"""
        while self.is_monitoring:
            try:
                # Check for unacknowledged critical alerts
                critical_alerts = [
                    alert
                    for alert in self.security_alerts
                    if (
                        alert.status == "open"
                        and alert.requires_immediate_action
                        and alert.timestamp < datetime.utcnow() - timedelta(minutes=5)
                    )
                ]

                for alert in critical_alerts:
                    # Escalate critical alerts
                    alert.escalation_level += 1
                    logger.critical(f"CRITICAL ALERT ESCALATION: {alert.alert_id}")

                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Alert processing error: {e}")
                await asyncio.sleep(30)

    def _map_anomaly_severity(self, severity: str) -> SecurityEventSeverity:
        """Map anomaly severity to security event severity"""
        mapping = {
            "critical": SecurityEventSeverity.CRITICAL,
            "high": SecurityEventSeverity.HIGH,
            "medium": SecurityEventSeverity.MEDIUM,
            "low": SecurityEventSeverity.LOW,
        }
        return mapping.get(severity, SecurityEventSeverity.MEDIUM)

    def _map_threat_level(self, threat_level: str) -> SecurityEventSeverity:
        """Map threat level to security event severity"""
        mapping = {
            "critical": SecurityEventSeverity.CRITICAL,
            "high": SecurityEventSeverity.HIGH,
            "medium": SecurityEventSeverity.MEDIUM,
            "low": SecurityEventSeverity.LOW,
            "info": SecurityEventSeverity.INFO,
        }
        return mapping.get(threat_level, SecurityEventSeverity.MEDIUM)

    def _get_alert_priority(self, severity: SecurityEventSeverity) -> int:
        """Get alert priority based on severity"""
        priority_map = {
            SecurityEventSeverity.CRITICAL: 1,
            SecurityEventSeverity.HIGH: 2,
            SecurityEventSeverity.MEDIUM: 3,
            SecurityEventSeverity.LOW: 4,
            SecurityEventSeverity.INFO: 5,
        }
        return priority_map.get(severity, 5)

    async def get_security_dashboard(self) -> dict[str, Any]:
        """Get comprehensive security dashboard data"""
        # Get recent events (last 24 hours)
        recent_events = [
            event
            for event in self.security_events
            if event.timestamp > datetime.utcnow() - timedelta(hours=24)
        ]

        # Get active alerts
        active_alerts = [alert for alert in self.security_alerts if alert.status == "open"]

        # Get component health
        attestation_metrics = await self.attestation_monitor.get_attestation_metrics()
        quorum_health = await self.proof_of_reserves.get_quorum_health_summary()
        attack_stats = await self.attack_detection.get_attack_statistics()
        liveness_summary = await self.liveness_monitor.get_health_summary()

        # Calculate overall security score
        security_score = self._calculate_overall_security_score(
            attestation_metrics, quorum_health, attack_stats, liveness_summary
        )

        return {
            "overall_security_score": security_score,
            "security_status": (
                "healthy"
                if security_score >= 0.8
                else "degraded" if security_score >= 0.6 else "critical"
            ),
            "recent_events": {
                "total": len(recent_events),
                "critical": len(
                    [e for e in recent_events if e.severity == SecurityEventSeverity.CRITICAL]
                ),
                "high": len([e for e in recent_events if e.severity == SecurityEventSeverity.HIGH]),
                "medium": len(
                    [e for e in recent_events if e.severity == SecurityEventSeverity.MEDIUM]
                ),
                "low": len([e for e in recent_events if e.severity == SecurityEventSeverity.LOW]),
            },
            "active_alerts": {
                "total": len(active_alerts),
                "critical": len([a for a in active_alerts if a.requires_immediate_action]),
                "escalated": len([a for a in active_alerts if a.escalation_level > 1]),
            },
            "component_health": {
                "attestation_monitor": {
                    "anomaly_rate": attestation_metrics.get("anomaly_rate", 0),
                    "validity_rate": attestation_metrics.get("validity_rate", 0),
                    "active_validators": attestation_metrics.get("active_validators", 0),
                },
                "proof_of_reserves": {
                    "quorum_status": quorum_health.get("status", "unknown"),
                    "diversity_score": quorum_health.get("overall_diversity_score", 0),
                    "active_guardians": quorum_health.get("active_guardians", 0),
                },
                "attack_detection": {
                    "total_detections": attack_stats.get("total_detections", 0),
                    "critical_detections": attack_stats.get("critical_detections", 0),
                    "average_confidence": attack_stats.get("average_confidence", 0),
                },
                "liveness_monitor": {
                    "network_health": liveness_summary.get("networks", {}).get(
                        "health_percentage", 0
                    ),
                    "validator_uptime": liveness_summary.get("validators", {}).get(
                        "uptime_percentage", 0
                    ),
                    "active_gaps": liveness_summary.get("liveness_gaps", {}).get("active", 0),
                },
            },
            "recommendations": self._generate_security_recommendations(
                attestation_metrics, quorum_health, attack_stats, liveness_summary
            ),
        }

    def _calculate_overall_security_score(
        self,
        attestation_metrics: dict,
        quorum_health: dict,
        attack_stats: dict,
        liveness_summary: dict,
    ) -> float:
        """Calculate overall security score"""
        # Weighted average of component scores
        scores = []
        weights = []

        # Attestation score (based on validity rate and anomaly rate)
        attestation_score = attestation_metrics.get("validity_rate", 0) * (
            1 - attestation_metrics.get("anomaly_rate", 0)
        )
        scores.append(attestation_score)
        weights.append(0.25)

        # Quorum diversity score
        quorum_score = quorum_health.get("overall_diversity_score", 0)
        scores.append(quorum_score)
        weights.append(0.25)

        # Attack detection score (inverse of detection rate)
        attack_score = max(
            0, 1 - (attack_stats.get("total_detections", 0) / 100)
        )  # Normalize to 0-1
        scores.append(attack_score)
        weights.append(0.25)

        # Liveness score
        network_health = liveness_summary.get("networks", {}).get("health_percentage", 0) / 100
        validator_uptime = liveness_summary.get("validators", {}).get("uptime_percentage", 0) / 100
        liveness_score = (network_health + validator_uptime) / 2
        scores.append(liveness_score)
        weights.append(0.25)

        # Calculate weighted average
        if weights:
            return sum(
                score * weight for score, weight in zip(scores, weights, strict=False)
            ) / sum(weights)
        return 0.0

    def _generate_security_recommendations(
        self,
        attestation_metrics: dict,
        quorum_health: dict,
        attack_stats: dict,
        liveness_summary: dict,
    ) -> list[str]:
        """Generate security recommendations based on current state"""
        recommendations = []

        # Attestation recommendations
        if attestation_metrics.get("anomaly_rate", 0) > 0.1:
            recommendations.append(
                "High attestation anomaly rate detected - investigate validator behavior"
            )

        if attestation_metrics.get("validity_rate", 0) < 0.9:
            recommendations.append(
                "Low attestation validity rate - review signature validation processes"
            )

        # Quorum recommendations
        if quorum_health.get("status") == "poor":
            recommendations.append(
                "Poor quorum diversity - recruit additional guardians from different regions"
            )

        if quorum_health.get("overall_diversity_score", 0) < 0.6:
            recommendations.append(
                "Low quorum diversity score - improve geographic and institutional distribution"
            )

        # Attack detection recommendations
        if attack_stats.get("total_detections", 0) > 10:
            recommendations.append(
                "High number of attack detections - increase monitoring and review security measures"
            )

        if attack_stats.get("critical_detections", 0) > 0:
            recommendations.append(
                "Critical attacks detected - implement immediate security measures"
            )

        # Liveness recommendations
        if liveness_summary.get("networks", {}).get("health_percentage", 0) < 80:
            recommendations.append(
                "Network health degraded - check RPC endpoints and network connectivity"
            )

        if liveness_summary.get("validators", {}).get("uptime_percentage", 0) < 90:
            recommendations.append(
                "Validator uptime low - investigate validator performance and connectivity"
            )

        if liveness_summary.get("liveness_gaps", {}).get("active", 0) > 0:
            recommendations.append(
                "Active liveness gaps detected - investigate and resolve immediately"
            )

        if not recommendations:
            recommendations.append(
                "Security systems operating normally - continue regular monitoring"
            )

        return recommendations

    async def get_recent_events(self, hours: int = 24) -> list[dict[str, Any]]:
        """Get recent security events"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        recent_events = [event for event in self.security_events if event.timestamp > cutoff_time]

        return [
            {
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "severity": event.severity.value,
                "timestamp": event.timestamp.isoformat(),
                "description": event.description,
                "source_component": event.source_component,
                "affected_bridge": event.affected_bridge,
                "affected_network": event.affected_network,
                "status": event.status,
                "correlation_id": event.correlation_id,
            }
            for event in sorted(recent_events, key=lambda x: x.timestamp, reverse=True)
        ]

    async def get_active_alerts(self) -> list[dict[str, Any]]:
        """Get active security alerts"""
        active_alerts = [alert for alert in self.security_alerts if alert.status == "open"]

        return [
            {
                "alert_id": alert.alert_id,
                "event_id": alert.event_id,
                "priority": alert.priority,
                "title": alert.title,
                "description": alert.description,
                "timestamp": alert.timestamp.isoformat(),
                "requires_immediate_action": alert.requires_immediate_action,
                "escalation_level": alert.escalation_level,
                "assigned_to": alert.assigned_to,
                "status": alert.status,
            }
            for alert in sorted(active_alerts, key=lambda x: x.priority)
        ]

    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge a security alert"""
        for alert in self.security_alerts:
            if alert.alert_id == alert_id:
                alert.status = "acknowledged"
                alert.assigned_to = acknowledged_by
                logger.info(f"Alert {alert_id} acknowledged by {acknowledged_by}")
                return True
        return False

    async def resolve_event(self, event_id: str, resolution_notes: str) -> bool:
        """Resolve a security event"""
        for event in self.security_events:
            if event.event_id == event_id:
                event.status = "resolved"
                event.evidence["resolution_notes"] = resolution_notes
                event.evidence["resolved_at"] = datetime.utcnow().isoformat()
                logger.info(f"Event {event_id} resolved: {resolution_notes}")
                return True
        return False
