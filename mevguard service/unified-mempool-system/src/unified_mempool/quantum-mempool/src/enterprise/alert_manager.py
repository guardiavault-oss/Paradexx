import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Advanced alerting system with multiple notification channels.
"""

import smtplib  # noqa: E402
from datetime import datetime  # noqa: E402
from typing import Any, Dict, List  # noqa: E402

import aiohttp  # noqa: E402
from common.observability.logging import get_scorpius_logger  # noqa: E402

# Email imports with fallback
try:
    from email.mime.multipart import MIMEMultipart as MimeMultipart  # noqa: E402
    from email.mime.text import MIMEText as MimeText  # noqa: E402
except ImportError:
    try:
        from email.MIMEMultipart import MIMEMultipart as MimeMultipart  # noqa: E402
        from email.MIMEText import MIMEText as MimeText  # noqa: E402
    except ImportError:
        # Fallback for missing email functionality
        MimeText = None
        MimeMultipart = None


from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402


class AlertSeverity:
    """Alert severity levels."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertChannel:
    """Base class for alert channels."""

    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config
        self.logger = get_scorpius_logger(f"{__name__}.{name}")

    async def send_alert(self, alert: Dict[str, Any]) -> bool:
        """Send alert through this channel."""
        raise NotImplementedError


class EmailAlertChannel(AlertChannel):
    """Email alert channel."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__("email", config)

    async def send_alert(self, alert: Dict[str, Any]) -> bool:
        """Send email alert."""
        try:
            # Check if email functionality is available
            if MimeText is None or MimeMultipart is None:
                self.logger.warning(
                    "Email functionality not available - skipping email alert"
                )
                return False

            # Create message
            msg = MimeMultipart()
            msg["From"] = self.config["email_from"]
            msg["To"] = ", ".join(self.config["email_to"])
            msg["Subject"] = f"[{alert['severity'].upper()}] Quantum Threat Alert"

            # Create email body
            body = self._create_email_body(alert)
            msg.attach(MimeText(body, "html"))

            # Send email
            server = smtplib.SMTP(self.config["smtp_server"], self.config["smtp_port"])
            if self.config.get("smtp_username"):
                server.starttls()
                server.login(self.config["smtp_username"], self.config["smtp_password"])

            server.send_message(msg)
            server.quit()

            self.logger.info(f"Email alert sent for {alert['alert_id']}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send email alert: {str(e)}")
            return False

    def _create_email_body(self, alert: Dict[str, Any]) -> str:
        """Create HTML email body."""
        severity_colors = {
            AlertSeverity.CRITICAL: "#dc2626",
            AlertSeverity.HIGH: "#ea580c",
            AlertSeverity.MEDIUM: "#d97706",
            AlertSeverity.LOW: "#2563eb",
            AlertSeverity.INFO: "#059669",
        }

        color = severity_colors.get(alert["severity"], "#6b7280")

        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }}
                .header {{ background-color: {color}; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .field {{ margin: 10px 0; }}
                .label {{ font-weight: bold; color: #374151; }}
                .value {{ color: #6b7280; }}
                .footer {{ background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔬 Quantum Threat Alert</h1>
                    <h2>{alert["severity"].upper()} SEVERITY</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Alert ID:</span>
                        <span class="value">{alert["alert_id"]}</span>
                    </div>
                    <div class="field">
                        <span class="label">Threat Type:</span>
                        <span class="value">{alert.get("threat_type", "Unknown")}</span>
                    </div>
                    <div class="field">
                        <span class="label">Confidence Score:</span>
                        <span class="value">{alert.get("confidence_score", 0):.2%}</span>
                    </div>
                    <div class="field">
                        <span class="label">Detected At:</span>
                        <span class="value">{alert["timestamp"]}</span>
                    </div>
                    <div class="field">
                        <span class="label">Description:</span>
                        <span class="value">{alert.get("description", "No description available")}</span>
                    </div>
                    <div class="field">
                        <span class="label">Affected Addresses:</span>
                        <span class="value">{", ".join(alert.get("affected_addresses", []))}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Enterprise Quantum Mempool Monitor | {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC</p>
                </div>
            </div>
        </body>
        </html>
        """


class SlackAlertChannel(AlertChannel):
    """Slack alert channel."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__("slack", config)

    async def send_alert(self, alert: Dict[str, Any]) -> bool:
        """Send Slack alert."""
        try:
            webhook_url = self.config["slack_webhook"]
            if not webhook_url:
                return False

            # Create Slack message
            message = self._create_slack_message(alert)

            # Send to Slack
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=message) as response:
                    if response.status == 200:
                        self.logger.info(f"Slack alert sent for {alert['alert_id']}")
                        return True
                    else:
                        self.logger.error(
                            f"Slack webhook failed with status {response.status}"
                        )
                        return False

        except Exception as e:
            self.logger.error(f"Failed to send Slack alert: {str(e)}")
            return False

    def _create_slack_message(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Create Slack message payload."""
        severity_colors = {
            AlertSeverity.CRITICAL: "#dc2626",
            AlertSeverity.HIGH: "#ea580c",
            AlertSeverity.MEDIUM: "#d97706",
            AlertSeverity.LOW: "#2563eb",
            AlertSeverity.INFO: "#059669",
        }

        color = severity_colors.get(alert["severity"], "#6b7280")

        return {
            "channel": self.config.get("slack_channel", "#security-alerts"),
            "username": "Quantum Monitor",
            "icon_emoji": ":microscope:",
            "attachments": [
                {
                    "color": color,
                    "title": f"🔬 Quantum Threat Alert - {alert['severity'].upper()}",
                    "fields": [
                        {
                            "title": "Alert ID",
                            "value": alert["alert_id"],
                            "short": True,
                        },
                        {
                            "title": "Threat Type",
                            "value": alert.get("threat_type", "Unknown"),
                            "short": True,
                        },
                        {
                            "title": "Confidence Score",
                            "value": f"{alert.get('confidence_score', 0):.2%}",
                            "short": True,
                        },
                        {
                            "title": "Detection Time",
                            "value": alert["timestamp"],
                            "short": True,
                        },
                        {
                            "title": "Description",
                            "value": alert.get(
                                "description", "No description available"
                            ),
                            "short": False,
                        },
                        {
                            "title": "Affected Addresses",
                            "value": ", ".join(alert.get("affected_addresses", []))
                            or "None",
                            "short": False,
                        },
                    ],
                    "footer": "Enterprise Quantum Mempool Monitor",
                    "ts": int(datetime.utcnow().timestamp()),
                }
            ],
        }


class WebhookAlertChannel(AlertChannel):
    """Generic webhook alert channel."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__("webhook", config)

    async def send_alert(self, alert: Dict[str, Any]) -> bool:
        """Send webhook alert."""
        try:
            webhook_url = self.config.get("webhook_url")
            if not webhook_url:
                return False

            # Prepare payload
            payload = {
                "source": "quantum_mempool_monitor",
                "timestamp": datetime.utcnow().isoformat(),
                "alert": alert,
            }

            headers = {
                "Content-Type": "application/json",
                "User-Agent": "QuantumMempoolMonitor/1.0",
            }

            # Add authentication if configured
            if self.config.get("auth_header"):
                headers["Authorization"] = self.config["auth_header"]

            # Send webhook
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url, json=payload, headers=headers
                ) as response:
                    if response.status < 400:
                        self.logger.info(f"Webhook alert sent for {alert['alert_id']}")
                        return True
                    else:
                        self.logger.error(
                            f"Webhook failed with status {response.status}"
                        )
                        return False

        except Exception as e:
            self.logger.error(f"Failed to send webhook alert: {str(e)}")
            return False


class EnterpriseAlertManager:
    """
    Enterprise alert management system with multiple notification channels.

    Features:
    - Multiple notification channels (email, Slack, webhooks)
    - Severity-based routing
    - Rate limiting and deduplication
    - Alert escalation
    - Audit logging
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.logger = get_scorpius_logger(__name__)
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)

        # Alert channels
        self.channels: Dict[str, AlertChannel] = {}
        self._setup_channels()

        # Alert tracking
        self.recent_alerts: Dict[str, datetime] = {}
        self.alert_counts: Dict[str, int] = {}

        # Rate limiting
        self.rate_limit_window = 300  # 5 minutes
        self.max_alerts_per_window = 10

    def _setup_channels(self):
        """Setup notification channels based on configuration."""
        alerting_config = self.config.alerting_config

        # Email channel
        if alerting_config.email_enabled and alerting_config.email_to:
            self.channels["email"] = EmailAlertChannel(alerting_config.__dict__)

        # Slack channel
        if alerting_config.slack_enabled and alerting_config.slack_webhook:
            self.channels["slack"] = SlackAlertChannel(alerting_config.__dict__)

        # Webhook channel (if configured)
        webhook_config = getattr(alerting_config, "webhook_config", {})
        if webhook_config.get("enabled"):
            self.channels["webhook"] = WebhookAlertChannel(webhook_config)

        self.logger.info(f"Initialized alert channels: {list(self.channels.keys())}")

    async def send_alert(self, alert: Dict[str, Any]) -> bool:
        """Send alert through appropriate channels."""
        try:
            # Add metadata
            alert["alert_id"] = alert.get(
                "alert_id", f"alert_{int(datetime.utcnow().timestamp())}"
            )
            alert["timestamp"] = alert.get("timestamp", datetime.utcnow().isoformat())

            # Check rate limiting
            if self._is_rate_limited(alert):
                self.logger.warning(f"Alert rate limited: {alert['alert_id']}")
                return False

            # Check if duplicate
            if self._is_duplicate(alert):
                self.logger.info(f"Duplicate alert suppressed: {alert['alert_id']}")
                return False

            # Determine channels based on severity
            channels_to_use = self._get_channels_for_severity(
                alert.get("severity", AlertSeverity.MEDIUM)
            )

            # Send through channels
            results = []
            for channel_name in channels_to_use:
                if channel_name in self.channels:
                    result = await self.channels[channel_name].send_alert(alert)
                    results.append(result)

            # Log alert
            await self.audit_logger.log_security_event(
                {
                    "event_type": "ALERT_SENT",
                    "alert_id": alert["alert_id"],
                    "severity": alert.get("severity"),
                    "channels": channels_to_use,
                    "success": any(results),
                    "timestamp": datetime.utcnow(),
                }
            )

            # Update tracking
            self._update_alert_tracking(alert)

            return any(results)

        except Exception as e:
            self.logger.error(f"Failed to send alert: {str(e)}")
            return False

    def _get_channels_for_severity(self, severity: str) -> List[str]:
        """Get notification channels based on alert severity."""
        channels = []

        # Always use available channels for critical alerts
        if severity == AlertSeverity.CRITICAL:
            channels = list(self.channels.keys())
        elif severity == AlertSeverity.HIGH:
            channels = ["email", "slack"] if "email" in self.channels else ["slack"]
            if "email" not in channels and "email" in self.channels:
                channels.append("email")
        elif severity in [AlertSeverity.MEDIUM, AlertSeverity.LOW]:
            if "slack" in self.channels:
                channels.append("slack")
        else:  # INFO
            if "webhook" in self.channels:
                channels.append("webhook")

        return [ch for ch in channels if ch in self.channels]

    def _is_rate_limited(self, alert: Dict[str, Any]) -> bool:
        """Check if alert should be rate limited."""
        alert_type = alert.get("threat_type", "unknown")
        current_time = datetime.utcnow()

        # Clean old entries
        cutoff_time = current_time.timestamp() - self.rate_limit_window
        self.recent_alerts = {
            key: timestamp
            for key, timestamp in self.recent_alerts.items()
            if timestamp.timestamp() > cutoff_time
        }

        # Count recent alerts of this type
        recent_count = sum(
            1
            for key, timestamp in self.recent_alerts.items()
            if key.startswith(alert_type) and timestamp.timestamp() > cutoff_time
        )

        return recent_count >= self.max_alerts_per_window

    def _is_duplicate(self, alert: Dict[str, Any]) -> bool:
        """Check if this is a duplicate alert."""
        # Create a simple hash of the alert content
        alert_hash = hash(
            f"{alert.get('threat_type')}:"
            f"{alert.get('severity')}:"
            f"{','.join(sorted(alert.get('affected_addresses', [])))}"
        )

        # Check if we've seen this alert recently (within 1 minute)
        cutoff_time = datetime.utcnow().timestamp() - 60
        recent_similar = [
            key
            for key, timestamp in self.recent_alerts.items()
            if key.endswith(str(alert_hash)) and timestamp.timestamp() > cutoff_time
        ]

        return len(recent_similar) > 0

    def _update_alert_tracking(self, alert: Dict[str, Any]):
        """Update alert tracking data."""
        current_time = datetime.utcnow()
        alert_type = alert.get("threat_type", "unknown")

        # Create tracking key
        alert_hash = hash(
            f"{alert.get('threat_type')}:"
            f"{alert.get('severity')}:"
            f"{','.join(sorted(alert.get('affected_addresses', [])))}"
        )
        tracking_key = f"{alert_type}:{alert_hash}"

        # Update tracking
        self.recent_alerts[tracking_key] = current_time
        self.alert_counts[alert_type] = self.alert_counts.get(alert_type, 0) + 1

    async def get_alert_statistics(self) -> Dict[str, Any]:
        """Get alert statistics."""
        current_time = datetime.utcnow()
        cutoff_time = current_time.timestamp() - 3600  # Last hour

        recent_alerts = [
            timestamp
            for timestamp in self.recent_alerts.values()
            if timestamp.timestamp() > cutoff_time
        ]

        return {
            "total_alerts_sent": sum(self.alert_counts.values()),
            "alerts_last_hour": len(recent_alerts),
            "alert_counts_by_type": dict(self.alert_counts),
            "active_channels": list(self.channels.keys()),
            "last_updated": current_time.isoformat(),
        }

    async def test_channels(self) -> Dict[str, bool]:
        """Test all configured alert channels."""
        test_alert = {
            "alert_id": f"test_{int(datetime.utcnow().timestamp())}",
            "severity": AlertSeverity.INFO,
            "threat_type": "test",
            "description": "This is a test alert from the Quantum Mempool Monitor",
            "confidence_score": 1.0,
            "affected_addresses": ["test_address"],
            "timestamp": datetime.utcnow().isoformat(),
        }

        results = {}
        for channel_name, channel in self.channels.items():
            try:
                result = await channel.send_alert(test_alert)
                results[channel_name] = result
            except Exception as e:
                self.logger.error(f"Test failed for channel {channel_name}: {str(e)}")
                results[channel_name] = False

        return results
