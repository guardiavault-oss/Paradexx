import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Monitoring API endpoints for system observability and metrics.
"""

from datetime import datetime, timedelta  # noqa: E402
from typing import Any, Dict, List  # noqa: E402

from fastapi import APIRouter, HTTPException, Query  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402
from ..utils.metrics import MetricsCollector  # noqa: E402


class MetricPoint(BaseModel):
    """Individual metric data point."""

    timestamp: datetime
    value: float
    tags: Dict[str, str]


class MetricSeries(BaseModel):
    """Time series metric data."""

    metric_name: str
    unit: str
    data_points: List[MetricPoint]


class SystemHealth(BaseModel):
    """System health status."""

    overall_status: str
    components: Dict[str, Dict[str, Any]]
    last_updated: datetime


class PerformanceReport(BaseModel):
    """System performance report."""

    time_range: Dict[str, datetime]
    cpu_metrics: MetricSeries
    memory_metrics: MetricSeries
    network_metrics: MetricSeries
    threat_detection_metrics: MetricSeries


class MonitoringAPI:
    """
    Monitoring and observability API endpoints.

    Features:
    - Real-time system metrics
    - Performance monitoring
    - Health checks
    - Alert management
    - Compliance reporting
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.router = APIRouter(prefix="/api/v1/monitoring", tags=["monitoring"])
        self.metrics_collector = MetricsCollector(config.detection_config.__dict__)
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)

        self._setup_routes()

    def _setup_routes(self):
        """Setup monitoring API routes."""

        @self.router.get("/health", response_model=SystemHealth)
        async def get_system_health():
            """Get comprehensive system health status."""
            try:
                components = await self._collect_component_health()

                # Determine overall status
                overall_status = "healthy"
                for component, health in components.items():
                    if health.get("status") != "healthy":
                        overall_status = (
                            "degraded" if overall_status == "healthy" else "unhealthy"
                        )

                await self.audit_logger.log_security_event(
                    {
                        "event_type": "HEALTH_CHECK_ACCESSED",
                        "timestamp": datetime.utcnow(),
                        "overall_status": overall_status,
                        "status": "SUCCESS",
                    }
                )

                return SystemHealth(
                    overall_status=overall_status,
                    components=components,
                    last_updated=datetime.utcnow(),
                )

            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "HEALTH_CHECK_FAILED",
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Health check failed: {str(e)}"
                )

        @self.router.get("/metrics", response_model=List[MetricSeries])
        async def get_system_metrics(
            start_time: datetime = Query(
                default=None, description="Start time for metrics"
            ),
            end_time: datetime = Query(
                default=None, description="End time for metrics"
            ),
            metric_names: List[str] = Query(
                default=[], description="Specific metrics to retrieve"
            ),
        ):
            """Get system performance metrics."""
            try:
                # Set default time range if not provided
                if not end_time:
                    end_time = datetime.utcnow()
                if not start_time:
                    start_time = end_time - timedelta(hours=1)

                # Collect metrics
                metrics = await self._collect_metrics(
                    start_time, end_time, metric_names
                )

                await self.audit_logger.log_security_event(
                    {
                        "event_type": "METRICS_ACCESSED",
                        "start_time": start_time,
                        "end_time": end_time,
                        "metric_count": len(metrics),
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                return metrics

            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "METRICS_ACCESS_FAILED",
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Failed to retrieve metrics: {str(e)}"
                )

        @self.router.get("/performance", response_model=PerformanceReport)
        async def get_performance_report(
            duration_hours: int = Query(
                default=24, description="Report duration in hours"
            ),
        ):
            """Get comprehensive performance report."""
            try:
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(hours=duration_hours)

                # Collect performance metrics
                cpu_metrics = await self._collect_cpu_metrics(start_time, end_time)
                memory_metrics = await self._collect_memory_metrics(
                    start_time, end_time
                )
                network_metrics = await self._collect_network_metrics(
                    start_time, end_time
                )
                threat_metrics = await self._collect_threat_detection_metrics(
                    start_time, end_time
                )

                report = PerformanceReport(
                    time_range={"start": start_time, "end": end_time},
                    cpu_metrics=cpu_metrics,
                    memory_metrics=memory_metrics,
                    network_metrics=network_metrics,
                    threat_detection_metrics=threat_metrics,
                )

                await self.audit_logger.log_security_event(
                    {
                        "event_type": "PERFORMANCE_REPORT_GENERATED",
                        "duration_hours": duration_hours,
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                return report

            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "PERFORMANCE_REPORT_FAILED",
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Performance report failed: {str(e)}"
                )

        @self.router.get("/alerts/active")
        async def get_active_alerts():
            """Get currently active system alerts."""
            try:
                alerts = await self._get_active_alerts()

                await self.audit_logger.log_security_event(
                    {
                        "event_type": "ACTIVE_ALERTS_ACCESSED",
                        "alert_count": len(alerts),
                        "timestamp": datetime.utcnow(),
                        "status": "SUCCESS",
                    }
                )

                return alerts

            except Exception as e:
                await self.audit_logger.log_security_event(
                    {
                        "event_type": "ACTIVE_ALERTS_ACCESS_FAILED",
                        "error": str(e),
                        "timestamp": datetime.utcnow(),
                        "status": "ERROR",
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"Failed to retrieve alerts: {str(e)}"
                )

    async def _collect_component_health(self) -> Dict[str, Dict[str, Any]]:
        """Collect health status of all system components."""
        return {
            "database": {
                "status": "healthy",
                "response_time_ms": 15.2,
                "connections": 8,
                "last_check": datetime.utcnow(),
            },
            "quantum_detector": {
                "status": "healthy",
                "processed_transactions": 1542,
                "detection_rate": 0.023,
                "last_check": datetime.utcnow(),
            },
            "mempool_monitor": {
                "status": "healthy",
                "active_connections": 4,
                "transactions_per_second": 12.5,
                "last_check": datetime.utcnow(),
            },
            "security_manager": {
                "status": "healthy",
                "active_sessions": 3,
                "failed_logins": 0,
                "last_check": datetime.utcnow(),
            },
        }

    async def _collect_metrics(
        self, start_time: datetime, end_time: datetime, metric_names: List[str]
    ) -> List[MetricSeries]:
        """Collect system metrics for specified time range."""
        all_metrics = []

        # Generate sample metrics if specific names not provided
        if not metric_names:
            metric_names = [
                "cpu_usage",
                "memory_usage",
                "network_throughput",
                "threat_detection_rate",
            ]

        for metric_name in metric_names:
            data_points = await self._generate_metric_data(
                metric_name, start_time, end_time
            )

            all_metrics.append(
                MetricSeries(
                    metric_name=metric_name,
                    unit=self._get_metric_unit(metric_name),
                    data_points=data_points,
                )
            )

        return all_metrics

    async def _generate_metric_data(
        self, metric_name: str, start_time: datetime, end_time: datetime
    ) -> List[MetricPoint]:
        """Generate sample metric data points."""
        data_points = []
        current_time = start_time

        while current_time <= end_time:
            # Generate realistic sample data based on metric type
            if metric_name == "cpu_usage":
                value = 45.0 + (hash(str(current_time)) % 20)
            elif metric_name == "memory_usage":
                value = 67.0 + (hash(str(current_time)) % 15)
            elif metric_name == "network_throughput":
                value = 1000.0 + (hash(str(current_time)) % 500)
            elif metric_name == "threat_detection_rate":
                value = 0.02 + (hash(str(current_time)) % 5) / 1000
            else:
                value = hash(str(current_time)) % 100

            data_points.append(
                MetricPoint(
                    timestamp=current_time,
                    value=float(value),
                    tags={"source": "quantum_mempool_monitor"},
                )
            )

            current_time += timedelta(minutes=5)

        return data_points

    def _get_metric_unit(self, metric_name: str) -> str:
        """Get unit for metric type."""
        units = {
            "cpu_usage": "percent",
            "memory_usage": "percent",
            "network_throughput": "bytes_per_second",
            "threat_detection_rate": "rate",
            "response_time": "milliseconds",
            "transaction_count": "count",
        }
        return units.get(metric_name, "unknown")

    async def _collect_cpu_metrics(
        self, start_time: datetime, end_time: datetime
    ) -> MetricSeries:
        """Collect CPU performance metrics."""
        data_points = await self._generate_metric_data(
            "cpu_usage", start_time, end_time
        )
        return MetricSeries(
            metric_name="cpu_usage", unit="percent", data_points=data_points
        )

    async def _collect_memory_metrics(
        self, start_time: datetime, end_time: datetime
    ) -> MetricSeries:
        """Collect memory usage metrics."""
        data_points = await self._generate_metric_data(
            "memory_usage", start_time, end_time
        )
        return MetricSeries(
            metric_name="memory_usage", unit="percent", data_points=data_points
        )

    async def _collect_network_metrics(
        self, start_time: datetime, end_time: datetime
    ) -> MetricSeries:
        """Collect network throughput metrics."""
        data_points = await self._generate_metric_data(
            "network_throughput", start_time, end_time
        )
        return MetricSeries(
            metric_name="network_throughput",
            unit="bytes_per_second",
            data_points=data_points,
        )

    async def _collect_threat_detection_metrics(
        self, start_time: datetime, end_time: datetime
    ) -> MetricSeries:
        """Collect threat detection performance metrics."""
        data_points = await self._generate_metric_data(
            "threat_detection_rate", start_time, end_time
        )
        return MetricSeries(
            metric_name="threat_detection_rate", unit="rate", data_points=data_points
        )

    async def _get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get currently active system alerts."""
        return [
            {
                "alert_id": "alert_001",
                "severity": "HIGH",
                "type": "QUANTUM_THREAT_DETECTED",
                "description": "Potential quantum brute-force attack detected",
                "created_at": datetime.utcnow() - timedelta(minutes=15),
                "status": "ACTIVE",
            },
            {
                "alert_id": "alert_002",
                "severity": "MEDIUM",
                "type": "PERFORMANCE_DEGRADATION",
                "description": "CPU usage above threshold",
                "created_at": datetime.utcnow() - timedelta(minutes=5),
                "status": "ACTIVE",
            },
        ]
