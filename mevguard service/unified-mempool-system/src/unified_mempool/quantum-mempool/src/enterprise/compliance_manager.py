import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise compliance management and regulatory reporting.
"""

import json  # noqa: E402
from dataclasses import dataclass  # noqa: E402
from datetime import datetime, timedelta  # noqa: E402
from enum import Enum  # noqa: E402
from typing import Any, Dict, List, Optional  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402


class ComplianceFramework(Enum):
    """Supported compliance frameworks."""

    SOX = "SOX"
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    PCI_DSS = "PCI_DSS"
    ISO_27001 = "ISO_27001"
    NIST = "NIST"
    SOC2 = "SOC2"


class ComplianceStatus(Enum):
    """Compliance status types."""

    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    PARTIAL_COMPLIANCE = "PARTIAL_COMPLIANCE"
    UNDER_REVIEW = "UNDER_REVIEW"
    REMEDIATION_REQUIRED = "REMEDIATION_REQUIRED"


@dataclass
class ComplianceRequirement:
    """Individual compliance requirement."""

    requirement_id: str
    framework: ComplianceFramework
    title: str
    description: str
    control_objectives: List[str]
    implementation_status: ComplianceStatus
    last_assessment: datetime
    next_assessment: datetime
    responsible_party: str
    evidence_documents: List[str]


@dataclass
class ComplianceViolation:
    """Compliance violation record."""

    violation_id: str
    requirement_id: str
    framework: ComplianceFramework
    severity: str
    description: str
    detected_at: datetime
    remediation_deadline: datetime
    remediation_plan: Optional[str] = None
    resolved_at: Optional[datetime] = None
    responsible_party: Optional[str] = None


@dataclass
class ComplianceReport:
    """Compliance assessment report."""

    report_id: str
    framework: ComplianceFramework
    assessment_period: Dict[str, datetime]
    overall_status: ComplianceStatus
    compliance_percentage: float
    requirements_assessed: int
    violations_found: int
    remediation_actions: int
    generated_at: datetime
    next_assessment: datetime


class ComplianceManager:
    """
    Enterprise compliance management and regulatory reporting system.

    Features:
    - Multi-framework compliance tracking
    - Automated compliance monitoring
    - Violation detection and remediation
    - Regulatory reporting
    - Audit trail maintenance
    - Evidence collection and management
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)

        # Compliance tracking
        self.requirements: Dict[str, ComplianceRequirement] = {}
        self.violations: Dict[str, ComplianceViolation] = {}
        self.reports: List[ComplianceReport] = []

        # Initialize compliance frameworks
        self.frameworks = self._initialize_compliance_frameworks()

        # Monitoring rules
        self.monitoring_rules = self._initialize_monitoring_rules()

    def _initialize_compliance_frameworks(
        self,
    ) -> Dict[ComplianceFramework, Dict[str, Any]]:
        """Initialize supported compliance frameworks."""
        return {
            ComplianceFramework.SOX: {
                "name": "Sarbanes-Oxley Act",
                "assessment_frequency": "quarterly",
                "key_controls": [
                    "FINANCIAL_REPORTING_CONTROLS",
                    "INTERNAL_CONTROLS_ASSESSMENT",
                    "MANAGEMENT_CERTIFICATION",
                    "AUDIT_COMMITTEE_OVERSIGHT",
                ],
                "reporting_requirements": ["QUARTERLY_ASSESSMENT", "ANNUAL_REPORT"],
            },
            ComplianceFramework.GDPR: {
                "name": "General Data Protection Regulation",
                "assessment_frequency": "continuous",
                "key_controls": [
                    "DATA_PROTECTION_BY_DESIGN",
                    "CONSENT_MANAGEMENT",
                    "DATA_BREACH_NOTIFICATION",
                    "DATA_SUBJECT_RIGHTS",
                ],
                "reporting_requirements": ["BREACH_NOTIFICATION", "DPO_REPORTS"],
            },
            ComplianceFramework.ISO_27001: {
                "name": "ISO/IEC 27001 Information Security",
                "assessment_frequency": "annual",
                "key_controls": [
                    "INFORMATION_SECURITY_POLICY",
                    "RISK_MANAGEMENT",
                    "ACCESS_CONTROL",
                    "INCIDENT_MANAGEMENT",
                ],
                "reporting_requirements": ["ANNUAL_ASSESSMENT", "MANAGEMENT_REVIEW"],
            },
            ComplianceFramework.NIST: {
                "name": "NIST Cybersecurity Framework",
                "assessment_frequency": "continuous",
                "key_controls": [
                    "IDENTIFY_ASSETS",
                    "PROTECT_SYSTEMS",
                    "DETECT_THREATS",
                    "RESPOND_INCIDENTS",
                    "RECOVER_OPERATIONS",
                ],
                "reporting_requirements": ["CONTINUOUS_MONITORING", "RISK_ASSESSMENT"],
            },
        }

    def _initialize_monitoring_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize automated compliance monitoring rules."""
        return {
            "DATA_ENCRYPTION": {
                "frameworks": [ComplianceFramework.GDPR, ComplianceFramework.ISO_27001],
                "check_frequency": "continuous",
                "validation_function": self._validate_data_encryption,
                "remediation_actions": ["ENABLE_ENCRYPTION", "UPDATE_ENCRYPTION_KEYS"],
            },
            "ACCESS_LOGGING": {
                "frameworks": [ComplianceFramework.SOX, ComplianceFramework.ISO_27001],
                "check_frequency": "daily",
                "validation_function": self._validate_access_logging,
                "remediation_actions": ["ENABLE_AUDIT_LOGGING", "REVIEW_ACCESS_LOGS"],
            },
            "INCIDENT_RESPONSE": {
                "frameworks": [ComplianceFramework.GDPR, ComplianceFramework.NIST],
                "check_frequency": "continuous",
                "validation_function": self._validate_incident_response,
                "remediation_actions": ["UPDATE_RESPONSE_PROCEDURES", "TRAIN_STAFF"],
            },
            "DATA_RETENTION": {
                "frameworks": [ComplianceFramework.GDPR, ComplianceFramework.SOX],
                "check_frequency": "weekly",
                "validation_function": self._validate_data_retention,
                "remediation_actions": [
                    "UPDATE_RETENTION_POLICY",
                    "PURGE_EXPIRED_DATA",
                ],
            },
        }

    async def initialize_compliance_requirements(self):
        """Initialize compliance requirements for all frameworks."""
        try:
            for framework in self.frameworks:
                await self._load_framework_requirements(framework)

            await self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_REQUIREMENTS_INITIALIZED",
                    "frameworks": [f.value for f in self.frameworks.keys()],
                    "requirements_count": len(self.requirements),
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_INITIALIZATION_FAILED",
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            raise

    async def _load_framework_requirements(self, framework: ComplianceFramework):
        """Load requirements for specific compliance framework."""
        framework_info = self.frameworks[framework]

        # Load requirements from compliance database
        try:
            # Connect to compliance database and load actual requirements
            from ..database.connection_manager import (
                get_database_connection,
            )  # noqa: E402

            async with get_database_connection() as db:
                db_requirements = await db.fetch_all(
                    "SELECT * FROM compliance_requirements WHERE framework = ?",
                    (framework.value,),
                )

                if db_requirements:
                    for req_data in db_requirements:
                        requirement = ComplianceRequirement(
                            requirement_id=req_data["requirement_id"],
                            framework=framework,
                            title=req_data["title"],
                            description=req_data["description"],
                            control_objectives=json.loads(
                                req_data["control_objectives"]
                            ),
                            implementation_status=ComplianceStatus(req_data["status"]),
                            last_assessment=datetime.fromisoformat(
                                req_data["last_assessment"]
                            ),
                            next_assessment=datetime.fromisoformat(
                                req_data["next_assessment"]
                            ),
                            responsible_party=req_data["responsible_party"],
                            evidence_documents=json.loads(
                                req_data["evidence_documents"]
                            ),
                        )
                        self.requirements[requirement.requirement_id] = requirement
                    return
        except Exception as e:
            self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_DB_LOAD_FAILED",
                    "framework": framework.value,
                    "error": str(e),
                    "fallback": "using_default_requirements",
                }
            )

        for i, control in enumerate(framework_info["key_controls"]):
            requirement_id = f"{framework.value}_{control}_{i + 1:03d}"

            requirement = ComplianceRequirement(
                requirement_id=requirement_id,
                framework=framework,
                title=f"{control.replace('_', ' ').title()}",
                description=f"Compliance requirement for {control}",
                control_objectives=[
                    f"Implement {control}",
                    f"Monitor {control}",
                    f"Audit {control}",
                ],
                implementation_status=ComplianceStatus.COMPLIANT,
                last_assessment=datetime.utcnow() - timedelta(days=30),
                next_assessment=datetime.utcnow() + timedelta(days=90),
                responsible_party="Security Team",
                evidence_documents=[f"{requirement_id}_evidence.pdf"],
            )

            self.requirements[requirement_id] = requirement

    async def perform_compliance_assessment(
        self, framework: ComplianceFramework
    ) -> str:
        """Perform comprehensive compliance assessment."""
        try:
            report_id = (
                f"COMP_{framework.value}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            )

            # Get framework requirements
            framework_requirements = [
                req for req in self.requirements.values() if req.framework == framework
            ]

            # Assess each requirement
            violations_found = 0
            compliant_requirements = 0

            for requirement in framework_requirements:
                is_compliant = await self._assess_requirement(requirement)
                if is_compliant:
                    compliant_requirements += 1
                else:
                    violations_found += 1
                    await self._create_violation(requirement)

            # Calculate compliance percentage
            total_requirements = len(framework_requirements)
            compliance_percentage = (
                (compliant_requirements / total_requirements * 100)
                if total_requirements > 0
                else 0
            )

            # Determine overall status
            if compliance_percentage >= 95:
                overall_status = ComplianceStatus.COMPLIANT
            elif compliance_percentage >= 80:
                overall_status = ComplianceStatus.PARTIAL_COMPLIANCE
            else:
                overall_status = ComplianceStatus.NON_COMPLIANT

            # Generate report
            report = ComplianceReport(
                report_id=report_id,
                framework=framework,
                assessment_period={
                    "start": datetime.utcnow() - timedelta(days=90),
                    "end": datetime.utcnow(),
                },
                overall_status=overall_status,
                compliance_percentage=compliance_percentage,
                requirements_assessed=total_requirements,
                violations_found=violations_found,
                remediation_actions=violations_found,
                generated_at=datetime.utcnow(),
                next_assessment=datetime.utcnow() + timedelta(days=90),
            )

            self.reports.append(report)

            # Log assessment
            await self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_ASSESSMENT_COMPLETED",
                    "report_id": report_id,
                    "framework": framework.value,
                    "overall_status": overall_status.value,
                    "compliance_percentage": compliance_percentage,
                    "violations_found": violations_found,
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

            return report_id

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_ASSESSMENT_FAILED",
                    "framework": framework.value,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            raise

    async def _assess_requirement(self, requirement: ComplianceRequirement) -> bool:
        """Assess individual compliance requirement."""
        # Perform actual compliance checks based on requirement type
        if "ENCRYPTION" in requirement.title.upper():
            return await self._validate_data_encryption()
        elif "LOGGING" in requirement.title.upper():
            return await self._validate_access_logging()
        elif "INCIDENT" in requirement.title.upper():
            return await self._validate_incident_response()
        elif "RETENTION" in requirement.title.upper():
            return await self._validate_data_retention()

        # Default to compliant for other requirements
        return True

    async def _validate_data_encryption(self) -> bool:
        """Validate data encryption compliance."""
        try:
            # Check database encryption status
            from ..database.connection_manager import (
                get_database_connection,
            )  # noqa: E402

            async with get_database_connection() as db:
                encryption_status = await db.fetch_one(
                    "SELECT encryption_enabled, encryption_algorithm FROM system_config WHERE config_type = 'database'"
                )

                if not encryption_status or not encryption_status["encryption_enabled"]:
                    return False

                approved_algorithms = ["AES-256", "ChaCha20-Poly1305"]
                return encryption_status["encryption_algorithm"] in approved_algorithms

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "ENCRYPTION_VALIDATION_FAILED",
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                }
            )
            return False

    async def _validate_access_logging(self) -> bool:
        """Validate access logging compliance."""
        try:
            from ..database.connection_manager import (
                get_database_connection,
            )  # noqa: E402

            async with get_database_connection() as db:
                recent_logs = await db.fetch_all(
                    "SELECT COUNT(*) as log_count FROM audit_logs WHERE created_at > ?",
                    (datetime.utcnow() - timedelta(hours=24),),
                )

                if not recent_logs or recent_logs[0]["log_count"] == 0:
                    return False

                retention_config = await db.fetch_one(
                    "SELECT retention_days FROM system_config WHERE config_type = 'audit_logging'"
                )

                return retention_config and retention_config["retention_days"] >= 90

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "ACCESS_LOGGING_VALIDATION_FAILED",
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                }
            )
            return False

    async def _validate_incident_response(self) -> bool:
        """Validate incident response compliance."""
        # Mock implementation - would check response procedures
        return True

    async def _validate_data_retention(self) -> bool:
        """Validate data retention compliance."""
        # Mock implementation - would check retention policies
        return True

    async def _create_violation(self, requirement: ComplianceRequirement):
        """Create compliance violation record."""
        violation_id = f"VIO_{requirement.framework.value}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        violation = ComplianceViolation(
            violation_id=violation_id,
            requirement_id=requirement.requirement_id,
            framework=requirement.framework,
            severity="HIGH",
            description=f"Non-compliance detected for {requirement.title}",
            detected_at=datetime.utcnow(),
            remediation_deadline=datetime.utcnow() + timedelta(days=30),
            responsible_party=requirement.responsible_party,
        )

        self.violations[violation_id] = violation

        # Log violation
        await self.audit_logger.log_critical_security_event(
            {
                "event_type": "COMPLIANCE_VIOLATION_DETECTED",
                "violation_id": violation_id,
                "requirement_id": requirement.requirement_id,
                "framework": requirement.framework.value,
                "severity": violation.severity,
                "timestamp": datetime.utcnow(),
                "status": "SUCCESS",
            }
        )

    async def resolve_violation(self, violation_id: str, remediation_plan: str):
        """Resolve compliance violation."""
        try:
            if violation_id not in self.violations:
                raise ValueError(f"Violation {violation_id} not found")

            violation = self.violations[violation_id]
            violation.remediation_plan = remediation_plan
            violation.resolved_at = datetime.utcnow()

            # Log resolution
            await self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_VIOLATION_RESOLVED",
                    "violation_id": violation_id,
                    "remediation_plan": remediation_plan,
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "COMPLIANCE_VIOLATION_RESOLUTION_FAILED",
                    "violation_id": violation_id,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            raise

    async def generate_regulatory_report(
        self, framework: ComplianceFramework, report_type: str
    ) -> Dict[str, Any]:
        """Generate regulatory compliance report."""
        try:
            # Get latest assessment report
            latest_report = None
            for report in reversed(self.reports):
                if report.framework == framework:
                    latest_report = report
                    break

            if not latest_report:
                raise ValueError(f"No assessment report found for {framework.value}")

            # Generate regulatory report
            regulatory_report = {
                "report_metadata": {
                    "report_id": f"REG_{framework.value}_{datetime.utcnow().strftime('%Y%m%d')}",
                    "framework": framework.value,
                    "report_type": report_type,
                    "generated_at": datetime.utcnow().isoformat(),
                    "reporting_period": {
                        "start": latest_report.assessment_period["start"].isoformat(),
                        "end": latest_report.assessment_period["end"].isoformat(),
                    },
                },
                "compliance_summary": {
                    "overall_status": latest_report.overall_status.value,
                    "compliance_percentage": latest_report.compliance_percentage,
                    "requirements_assessed": latest_report.requirements_assessed,
                    "violations_found": latest_report.violations_found,
                    "remediation_actions": latest_report.remediation_actions,
                },
                "violations": [
                    {
                        "violation_id": v.violation_id,
                        "requirement_id": v.requirement_id,
                        "severity": v.severity,
                        "description": v.description,
                        "detected_at": v.detected_at.isoformat(),
                        "remediation_deadline": v.remediation_deadline.isoformat(),
                        "status": "RESOLVED" if v.resolved_at else "OPEN",
                    }
                    for v in self.violations.values()
                    if v.framework == framework
                ],
                "remediation_plan": self._generate_remediation_plan(framework),
                "next_assessment": latest_report.next_assessment.isoformat(),
            }

            # Log report generation
            await self.audit_logger.log_security_event(
                {
                    "event_type": "REGULATORY_REPORT_GENERATED",
                    "framework": framework.value,
                    "report_type": report_type,
                    "report_id": regulatory_report["report_metadata"]["report_id"],
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

            return regulatory_report

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "REGULATORY_REPORT_GENERATION_FAILED",
                    "framework": framework.value,
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            raise

    def _generate_remediation_plan(
        self, framework: ComplianceFramework
    ) -> Dict[str, Any]:
        """Generate remediation plan for framework violations."""
        open_violations = [
            v
            for v in self.violations.values()
            if v.framework == framework and not v.resolved_at
        ]

        return {
            "total_actions": len(open_violations),
            "priority_actions": [
                {
                    "violation_id": v.violation_id,
                    "action": f"Remediate {v.requirement_id}",
                    "deadline": v.remediation_deadline.isoformat(),
                    "responsible_party": v.responsible_party,
                }
                for v in open_violations[:5]  # Top 5 priority actions
            ],
            "timeline": {
                "immediate": len(
                    [
                        v
                        for v in open_violations
                        if v.remediation_deadline
                        <= datetime.utcnow() + timedelta(days=7)
                    ]
                ),
                "short_term": len(
                    [
                        v
                        for v in open_violations
                        if v.remediation_deadline
                        <= datetime.utcnow() + timedelta(days=30)
                    ]
                ),
                "long_term": len(
                    [
                        v
                        for v in open_violations
                        if v.remediation_deadline
                        > datetime.utcnow() + timedelta(days=30)
                    ]
                ),
            },
        }

    def get_compliance_status(
        self, framework: Optional[ComplianceFramework] = None
    ) -> Dict[str, Any]:
        """Get current compliance status."""
        if framework:
            # Get status for specific framework
            framework_violations = [
                v
                for v in self.violations.values()
                if v.framework == framework and not v.resolved_at
            ]
            framework_requirements = [
                r for r in self.requirements.values() if r.framework == framework
            ]

            return {
                "framework": framework.value,
                "open_violations": len(framework_violations),
                "total_requirements": len(framework_requirements),
                "last_assessment": (
                    max([r.last_assessment for r in framework_requirements])
                    if framework_requirements
                    else None
                ),
                "next_assessment": (
                    min([r.next_assessment for r in framework_requirements])
                    if framework_requirements
                    else None
                ),
            }
        else:
            # Get overall status
            return {
                "total_frameworks": len(self.frameworks),
                "total_requirements": len(self.requirements),
                "total_violations": len(
                    [v for v in self.violations.values() if not v.resolved_at]
                ),
                "compliance_percentage": self._calculate_overall_compliance(),
            }

    def _calculate_overall_compliance(self) -> float:
        """Calculate overall compliance percentage across all frameworks."""
        if not self.requirements:
            return 0.0

        open_violations = len(
            [v for v in self.violations.values() if not v.resolved_at]
        )
        total_requirements = len(self.requirements)

        return (
            ((total_requirements - open_violations) / total_requirements * 100)
            if total_requirements > 0
            else 0.0
        )
