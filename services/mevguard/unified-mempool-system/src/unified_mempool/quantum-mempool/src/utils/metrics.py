"""
Enterprise metrics collection and monitoring integration.
"""

import threading
import time
from collections import defaultdict, deque
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from prometheus_client import (
        CollectorRegistry,
        Counter,
        Gauge,
        Histogram,
        Summary,
        start_http_server,
    )

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False


class MetricsCollector:
    """
    Enterprise-grade metrics collection with Prometheus integration.

    Features:
    - Prometheus metrics export
    - Custom metric registration
    - Time-series data collection
    - Alerting integration
    - Performance monitoring
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.enabled = self.config.get("enabled", True)
        self.prometheus_enabled = (
            self.config.get("prometheus_enabled", True) and PROMETHEUS_AVAILABLE
        )
        self.collection_interval = self.config.get("collection_interval", 60)

        # Metrics storage
        self.counters: Dict[str, int] = defaultdict(int)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.timers: Dict[str, List[float]] = defaultdict(list)

        # Prometheus metrics
        if self.prometheus_enabled:
            self.registry = CollectorRegistry()
            self.prom_counters: Dict[str, Counter] = {}
            self.prom_gauges: Dict[str, Gauge] = {}
            self.prom_histograms: Dict[str, Histogram] = {}
            self.prom_summaries: Dict[str, Summary] = {}

        # Threading
        self.lock = threading.Lock()
        self.running = False
        self.collection_thread = None

    def start_collection(self):
        """Start metrics collection and Prometheus server."""
        if not self.enabled:
            return

        self.running = True

        # Start Prometheus HTTP server
        if self.prometheus_enabled:
            port = self.config.get("prometheus_port", 9090)
            try:
                start_http_server(port, registry=self.registry)
                print(f"Prometheus metrics server started on port {port}")
            except Exception as e:
                print(f"Failed to start Prometheus server: {e}")

        # Start collection thread
        self.collection_thread = threading.Thread(target=self._collection_loop)
        self.collection_thread.daemon = True
        self.collection_thread.start()

    def stop_collection(self):
        """Stop metrics collection."""
        self.running = False
        if self.collection_thread:
            self.collection_thread.join(timeout=5)

    def _collection_loop(self):
        """Main metrics collection loop."""
        while self.running:
            try:
                self._collect_system_metrics()
                time.sleep(self.collection_interval)
            except Exception as e:
                print(f"Metrics collection error: {e}")
                time.sleep(self.collection_interval)

    def _collect_system_metrics(self):
        """Collect system-level metrics."""
        # Collect basic system metrics
        timestamp = time.time()

        with self.lock:
            # Update system gauges
            self.set_gauge("system_timestamp", timestamp)
            self.set_gauge("metrics_collection_active", 1.0 if self.running else 0.0)

    def increment_counter(
        self, name: str, value: int = 1, labels: Optional[Dict[str, str]] = None
    ):
        """Increment a counter metric."""
        if not self.enabled:
            return

        with self.lock:
            self.counters[name] += value

            # Update Prometheus counter
            if self.prometheus_enabled and name in self.prom_counters:
                if labels:
                    self.prom_counters[name].labels(**labels).inc(value)
                else:
                    self.prom_counters[name].inc(value)

    def set_gauge(
        self, name: str, value: float, labels: Optional[Dict[str, str]] = None
    ):
        """Set a gauge metric value."""
        if not self.enabled:
            return

        with self.lock:
            self.gauges[name] = value

            # Update Prometheus gauge
            if self.prometheus_enabled and name in self.prom_gauges:
                if labels:
                    self.prom_gauges[name].labels(**labels).set(value)
                else:
                    self.prom_gauges[name].set(value)

    def observe_histogram(
        self, name: str, value: float, labels: Optional[Dict[str, str]] = None
    ):
        """Observe a value for histogram metric."""
        if not self.enabled:
            return

        with self.lock:
            self.histograms[name].append(value)

            # Update Prometheus histogram
            if self.prometheus_enabled and name in self.prom_histograms:
                if labels:
                    self.prom_histograms[name].labels(**labels).observe(value)
                else:
                    self.prom_histograms[name].observe(value)

    def time_operation(self, name: str, labels: Optional[Dict[str, str]] = None):
        """Context manager for timing operations."""
        return TimingContext(self, name, labels)

    def record_timing(
        self, name: str, duration: float, labels: Optional[Dict[str, str]] = None
    ):
        """Record timing for an operation."""
        if not self.enabled:
            return

        with self.lock:
            self.timers[name].append(duration)

            # Keep only recent timings
            if len(self.timers[name]) > 1000:
                self.timers[name] = self.timers[name][-1000:]

            # Update Prometheus summary
            if self.prometheus_enabled and name in self.prom_summaries:
                if labels:
                    self.prom_summaries[name].labels(**labels).observe(duration)
                else:
                    self.prom_summaries[name].observe(duration)

    def register_counter(
        self, name: str, description: str, labels: Optional[List[str]] = None
    ):
        """Register a new counter metric."""
        if not self.enabled:
            return

        with self.lock:
            if name not in self.counters:
                self.counters[name] = 0

            # Register Prometheus counter
            if self.prometheus_enabled and name not in self.prom_counters:
                self.prom_counters[name] = Counter(
                    name, description, labelnames=labels or [], registry=self.registry
                )

    def register_gauge(
        self, name: str, description: str, labels: Optional[List[str]] = None
    ):
        """Register a new gauge metric."""
        if not self.enabled:
            return

        with self.lock:
            if name not in self.gauges:
                self.gauges[name] = 0.0

            # Register Prometheus gauge
            if self.prometheus_enabled and name not in self.prom_gauges:
                self.prom_gauges[name] = Gauge(
                    name, description, labelnames=labels or [], registry=self.registry
                )

    def register_histogram(
        self,
        name: str,
        description: str,
        buckets: Optional[List[float]] = None,
        labels: Optional[List[str]] = None,
    ):
        """Register a new histogram metric."""
        if not self.enabled:
            return

        with self.lock:
            if name not in self.histograms:
                self.histograms[name] = deque(maxlen=1000)

            # Register Prometheus histogram
            if self.prometheus_enabled and name not in self.prom_histograms:
                self.prom_histograms[name] = Histogram(
                    name,
                    description,
                    buckets=buckets,
                    labelnames=labels or [],
                    registry=self.registry,
                )

    def register_summary(
        self, name: str, description: str, labels: Optional[List[str]] = None
    ):
        """Register a new summary metric."""
        if not self.enabled:
            return

        with self.lock:
            if name not in self.timers:
                self.timers[name] = []

            # Register Prometheus summary
            if self.prometheus_enabled and name not in self.prom_summaries:
                self.prom_summaries[name] = Summary(
                    name, description, labelnames=labels or [], registry=self.registry
                )

    def get_counter(self, name: str) -> int:
        """Get counter value."""
        with self.lock:
            return self.counters.get(name, 0)

    def get_gauge(self, name: str) -> float:
        """Get gauge value."""
        with self.lock:
            return self.gauges.get(name, 0.0)

    def get_histogram_stats(self, name: str) -> Dict[str, float]:
        """Get histogram statistics."""
        with self.lock:
            values = list(self.histograms.get(name, []))

            if not values:
                return {}

            import statistics

            return {
                "count": len(values),
                "mean": statistics.mean(values),
                "median": statistics.median(values),
                "min": min(values),
                "max": max(values),
                "std_dev": statistics.stdev(values) if len(values) > 1 else 0.0,
            }

    def get_timing_stats(self, name: str) -> Dict[str, float]:
        """Get timing statistics."""
        with self.lock:
            timings = self.timers.get(name, [])

            if not timings:
                return {}

            import statistics

            return {
                "count": len(timings),
                "mean": statistics.mean(timings),
                "median": statistics.median(timings),
                "min": min(timings),
                "max": max(timings),
                "p95": (
                    statistics.quantiles(timings, n=20)[18]
                    if len(timings) >= 20
                    else max(timings)
                ),
                "p99": (
                    statistics.quantiles(timings, n=100)[98]
                    if len(timings) >= 100
                    else max(timings)
                ),
            }

    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics."""
        with self.lock:
            return {
                "counters": dict(self.counters),
                "gauges": dict(self.gauges),
                "histograms": {
                    name: list(values) for name, values in self.histograms.items()
                },
                "timers": dict(self.timers),
                "timestamp": datetime.utcnow().isoformat(),
                "collection_active": self.running,
            }

    def reset_metrics(self):
        """Reset all metrics."""
        with self.lock:
            self.counters.clear()
            self.gauges.clear()
            self.histograms.clear()
            self.timers.clear()


class TimingContext:
    """Context manager for timing operations."""

    def __init__(
        self,
        metrics_collector: MetricsCollector,
        name: str,
        labels: Optional[Dict[str, str]] = None,
    ):
        self.metrics_collector = metrics_collector
        self.name = name
        self.labels = labels
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is not None:
            duration = time.time() - self.start_time
            self.metrics_collector.record_timing(self.name, duration, self.labels)


# Singleton instance for global metrics collection
_global_metrics_collector = None


def get_metrics_collector() -> MetricsCollector:
    """Get global metrics collector instance."""
    global _global_metrics_collector
    if _global_metrics_collector is None:
        _global_metrics_collector = MetricsCollector()
    return _global_metrics_collector


def initialize_metrics(config: Optional[Dict[str, Any]] = None):
    """Initialize global metrics collector."""
    global _global_metrics_collector
    _global_metrics_collector = MetricsCollector(config)
    return _global_metrics_collector
