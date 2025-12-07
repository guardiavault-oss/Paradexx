#!/usr/bin/env python3
"""
Liveness Monitor - Network health monitoring and liveness gap detection
"""

import asyncio
import logging
import statistics
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)


class NetworkStatus(str, Enum):
    """Network status types"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    DOWN = "down"
    UNKNOWN = "unknown"


class LivenessIssue(str, Enum):
    """Types of liveness issues"""

    RPC_UNAVAILABLE = "rpc_unavailable"
    HIGH_LATENCY = "high_latency"
    BLOCK_STALL = "block_stall"
    VALIDATOR_OFFLINE = "validator_offline"
    BRIDGE_UNRESPONSIVE = "bridge_unresponsive"
    CROSS_CHAIN_DELAY = "cross_chain_delay"
    QUORUM_LOSS = "quorum_loss"
    NETWORK_PARTITION = "network_partition"


@dataclass
class NetworkHealth:
    """Network health metrics"""

    network: str
    status: NetworkStatus
    timestamp: datetime
    response_time: float
    block_height: int
    block_time: float
    active_validators: int
    total_validators: int
    health_score: float
    issues: list[LivenessIssue]
    metrics: dict[str, Any]


@dataclass
class LivenessGap:
    """Liveness gap detection result"""

    gap_id: str
    network: str
    issue_type: LivenessIssue
    start_time: datetime
    end_time: datetime | None
    duration: float
    severity: str
    description: str
    affected_components: list[str]
    resolution_actions: list[str]
    metrics: dict[str, Any]


@dataclass
class ValidatorLiveness:
    """Validator liveness tracking"""

    validator_address: str
    network: str
    is_online: bool
    last_seen: datetime
    response_time_avg: float
    uptime_percentage: float
    consecutive_failures: int
    health_score: float
    issues: list[LivenessIssue]


class LivenessMonitor:
    """Comprehensive liveness monitoring and gap detection system"""

    def __init__(self):
        self.network_health: dict[str, NetworkHealth] = {}
        self.validator_liveness: dict[str, ValidatorLiveness] = {}
        self.liveness_gaps: list[LivenessGap] = []
        self.health_history: dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.rpc_endpoints: dict[str, list[str]] = {}
        self.monitoring_config: dict[str, Any] = {}

        # Configuration
        self.health_thresholds = {
            "response_time_max": 5.0,  # seconds
            "block_time_max": 30.0,  # seconds
            "uptime_min": 0.95,  # 95%
            "consecutive_failures_max": 3,
            "health_score_min": 0.7,
        }

        self.monitoring_intervals = {
            "network_check": 30,  # seconds
            "validator_check": 60,  # seconds
            "health_analysis": 300,  # 5 minutes
            "gap_detection": 60,  # 1 minute
        }

        logger.info("LivenessMonitor initialized")

    async def initialize_networks(self, networks: list[dict[str, Any]]):
        """Initialize monitoring for networks"""
        for network_config in networks:
            network_name = network_config["name"]
            self.rpc_endpoints[network_name] = network_config.get("rpc_endpoints", [])
            self.monitoring_config[network_name] = network_config.get("monitoring", {})

            # Initialize network health
            self.network_health[network_name] = NetworkHealth(
                network=network_name,
                status=NetworkStatus.UNKNOWN,
                timestamp=datetime.utcnow(),
                response_time=0.0,
                block_height=0,
                block_time=0.0,
                active_validators=0,
                total_validators=0,
                health_score=0.0,
                issues=[],
                metrics={},
            )

            logger.info(f"Initialized monitoring for network: {network_name}")

    async def start_monitoring(self):
        """Start continuous monitoring"""
        logger.info("Starting liveness monitoring")

        # Start monitoring tasks
        tasks = [
            asyncio.create_task(self._monitor_networks()),
            asyncio.create_task(self._monitor_validators()),
            asyncio.create_task(self._detect_liveness_gaps()),
            asyncio.create_task(self._analyze_health_trends()),
        ]

        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Monitoring error: {e}")

    async def _monitor_networks(self):
        """Monitor network health continuously"""
        while True:
            try:
                for network in self.network_health.keys():
                    await self._check_network_health(network)
                await asyncio.sleep(self.monitoring_intervals["network_check"])
            except Exception as e:
                logger.error(f"Network monitoring error: {e}")
                await asyncio.sleep(10)

    async def _monitor_validators(self):
        """Monitor validator liveness continuously"""
        while True:
            try:
                for validator_address in self.validator_liveness.keys():
                    await self._check_validator_liveness(validator_address)
                await asyncio.sleep(self.monitoring_intervals["validator_check"])
            except Exception as e:
                logger.error(f"Validator monitoring error: {e}")
                await asyncio.sleep(10)

    async def _detect_liveness_gaps(self):
        """Detect liveness gaps continuously"""
        while True:
            try:
                await self._analyze_liveness_gaps()
                await asyncio.sleep(self.monitoring_intervals["gap_detection"])
            except Exception as e:
                logger.error(f"Gap detection error: {e}")
                await asyncio.sleep(10)

    async def _analyze_health_trends(self):
        """Analyze health trends and patterns"""
        while True:
            try:
                await self._update_health_scores()
                await asyncio.sleep(self.monitoring_intervals["health_analysis"])
            except Exception as e:
                logger.error(f"Health analysis error: {e}")
                await asyncio.sleep(10)

    async def _check_network_health(self, network: str):
        """Check health of a specific network"""
        logger.debug(f"Checking health for network: {network}")

        try:
            # Get RPC endpoints for network
            endpoints = self.rpc_endpoints.get(network, [])
            if not endpoints:
                logger.warning(f"No RPC endpoints configured for network: {network}")
                return

            # Test each endpoint
            best_endpoint = None
            best_response_time = float("inf")
            network_data = None

            for endpoint in endpoints:
                try:
                    response_time, data = await self._test_rpc_endpoint(endpoint)
                    if response_time < best_response_time:
                        best_response_time = response_time
                        best_endpoint = endpoint
                        network_data = data
                except Exception as e:
                    logger.debug(f"RPC endpoint {endpoint} failed: {e}")
                    continue

            if network_data is None:
                # All endpoints failed
                await self._update_network_status(network, NetworkStatus.DOWN, [], 0.0)
                return

            # Analyze network data
            issues = await self._analyze_network_issues(network, network_data, best_response_time)
            health_score = await self._calculate_network_health_score(
                network_data, best_response_time, issues
            )

            # Update network health
            await self._update_network_status(network, NetworkStatus.HEALTHY, issues, health_score)

            # Store health data
            health_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "response_time": best_response_time,
                "block_height": network_data.get("block_height", 0),
                "block_time": network_data.get("block_time", 0),
                "health_score": health_score,
                "issues": [issue.value for issue in issues],
            }
            self.health_history[network].append(health_data)

        except Exception as e:
            logger.error(f"Error checking network health for {network}: {e}")
            await self._update_network_status(
                network, NetworkStatus.UNKNOWN, [LivenessIssue.RPC_UNAVAILABLE], 0.0
            )

    async def _test_rpc_endpoint(self, endpoint: str) -> tuple[float, dict[str, Any]]:
        """Test an RPC endpoint and return response time and data"""
        start_time = time.time()

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            # Test basic connectivity
            response = await session.post(
                endpoint,
                json={"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1},
            )

            if response.status != 200:
                raise Exception(f"HTTP {response.status}")

            data = await response.json()
            if "error" in data:
                raise Exception(f"RPC error: {data['error']}")

            response_time = time.time() - start_time

            # Get additional network data
            block_height = int(data["result"], 16)

            # Get block time
            block_response = await session.post(
                endpoint,
                json={
                    "jsonrpc": "2.0",
                    "method": "eth_getBlockByNumber",
                    "params": [hex(block_height), False],
                    "id": 2,
                },
            )

            block_data = await block_response.json()
            block_timestamp = (
                int(block_data["result"]["timestamp"], 16) if "result" in block_data else 0
            )

            return response_time, {
                "block_height": block_height,
                "block_time": block_timestamp,
                "response_time": response_time,
                "endpoint": endpoint,
            }

    async def _analyze_network_issues(
        self, network: str, network_data: dict[str, Any], response_time: float
    ) -> list[LivenessIssue]:
        """Analyze network data for liveness issues"""
        issues = []

        # Check response time
        if response_time > self.health_thresholds["response_time_max"]:
            issues.append(LivenessIssue.HIGH_LATENCY)

        # Check block time (simplified - in production, compare with previous blocks)
        current_time = int(time.time())
        block_time = network_data.get("block_time", 0)
        if block_time > 0:
            time_diff = current_time - block_time
            if time_diff > self.health_thresholds["block_time_max"]:
                issues.append(LivenessIssue.BLOCK_STALL)

        # Check for RPC availability issues
        if response_time == 0 or network_data.get("block_height", 0) == 0:
            issues.append(LivenessIssue.RPC_UNAVAILABLE)

        return issues

    async def _calculate_network_health_score(
        self, network_data: dict[str, Any], response_time: float, issues: list[LivenessIssue]
    ) -> float:
        """Calculate overall network health score"""
        score = 1.0

        # Response time penalty
        if response_time > self.health_thresholds["response_time_max"]:
            score -= 0.3

        # Issue penalties
        for issue in issues:
            if issue == LivenessIssue.RPC_UNAVAILABLE:
                score -= 0.5
            elif issue == LivenessIssue.BLOCK_STALL:
                score -= 0.4
            elif issue == LivenessIssue.HIGH_LATENCY:
                score -= 0.2

        return max(0.0, min(1.0, score))

    async def _update_network_status(
        self, network: str, status: NetworkStatus, issues: list[LivenessIssue], health_score: float
    ):
        """Update network status"""
        if network in self.network_health:
            self.network_health[network].status = status
            self.network_health[network].timestamp = datetime.utcnow()
            self.network_health[network].issues = issues
            self.network_health[network].health_score = health_score

    async def _check_validator_liveness(self, validator_address: str):
        """Check liveness of a specific validator"""
        if validator_address not in self.validator_liveness:
            return

        validator = self.validator_liveness[validator_address]

        try:
            # Simulate validator check (in production, this would be actual validator monitoring)
            is_online = await self._test_validator_online(validator_address)
            response_time = await self._test_validator_response_time(validator_address)

            # Update validator status
            validator.is_online = is_online
            validator.last_seen = datetime.utcnow()

            if is_online:
                validator.consecutive_failures = 0
                # Update response time average
                if validator.response_time_avg == 0:
                    validator.response_time_avg = response_time
                else:
                    validator.response_time_avg = (validator.response_time_avg + response_time) / 2
            else:
                validator.consecutive_failures += 1

            # Calculate uptime percentage
            validator.uptime_percentage = await self._calculate_uptime_percentage(validator_address)

            # Calculate health score
            validator.health_score = await self._calculate_validator_health_score(validator)

            # Check for issues
            validator.issues = await self._analyze_validator_issues(validator)

        except Exception as e:
            logger.error(f"Error checking validator {validator_address}: {e}")
            validator.is_online = False
            validator.consecutive_failures += 1

    async def _test_validator_online(self, validator_address: str) -> bool:
        """Test if validator is online (simplified)"""
        # In production, this would check actual validator status
        # For now, simulate with some randomness
        import random

        return random.random() > 0.1  # 90% uptime simulation

    async def _test_validator_response_time(self, validator_address: str) -> float:
        """Test validator response time (simplified)"""
        # In production, this would measure actual response time
        import random

        return random.uniform(0.1, 2.0)  # 0.1-2.0 seconds

    async def _calculate_uptime_percentage(self, validator_address: str) -> float:
        """Calculate validator uptime percentage"""
        # In production, this would calculate based on historical data
        import random

        return random.uniform(0.8, 1.0)  # 80-100% uptime

    async def _calculate_validator_health_score(self, validator: ValidatorLiveness) -> float:
        """Calculate validator health score"""
        score = 1.0

        if not validator.is_online:
            score -= 0.5

        if validator.consecutive_failures > self.health_thresholds["consecutive_failures_max"]:
            score -= 0.3

        if validator.uptime_percentage < self.health_thresholds["uptime_min"]:
            score -= 0.2

        if validator.response_time_avg > 5.0:  # 5 seconds
            score -= 0.1

        return max(0.0, min(1.0, score))

    async def _analyze_validator_issues(self, validator: ValidatorLiveness) -> list[LivenessIssue]:
        """Analyze validator for liveness issues"""
        issues = []

        if not validator.is_online:
            issues.append(LivenessIssue.VALIDATOR_OFFLINE)

        if validator.consecutive_failures > self.health_thresholds["consecutive_failures_max"]:
            issues.append(LivenessIssue.VALIDATOR_OFFLINE)

        if validator.uptime_percentage < self.health_thresholds["uptime_min"]:
            issues.append(LivenessIssue.VALIDATOR_OFFLINE)

        return issues

    async def _analyze_liveness_gaps(self):
        """Analyze for liveness gaps across all monitored components"""
        current_time = datetime.utcnow()

        # Check network gaps
        for network, health in self.network_health.items():
            if health.status in [NetworkStatus.DOWN, NetworkStatus.UNHEALTHY]:
                await self._detect_network_gap(network, health)

        # Check validator gaps
        for validator_address, validator in self.validator_liveness.items():
            if (
                not validator.is_online
                or validator.health_score < self.health_thresholds["health_score_min"]
            ):
                await self._detect_validator_gap(validator_address, validator)

    async def _detect_network_gap(self, network: str, health: NetworkHealth):
        """Detect liveness gap for a network"""
        # Check if gap already exists
        existing_gap = None
        for gap in self.liveness_gaps:
            if (
                gap.network == network
                and gap.issue_type in [LivenessIssue.RPC_UNAVAILABLE, LivenessIssue.BLOCK_STALL]
                and gap.end_time is None
            ):
                existing_gap = gap
                break

        if existing_gap:
            # Update existing gap
            existing_gap.duration = (current_time - existing_gap.start_time).total_seconds()
        else:
            # Create new gap
            gap = LivenessGap(
                gap_id=f"network_{network}_{current_time.strftime('%Y%m%d_%H%M%S')}",
                network=network,
                issue_type=(
                    LivenessIssue.RPC_UNAVAILABLE
                    if health.status == NetworkStatus.DOWN
                    else LivenessIssue.BLOCK_STALL
                ),
                start_time=current_time,
                end_time=None,
                duration=0.0,
                severity="high" if health.status == NetworkStatus.DOWN else "medium",
                description=f"Network {network} is {health.status.value}",
                affected_components=["rpc", "blockchain", "bridge"],
                resolution_actions=[
                    "Check RPC endpoints",
                    "Verify network connectivity",
                    "Contact network operators",
                ],
                metrics={
                    "health_score": health.health_score,
                    "response_time": health.response_time,
                    "issues": [issue.value for issue in health.issues],
                },
            )
            self.liveness_gaps.append(gap)

    async def _detect_validator_gap(self, validator_address: str, validator: ValidatorLiveness):
        """Detect liveness gap for a validator"""
        current_time = datetime.utcnow()

        # Check if gap already exists
        existing_gap = None
        for gap in self.liveness_gaps:
            if (
                gap.network == validator.network
                and gap.issue_type == LivenessIssue.VALIDATOR_OFFLINE
                and gap.end_time is None
            ):
                existing_gap = gap
                break

        if existing_gap:
            # Update existing gap
            existing_gap.duration = (current_time - existing_gap.start_time).total_seconds()
        else:
            # Create new gap
            gap = LivenessGap(
                gap_id=f"validator_{validator_address}_{current_time.strftime('%Y%m%d_%H%M%S')}",
                network=validator.network,
                issue_type=LivenessIssue.VALIDATOR_OFFLINE,
                start_time=current_time,
                end_time=None,
                duration=0.0,
                severity="medium" if validator.health_score > 0.3 else "high",
                description=f"Validator {validator_address} is offline or unhealthy",
                affected_components=["validator", "consensus", "bridge"],
                resolution_actions=[
                    "Check validator status",
                    "Verify validator connectivity",
                    "Review validator configuration",
                ],
                metrics={
                    "health_score": validator.health_score,
                    "uptime_percentage": validator.uptime_percentage,
                    "consecutive_failures": validator.consecutive_failures,
                    "response_time": validator.response_time_avg,
                },
            )
            self.liveness_gaps.append(gap)

    async def _update_health_scores(self):
        """Update health scores based on recent data"""
        for network in self.network_health.keys():
            if network in self.health_history:
                recent_data = list(self.health_history[network])[-10:]  # Last 10 data points
                if recent_data:
                    avg_health_score = statistics.mean([d["health_score"] for d in recent_data])
                    self.network_health[network].health_score = avg_health_score

    async def register_validator(
        self, validator_address: str, network: str, metadata: dict[str, Any] = None
    ):
        """Register a validator for monitoring"""
        validator = ValidatorLiveness(
            validator_address=validator_address,
            network=network,
            is_online=True,
            last_seen=datetime.utcnow(),
            response_time_avg=0.0,
            uptime_percentage=1.0,
            consecutive_failures=0,
            health_score=1.0,
            issues=[],
        )

        self.validator_liveness[validator_address] = validator
        logger.info(f"Registered validator {validator_address} on network {network}")

    async def get_network_health(self, network: str = None) -> dict[str, Any]:
        """Get network health information"""
        if network:
            if network not in self.network_health:
                return {"error": "Network not found"}

            health = self.network_health[network]
            return {
                "network": health.network,
                "status": health.status.value,
                "timestamp": health.timestamp.isoformat(),
                "response_time": health.response_time,
                "block_height": health.block_height,
                "block_time": health.block_time,
                "active_validators": health.active_validators,
                "total_validators": health.total_validators,
                "health_score": health.health_score,
                "issues": [issue.value for issue in health.issues],
                "metrics": health.metrics,
            }
        return {
            network: {
                "status": health.status.value,
                "health_score": health.health_score,
                "issues": [issue.value for issue in health.issues],
                "timestamp": health.timestamp.isoformat(),
            }
            for network, health in self.network_health.items()
        }

    async def get_validator_health(self, validator_address: str = None) -> dict[str, Any]:
        """Get validator health information"""
        if validator_address:
            if validator_address not in self.validator_liveness:
                return {"error": "Validator not found"}

            validator = self.validator_liveness[validator_address]
            return {
                "validator_address": validator.validator_address,
                "network": validator.network,
                "is_online": validator.is_online,
                "last_seen": validator.last_seen.isoformat(),
                "response_time_avg": validator.response_time_avg,
                "uptime_percentage": validator.uptime_percentage,
                "consecutive_failures": validator.consecutive_failures,
                "health_score": validator.health_score,
                "issues": [issue.value for issue in validator.issues],
            }
        return {
            validator_address: {
                "is_online": validator.is_online,
                "health_score": validator.health_score,
                "uptime_percentage": validator.uptime_percentage,
                "last_seen": validator.last_seen.isoformat(),
            }
            for validator_address, validator in self.validator_liveness.items()
        }

    async def get_liveness_gaps(self, hours: int = 24) -> list[dict[str, Any]]:
        """Get liveness gaps for specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        recent_gaps = [gap for gap in self.liveness_gaps if gap.start_time > cutoff_time]

        return [
            {
                "gap_id": gap.gap_id,
                "network": gap.network,
                "issue_type": gap.issue_type.value,
                "start_time": gap.start_time.isoformat(),
                "end_time": gap.end_time.isoformat() if gap.end_time else None,
                "duration": gap.duration,
                "severity": gap.severity,
                "description": gap.description,
                "affected_components": gap.affected_components,
                "resolution_actions": gap.resolution_actions,
                "metrics": gap.metrics,
            }
            for gap in sorted(recent_gaps, key=lambda x: x.start_time, reverse=True)
        ]

    async def get_health_summary(self) -> dict[str, Any]:
        """Get overall health summary"""
        total_networks = len(self.network_health)
        healthy_networks = len(
            [h for h in self.network_health.values() if h.status == NetworkStatus.HEALTHY]
        )

        total_validators = len(self.validator_liveness)
        online_validators = len([v for v in self.validator_liveness.values() if v.is_online])

        active_gaps = len([g for g in self.liveness_gaps if g.end_time is None])

        return {
            "networks": {
                "total": total_networks,
                "healthy": healthy_networks,
                "health_percentage": (
                    (healthy_networks / total_networks * 100) if total_networks > 0 else 0
                ),
            },
            "validators": {
                "total": total_validators,
                "online": online_validators,
                "uptime_percentage": (
                    (online_validators / total_validators * 100) if total_validators > 0 else 0
                ),
            },
            "liveness_gaps": {
                "active": active_gaps,
                "total_recent": len(
                    [
                        g
                        for g in self.liveness_gaps
                        if g.start_time > datetime.utcnow() - timedelta(hours=24)
                    ]
                ),
            },
            "overall_health": (
                "healthy"
                if healthy_networks == total_networks and online_validators == total_validators
                else "degraded"
            ),
        }
