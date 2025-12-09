import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Real-time web dashboard for quantum mempool monitoring.
"""

import json  # noqa: E402
from datetime import datetime  # noqa: E402
from pathlib import Path  # noqa: E402
from typing import Any, Dict, List  # noqa: E402

import uvicorn  # noqa: E402
from common.observability.logging import get_scorpius_logger  # noqa: E402
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect  # noqa: E402
from fastapi.responses import HTMLResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from fastapi.templating import Jinja2Templates  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..enterprise.security_manager import EnterpriseSecurityManager  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402


class QuantumDashboard:
    """
    Real-time web dashboard for quantum mempool monitoring.

    Features:
    - Live threat detection visualization
    - Real-time mempool statistics
    - System health monitoring
    - Alert management interface
    - Historical data analysis
    - Export capabilities
    """

    def __init__(self, config: EnterpriseConfig):
        self.config = config
        self.logger = get_scorpius_logger(__name__)

        # FastAPI app
        self.app = FastAPI(title="Quantum Mempool Dashboard")

        # Security and audit
        self.security_manager = EnterpriseSecurityManager(config)
        self.audit_logger = SecurityEventLogger(config.audit_config.__dict__)

        # WebSocket connections
        self.websocket_connections: List[WebSocket] = []

        # Dashboard data
        self.current_metrics = {}
        self.alert_history = []
        self.system_status = {}

        # Setup routes and static files
        self._setup_routes()
        self._setup_static_files()

    def _setup_static_files(self):
        """Setup static files and templates."""
        # Create dashboard directory structure if it doesn't exist
        dashboard_dir = Path("dashboard")
        dashboard_dir.mkdir(exist_ok=True)

        static_dir = dashboard_dir / "static"
        static_dir.mkdir(exist_ok=True)

        templates_dir = dashboard_dir / "templates"
        templates_dir.mkdir(exist_ok=True)

        # Mount static files
        self.app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        # Setup templates
        self.templates = Jinja2Templates(directory=str(templates_dir))

    def _setup_routes(self):
        """Setup dashboard routes."""

        @self.app.get("/", response_class=HTMLResponse)
        async def dashboard_home(request: Request):
            """Main dashboard page."""
            return self.templates.TemplateResponse(
                "dashboard.html",
                {
                    "request": request,
                    "title": "Quantum Mempool Monitor",
                    "config": self.config.dashboard_config.__dict__,
                },
            )

        @self.app.get("/api/metrics")
        async def get_metrics():
            """Get current metrics."""
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "metrics": self.current_metrics,
            }

        @self.app.get("/api/alerts")
        async def get_alerts():
            """Get recent alerts."""
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "alerts": self.alert_history[-100:],  # Last 100 alerts
            }

        @self.app.get("/api/status")
        async def get_system_status():
            """Get system status."""
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "status": self.system_status,
            }

        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time updates."""
            await self.handle_websocket(websocket)

    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connection for real-time updates."""
        await websocket.accept()
        self.websocket_connections.append(websocket)

        try:
            # Send initial data
            await websocket.send_json(
                {
                    "type": "initial_data",
                    "metrics": self.current_metrics,
                    "alerts": self.alert_history[-10:],  # Last 10 alerts
                    "status": self.system_status,
                }
            )

            # Keep connection alive
            while True:
                await websocket.receive_text()

        except WebSocketDisconnect:
            self.websocket_connections.remove(websocket)
        except Exception as e:
            self.logger.error(f"WebSocket error: {str(e)}")
            if websocket in self.websocket_connections:
                self.websocket_connections.remove(websocket)

    async def broadcast_update(self, data: Dict[str, Any]):
        """Broadcast update to all connected WebSocket clients."""
        if not self.websocket_connections:
            return

        message = json.dumps(data, default=str)

        # Send to all connected clients
        disconnected = []
        for websocket in self.websocket_connections:
            try:
                await websocket.send_text(message)
            except Exception:
                disconnected.append(websocket)

        # Remove disconnected clients
        for websocket in disconnected:
            self.websocket_connections.remove(websocket)

    async def update_metrics(self, metrics: Dict[str, Any]):
        """Update dashboard metrics."""
        self.current_metrics = metrics

        await self.broadcast_update(
            {
                "type": "metrics_update",
                "data": metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

    async def add_alert(self, alert: Dict[str, Any]):
        """Add new alert to dashboard."""
        alert["timestamp"] = datetime.utcnow().isoformat()
        self.alert_history.append(alert)

        # Keep only last 1000 alerts
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]

        await self.broadcast_update(
            {"type": "new_alert", "data": alert, "timestamp": alert["timestamp"]}
        )

    async def update_system_status(self, status: Dict[str, Any]):
        """Update system status."""
        self.system_status = status

        await self.broadcast_update(
            {
                "type": "status_update",
                "data": status,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

    async def start_dashboard(self):
        """Start the dashboard server."""
        # Create dashboard HTML template
        await self._create_dashboard_template()

        # Create static assets
        await self._create_static_assets()

        # Start server
        config = uvicorn.Config(
            self.app,
            host=self.config.api_config.host,
            port=self.config.api_config.port + 1,  # Dashboard on API port + 1
            log_level="info",
        )

        server = uvicorn.Server(config)
        self.logger.info(f"Starting dashboard on http://{config.host}:{config.port}")

        return server

    async def _create_dashboard_template(self):
        """Create the main dashboard HTML template."""
        template_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/static/dashboard.css">
</head>
<body class="bg-gray-900 text-white">
    <div id="app" class="min-h-screen">
        <!-- Header -->
        <header class="bg-gray-800 border-b border-gray-700">
            <div class="container mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-400">🔬 Quantum Mempool Monitor</h1>
                    <div class="flex items-center space-x-4">
                        <div id="connection-status" class="flex items-center">
                            <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            <span>Connected</span>
                        </div>
                        <div id="last-update" class="text-sm text-gray-400">
                            Last update: <span id="timestamp">--</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="container mx-auto px-4 py-6">
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-2">Transactions Monitored</h3>
                    <p id="transactions-count" class="text-3xl font-bold text-blue-400">0</p>
                </div>
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-2">Quantum Threats</h3>
                    <p id="threats-count" class="text-3xl font-bold text-red-400">0</p>
                </div>
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-2">System Load</h3>
                    <p id="system-load" class="text-3xl font-bold text-green-400">0%</p>
                </div>
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-2">Uptime</h3>
                    <p id="uptime" class="text-3xl font-bold text-yellow-400">--</p>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">Threat Detection Timeline</h3>
                    <canvas id="threat-chart" width="400" height="200"></canvas>
                </div>
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">Transaction Volume</h3>
                    <canvas id="volume-chart" width="400" height="200"></canvas>
                </div>
            </div>

            <!-- Recent Alerts -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Recent Alerts</h3>
                <div id="alerts-container" class="space-y-2">
                    <!-- Alerts will be populated here -->
                </div>
            </div>
        </main>
    </div>

    <script src="/static/dashboard.js"></script>
</body>
</html>
        """

        templates_dir = Path("dashboard/templates")
        templates_dir.mkdir(parents=True, exist_ok=True)

        with open(templates_dir / "dashboard.html", "w") as f:
            f.write(template_content)

    async def _create_static_assets(self):
        """Create static CSS and JavaScript files."""
        # CSS
        css_content = """
        .alert-critical {
            @apply border-l-4 border-red-500 bg-red-900 bg-opacity-20;
        }
        .alert-high {
            @apply border-l-4 border-orange-500 bg-orange-900 bg-opacity-20;
        }
        .alert-medium {
            @apply border-l-4 border-yellow-500 bg-yellow-900 bg-opacity-20;
        }
        .alert-low {
            @apply border-l-4 border-blue-500 bg-blue-900 bg-opacity-20;
        }
        """

        # JavaScript
        js_content = """
        class QuantumDashboard {
            constructor() {
                this.ws = null;
                this.charts = {};
                this.init();
            }

            init() {
                this.setupWebSocket();
                this.setupCharts();
                this.updateTimestamp();
                setInterval(() => this.updateTimestamp(), 1000);
            }

            setupWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws`;

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.updateConnectionStatus(true);
                };

                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.updateConnectionStatus(false);
                    setTimeout(() => this.setupWebSocket(), 5000);
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.updateConnectionStatus(false);
                };
            }

            handleMessage(data) {
                switch(data.type) {
                    case 'initial_data':
                        this.updateMetrics(data.metrics);
                        this.updateAlerts(data.alerts);
                        break;
                    case 'metrics_update':
                        this.updateMetrics(data.data);
                        break;
                    case 'new_alert':
                        this.addAlert(data.data);
                        break;
                    case 'status_update':
                        this.updateStatus(data.data);
                        break;
                }
            }

            updateConnectionStatus(connected) {
                const statusEl = document.getElementById('connection-status');
                const dot = statusEl.querySelector('span');
                const text = statusEl.querySelector('span:last-child');

                if (connected) {
                    dot.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
                    text.textContent = 'Connected';
                } else {
                    dot.className = 'w-3 h-3 bg-red-500 rounded-full mr-2';
                    text.textContent = 'Disconnected';
                }
            }

            updateMetrics(metrics) {
                document.getElementById('transactions-count').textContent = metrics.transactions_processed || 0;
                document.getElementById('threats-count').textContent = metrics.threats_detected || 0;
                document.getElementById('system-load').textContent = `${Math.round((metrics.system_load || 0) * 100)}%`;

                // Update charts
                this.updateCharts(metrics);
            }

            updateCharts(metrics) {
                // Update threat detection chart
                if (this.charts.threats) {
                    const now = new Date();
                    this.charts.threats.data.labels.push(now.toLocaleTimeString());
                    this.charts.threats.data.datasets[0].data.push(metrics.threats_detected || 0);

                    // Keep only last 20 points
                    if (this.charts.threats.data.labels.length > 20) {
                        this.charts.threats.data.labels.shift();
                        this.charts.threats.data.datasets[0].data.shift();
                    }

                    this.charts.threats.update();
                }

                // Update volume chart
                if (this.charts.volume) {
                    const now = new Date();
                    this.charts.volume.data.labels.push(now.toLocaleTimeString());
                    this.charts.volume.data.datasets[0].data.push(metrics.transactions_processed || 0);

                    // Keep only last 20 points
                    if (this.charts.volume.data.labels.length > 20) {
                        this.charts.volume.data.labels.shift();
                        this.charts.volume.data.datasets[0].data.shift();
                    }

                    this.charts.volume.update();
                }
            }

            setupCharts() {
                // Threat detection chart
                const threatCtx = document.getElementById('threat-chart').getContext('2d');
                this.charts.threats = new Chart(threatCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Threats Detected',
                            data: [],
                            borderColor: 'rgb(239, 68, 68)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(75, 85, 99, 0.3)' },
                                ticks: { color: 'rgb(156, 163, 175)' }
                            },
                            x: {
                                grid: { color: 'rgba(75, 85, 99, 0.3)' },
                                ticks: { color: 'rgb(156, 163, 175)' }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: 'rgb(156, 163, 175)' } }
                        }
                    }
                });

                // Volume chart
                const volumeCtx = document.getElementById('volume-chart').getContext('2d');
                this.charts.volume = new Chart(volumeCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Transactions',
                            data: [],
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(75, 85, 99, 0.3)' },
                                ticks: { color: 'rgb(156, 163, 175)' }
                            },
                            x: {
                                grid: { color: 'rgba(75, 85, 99, 0.3)' },
                                ticks: { color: 'rgb(156, 163, 175)' }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: 'rgb(156, 163, 175)' } }
                        }
                    }
                });
            }

            addAlert(alert) {
                const container = document.getElementById('alerts-container');
                const alertEl = document.createElement('div');
                alertEl.className = `alert-${alert.severity} p-4 rounded-lg`;
                alertEl.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-semibold">${alert.type || 'Alert'}</h4>
                            <p class="text-sm">${alert.message || 'No message'}</p>
                        </div>
                        <span class="text-xs text-gray-400">${new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                `;

                container.insertBefore(alertEl, container.firstChild);

                // Keep only last 10 alerts visible
                while (container.children.length > 10) {
                    container.removeChild(container.lastChild);
                }
            }

            updateTimestamp() {
                document.getElementById('timestamp').textContent = new Date().toLocaleTimeString();
            }
        }

        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new QuantumDashboard();
        });
        """

        static_dir = Path("dashboard/static")
        static_dir.mkdir(parents=True, exist_ok=True)

        with open(static_dir / "dashboard.css", "w") as f:
            f.write(css_content)

        with open(static_dir / "dashboard.js", "w") as f:
            f.write(js_content)
