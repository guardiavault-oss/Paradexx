import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise configuration management with environment-specific settings.
"""

import os  # noqa: E402
from dataclasses import dataclass, field  # noqa: E402
from pathlib import Path  # noqa: E402
from typing import Any, Dict, List, Optional  # noqa: E402

import yaml  # noqa: E402


@dataclass
class HSMConfig:
    """Hardware Security Module configuration."""

    provider: str = "aws-cloudhsm"
    fips_compliance: str = "level-3"
    key_rotation_interval: str = "quarterly"
    connection_timeout: int = 30
    retry_attempts: int = 3


@dataclass
class RBACConfig:
    """Role-Based Access Control configuration."""

    backend: str = "eos-blockchain"
    enforcement_mode: str = "strict"
    separation_of_duties: bool = True
    multi_factor_auth: bool = True
    session_timeout: int = 3600


@dataclass
class AuditConfig:
    """Audit and compliance configuration."""

    blockchain_audit_trail: bool = True
    immutable_logging: bool = True
    real_time_siem_integration: bool = True
    retention_period: str = "7_years"
    encryption_enabled: bool = True


@dataclass
class DetectionConfig:
    """Quantum detection algorithm configuration."""

    threshold: int = 100
    time_window: int = 600
    confidence_threshold: float = 0.85
    temporal_threshold: float = 0.7
    statistical_threshold: float = 0.8
    minimum_transactions: int = 10
    audit_config: Optional[AuditConfig] = None
    metrics_config: Optional[Dict[str, Any]] = None


@dataclass
class MetricsConfig:
    """Metrics and monitoring configuration."""

    prometheus_enabled: bool = True
    prometheus_port: int = 9090
    collection_interval: int = 60
    retention_days: int = 365


@dataclass
class BitcoinConfig:
    """Bitcoin network configuration."""

    node_url: str = "http://localhost:8332"
    rpc_user: str = "bitcoin_user"
    rpc_password: str = "bitcoin_password"
    websocket_url: str = "wss://mempool.space/api/v1/ws"
    timeout: int = 30


@dataclass
class EthereumConfig:
    """Ethereum network configuration."""

    provider_url: str = "http://localhost:8545"
    private_key: str = ""
    gas_limit: int = 500000
    timeout: int = 30


@dataclass
class SIEMConfig:
    """SIEM integration configuration."""

    splunk_enabled: bool = True
    splunk_host: str = "localhost"
    splunk_port: int = 8089
    elastic_enabled: bool = True
    elastic_host: str = "localhost"
    elastic_port: int = 9200


@dataclass
class ComplianceConfig:
    """Compliance framework configuration."""

    frameworks: list = field(
        default_factory=lambda: ["SOX", "GDPR", "PCI_DSS", "NIST", "ISO_27001"]
    )
    automated_reporting: bool = True
    continuous_monitoring: bool = True


@dataclass
class APIConfig:
    """API configuration."""

    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    rate_limit: int = 1000
    auth_required: bool = False
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600


@dataclass
class WebSocketConfig:
    """WebSocket configuration."""

    host: str = "0.0.0.0"
    port: int = 8765
    max_connections: int = 100
    ping_interval: int = 20
    ping_timeout: int = 20
    close_timeout: int = 10
    max_size: int = 1048576  # 1MB
    compression: str = "deflate"


@dataclass
class AlertingConfig:
    """Alerting configuration."""

    enabled: bool = True
    channels: List[str] = field(default_factory=lambda: ["email", "slack"])

    # Email configuration
    email_enabled: bool = True
    email_to: str = ""
    email_smtp_server: str = "smtp.gmail.com"
    email_smtp_port: int = 587
    email_username: str = ""
    email_password: str = ""

    # Slack configuration
    slack_enabled: bool = False
    slack_webhook: str = ""
    slack_webhook_url: str = ""

    # Other notification channels
    discord_webhook_url: str = ""
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""


@dataclass
class DashboardConfig:
    """Dashboard configuration."""

    enabled: bool = True
    host: str = "0.0.0.0"
    port: int = 8001
    auto_refresh_interval: int = 30
    max_data_points: int = 1000


@dataclass
class MLConfig:
    """Machine Learning configuration."""

    enabled: bool = True
    model_path: str = "models/"
    training_enabled: bool = False
    auto_retrain: bool = False
    retrain_interval_hours: int = 24
    confidence_threshold: float = 0.8


@dataclass
class NetworkConfig:
    """Network configuration."""

    rpc_url: str = "http://localhost:8545"
    chain_id: int = 1
    is_active: bool = True


@dataclass
class MempoolMonitorConfig:
    """Mempool monitor configuration."""

    max_stored_txs: int = 10000
    poll_interval_seconds: float = 0.1
    cleanup_interval_seconds: float = 60.0
    reconnect_delay_seconds: float = 5.0
    request_timeout_seconds: float = 10.0
    default_min_tx_value_eth: float = 0.001


@dataclass
class DatabaseConfig:
    """Database configuration for enterprise deployment."""

    connection_string: str = "sqlite:///quantum_mempool.db"
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600
    pool_pre_ping: bool = True
    ssl_mode: str = "disable"
    ssl_cert_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    ssl_ca_path: Optional[str] = None
    query_timeout: int = 60
    connection_timeout: int = 30
    retry_attempts: int = 3
    health_check_interval: int = 30


@dataclass
class EnterpriseConfig:
    """Master enterprise configuration."""

    # Core detection settings
    detection: DetectionConfig = field(default_factory=DetectionConfig)

    # Blockchain configurations
    bitcoin: BitcoinConfig = field(default_factory=BitcoinConfig)
    ethereum: EthereumConfig = field(default_factory=EthereumConfig)

    # Enterprise security
    hsm_config: HSMConfig = field(default_factory=HSMConfig)
    rbac_config: RBACConfig = field(default_factory=RBACConfig)
    audit_config: AuditConfig = field(default_factory=AuditConfig)

    # Monitoring and compliance
    metrics_config: MetricsConfig = field(default_factory=MetricsConfig)
    siem_config: SIEMConfig = field(default_factory=SIEMConfig)
    compliance_config: ComplianceConfig = field(default_factory=ComplianceConfig)

    # Database configuration
    database_config: DatabaseConfig = field(default_factory=DatabaseConfig)

    # Additional configurations
    websocket_config: WebSocketConfig = field(default_factory=WebSocketConfig)
    api_config: APIConfig = field(default_factory=APIConfig)
    alerting_config: AlertingConfig = field(default_factory=AlertingConfig)
    dashboard_config: DashboardConfig = field(default_factory=DashboardConfig)
    ml_config: MLConfig = field(default_factory=MLConfig)
    network_config: NetworkConfig = field(default_factory=NetworkConfig)
    mempool_monitor_config: MempoolMonitorConfig = field(
        default_factory=MempoolMonitorConfig
    )

    # Environment settings
    environment: str = "production"
    debug: bool = False
    log_level: str = "INFO"

    @classmethod
    def from_yaml(cls, config_path: str) -> "EnterpriseConfig":
        """Load configuration from YAML file."""
        try:
            with open(config_path, "r") as f:
                config_data = yaml.safe_load(f)

            # Create configuration object with loaded data
            config = cls()

            # Update configuration with loaded values
            if "detection" in config_data:
                config.detection = DetectionConfig(**config_data["detection"])

            if "bitcoin" in config_data:
                config.bitcoin = BitcoinConfig(**config_data["bitcoin"])

            if "ethereum" in config_data:
                config.ethereum = EthereumConfig(**config_data["ethereum"])

            if "database" in config_data:
                config.database_config = DatabaseConfig(**config_data["database"])

            if "api" in config_data:
                config.api_config = APIConfig(**config_data["api"])

            if "websocket" in config_data:
                config.websocket_config = WebSocketConfig(**config_data["websocket"])

            if "alerting" in config_data:
                config.alerting_config = AlertingConfig(**config_data["alerting"])

            if "dashboard" in config_data:
                config.dashboard_config = DashboardConfig(**config_data["dashboard"])

            if "ml" in config_data:
                config.ml_config = MLConfig(**config_data["ml"])

            if "enterprise" in config_data:
                enterprise_data = config_data["enterprise"]

                if "security" in enterprise_data:
                    security_data = enterprise_data["security"]
                    if "hsm" in security_data:
                        config.hsm_config = HSMConfig(**security_data["hsm"])
                    if "rbac" in security_data:
                        config.rbac_config = RBACConfig(**security_data["rbac"])
                    if "audit" in security_data:
                        config.audit_config = AuditConfig(**security_data["audit"])

                if "monitoring" in enterprise_data:
                    config.metrics_config = MetricsConfig(
                        **enterprise_data["monitoring"]
                    )

                if "compliance" in enterprise_data:
                    config.compliance_config = ComplianceConfig(
                        **enterprise_data["compliance"]
                    )

            if "networks" in config_data:
                config._networks = config_data["networks"]

            if "mempool_monitor" in config_data:
                config.mempool_monitor_config = MempoolMonitorConfig(
                    **config_data["mempool_monitor"]
                )

            # Environment-specific overrides
            config.environment = os.getenv("QUANTUM_ENV", config.environment)
            config.debug = os.getenv("QUANTUM_DEBUG", "false").lower() == "true"
            config.log_level = os.getenv("QUANTUM_LOG_LEVEL", config.log_level)

            return config

        except Exception as e:
            raise ConfigurationError(
                f"Failed to load configuration from {config_path}: {e}"
            )

    @classmethod
    def from_env(cls) -> "EnterpriseConfig":
        """Load configuration from environment variables."""
        config = cls()

        # Detection configuration from environment
        config.detection.threshold = int(
            os.getenv("QUANTUM_DETECTION_THRESHOLD", config.detection.threshold)
        )
        config.detection.time_window = int(
            os.getenv("QUANTUM_TIME_WINDOW", config.detection.time_window)
        )
        config.detection.confidence_threshold = float(
            os.getenv(
                "QUANTUM_CONFIDENCE_THRESHOLD", config.detection.confidence_threshold
            )
        )

        # Bitcoin configuration from environment
        config.bitcoin.node_url = os.getenv("BITCOIN_NODE_URL", config.bitcoin.node_url)
        config.bitcoin.rpc_user = os.getenv("BITCOIN_RPC_USER", config.bitcoin.rpc_user)
        config.bitcoin.rpc_password = os.getenv(
            "BITCOIN_RPC_PASSWORD", config.bitcoin.rpc_password
        )
        config.bitcoin.websocket_url = os.getenv(
            "BITCOIN_WEBSOCKET_URL", config.bitcoin.websocket_url
        )

        # Ethereum configuration from environment
        config.ethereum.provider_url = os.getenv(
            "ETHEREUM_PROVIDER_URL", config.ethereum.provider_url
        )
        config.ethereum.private_key = os.getenv(
            "ETHEREUM_PRIVATE_KEY", config.ethereum.private_key
        )

        # Environment settings
        config.environment = os.getenv("QUANTUM_ENV", config.environment)
        config.debug = os.getenv("QUANTUM_DEBUG", "false").lower() == "true"
        config.log_level = os.getenv("QUANTUM_LOG_LEVEL", config.log_level)

        return config

    def validate(self) -> bool:
        """Validate configuration settings."""
        try:
            # Validate detection parameters
            if self.detection.threshold <= 0:
                raise ConfigurationError("Detection threshold must be positive")

            if (
                self.detection.confidence_threshold < 0
                or self.detection.confidence_threshold > 1
            ):
                raise ConfigurationError("Confidence threshold must be between 0 and 1")

            # Validate blockchain connections
            if not self.bitcoin.node_url.startswith(("http://", "https://")):
                raise ConfigurationError("Bitcoin node URL must be a valid HTTP(S) URL")

            if not self.ethereum.provider_url.startswith(
                ("http://", "https://", "ws://", "wss://")
            ):
                raise ConfigurationError("Ethereum provider URL must be a valid URL")

            # Validate enterprise security settings
            if self.hsm_config.fips_compliance not in [
                "level-1",
                "level-2",
                "level-3",
                "level-4",
            ]:
                raise ConfigurationError("Invalid FIPS compliance level")

            if self.rbac_config.enforcement_mode not in [
                "strict",
                "permissive",
                "disabled",
            ]:
                raise ConfigurationError("Invalid RBAC enforcement mode")

            # Validate database configuration
            if not self.database_config.connection_string.startswith(
                ("postgresql://", "mysql://", "sqlite://")
            ):
                raise ConfigurationError("Invalid database connection string")

            return True

        except ConfigurationError:
            raise
        except Exception as e:
            raise ConfigurationError(f"Configuration validation failed: {e}")

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            "detection": self.detection.__dict__,
            "bitcoin": self.bitcoin.__dict__,
            "ethereum": self.ethereum.__dict__,
            "hsm_config": self.hsm_config.__dict__,
            "rbac_config": self.rbac_config.__dict__,
            "audit_config": self.audit_config.__dict__,
            "metrics_config": self.metrics_config.__dict__,
            "siem_config": self.siem_config.__dict__,
            "compliance_config": self.compliance_config.__dict__,
            "database_config": self.database_config.__dict__,
            "environment": self.environment,
            "debug": self.debug,
            "log_level": self.log_level,
        }

    def get(self, key: str, default: Any = None) -> Any:
        """
        Dictionary-style get method for compatibility.

        Args:
            key: Configuration key to retrieve
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        return getattr(self, key, default)

    @property
    def api(self):
        """Alias for api_config to maintain compatibility."""
        return self.api_config

    @property
    def websocket(self):
        """Alias for websocket_config to maintain compatibility."""
        return self.websocket_config

    @property
    def alerting(self):
        """Alias for alerting_config to maintain compatibility."""
        return self.alerting_config

    @property
    def dashboard(self):
        """Alias for dashboard_config to maintain compatibility."""
        return self.dashboard_config

    @property
    def ml(self):
        """Alias for ml_config to maintain compatibility."""
        return self.ml_config

    @property
    def networks(self):
        """Networks configuration dictionary."""
        # Return a dictionary with network configurations from YAML
        return getattr(
            self,
            "_networks",
            {
                "ethereum": {
                    "rpc_url": "http://localhost:8545",
                    "chain_id": 1,
                    "is_active": True,
                }
            },
        )

    @property
    def mempool_monitor(self):
        """Alias for mempool_monitor_config to maintain compatibility."""
        return self.mempool_monitor_config


class ConfigurationError(Exception):
    """Configuration-related errors."""


def load_config(config_path: Optional[str] = None) -> EnterpriseConfig:
    """
    Load enterprise configuration from file or environment.

    Args:
        config_path: Path to configuration file (optional)

    Returns:
        EnterpriseConfig: Loaded configuration
    """
    if config_path and Path(config_path).exists():
        config = EnterpriseConfig.from_yaml(config_path)
    else:
        config = EnterpriseConfig.from_env()

    # Validate configuration
    config.validate()

    return config


def get_default_config() -> EnterpriseConfig:
    """Get default enterprise configuration."""
    return EnterpriseConfig()
