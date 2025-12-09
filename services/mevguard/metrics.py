"""
MEV Protection Service Metrics
Provides Prometheus metrics for MEV protection monitoring
"""

import logging
import time

from prometheus_client import Counter, Gauge, Histogram, start_http_server

logger = logging.getLogger(__name__)

# MEV Protection Metrics
mev_saved_usd_total = Counter(
    "mev_protection_savings_usd_total",
    "Total USD value saved through MEV protection",
    ["service", "network", "protection_type"],
)

private_orderflow_ratio = Gauge(
    "private_orderflow_ratio",
    "Ratio of private orderflow to total orderflow",
    ["service", "network"],
)

mev_attack_attempts_total = Counter(
    "mev_attack_attempts_total",
    "Total number of MEV attack attempts detected",
    ["attack_type", "severity", "network"],
)

mev_attack_prevented_total = Counter(
    "mev_attack_prevented_total",
    "Total number of MEV attacks prevented",
    ["attack_type", "severity", "network"],
)

mev_protection_cost_usd = Counter(
    "mev_protection_cost_usd_total",
    "Total cost of MEV protection in USD",
    ["service", "network", "cost_type"],
)

mev_protection_duration_seconds = Histogram(
    "mev_protection_duration_seconds",
    "Time spent on MEV protection operations",
    ["service", "operation_type"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

mev_protection_requests_total = Counter(
    "mev_protection_requests_total",
    "Total number of MEV protection requests",
    ["service", "network", "status"],
)

mev_protection_errors_total = Counter(
    "mev_protection_errors_total",
    "Total number of MEV protection errors",
    ["service", "network", "error_type"],
)

# Specific attack type metrics
sandwich_attack_attempts_total = Counter(
    "sandwich_attack_attempts_total",
    "Total number of sandwich attack attempts",
    ["network", "severity"],
)

frontrunning_attempts_total = Counter(
    "frontrunning_attempts_total", "Total number of frontrunning attempts", ["network", "severity"]
)

backrunning_attempts_total = Counter(
    "backrunning_attempts_total", "Total number of backrunning attempts", ["network", "severity"]
)

# Transaction metrics
total_transactions = Counter(
    "total_transactions_total",
    "Total number of transactions processed",
    ["network", "transaction_type"],
)

private_transactions_total = Counter(
    "private_transactions_total",
    "Total number of private transactions",
    ["network", "privacy_level"],
)

# Gas optimization metrics
gas_savings_gwei = Counter(
    "gas_savings_gwei_total", "Total gas saved in Gwei", ["service", "network", "optimization_type"]
)

gas_optimization_efficiency = Gauge(
    "gas_optimization_efficiency", "Gas optimization efficiency percentage", ["service", "network"]
)

# Network health metrics
network_health_score = Gauge("network_health_score", "Network health score (0-100)", ["network"])

network_latency_seconds = Histogram(
    "network_latency_seconds",
    "Network latency in seconds",
    ["network", "operation_type"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# MEV protection efficiency metrics
mev_protection_efficiency = Gauge(
    "mev_protection_efficiency", "MEV protection efficiency percentage", ["service", "network"]
)

mev_protection_roi = Gauge(
    "mev_protection_roi", "MEV protection return on investment", ["service", "network"]
)

# Alert thresholds
high_mev_activity_threshold = Gauge(
    "high_mev_activity_threshold", "Threshold for high MEV activity alerts", ["network"]
)

mev_protection_coverage = Gauge(
    "mev_protection_coverage",
    "Percentage of transactions protected from MEV",
    ["service", "network"],
)


class MEVProtectionMetrics:
    """MEV Protection Metrics Manager"""

    def __init__(self, service_name: str = "mev-protection-service"):
        self.service_name = service_name
        self.start_time = time.time()

    def record_mev_savings(self, amount_usd: float, network: str, protection_type: str):
        """Record MEV savings in USD"""
        mev_saved_usd_total.labels(
            service=self.service_name, network=network, protection_type=protection_type
        ).inc(amount_usd)

    def record_private_orderflow(self, private_count: int, total_count: int, network: str):
        """Record private orderflow ratio"""
        if total_count > 0:
            ratio = private_count / total_count
            private_orderflow_ratio.labels(service=self.service_name, network=network).set(ratio)

    def record_attack_attempt(self, attack_type: str, severity: str, network: str):
        """Record MEV attack attempt"""
        mev_attack_attempts_total.labels(
            attack_type=attack_type, severity=severity, network=network
        ).inc()

        # Record specific attack types
        if attack_type == "sandwich":
            sandwich_attack_attempts_total.labels(network=network, severity=severity).inc()
        elif attack_type == "frontrunning":
            frontrunning_attempts_total.labels(network=network, severity=severity).inc()
        elif attack_type == "backrunning":
            backrunning_attempts_total.labels(network=network, severity=severity).inc()

    def record_attack_prevented(self, attack_type: str, severity: str, network: str):
        """Record prevented MEV attack"""
        mev_attack_prevented_total.labels(
            attack_type=attack_type, severity=severity, network=network
        ).inc()

    def record_protection_cost(self, cost_usd: float, network: str, cost_type: str):
        """Record MEV protection cost"""
        mev_protection_cost_usd.labels(
            service=self.service_name, network=network, cost_type=cost_type
        ).inc(cost_usd)

    def record_protection_duration(self, duration_seconds: float, operation_type: str):
        """Record MEV protection operation duration"""
        mev_protection_duration_seconds.labels(
            service=self.service_name, operation_type=operation_type
        ).observe(duration_seconds)

    def record_protection_request(self, network: str, status: str):
        """Record MEV protection request"""
        mev_protection_requests_total.labels(
            service=self.service_name, network=network, status=status
        ).inc()

    def record_protection_error(self, network: str, error_type: str):
        """Record MEV protection error"""
        mev_protection_errors_total.labels(
            service=self.service_name, network=network, error_type=error_type
        ).inc()

    def record_transaction(self, network: str, transaction_type: str, is_private: bool = False):
        """Record transaction processing"""
        total_transactions.labels(network=network, transaction_type=transaction_type).inc()

        if is_private:
            private_transactions_total.labels(network=network, privacy_level="high").inc()

    def record_gas_savings(self, gas_saved_gwei: int, network: str, optimization_type: str):
        """Record gas savings"""
        gas_savings_gwei.labels(
            service=self.service_name, network=network, optimization_type=optimization_type
        ).inc(gas_saved_gwei)

    def update_gas_optimization_efficiency(self, efficiency_percent: float, network: str):
        """Update gas optimization efficiency"""
        gas_optimization_efficiency.labels(service=self.service_name, network=network).set(
            efficiency_percent
        )

    def update_network_health(self, network: str, health_score: float):
        """Update network health score"""
        network_health_score.labels(network=network).set(health_score)

    def record_network_latency(self, network: str, operation_type: str, latency_seconds: float):
        """Record network latency"""
        network_latency_seconds.labels(network=network, operation_type=operation_type).observe(
            latency_seconds
        )

    def update_mev_protection_efficiency(self, efficiency_percent: float, network: str):
        """Update MEV protection efficiency"""
        mev_protection_efficiency.labels(service=self.service_name, network=network).set(
            efficiency_percent
        )

    def update_mev_protection_roi(self, roi_percent: float, network: str):
        """Update MEV protection ROI"""
        mev_protection_roi.labels(service=self.service_name, network=network).set(roi_percent)

    def update_protection_coverage(self, coverage_percent: float, network: str):
        """Update MEV protection coverage"""
        mev_protection_coverage.labels(service=self.service_name, network=network).set(
            coverage_percent
        )

    def set_high_mev_activity_threshold(self, network: str, threshold: float):
        """Set high MEV activity threshold"""
        high_mev_activity_threshold.labels(network=network).set(threshold)

    def calculate_efficiency_metrics(self, network: str):
        """Calculate and update efficiency metrics"""
        # This would calculate efficiency based on savings vs costs
        # For now, we'll set placeholder values
        self.update_mev_protection_efficiency(85.5, network)
        self.update_mev_protection_roi(320.0, network)
        self.update_protection_coverage(92.3, network)

    def start_metrics_server(self, port: int = 8000):
        """Start Prometheus metrics server"""
        start_http_server(port)
        logger.info(f"MEV Protection metrics server started on port {port}")


# Global metrics instance
metrics = MEVProtectionMetrics()


# Example usage functions
def record_sandwich_attack_prevention(amount_saved_usd: float, network: str):
    """Record sandwich attack prevention"""
    metrics.record_mev_savings(amount_saved_usd, network, "sandwich_prevention")
    metrics.record_attack_prevented("sandwich", "high", network)


def record_frontrunning_prevention(amount_saved_usd: float, network: str):
    """Record frontrunning prevention"""
    metrics.record_mev_savings(amount_saved_usd, network, "frontrunning_prevention")
    metrics.record_attack_prevented("frontrunning", "medium", network)


def record_backrunning_prevention(amount_saved_usd: float, network: str):
    """Record backrunning prevention"""
    metrics.record_mev_savings(amount_saved_usd, network, "backrunning_prevention")
    metrics.record_attack_prevented("backrunning", "low", network)


def record_private_transaction(network: str):
    """Record private transaction"""
    metrics.record_transaction(network, "private", is_private=True)


def record_public_transaction(network: str):
    """Record public transaction"""
    metrics.record_transaction(network, "public", is_private=False)
