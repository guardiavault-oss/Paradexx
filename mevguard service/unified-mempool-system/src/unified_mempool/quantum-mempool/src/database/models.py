"""
SQLAlchemy models for enterprise quantum mempool monitoring system.
"""

import uuid

from sqlalchemy import (
    DECIMAL,
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Use JSON instead of JSONType for SQLite compatibility
try:
    from sqlalchemy.dialects.postgresql import JSONB, UUID

    # For PostgreSQL
    JSONType = JSONB
    UUIDType = UUID(as_uuid=True)
except ImportError:
    # Fallback for SQLite and other databases
    JSONType = JSON
    UUIDType = String(36)

Base = declarative_base()


class TimestampMixin:
    """Mixin for timestamp fields with enterprise audit requirements."""

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(String(100), nullable=False, default="system")
    updated_by = Column(String(100), nullable=False, default="system")


class AuditMixin:
    """Mixin for enterprise audit trail."""

    audit_id = Column(UUIDType, default=uuid.uuid4, nullable=False, unique=True)
    compliance_tags = Column(JSONType, default=list, nullable=False)
    retention_policy = Column(String(50), default="7_years", nullable=False)
    classification_level = Column(String(20), default="INTERNAL", nullable=False)


class TransactionRecord(Base, TimestampMixin, AuditMixin):
    """Enterprise transaction record with full audit trail."""

    __tablename__ = "transactions"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Transaction Data
    txid = Column(String(64), nullable=False, unique=True, index=True)
    block_hash = Column(String(64), nullable=True, index=True)
    block_height = Column(Integer, nullable=True, index=True)

    # Transaction Details
    fee = Column(DECIMAL(18, 8), nullable=False, default=0)
    size = Column(Integer, nullable=False)
    vsize = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    locktime = Column(Integer, nullable=False, default=0)

    # Inputs and Outputs (JSON for flexibility)
    inputs = Column(JSONType, nullable=False, default=list)
    outputs = Column(JSONType, nullable=False, default=list)

    # Risk Assessment
    is_legacy = Column(Boolean, nullable=False, default=False, index=True)
    risk_score = Column(Float, nullable=False, default=0.0, index=True)
    quantum_vulnerable = Column(Boolean, nullable=False, default=False, index=True)

    # Network Information
    network = Column(String(20), nullable=False, default="bitcoin", index=True)
    confirmation_count = Column(Integer, nullable=False, default=0)

    # Timing Information
    seen_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    quantum_signatures = relationship("QuantumSignature", back_populates="transaction")
    alerts = relationship("ThreatAlert", back_populates="transaction")

    # Constraints
    __table_args__ = (
        Index("idx_transaction_risk", "risk_score", "quantum_vulnerable"),
        Index("idx_transaction_timing", "seen_at", "network"),
        Index("idx_transaction_legacy", "is_legacy", "quantum_vulnerable"),
        CheckConstraint("risk_score >= 0 AND risk_score <= 1", name="risk_score_range"),
        CheckConstraint("fee >= 0", name="fee_positive"),
        CheckConstraint("size > 0", name="size_positive"),
    )


class QuantumSignature(Base, TimestampMixin, AuditMixin):
    """Quantum attack signature analysis results."""

    __tablename__ = "quantum_signatures"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Analysis Identification
    analysis_id = Column(String(100), nullable=False, unique=True, index=True)
    transaction_id = Column(UUIDType, ForeignKey("transactions.id"), nullable=False)

    # Signature Scores
    temporal_clustering = Column(Float, nullable=False, default=0.0)
    fee_uniformity = Column(Float, nullable=False, default=0.0)
    address_age_correlation = Column(Float, nullable=False, default=0.0)
    geometric_pattern_score = Column(Float, nullable=False, default=0.0)
    entropy_analysis = Column(Float, nullable=False, default=0.0)
    statistical_anomaly_score = Column(Float, nullable=False, default=0.0)

    # Overall Assessment
    confidence_score = Column(Float, nullable=False, default=0.0, index=True)
    threat_level = Column(String(20), nullable=False, index=True)

    # Machine Learning Results
    ml_prediction = Column(Float, nullable=True)
    ml_model_version = Column(String(50), nullable=True)
    feature_importance = Column(JSONType, nullable=True)

    # Analysis Metadata
    algorithm_version = Column(String(50), nullable=False, default="1.0")
    processing_time_ms = Column(Integer, nullable=True)
    data_quality_score = Column(Float, nullable=True)

    # Relationships
    transaction = relationship("TransactionRecord", back_populates="quantum_signatures")
    alerts = relationship("ThreatAlert", back_populates="signature")

    # Constraints
    __table_args__ = (
        Index("idx_signature_confidence", "confidence_score", "threat_level"),
        Index("idx_signature_analysis", "analysis_id", "created_at"),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 1", name="confidence_range"
        ),
        CheckConstraint(
            "temporal_clustering >= 0 AND temporal_clustering <= 1",
            name="temporal_range",
        ),
        CheckConstraint(
            "fee_uniformity >= 0 AND fee_uniformity <= 1", name="fee_range"
        ),
    )


class ThreatAlert(Base, TimestampMixin, AuditMixin):
    """Enterprise quantum threat alerts with incident management."""

    __tablename__ = "threat_alerts"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Alert Identification
    alert_id = Column(String(100), nullable=False, unique=True, index=True)
    transaction_id = Column(UUIDType, ForeignKey("transactions.id"), nullable=False)
    signature_id = Column(UUIDType, ForeignKey("quantum_signatures.id"), nullable=False)

    # Threat Information
    threat_level = Column(String(20), nullable=False, index=True)
    confidence_score = Column(Float, nullable=False, index=True)
    attack_vector = Column(String(100), nullable=False)
    estimated_time_to_compromise = Column(String(50), nullable=False)

    # Affected Resources
    affected_addresses = Column(JSONType, nullable=False, default=list)
    affected_contracts = Column(JSONType, nullable=True, default=list)

    # Response Information
    recommended_actions = Column(JSONType, nullable=False, default=list)
    automated_response_triggered = Column(Boolean, nullable=False, default=False)
    response_status = Column(String(50), nullable=False, default="OPEN", index=True)

    # Technical Details
    technical_details = Column(JSONType, nullable=False, default=dict)
    false_positive_probability = Column(Float, nullable=True)
    attack_sophistication = Column(String(50), nullable=True)

    # Compliance and Regulatory
    compliance_impact = Column(JSONType, nullable=False, default=dict)
    incident_classification = Column(String(50), nullable=False, index=True)
    regulatory_notification_required = Column(Boolean, nullable=False, default=True)

    # Resolution Information
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    transaction = relationship("TransactionRecord", back_populates="alerts")
    signature = relationship("QuantumSignature", back_populates="alerts")
    incidents = relationship("IncidentReport", back_populates="alert")

    # Constraints
    __table_args__ = (
        Index("idx_alert_threat", "threat_level", "response_status"),
        Index("idx_alert_timing", "created_at", "resolved_at"),
        Index(
            "idx_alert_compliance",
            "incident_classification",
            "regulatory_notification_required",
        ),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 1",
            name="alert_confidence_range",
        ),
    )


class SecurityEvent(Base, TimestampMixin, AuditMixin):
    """Enterprise security event logging for comprehensive audit trail."""

    __tablename__ = "security_events"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Event Identification
    event_id = Column(String(100), nullable=False, unique=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False, index=True)

    # Event Details
    severity = Column(String(20), nullable=False, index=True)
    source_system = Column(String(100), nullable=False, default="quantum_monitor")
    source_ip = Column(String(45), nullable=True, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    session_id = Column(String(100), nullable=True, index=True)

    # Event Data
    event_data = Column(JSONType, nullable=False, default=dict)
    request_data = Column(JSONType, nullable=True)
    response_data = Column(JSONType, nullable=True)

    # Status and Outcome
    status = Column(String(20), nullable=False, default="SUCCESS", index=True)
    error_code = Column(String(20), nullable=True)
    error_message = Column(Text, nullable=True)

    # Correlation and Tracing
    correlation_id = Column(String(100), nullable=True, index=True)
    parent_event_id = Column(String(100), nullable=True, index=True)
    trace_id = Column(String(100), nullable=True, index=True)

    # Compliance and Retention
    retention_until = Column(DateTime(timezone=True), nullable=True)
    archived = Column(Boolean, nullable=False, default=False)

    # Constraints
    __table_args__ = (
        Index("idx_security_event_type", "event_type", "event_category"),
        Index("idx_security_timing", "created_at", "severity"),
        Index("idx_security_user", "user_id", "session_id"),
        Index("idx_security_correlation", "correlation_id", "trace_id"),
    )


class AuditLog(Base, TimestampMixin):
    """Immutable audit log for compliance and regulatory requirements."""

    __tablename__ = "audit_logs"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Audit Information
    audit_id = Column(String(100), nullable=False, unique=True, index=True)
    blockchain_hash = Column(
        String(64), nullable=True, unique=True
    )  # For blockchain audit trail

    # Event Information
    event_type = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False)

    # Actor Information
    actor_id = Column(String(100), nullable=False, index=True)
    actor_type = Column(String(50), nullable=False, default="USER")
    actor_ip = Column(String(45), nullable=True)

    # Change Information
    before_state = Column(JSONType, nullable=True)
    after_state = Column(JSONType, nullable=True)
    changes = Column(JSONType, nullable=True)

    # Outcome
    outcome = Column(String(20), nullable=False, index=True)
    reason = Column(Text, nullable=True)

    # Compliance
    compliance_framework = Column(String(50), nullable=True)
    risk_level = Column(String(20), nullable=False, default="LOW")

    # Immutability Protection
    content_hash = Column(String(64), nullable=False)  # SHA-256 of content
    signature = Column(Text, nullable=True)  # Digital signature

    # Constraints
    __table_args__ = (
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_actor", "actor_id", "actor_type"),
        Index("idx_audit_timing", "created_at", "event_type"),
        Index("idx_audit_compliance", "compliance_framework", "risk_level"),
    )


class ComplianceReport(Base, TimestampMixin, AuditMixin):
    """Compliance reporting for regulatory frameworks."""

    __tablename__ = "compliance_reports"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Report Information
    report_id = Column(String(100), nullable=False, unique=True, index=True)
    report_type = Column(String(50), nullable=False, index=True)
    framework = Column(
        String(50), nullable=False, index=True
    )  # SOX, GDPR, PCI_DSS, etc.

    # Reporting Period
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)

    # Report Status
    status = Column(String(20), nullable=False, default="DRAFT", index=True)
    generated_by = Column(String(100), nullable=False)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Report Content
    executive_summary = Column(Text, nullable=True)
    findings = Column(JSONType, nullable=False, default=list)
    recommendations = Column(JSONType, nullable=False, default=list)
    metrics = Column(JSONType, nullable=False, default=dict)

    # Compliance Status
    compliance_score = Column(Float, nullable=True)
    gaps_identified = Column(JSONType, nullable=True, default=list)
    remediation_plan = Column(JSONType, nullable=True, default=list)

    # File References
    report_file_path = Column(String(500), nullable=True)
    evidence_file_paths = Column(JSONType, nullable=True, default=list)

    # Constraints
    __table_args__ = (
        Index("idx_compliance_framework", "framework", "report_type"),
        Index("idx_compliance_period", "period_start", "period_end"),
        Index("idx_compliance_status", "status", "approved_at"),
        CheckConstraint("period_end > period_start", name="valid_period"),
    )


class IncidentReport(Base, TimestampMixin, AuditMixin):
    """Enterprise incident management and reporting."""

    __tablename__ = "incident_reports"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Incident Information
    incident_id = Column(String(100), nullable=False, unique=True, index=True)
    alert_id = Column(UUIDType, ForeignKey("threat_alerts.id"), nullable=False)

    # Classification
    incident_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    category = Column(String(50), nullable=False)

    # Timeline
    detected_at = Column(DateTime(timezone=True), nullable=False)
    reported_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Response Team
    assigned_to = Column(String(100), nullable=True, index=True)
    response_team = Column(JSONType, nullable=True, default=list)
    escalation_level = Column(Integer, nullable=False, default=1)

    # Impact Assessment
    impact_description = Column(Text, nullable=False)
    affected_systems = Column(JSONType, nullable=False, default=list)
    business_impact = Column(String(20), nullable=False, index=True)
    financial_impact = Column(DECIMAL(15, 2), nullable=True)

    # Response Actions
    containment_actions = Column(JSONType, nullable=True, default=list)
    mitigation_actions = Column(JSONType, nullable=True, default=list)
    recovery_actions = Column(JSONType, nullable=True, default=list)

    # Root Cause Analysis
    root_cause = Column(Text, nullable=True)
    contributing_factors = Column(JSONType, nullable=True, default=list)
    lessons_learned = Column(JSONType, nullable=True, default=list)

    # Communication
    stakeholders_notified = Column(JSONType, nullable=True, default=list)
    external_notifications = Column(JSONType, nullable=True, default=list)
    media_involvement = Column(Boolean, nullable=False, default=False)

    # Closure
    status = Column(String(20), nullable=False, default="OPEN", index=True)
    closure_summary = Column(Text, nullable=True)
    post_incident_review_completed = Column(Boolean, nullable=False, default=False)

    # Relationships
    alert = relationship("ThreatAlert", back_populates="incidents")

    # Constraints
    __table_args__ = (
        Index("idx_incident_severity", "severity", "status"),
        Index("idx_incident_timing", "detected_at", "resolved_at"),
        Index("idx_incident_assignment", "assigned_to", "escalation_level"),
        CheckConstraint(
            "escalation_level >= 1 AND escalation_level <= 5", name="valid_escalation"
        ),
    )


class AddressProfile(Base, TimestampMixin, AuditMixin):
    """Address profiling for quantum vulnerability assessment."""

    __tablename__ = "address_profiles"

    # Primary Key
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    # Address Information
    address = Column(String(100), nullable=False, unique=True, index=True)
    address_type = Column(
        String(20), nullable=False, index=True
    )  # P2PKH, P2SH, P2WPKH, etc.
    network = Column(String(20), nullable=False, default="bitcoin")

    # Quantum Vulnerability
    quantum_vulnerable = Column(Boolean, nullable=False, default=False, index=True)
    vulnerability_score = Column(Float, nullable=False, default=0.0)
    last_vulnerability_check = Column(DateTime(timezone=True), nullable=True)

    # Activity Metrics
    first_seen = Column(DateTime(timezone=True), nullable=False, default=func.now())
    last_activity = Column(DateTime(timezone=True), nullable=True)
    transaction_count = Column(Integer, nullable=False, default=0)
    total_received = Column(DECIMAL(18, 8), nullable=False, default=0)
    total_sent = Column(DECIMAL(18, 8), nullable=False, default=0)
    current_balance = Column(DECIMAL(18, 8), nullable=False, default=0)

    # Risk Assessment
    risk_score = Column(Float, nullable=False, default=0.0, index=True)
    risk_factors = Column(JSONType, nullable=True, default=list)
    last_risk_assessment = Column(DateTime(timezone=True), nullable=True)

    # Patterns and Behavior
    usage_patterns = Column(JSONType, nullable=True, default=dict)
    anomaly_flags = Column(JSONType, nullable=True, default=list)

    # Watchlist Status
    on_watchlist = Column(Boolean, nullable=False, default=False, index=True)
    watchlist_reason = Column(String(200), nullable=True)
    watchlist_added_at = Column(DateTime(timezone=True), nullable=True)

    # Constraints
    __table_args__ = (
        Index("idx_address_quantum", "quantum_vulnerable", "vulnerability_score"),
        Index("idx_address_risk", "risk_score", "on_watchlist"),
        Index("idx_address_activity", "last_activity", "transaction_count"),
        CheckConstraint(
            "vulnerability_score >= 0 AND vulnerability_score <= 1",
            name="vulnerability_range",
        ),
        CheckConstraint(
            "risk_score >= 0 AND risk_score <= 1", name="address_risk_range"
        ),
        CheckConstraint("total_received >= 0", name="received_positive"),
        CheckConstraint("total_sent >= 0", name="sent_positive"),
    )


# Additional indexes for performance optimization
Index(
    "idx_transactions_compound",
    TransactionRecord.network,
    TransactionRecord.is_legacy,
    TransactionRecord.seen_at,
)
Index(
    "idx_signatures_compound",
    QuantumSignature.confidence_score,
    QuantumSignature.threat_level,
    QuantumSignature.created_at,
)
Index(
    "idx_alerts_compound",
    ThreatAlert.threat_level,
    ThreatAlert.response_status,
    ThreatAlert.created_at,
)
Index(
    "idx_events_compound",
    SecurityEvent.event_type,
    SecurityEvent.severity,
    SecurityEvent.created_at,
)
Index("idx_audit_compound", AuditLog.event_type, AuditLog.outcome, AuditLog.created_at)


def create_all_tables(engine):
    """Create all tables in the database."""
    Base.metadata.create_all(engine)


def drop_all_tables(engine):
    """Drop all tables from the database."""
    Base.metadata.drop_all(engine)
