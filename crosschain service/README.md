# Cross-Chain Bridge Security Analysis Service

A comprehensive standalone service for analyzing cross-chain bridge security, vulnerabilities, and interoperability risks across multiple blockchains.

## 🚀 Features

### Core Capabilities
- **Bridge Analysis**: Comprehensive security analysis of cross-chain bridges
- **Vulnerability Scanning**: Advanced vulnerability detection and assessment
- **Network Monitoring**: Real-time network status and health monitoring
- **Transaction Validation**: Cross-chain transaction validation and verification
- **Risk Assessment**: Multi-dimensional risk scoring and recommendations

### Advanced Security Features
- **Attestation Monitoring**: Real-time monitoring of bridge attestations with anomaly detection
- **Proof of Reserves**: Guardian quorum diversity scoring and reserve verification
- **Attack Detection**: Signature mismatch and forgery detection based on past exploits
- **Liveness Monitoring**: Network health monitoring and liveness gap detection
- **Security Orchestration**: Comprehensive security event correlation and alerting

### Supported Networks
- **Ethereum Mainnet** - The primary smart contract platform
- **Polygon** - Layer 2 scaling solution for Ethereum
- **Binance Smart Chain (BSC)** - High-performance blockchain
- **Avalanche** - Fast, low-cost blockchain platform
- **Arbitrum** - Optimistic rollup for Ethereum
- **Optimism** - Layer 2 scaling solution
- **Testnets** - Goerli, Mumbai for testing

### Security Analysis Types
- **Basic Analysis**: Contract verification and basic security checks
- **Comprehensive Analysis**: Governance, validator set, and economic security
- **Deep Analysis**: Liquidity analysis, token flow, and cross-chain risks
- **Advanced Security Monitoring**: Attack playbook analysis, signature forgery detection, attestation anomaly detection, and quorum skew analysis

### Bridge-Specific Heuristics
- **Attestation Anomalies**: Detection of unusual attestation patterns and timing
- **Quorum Skews**: Monitoring validator behavior and quorum distribution
- **Liveness Gaps**: Real-time detection of network and validator downtime
- **Signature Analysis**: Advanced signature validation and forgery detection
- **Attack Pattern Recognition**: Detection based on historical bridge exploits

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [Development](#development)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Installation

### Prerequisites

- Python 3.9+
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (for production)
- Redis 7+ (for caching and task queue)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/scorpius/cross-chain-bridge-service.git
   cd cross-chain-bridge-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the service**
   ```bash
   uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Check service status**
   ```bash
   docker-compose ps
   ```

3. **View logs**
   ```bash
   docker-compose logs -f cross-chain-bridge-service
   ```

4. **Access the service**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Grafana: http://localhost:3000 (admin/admin)
   - Prometheus: http://localhost:9090

### Basic Usage Examples

#### Analyze a Bridge
```bash
curl -X POST "http://localhost:8000/api/v1/bridge/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "source_network": "ethereum",
    "target_network": "polygon",
    "analysis_depth": "comprehensive"
  }'
```

#### Get Network Status
```bash
curl "http://localhost:8000/api/v1/network/status"
```

#### Scan for Vulnerabilities
```bash
curl -X POST "http://localhost:8000/api/v1/vulnerability/scan" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_addresses": ["0x1234567890123456789012345678901234567890"],
    "networks": ["ethereum", "polygon"],
    "scan_type": "comprehensive"
  }'
```

#### Advanced Security Monitoring Examples

##### Detect Attestation Anomalies
```bash
curl -X POST "http://localhost:8000/api/v1/bridge/detect-attestation-anomalies" \
  -H "Content-Type: application/json" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "network": "ethereum",
    "time_range": "24h",
    "include_details": true
  }'
```

##### Analyze Quorum Skews
```bash
curl -X POST "http://localhost:8000/api/v1/bridge/analyze-quorum-skews" \
  -H "Content-Type: application/json" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "network": "ethereum",
    "analysis_period": "7d"
  }'
```

##### Monitor Proof-of-Reserves
```bash
curl -X POST "http://localhost:8000/api/v1/bridge/proof-of-reserves-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "network": "ethereum",
    "include_asset_breakdown": true
  }'
```

##### Attack Playbook Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/bridge/attack-playbook-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "network": "ethereum",
    "transaction_data": [
      {
        "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "value": 1000000000000000000,
        "signatures": [
          {
            "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
            "message": "{\"action\":\"transfer\",\"amount\":1000000,\"timestamp\":\"2024-01-01T00:00:00Z\"}",
            "public_key": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98",
            "expected_signer": "0x1234567890123456789012345678901234567890"
          }
        ]
      }
    ]
  }'
```

##### Comprehensive Security Scan
```bash
curl -X POST "http://localhost:8000/api/v1/bridge/comprehensive-security-scan" \
  -H "Content-Type: application/json" \
  -d '{
    "bridge_address": "0x1234567890123456789012345678901234567890",
    "network": "ethereum",
    "transaction_data": [],
    "scan_options": {
      "include_attack_analysis": true,
      "include_signature_analysis": true,
      "include_attestation_analysis": true,
      "include_quorum_analysis": true,
      "deep_scan": false
    }
  }'
```

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
Currently, the service runs without authentication. For production deployment, implement proper API key or JWT authentication.

### Endpoints

#### Bridge Analysis
- `POST /bridge/analyze` - Analyze a cross-chain bridge
- `POST /bridge/security-score` - Get detailed security score
- `POST /bridge/simulate-attack` - Simulate bridge attacks
- `POST /bridge/detect-attestation-anomalies` - Detect attestation anomalies
- `POST /bridge/analyze-quorum-skews` - Analyze quorum skews and liveness gaps
- `POST /bridge/proof-of-reserves-monitoring` - Monitor proof-of-reserves
- `POST /bridge/attack-playbook-analysis` - Analyze against known attack patterns
- `POST /bridge/validate-signatures` - Validate signatures for forgery detection
- `POST /bridge/comprehensive-security-scan` - Comprehensive security analysis
- `GET /bridge/metrics` - Get bridge metrics
- `GET /bridge/list` - List known bridges
- `GET /bridge/{address}/info` - Get bridge information

#### Network Monitoring
- `GET /network/status` - Get network status
- `GET /network/{network}/status` - Get specific network status
- `POST /network/{network}/health` - Assess network health
- `GET /network/supported` - Get supported networks
- `GET /network/{network}/info` - Get network information
- `GET /network/{network}/metrics` - Get network metrics

#### Transaction Validation
- `POST /transaction/validate` - Validate cross-chain transaction
- `POST /transaction/analyze` - Analyze transaction
- `GET /transaction/{hash}/status` - Get transaction status
- `GET /transaction/{hash}/details` - Get transaction details
- `GET /transaction/search` - Search transactions

#### Vulnerability Analysis
- `POST /vulnerability/scan` - Scan for vulnerabilities
- `POST /vulnerability/cross-chain-scan` - Cross-chain vulnerability analysis
- `GET /vulnerability/threats` - Get threat intelligence
- `GET /vulnerability/vulnerability-types` - Get vulnerability types

#### Security Monitoring
- `GET /security/dashboard` - Get comprehensive security dashboard
- `POST /security/attestations/process` - Process attestation and detect anomalies
- `GET /security/attestations/metrics` - Get attestation metrics
- `GET /security/attestations/anomalies` - Get recent attestation anomalies
- `POST /security/guardians/register` - Register a new guardian
- `POST /security/reserves/verify` - Verify proof of reserves
- `GET /security/quorum/diversity` - Get quorum diversity score
- `GET /security/quorum/health` - Get quorum health summary
- `POST /security/attacks/detect` - Detect potential attacks
- `GET /security/attacks/statistics` - Get attack detection statistics
- `GET /security/attacks/history` - Get attack detection history
- `GET /security/liveness/networks` - Get network health information
- `GET /security/liveness/validators` - Get validator health information
- `GET /security/liveness/gaps` - Get liveness gaps
- `GET /security/liveness/summary` - Get liveness monitoring summary
- `GET /security/events` - Get recent security events
- `GET /security/alerts` - Get active security alerts
- `POST /security/alerts/{alert_id}/acknowledge` - Acknowledge security alert
- `POST /security/events/{event_id}/resolve` - Resolve security event
- `POST /security/monitoring/start` - Start security monitoring
- `POST /security/monitoring/stop` - Stop security monitoring

### Response Formats

All API responses follow a consistent format:

```json
{
  "data": { ... },
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "uuid"
}
```

Error responses:
```json
{
  "error": "Error message",
  "status": "error",
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "uuid"
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `8000` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/bridge_service` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `API_GATEWAY_URL` | API gateway URL | `http://localhost:8000` |

### Network Configuration

Networks are configured in `src/utils/network_utils.py`. To add a new network:

```python
SUPPORTED_NETWORKS["new_network"] = {
    "chain_id": 12345,
    "name": "New Network",
    "rpc_url": "https://rpc.new-network.com",
    "explorer_url": "https://explorer.new-network.com",
    "native_token": "NEW",
    "block_time": 2.0,
    "gas_limit": 30000000,
    "is_testnet": False
}
```

## 🐳 Docker Deployment

### Production Deployment

1. **Build the image**
   ```bash
   docker build -t cross-chain-bridge-service .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Scale the service**
   ```bash
   docker-compose up -d --scale cross-chain-bridge-service=3
   ```

### Environment-specific Configurations

- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment
- `docker-compose.test.yml` - Testing environment

## 🔧 Development

### Project Structure

```
cross-chain-bridge-service/
├── src/
│   ├── api/                 # FastAPI application
│   │   ├── main.py         # Main application
│   │   └── routes/         # API routes
│   ├── core/               # Core business logic
│   │   ├── bridge_analyzer.py
│   │   ├── security_scanner.py
│   │   ├── network_monitor.py
│   │   └── transaction_validator.py
│   ├── models/             # Data models
│   ├── services/           # Service layer
│   └── utils/              # Utility functions
├── tests/                  # Test suite
├── docs/                   # Documentation
├── docker/                 # Docker configurations
├── monitoring/             # Monitoring configurations
└── nginx/                  # Nginx configurations
```

### Code Style

The project uses:
- **Black** for code formatting
- **Flake8** for linting
- **MyPy** for type checking
- **Pre-commit** hooks for code quality

Run code quality checks:
```bash
black src/ tests/
flake8 src/ tests/
mypy src/
```

### Adding New Features

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Implement changes**
   - Add models in `src/models/`
   - Add business logic in `src/core/`
   - Add API routes in `src/api/routes/`
   - Add tests in `tests/`

3. **Run tests**
   ```bash
   pytest tests/
   ```

4. **Submit pull request**

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_bridge_analyzer.py

# Run with verbose output
pytest -v
```

### Test Structure

- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/fixtures/` - Test fixtures
- `tests/mocks/` - Mock data

### Writing Tests

Example test:
```python
import pytest
from src.core.bridge_analyzer import BridgeAnalyzer

@pytest.mark.asyncio
async def test_bridge_analysis():
    analyzer = BridgeAnalyzer()
    result = await analyzer.analyze_bridge(
        "0x1234567890123456789012345678901234567890",
        "ethereum",
        "polygon"
    )
    assert result.security_score >= 0
    assert result.security_score <= 10
```

## 📊 Monitoring

### Metrics

The service exposes Prometheus metrics at `/metrics`:

- `bridge_analysis_total` - Total bridge analyses performed
- `vulnerability_scans_total` - Total vulnerability scans
- `network_checks_total` - Total network health checks
- `api_requests_total` - Total API requests
- `api_request_duration_seconds` - API request duration

### Dashboards

Grafana dashboards are available at:
- **Service Overview**: http://localhost:3000/d/service-overview
- **Bridge Analysis**: http://localhost:3000/d/bridge-analysis
- **Network Health**: http://localhost:3000/d/network-health
- **Vulnerability Trends**: http://localhost:3000/d/vulnerability-trends

### Alerts

Configured alerts:
- High error rate (>5%)
- Long response times (>10s)
- Service down
- High vulnerability count
- Network connectivity issues

## 🔒 Security

### Security Features

- **Input Validation**: All inputs are validated using Pydantic
- **Rate Limiting**: API rate limiting via Nginx
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Security headers via Nginx
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

### Security Best Practices

1. **Environment Variables**: Never commit secrets
2. **Network Security**: Use HTTPS in production
3. **Access Control**: Implement proper authentication
4. **Regular Updates**: Keep dependencies updated
5. **Security Audits**: Regular security assessments

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run quality checks
6. Submit a pull request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and API docs
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our GitHub Discussions
- **Email**: team@scorpius.dev

### Common Issues

#### Service Won't Start
- Check Docker is running
- Verify port 8000 is available
- Check environment variables

#### Database Connection Issues
- Verify PostgreSQL is running
- Check connection string
- Ensure database exists

#### Network Connection Issues
- Check RPC URLs are accessible
- Verify network configurations
- Check firewall settings

## 🗺 Roadmap

### Upcoming Features

- [ ] **Multi-signature Support**: Analyze multi-sig bridge implementations
- [ ] **AI-Powered Analysis**: Machine learning for vulnerability detection
- [ ] **Real-time Monitoring**: WebSocket support for real-time updates
- [ ] **Mobile SDK**: Mobile application support
- [ ] **Advanced Analytics**: Historical trend analysis
- [ ] **Integration APIs**: Third-party service integrations

### Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Enhanced vulnerability scanning
- **v1.2.0** - Real-time monitoring capabilities
- **v2.0.0** - AI-powered analysis (planned)

---

**Built with ❤️ by the Scorpius Team**

For more information, visit [scorpius.dev](https://scorpius.dev)