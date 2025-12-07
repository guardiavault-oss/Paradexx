#!/usr/bin/env python3
"""
Real-time Alerting System
Advanced notification system with webhook, email, and SMS support
"""

import asyncio
import json
import smtplib
import ssl
import time
from dataclasses import dataclass, field
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Any

import aiohttp
import structlog

try:
    from twilio.base.exceptions import TwilioException
    from twilio.rest import Client as TwilioClient

    TWILIO_AVAILABLE = True
except ImportError:
    TwilioClient = None
    TwilioException = Exception
    TWILIO_AVAILABLE = False

from config.settings import settings

from .contract_analysis import VulnerabilityReport
from .mempool_monitor import MempoolEvent
from .threat_detection import ThreatDetection

logger = structlog.get_logger(__name__)


class AlertChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"
    SLACK = "slack"
    DISCORD = "discord"
    TELEGRAM = "telegram"


class AlertPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AlertRule:
    rule_id: str
    name: str
    description: str
    conditions: dict[str, Any]
    channels: list[AlertChannel]
    priority: AlertPriority
    enabled: bool = True
    cooldown_seconds: int = 300  # 5 minutes default cooldown
    last_triggered: float = 0


@dataclass
class Alert:
    alert_id: str
    rule_id: str
    title: str
    message: str
    priority: AlertPriority
    channels: list[AlertChannel]
    timestamp: float
    data: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class AlertDelivery:
    alert_id: str
    channel: AlertChannel
    status: str  # sent, failed, pending
    timestamp: float
    error_message: str | None = None
    delivery_data: dict[str, Any] = field(default_factory=dict)


class EmailNotifier:
    """Email notification service"""

    def __init__(self):
        self.smtp_server = settings.email_smtp_server
        self.smtp_port = settings.email_smtp_port
        self.username = settings.email_username
        self.password = settings.email_password
        self.from_email = settings.email_from
        self.to_email = settings.email_to

    async def send_alert(self, alert: Alert) -> AlertDelivery:
        """Send email alert"""
        if not settings.email_enabled:
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.EMAIL,
                status="failed",
                timestamp=time.time(),
                error_message="Email alerts disabled",
            )

        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"🛡️ Wallet Guard Alert: {alert.title}"
            message["From"] = self.from_email
            message["To"] = self.to_email

            # Create HTML content
            html_content = self._create_html_email(alert)
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            # Create text content
            text_content = self._create_text_email(alert)
            text_part = MIMEText(text_content, "plain")
            message.attach(text_part)

            # Send email
            await self._send_email_async(message)

            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.EMAIL,
                status="sent",
                timestamp=time.time(),
                delivery_data={"to": self.to_email},
            )

        except Exception as e:
            logger.error("Failed to send email alert", alert_id=alert.alert_id, error=str(e))
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.EMAIL,
                status="failed",
                timestamp=time.time(),
                error_message=str(e),
            )

    def _create_html_email(self, alert: Alert) -> str:
        """Create HTML email content"""
        priority_color = {
            AlertPriority.LOW: "#28a745",
            AlertPriority.MEDIUM: "#ffc107",
            AlertPriority.HIGH: "#fd7e14",
            AlertPriority.CRITICAL: "#dc3545",
        }.get(alert.priority, "#6c757d")

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
                .header {{ background-color: {priority_color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                .alert-title {{ font-size: 24px; margin: 0; }}
                .alert-message {{ font-size: 16px; line-height: 1.5; }}
                .metadata {{ background-color: white; padding: 15px; border-radius: 5px; margin-top: 15px; }}
                .metadata h3 {{ margin-top: 0; }}
                .metadata pre {{ background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="alert-title">{alert.title}</h1>
            </div>
            <div class="content">
                <div class="alert-message">{alert.message}</div>

                <div class="metadata">
                    <h3>Alert Details</h3>
                    <p><strong>Priority:</strong> {alert.priority.value.upper()}</p>
                    <p><strong>Time:</strong> {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(alert.timestamp))}</p>
                    <p><strong>Alert ID:</strong> {alert.alert_id}</p>

                    {self._format_metadata_html(alert.data)}
                </div>
            </div>
        </body>
        </html>
        """

    def _create_text_email(self, alert: Alert) -> str:
        """Create text email content"""
        return f"""
Wallet Guard Alert

Title: {alert.title}
Priority: {alert.priority.value.upper()}
Time: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(alert.timestamp))}
Alert ID: {alert.alert_id}

Message:
{alert.message}

Details:
{self._format_metadata_text(alert.data)}
        """

    def _format_metadata_html(self, data: dict[str, Any]) -> str:
        """Format metadata as HTML"""
        if not data:
            return ""

        html = "<h4>Additional Data:</h4><pre>"
        html += json.dumps(data, indent=2)
        html += "</pre>"
        return html

    def _format_metadata_text(self, data: dict[str, Any]) -> str:
        """Format metadata as text"""
        if not data:
            return "None"
        return json.dumps(data, indent=2)

    async def _send_email_async(self, message: MIMEMultipart):
        """Send email asynchronously"""
        loop = asyncio.get_event_loop()

        def send_email():
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.send_message(message)

        await loop.run_in_executor(None, send_email)


class SMSNotifier:
    """SMS notification service using Twilio"""

    def __init__(self):
        self.account_sid = settings.twilio_account_sid
        self.auth_token = settings.twilio_auth_token
        self.phone_number = settings.twilio_phone_number
        self.client = None

        if self.account_sid and self.auth_token and TWILIO_AVAILABLE:
            self.client = TwilioClient(self.account_sid, self.auth_token)

    async def send_alert(self, alert: Alert) -> AlertDelivery:
        """Send SMS alert"""
        if not settings.sms_enabled or not self.client:
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.SMS,
                status="failed",
                timestamp=time.time(),
                error_message="SMS alerts disabled or not configured",
            )

        try:
            # Create SMS message
            message_text = self._create_sms_message(alert)

            # Send SMS
            loop = asyncio.get_event_loop()
            message = await loop.run_in_executor(
                None,
                lambda: self.client.messages.create(
                    body=message_text,
                    from_=self.phone_number,
                    to=self.phone_number,  # Would be configured per user
                ),
            )

            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.SMS,
                status="sent",
                timestamp=time.time(),
                delivery_data={"message_sid": message.sid},
            )

        except TwilioException as e:
            logger.error("Twilio SMS failed", alert_id=alert.alert_id, error=str(e))
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.SMS,
                status="failed",
                timestamp=time.time(),
                error_message=str(e),
            )
        except Exception as e:
            logger.error("SMS alert failed", alert_id=alert.alert_id, error=str(e))
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.SMS,
                status="failed",
                timestamp=time.time(),
                error_message=str(e),
            )

    def _create_sms_message(self, alert: Alert) -> str:
        """Create SMS message"""
        priority_emoji = {
            AlertPriority.LOW: "🟢",
            AlertPriority.MEDIUM: "🟡",
            AlertPriority.HIGH: "🟠",
            AlertPriority.CRITICAL: "🔴",
        }.get(alert.priority, "⚪")

        return f"""
{priority_emoji} Wallet Guard Alert

{alert.title}

{alert.message}

Priority: {alert.priority.value.upper()}
Time: {time.strftime('%H:%M:%S', time.gmtime(alert.timestamp))}

Alert ID: {alert.alert_id[:8]}...
        """


class WebhookNotifier:
    """Webhook notification service"""

    def __init__(self):
        self.webhook_url = settings.webhook_url
        self.timeout = settings.request_timeout

    async def send_alert(self, alert: Alert) -> AlertDelivery:
        """Send webhook alert"""
        if not settings.webhook_enabled or not self.webhook_url:
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.WEBHOOK,
                status="failed",
                timestamp=time.time(),
                error_message="Webhook alerts disabled or not configured",
            )

        try:
            # Create webhook payload
            payload = self._create_webhook_payload(alert)

            # Send webhook
            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.webhook_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=self.timeout),
                    headers={"Content-Type": "application/json"},
                ) as response,
            ):
                if response.status == 200:
                    return AlertDelivery(
                        alert_id=alert.alert_id,
                        channel=AlertChannel.WEBHOOK,
                        status="sent",
                        timestamp=time.time(),
                        delivery_data={"status_code": response.status},
                    )
                error_text = await response.text()
                return AlertDelivery(
                    alert_id=alert.alert_id,
                    channel=AlertChannel.WEBHOOK,
                    status="failed",
                    timestamp=time.time(),
                    error_message=f"HTTP {response.status}: {error_text}",
                )

        except Exception as e:
            logger.error("Webhook alert failed", alert_id=alert.alert_id, error=str(e))
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.WEBHOOK,
                status="failed",
                timestamp=time.time(),
                error_message=str(e),
            )

    def _create_webhook_payload(self, alert: Alert) -> dict[str, Any]:
        """Create webhook payload"""
        return {
            "alert_id": alert.alert_id,
            "rule_id": alert.rule_id,
            "title": alert.title,
            "message": alert.message,
            "priority": alert.priority.value,
            "timestamp": alert.timestamp,
            "data": alert.data,
            "metadata": alert.metadata,
            "service": "wallet-guard",
            "version": settings.service_version,
        }


class SlackNotifier:
    """Slack notification service"""

    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
        self.timeout = settings.request_timeout

    async def send_alert(self, alert: Alert) -> AlertDelivery:
        """Send Slack alert"""
        try:
            # Create Slack payload
            payload = self._create_slack_payload(alert)

            # Send to Slack
            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.webhook_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=self.timeout),
                ) as response,
            ):
                if response.status == 200:
                    return AlertDelivery(
                        alert_id=alert.alert_id,
                        channel=AlertChannel.SLACK,
                        status="sent",
                        timestamp=time.time(),
                        delivery_data={"status_code": response.status},
                    )
                error_text = await response.text()
                return AlertDelivery(
                    alert_id=alert.alert_id,
                    channel=AlertChannel.SLACK,
                    status="failed",
                    timestamp=time.time(),
                    error_message=f"HTTP {response.status}: {error_text}",
                )

        except Exception as e:
            logger.error("Slack alert failed", alert_id=alert.alert_id, error=str(e))
            return AlertDelivery(
                alert_id=alert.alert_id,
                channel=AlertChannel.SLACK,
                status="failed",
                timestamp=time.time(),
                error_message=str(e),
            )

    def _create_slack_payload(self, alert: Alert) -> dict[str, Any]:
        """Create Slack payload"""
        priority_color = {
            AlertPriority.LOW: "good",
            AlertPriority.MEDIUM: "warning",
            AlertPriority.HIGH: "danger",
            AlertPriority.CRITICAL: "danger",
        }.get(alert.priority, "good")

        return {
            "attachments": [
                {
                    "color": priority_color,
                    "title": f"🛡️ {alert.title}",
                    "text": alert.message,
                    "fields": [
                        {"title": "Priority", "value": alert.priority.value.upper(), "short": True},
                        {
                            "title": "Time",
                            "value": f"<!date^{int(alert.timestamp)}^{{date}} {{time}} UTC|{alert.timestamp}>",
                            "short": True,
                        },
                        {"title": "Alert ID", "value": alert.alert_id, "short": True},
                    ],
                    "footer": "Wallet Guard Service",
                    "ts": alert.timestamp,
                }
            ]
        }


class AlertManager:
    """Main alert management system"""

    def __init__(self):
        self.alert_rules: dict[str, AlertRule] = {}
        self.alert_history: list[Alert] = []
        self.delivery_history: list[AlertDelivery] = []

        # Initialize notifiers
        self.email_notifier = EmailNotifier()
        self.sms_notifier = SMSNotifier()
        self.webhook_notifier = WebhookNotifier()

        # Initialize default rules
        self._initialize_default_rules()

        # Alert callbacks
        self.alert_callbacks: list[callable] = []

    def _initialize_default_rules(self):
        """Initialize default alert rules"""
        # Critical threat rule
        critical_threat_rule = AlertRule(
            rule_id="critical_threat",
            name="Critical Threat Detection",
            description="Alert when critical threats are detected",
            conditions={
                "threat_severity": "critical",
                "threat_types": ["mev_front_running", "sandwich_attack", "flash_loan_attack"],
            },
            channels=[AlertChannel.EMAIL, AlertChannel.SMS, AlertChannel.WEBHOOK],
            priority=AlertPriority.CRITICAL,
            cooldown_seconds=60,
        )
        self.alert_rules[critical_threat_rule.rule_id] = critical_threat_rule

        # High threat rule
        high_threat_rule = AlertRule(
            rule_id="high_threat",
            name="High Threat Detection",
            description="Alert when high-severity threats are detected",
            conditions={
                "threat_severity": "high",
                "threat_types": ["arbitrage_attack", "dust_attack", "phishing_contract"],
            },
            channels=[AlertChannel.EMAIL, AlertChannel.WEBHOOK],
            priority=AlertPriority.HIGH,
            cooldown_seconds=300,
        )
        self.alert_rules[high_threat_rule.rule_id] = high_threat_rule

        # Contract vulnerability rule
        contract_vuln_rule = AlertRule(
            rule_id="contract_vulnerability",
            name="Contract Vulnerability",
            description="Alert when contract vulnerabilities are found",
            conditions={
                "vulnerability_severity": ["high", "critical"],
                "vulnerability_types": ["reentrancy", "unchecked_call", "honeypot"],
            },
            channels=[AlertChannel.EMAIL, AlertChannel.WEBHOOK],
            priority=AlertPriority.HIGH,
            cooldown_seconds=600,
        )
        self.alert_rules[contract_vuln_rule.rule_id] = contract_vuln_rule

        # Mempool activity rule
        mempool_rule = AlertRule(
            rule_id="mempool_activity",
            name="Mempool Activity",
            description="Alert for significant mempool activity",
            conditions={"event_types": ["high_value_transaction", "suspicious_pattern"]},
            channels=[AlertChannel.WEBHOOK],
            priority=AlertPriority.MEDIUM,
            cooldown_seconds=180,
        )
        self.alert_rules[mempool_rule.rule_id] = mempool_rule

    async def process_threat_detection(self, threat: ThreatDetection):
        """Process threat detection and trigger alerts"""
        # Check rules for threat detections
        for rule in self.alert_rules.values():
            if not rule.enabled:
                continue

            if self._rule_matches_threat(rule, threat):
                await self._trigger_alert(rule, threat)

    async def process_vulnerability_report(self, vulnerability: VulnerabilityReport):
        """Process vulnerability report and trigger alerts"""
        # Check rules for vulnerability reports
        for rule in self.alert_rules.values():
            if not rule.enabled:
                continue

            if self._rule_matches_vulnerability(rule, vulnerability):
                await self._trigger_alert(rule, vulnerability)

    async def process_mempool_event(self, event: MempoolEvent):
        """Process mempool event and trigger alerts"""
        # Check rules for mempool events
        for rule in self.alert_rules.values():
            if not rule.enabled:
                continue

            if self._rule_matches_mempool_event(rule, event):
                await self._trigger_alert(rule, event)

    def _rule_matches_threat(self, rule: AlertRule, threat: ThreatDetection) -> bool:
        """Check if rule matches threat detection"""
        conditions = rule.conditions

        # Check threat severity
        if "threat_severity" in conditions:
            if threat.severity.value != conditions["threat_severity"]:
                return False

        # Check threat types
        if "threat_types" in conditions:
            if threat.threat_type.value not in conditions["threat_types"]:
                return False

        # Check cooldown
        if time.time() - rule.last_triggered < rule.cooldown_seconds:
            return False

        return True

    def _rule_matches_vulnerability(
        self, rule: AlertRule, vulnerability: VulnerabilityReport
    ) -> bool:
        """Check if rule matches vulnerability report"""
        conditions = rule.conditions

        # Check vulnerability severity
        if "vulnerability_severity" in conditions:
            if vulnerability.severity.value not in conditions["vulnerability_severity"]:
                return False

        # Check vulnerability types
        if "vulnerability_types" in conditions:
            if vulnerability.vulnerability_type.value not in conditions["vulnerability_types"]:
                return False

        # Check cooldown
        if time.time() - rule.last_triggered < rule.cooldown_seconds:
            return False

        return True

    def _rule_matches_mempool_event(self, rule: AlertRule, event: MempoolEvent) -> bool:
        """Check if rule matches mempool event"""
        conditions = rule.conditions

        # Check event types
        if "event_types" in conditions:
            if event.event_type.value not in conditions["event_types"]:
                return False

        # Check cooldown
        if time.time() - rule.last_triggered < rule.cooldown_seconds:
            return False

        return True

    async def _trigger_alert(self, rule: AlertRule, source_data: Any):
        """Trigger alert for matched rule"""
        # Create alert
        alert = Alert(
            alert_id=f"{rule.rule_id}_{int(time.time() * 1000)}",
            rule_id=rule.rule_id,
            title=self._create_alert_title(rule, source_data),
            message=self._create_alert_message(rule, source_data),
            priority=rule.priority,
            channels=rule.channels,
            timestamp=time.time(),
            data=self._extract_alert_data(source_data),
            metadata={"rule_name": rule.name},
        )

        # Add to history
        self.alert_history.append(alert)

        # Update rule last triggered
        rule.last_triggered = time.time()

        # Send alerts through configured channels
        for channel in rule.channels:
            delivery = await self._send_alert_to_channel(alert, channel)
            self.delivery_history.append(delivery)

        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                await callback(alert)
            except Exception as e:
                logger.error("Error in alert callback", error=str(e))

        logger.info(
            "Alert triggered",
            alert_id=alert.alert_id,
            rule_id=rule.rule_id,
            priority=alert.priority.value,
            channels=[c.value for c in alert.channels],
        )

    def _create_alert_title(self, rule: AlertRule, source_data: Any) -> str:
        """Create alert title based on rule and source data"""
        if isinstance(source_data, ThreatDetection):
            return f"{rule.name}: {source_data.threat_type.value.replace('_', ' ').title()}"
        if isinstance(source_data, VulnerabilityReport):
            return f"{rule.name}: {source_data.vulnerability_type.value.replace('_', ' ').title()}"
        if isinstance(source_data, MempoolEvent):
            return f"{rule.name}: {source_data.event_type.value.replace('_', ' ').title()}"
        return rule.name

    def _create_alert_message(self, rule: AlertRule, source_data: Any) -> str:
        """Create alert message based on rule and source data"""
        if isinstance(source_data, ThreatDetection):
            return f"Threat detected on {source_data.network}: {source_data.description}"
        if isinstance(source_data, VulnerabilityReport):
            return f"Vulnerability found in contract {source_data.contract_address}: {source_data.description}"
        if isinstance(source_data, MempoolEvent):
            return f"Mempool event on {source_data.network}: {source_data.transaction_hash}"
        return rule.description

    def _extract_alert_data(self, source_data: Any) -> dict[str, Any]:
        """Extract relevant data from source for alert"""
        if isinstance(source_data, ThreatDetection):
            return {
                "wallet_address": source_data.wallet_address,
                "network": source_data.network,
                "threat_type": source_data.threat_type.value,
                "severity": source_data.severity.value,
                "confidence": source_data.confidence,
                "metadata": source_data.metadata,
            }
        if isinstance(source_data, VulnerabilityReport):
            return {
                "contract_address": source_data.contract_address,
                "network": source_data.network,
                "vulnerability_type": source_data.vulnerability_type.value,
                "severity": source_data.severity.value,
                "confidence": source_data.confidence,
                "remediation": source_data.remediation,
            }
        if isinstance(source_data, MempoolEvent):
            return {
                "transaction_hash": source_data.transaction_hash,
                "network": source_data.network,
                "event_type": source_data.event_type.value,
                "data": source_data.data,
            }
        return {}

    async def _send_alert_to_channel(self, alert: Alert, channel: AlertChannel) -> AlertDelivery:
        """Send alert to specific channel"""
        if channel == AlertChannel.EMAIL:
            return await self.email_notifier.send_alert(alert)
        if channel == AlertChannel.SMS:
            return await self.sms_notifier.send_alert(alert)
        if channel == AlertChannel.WEBHOOK:
            return await self.webhook_notifier.send_alert(alert)
        return AlertDelivery(
            alert_id=alert.alert_id,
            channel=channel,
            status="failed",
            timestamp=time.time(),
            error_message=f"Channel {channel.value} not implemented",
        )

    def add_alert_rule(self, rule: AlertRule):
        """Add new alert rule"""
        self.alert_rules[rule.rule_id] = rule
        logger.info("Added alert rule", rule_id=rule.rule_id, name=rule.name)

    def remove_alert_rule(self, rule_id: str):
        """Remove alert rule"""
        if rule_id in self.alert_rules:
            del self.alert_rules[rule_id]
            logger.info("Removed alert rule", rule_id=rule_id)

    def enable_alert_rule(self, rule_id: str):
        """Enable alert rule"""
        if rule_id in self.alert_rules:
            self.alert_rules[rule_id].enabled = True
            logger.info("Enabled alert rule", rule_id=rule_id)

    def disable_alert_rule(self, rule_id: str):
        """Disable alert rule"""
        if rule_id in self.alert_rules:
            self.alert_rules[rule_id].enabled = False
            logger.info("Disabled alert rule", rule_id=rule_id)

    def add_alert_callback(self, callback: callable):
        """Add alert callback"""
        self.alert_callbacks.append(callback)

    def remove_alert_callback(self, callback: callable):
        """Remove alert callback"""
        if callback in self.alert_callbacks:
            self.alert_callbacks.remove(callback)

    def get_alert_stats(self) -> dict[str, Any]:
        """Get alert statistics"""
        total_alerts = len(self.alert_history)
        total_deliveries = len(self.delivery_history)

        # Count by priority
        priority_counts = {}
        for alert in self.alert_history:
            priority = alert.priority.value
            priority_counts[priority] = priority_counts.get(priority, 0) + 1

        # Count by channel
        channel_counts = {}
        for delivery in self.delivery_history:
            channel = delivery.channel.value
            channel_counts[channel] = channel_counts.get(channel, 0) + 1

        # Count successful vs failed deliveries
        successful_deliveries = len([d for d in self.delivery_history if d.status == "sent"])
        failed_deliveries = len([d for d in self.delivery_history if d.status == "failed"])

        return {
            "total_alerts": total_alerts,
            "total_deliveries": total_deliveries,
            "successful_deliveries": successful_deliveries,
            "failed_deliveries": failed_deliveries,
            "delivery_success_rate": (
                (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
            ),
            "priority_distribution": priority_counts,
            "channel_distribution": channel_counts,
            "active_rules": len([r for r in self.alert_rules.values() if r.enabled]),
            "total_rules": len(self.alert_rules),
        }


# Global alert manager instance
alert_manager = AlertManager()
