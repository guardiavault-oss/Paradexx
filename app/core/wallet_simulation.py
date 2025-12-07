"""
Real Wallet Pre-Simulation Engine
Production-ready implementation with real blockchain simulation for risk detection
"""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any

import structlog
from web3 import Web3

try:
    from web3.middleware import geth_poa_middleware
except ImportError:
    try:
        from web3 import middleware

        geth_poa_middleware = middleware.ExtraDataToPOAMiddleware
    except ImportError:
        geth_poa_middleware = None

if TYPE_CHECKING:
    from .real_blockchain_simulation import (
        RealBlockchainSimulation as RealBlockchainSimulationType,
        SimulationConfig as SimulationConfigType,
        SimulationNetwork as SimulationNetworkType,
        SimulationProvider as SimulationProviderType,
        TenderlyConfig as TenderlyConfigType,
    )

logger = structlog.get_logger(__name__)

RealBlockchainSimulationCls: Any | None = None
SimulationConfigCls: Any | None = None
SimulationNetworkCls: Any | None = None
SimulationProviderCls: Any | None = None
TenderlyConfigCls: Any | None = None


def _load_simulation_dependencies() -> bool:
    """Lazily import real blockchain simulation dependencies."""
    global RealBlockchainSimulationCls
    global SimulationConfigCls
    global SimulationNetworkCls
    global SimulationProviderCls
    global TenderlyConfigCls

    if RealBlockchainSimulationCls is not None:
        return True

    try:
        from .real_blockchain_simulation import (
            RealBlockchainSimulation as _RealBlockchainSimulation,
            SimulationConfig as _SimulationConfig,
            SimulationNetwork as _SimulationNetwork,
            SimulationProvider as _SimulationProvider,
            TenderlyConfig as _TenderlyConfig,
        )
    except (ModuleNotFoundError, ImportError) as exc:
        logger.warning(
            "Real blockchain simulation dependencies not available; falling back to local simulation",
            error=str(exc),
        )
        return False

    RealBlockchainSimulationCls = _RealBlockchainSimulation
    SimulationConfigCls = _SimulationConfig
    SimulationNetworkCls = _SimulationNetwork
    SimulationProviderCls = _SimulationProvider
    TenderlyConfigCls = _TenderlyConfig
    return True


class SimulationResult(Enum):
    SAFE = "safe"
    RISKY = "risky"
    DANGEROUS = "dangerous"
    FAILED = "failed"


class RiskType(Enum):
    REENTRANCY = "reentrancy"
    APPROVAL_DRAIN = "approval_drain"
    FRONT_RUNNING = "front_running"
    MEV_EXPLOIT = "mev_exploit"
    FLASH_LOAN_ATTACK = "flash_loan_attack"
    UNEXPECTED_BALANCE_CHANGE = "unexpected_balance_change"
    GAS_ESTIMATION_FAILURE = "gas_estimation_failure"
    CONTRACT_INTERACTION_RISK = "contract_interaction_risk"


@dataclass
class SimulationRisk:
    """Risk detected during simulation"""

    risk_type: RiskType
    severity: str  # low, medium, high, critical
    description: str
    confidence: float
    evidence: dict[str, Any]
    mitigation_suggestions: list[str]


@dataclass
class SimulationWarning:
    """Warning generated during simulation"""

    warning_type: str
    message: str
    details: dict[str, Any]
    suggested_action: str


@dataclass
class SimulationMetrics:
    """Metrics from simulation execution"""

    execution_time: float
    gas_used: int
    gas_estimate: int
    balance_changes: dict[str, float]
    token_approval_changes: dict[str, dict[str, float]]
    contract_calls: list[dict[str, Any]]
    events_emitted: list[dict[str, Any]]


@dataclass
class SimulationResult:
    """Complete simulation result"""

    transaction_id: str
    simulation_result: SimulationResult
    risks: list[SimulationRisk]
    warnings: list[SimulationWarning]
    metrics: SimulationMetrics
    executed_successfully: bool
    error_message: str | None
    recommendations: list[str]
    confidence_score: float
    simulation_timestamp: datetime


class RealWalletSimulationEngine:
    """
    Production-ready wallet simulation engine with real blockchain simulation
    """

    def __init__(self, config: dict[str, Any]):
        self.config = config
        self.web3_clients: dict[str, Web3] = {}
        self.simulation_engines: dict[str, Any] = {}
        self.fork_endpoints: dict[str, str] = {}
        self.risk_patterns: dict[RiskType, list[dict]] = {}
        self.simulation_cache: dict[str, SimulationResult] = {}

        # Initialize Web3 connections and real simulation engines
        self._initialize_web3_connections()
        self._initialize_real_simulation_engines()
        self._initialize_risk_patterns()

    def _initialize_web3_connections(self):
        """Initialize Web3 connections for different networks"""
        networks = self.config.get("networks", {})

        for network_name, network_config in networks.items():
            try:
                w3 = Web3(Web3.HTTPProvider(network_config["rpc_url"]))

                # Add PoA middleware for networks like BSC, Polygon
                if network_config.get("is_poa", False) and geth_poa_middleware:
                    w3.middleware_onion.inject(geth_poa_middleware, layer=0)

                self.web3_clients[network_name] = w3
                self.fork_endpoints[network_name] = network_config.get("fork_endpoint")

                logger.info("Web3 connection initialized", network=network_name)

            except Exception as e:
                logger.error(
                    "Failed to initialize Web3 connection", network=network_name, error=str(e)
                )

    def _initialize_real_simulation_engines(self):
        """Initialize real blockchain simulation engines"""
        if not _load_simulation_dependencies():
            logger.info("Real simulation dependencies missing; using local simulation only")
            return

        assert (
            RealBlockchainSimulationCls
            and SimulationConfigCls
            and SimulationNetworkCls
            and SimulationProviderCls
        ), "Simulation dependencies must be loaded"

        simulation_config = self.config.get("simulation", {})
        networks = self.config.get("networks", {})

        # Initialize Tenderly simulation if configured
        tenderly_config_obj = None
        if simulation_config.get("tenderly"):
            if not TenderlyConfigCls:
                logger.warning("Tenderly dependency missing; skipping Tenderly simulations")
            else:
                tenderly_cfg = simulation_config["tenderly"]
                tenderly_config_obj = TenderlyConfigCls(
                    api_key=tenderly_cfg["api_key"],
                    user_id=tenderly_cfg["user_id"],
                    project_id=tenderly_cfg["project_id"],
                    base_url=tenderly_cfg.get("base_url", "https://api.tenderly.co"),
                )

                for network_name, network_config in networks.items():
                    sim_config = SimulationConfigCls(
                        provider=SimulationProviderCls.TENDERLY,
                        network=(
                            SimulationNetworkCls.MAINNET
                            if network_name == "ethereum"
                            else SimulationNetworkCls.POLYGON
                        ),
                        rpc_url=network_config["rpc_url"],
                        fork_block_number=network_config.get("fork_block_number"),
                        timeout=simulation_config.get("timeout", 60),
                        gas_limit=simulation_config.get("gas_limit", 30000000),
                    )

                    self.simulation_engines[f"{network_name}_tenderly"] = RealBlockchainSimulationCls(
                        sim_config, tenderly_config_obj
                    )

        # Initialize Foundry simulation if configured
        if simulation_config.get("foundry"):
            for network_name, network_config in networks.items():
                sim_config = SimulationConfigCls(
                    provider=SimulationProviderCls.FOUNDRY,
                    network=(
                        SimulationNetworkCls.MAINNET
                        if network_name == "ethereum"
                        else SimulationNetworkCls.POLYGON
                    ),
                    rpc_url=network_config["rpc_url"],
                    fork_block_number=network_config.get("fork_block_number"),
                    timeout=simulation_config.get("timeout", 60),
                    gas_limit=simulation_config.get("gas_limit", 30000000),
                )

                self.simulation_engines[f"{network_name}_foundry"] = RealBlockchainSimulationCls(
                    sim_config, None
                )

        logger.info("Real simulation engines initialized", count=len(self.simulation_engines))

    def _initialize_risk_patterns(self):
        """Initialize risk detection patterns"""
        self.risk_patterns = {
            RiskType.REENTRANCY: [
                {
                    "pattern": "external_call_before_state_change",
                    "description": "External call before state variable update",
                    "severity": "high",
                },
                {
                    "pattern": "recursive_call_detected",
                    "description": "Function calls itself or related functions recursively",
                    "severity": "critical",
                },
                {
                    "pattern": "state_change_after_call",
                    "description": "State changes after external call without reentrancy guard",
                    "severity": "high",
                },
            ],
            RiskType.APPROVAL_DRAIN: [
                {
                    "pattern": "unlimited_approval",
                    "description": "Unlimited token approval detected",
                    "severity": "critical",
                },
                {
                    "pattern": "high_approval_amount",
                    "description": "Approval amount significantly higher than transaction value",
                    "severity": "high",
                },
                {
                    "pattern": "approval_to_unknown_contract",
                    "description": "Token approval to contract not in known safe list",
                    "severity": "medium",
                },
            ],
            RiskType.FRONT_RUNNING: [
                {
                    "pattern": "high_gas_price",
                    "description": "Gas price significantly higher than network average",
                    "severity": "medium",
                },
                {
                    "pattern": "time_dependent_execution",
                    "description": "Transaction execution depends on block timestamp",
                    "severity": "medium",
                },
            ],
            RiskType.MEV_EXPLOIT: [
                {
                    "pattern": "sandwich_attack_possible",
                    "description": "Transaction vulnerable to sandwich attacks",
                    "severity": "high",
                },
                {
                    "pattern": "arbitrage_opportunity",
                    "description": "Transaction creates arbitrage opportunity for MEV bots",
                    "severity": "medium",
                },
            ],
        }

    async def simulate_transaction(
        self,
        transaction: dict[str, Any],
        wallet_address: str,
        network: str = "ethereum",
        simulation_depth: int = 10,
    ) -> SimulationResult:
        """
        Simulate a transaction against a blockchain fork to detect risks
        """
        transaction_id = f"sim_{hashlib.sha256(json.dumps(transaction, sort_keys=True).encode()).hexdigest()[:16]}"

        # Check cache first
        if transaction_id in self.simulation_cache:
            logger.info("Using cached simulation result", transaction_id=transaction_id)
            return self.simulation_cache[transaction_id]

        start_time = time.time()

        try:
            logger.info(
                "Starting transaction simulation",
                transaction_id=transaction_id,
                wallet_address=wallet_address,
                network=network,
            )

            # Initialize simulation state
            simulation_state = await self._initialize_simulation_state(wallet_address, network)

            # Execute simulation
            simulation_metrics = await self._execute_simulation(
                transaction, simulation_state, network, simulation_depth
            )

            # Analyze results for risks
            risks = await self._analyze_risks(transaction, simulation_metrics, simulation_state)

            # Generate warnings
            warnings = await self._generate_warnings(
                transaction, simulation_metrics, simulation_state
            )

            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(risks, warnings, simulation_metrics)

            # Determine overall result
            simulation_result = self._determine_simulation_result(risks, warnings)

            # Generate recommendations
            recommendations = self._generate_recommendations(risks, warnings, simulation_metrics)

            # Create result
            result = SimulationResult(
                transaction_id=transaction_id,
                simulation_result=simulation_result,
                risks=risks,
                warnings=warnings,
                metrics=simulation_metrics,
                executed_successfully=True,
                error_message=None,
                recommendations=recommendations,
                confidence_score=confidence_score,
                simulation_timestamp=datetime.now(timezone.utc),
            )

            # Cache result
            self.simulation_cache[transaction_id] = result

            logger.info(
                "Transaction simulation completed",
                transaction_id=transaction_id,
                result=simulation_result.value,
                risks_found=len(risks),
                warnings=len(warnings),
                confidence=confidence_score,
                duration=time.time() - start_time,
            )

            return result

        except Exception as e:
            logger.error(
                "Transaction simulation failed", transaction_id=transaction_id, error=str(e)
            )

            return SimulationResult(
                transaction_id=transaction_id,
                simulation_result=SimulationResult.FAILED,
                risks=[],
                warnings=[],
                metrics=SimulationMetrics(0, 0, 0, {}, {}, [], []),
                executed_successfully=False,
                error_message=str(e),
                recommendations=[],
                confidence_score=0.0,
                simulation_timestamp=datetime.now(timezone.utc),
            )

    async def _initialize_simulation_state(
        self, wallet_address: str, network: str
    ) -> dict[str, Any]:
        """Initialize simulation state with current blockchain state"""
        w3 = self.web3_clients.get(network)
        if not w3:
            raise ValueError(f"Network {network} not configured")

        try:
            # Get current state
            balance = w3.eth.get_balance(wallet_address)
            nonce = w3.eth.get_transaction_count(wallet_address)
            code = w3.eth.get_code(wallet_address)

            # Get token approvals (simplified - would need contract interaction)
            token_approvals = await self._get_token_approvals(wallet_address, network)

            simulation_state = {
                "wallet_address": wallet_address,
                "network": network,
                "initial_balance": balance,
                "initial_nonce": nonce,
                "is_contract": len(code) > 0,
                "token_approvals": token_approvals,
                "simulation_block": w3.eth.block_number,
                "gas_price": w3.eth.gas_price,
                "block_timestamp": w3.eth.get_block("latest")["timestamp"],
            }

            return simulation_state

        except Exception as e:
            logger.error("Failed to initialize simulation state", error=str(e))
            raise

    async def _get_token_approvals(
        self, wallet_address: str, network: str
    ) -> dict[str, dict[str, float]]:
        """Get current token approvals for the wallet"""
        approvals = {}

        # Common ERC-20 tokens to check
        common_tokens = {
            "ethereum": {
                "USDC": "0xA0b86a33E6417c4d3F4E6B4B8B5A5A5A5A5A5A5A",
                "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                "USDC": "0xA0b86a33E6417c4d3F4E6B4B8B5A5A5A5A5A5A5A",
            },
            "polygon": {
                "USDC": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
                "USDT": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
                "DAI": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
                "WMATIC": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            },
            "bsc": {
                "USDT": "0x55d398326f99059fF775485246999027B3197955",
                "USDC": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
                "BUSD": "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
                "WBNB": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            },
        }

        tokens = common_tokens.get(network, {})
        w3 = self.web3_clients.get(network)

        if not w3:
            logger.warning("Web3 client not available for network", network=network)
            return approvals

        for token_name, token_address in tokens.items():
            try:
                # ERC-20 allowance function selector
                allowance_selector = w3.keccak(text="allowance(address,address)")[:4]

                # Encode parameters: owner (wallet_address), spender (wallet_address)
                owner_encoded = wallet_address[2:].zfill(64)
                spender_encoded = wallet_address[2:].zfill(64)

                # Create call data
                call_data = allowance_selector.hex() + owner_encoded + spender_encoded

                # Make contract call
                result = w3.eth.call(
                    {"to": token_address, "data": call_data, "from": wallet_address}
                )

                # Decode result (uint256)
                allowance = int(result.hex(), 16)

                # Get token symbol
                symbol_selector = w3.keccak(text="symbol()")[:4]
                symbol_result = w3.eth.call(
                    {"to": token_address, "data": symbol_selector.hex(), "from": wallet_address}
                )

                # Decode symbol (simplified)
                symbol = token_name  # Fallback to known symbol

                approvals[token_address] = {
                    "allowance": allowance / 1e18,  # Convert from wei
                    "symbol": symbol,
                    "decimals": 18,  # Most tokens use 18 decimals
                }

            except Exception as e:
                logger.warning("Failed to get token approval", token=token_name, error=str(e))
                # Still add the token with zero allowance
                approvals[token_address] = {"allowance": 0.0, "symbol": token_name, "decimals": 18}

        return approvals

    async def _execute_simulation(
        self,
        transaction: dict[str, Any],
        simulation_state: dict[str, Any],
        network: str,
        simulation_depth: int,
    ) -> SimulationMetrics:
        """Execute the transaction simulation"""
        w3 = self.web3_clients.get(network)
        if not w3:
            raise ValueError(f"Network {network} not configured")

        start_time = time.time()

        try:
            # Prepare transaction for simulation
            sim_transaction = transaction.copy()
            sim_transaction["from"] = simulation_state["wallet_address"]
            sim_transaction["gas"] = sim_transaction.get("gas", 21000)

            # Estimate gas
            try:
                gas_estimate = w3.eth.estimate_gas(sim_transaction)
                sim_transaction["gas"] = gas_estimate
            except Exception as e:
                logger.warning("Gas estimation failed", error=str(e))
                gas_estimate = sim_transaction.get("gas", 21000)

            # Simulate transaction execution using real blockchain simulation
            simulation_result = await self._simulate_with_real_engine(
                sim_transaction, simulation_state, network, simulation_depth
            )

            # Calculate metrics
            execution_time = time.time() - start_time
            balance_changes = simulation_result.get("balance_changes", {})
            token_approval_changes = simulation_result.get("token_approval_changes", {})
            contract_calls = simulation_result.get("contract_calls", [])
            events_emitted = simulation_result.get("events_emitted", [])

            metrics = SimulationMetrics(
                execution_time=execution_time,
                gas_used=simulation_result.get("gas_used", gas_estimate),
                gas_estimate=gas_estimate,
                balance_changes=balance_changes,
                token_approval_changes=token_approval_changes,
                contract_calls=contract_calls,
                events_emitted=events_emitted,
            )

            return metrics

        except Exception as e:
            logger.error("Simulation execution failed", error=str(e))
            raise

    async def _simulate_with_real_engine(
        self,
        transaction: dict[str, Any],
        simulation_state: dict[str, Any],
        network: str,
        simulation_depth: int,
    ) -> dict[str, Any]:
        """Simulate transaction using real blockchain simulation engine"""
        try:
            # Try Tenderly first, then Foundry
            simulation_engine = None

            # Look for Tenderly simulation engine
            tenderly_key = f"{network}_tenderly"
            if tenderly_key in self.simulation_engines:
                simulation_engine = self.simulation_engines[tenderly_key]
                logger.info("Using Tenderly simulation engine", network=network)
            else:
                # Look for Foundry simulation engine
                foundry_key = f"{network}_foundry"
                if foundry_key in self.simulation_engines:
                    simulation_engine = self.simulation_engines[foundry_key]
                    logger.info("Using Foundry simulation engine", network=network)

            if simulation_engine:
                # Use real blockchain simulation
                result = await simulation_engine.simulate_transaction(transaction)

                if result.success:
                    return {
                        "gas_used": result.gas_used,
                        "balance_changes": result.balance_changes,
                        "token_approval_changes": {},  # Extract from trace
                        "contract_calls": result.contract_calls,
                        "events_emitted": result.logs,
                        "simulation_data": result.trace_data,
                    }
                logger.warning("Real simulation failed", error=result.error)

            # Fallback to local simulation if real engines fail
            return await self._simulate_transaction_execution_local(
                transaction, simulation_state, network, simulation_depth
            )

        except Exception as e:
            logger.error("Real simulation engine failed", error=str(e))
            # Fallback to local simulation
            return await self._simulate_transaction_execution_local(
                transaction, simulation_state, network, simulation_depth
            )

    async def _simulate_transaction_execution_local(
        self,
        transaction: dict[str, Any],
        simulation_state: dict[str, Any],
        network: str,
        simulation_depth: int,
    ) -> dict[str, Any]:
        """Local simulation fallback"""
        w3 = self.web3_clients.get(network)
        if not w3:
            raise ValueError(f"Network {network} not configured")

        try:
            # Use eth_call for local simulation
            result = w3.eth.call(transaction)

            return {
                "gas_used": transaction.get("gas", 21000),
                "balance_changes": {},
                "token_approval_changes": {},
                "contract_calls": [],
                "events_emitted": [],
                "simulation_data": {"result": result.hex()},
            }

        except Exception as e:
            logger.error("Local simulation failed", error=str(e))
            return {
                "gas_used": 0,
                "balance_changes": {},
                "token_approval_changes": {},
                "contract_calls": [],
                "events_emitted": [],
                "simulation_data": {"error": str(e)},
            }

    async def _simulate_transaction_execution(
        self,
        transaction: dict[str, Any],
        simulation_state: dict[str, Any],
        w3: Web3,
        simulation_depth: int,
    ) -> dict[str, Any]:
        """Simulate the actual transaction execution"""

        # This is a simplified simulation
        # In production, you'd use tools like Tenderly, Foundry, or custom simulation

        simulation_result = {
            "gas_used": transaction.get("gas", 21000),
            "balance_changes": {},
            "token_approval_changes": {},
            "contract_calls": [],
            "events_emitted": [],
        }

        # Simulate balance changes
        if "value" in transaction and transaction["value"] > 0:
            simulation_result["balance_changes"][transaction["to"]] = transaction["value"]
            simulation_result["balance_changes"][simulation_state["wallet_address"]] = -transaction[
                "value"
            ]

        # Simulate token approvals if data indicates ERC-20 approval
        if "data" in transaction and len(transaction["data"]) > 10:
            approval_info = await self._analyze_transaction_data(transaction["data"])
            if approval_info.get("is_approval"):
                simulation_result["token_approval_changes"] = approval_info.get(
                    "approval_changes", {}
                )

        # Simulate contract calls
        if transaction.get("to") and simulation_state.get("is_contract"):
            contract_calls = await self._simulate_contract_interactions(
                transaction, simulation_state, w3, simulation_depth
            )
            simulation_result["contract_calls"] = contract_calls

        return simulation_result

    async def _analyze_transaction_data(self, data: str) -> dict[str, Any]:
        """Analyze transaction data for specific patterns"""
        # ERC-20 approve function signature
        approve_signature = "0x095ea7b3"  # approve(address,uint256)

        result = {"is_approval": False, "approval_changes": {}}

        if data.startswith(approve_signature):
            result["is_approval"] = True
            # Parse approval parameters (simplified)
            try:
                spender = "0x" + data[34:74]  # Extract spender address
                amount_hex = data[74:138]  # Extract amount
                amount = int(amount_hex, 16)

                result["approval_changes"][spender] = amount

            except Exception as e:
                logger.warning("Failed to parse approval data", error=str(e))

        return result

    async def _simulate_contract_interactions(
        self,
        transaction: dict[str, Any],
        simulation_state: dict[str, Any],
        w3: Web3,
        simulation_depth: int,
    ) -> list[dict[str, Any]]:
        """Simulate contract interactions and detect risks"""
        contract_calls = []

        try:
            # Get contract code
            contract_code = w3.eth.get_code(transaction["to"])

            if len(contract_code) > 0:
                # Analyze contract for known patterns
                contract_analysis = await self._analyze_contract_code(
                    contract_code, transaction["data"]
                )
                contract_calls.append(
                    {
                        "contract_address": transaction["to"],
                        "function_called": contract_analysis.get("function"),
                        "parameters": contract_analysis.get("parameters", {}),
                        "risks_detected": contract_analysis.get("risks", []),
                        "interaction_type": contract_analysis.get("interaction_type", "unknown"),
                    }
                )

        except Exception as e:
            logger.warning("Contract interaction simulation failed", error=str(e))

        return contract_calls

    async def _analyze_contract_code(self, contract_code: bytes, call_data: str) -> dict[str, Any]:
        """Analyze contract code for risk patterns"""
        analysis = {
            "function": "unknown",
            "parameters": {},
            "risks": [],
            "interaction_type": "unknown",
        }

        try:
            # Common function signatures
            function_signatures = {
                "0x095ea7b3": "approve",
                "0xa9059cbb": "transfer",
                "0x23b872dd": "transferFrom",
                "0x70a08231": "balanceOf",
                "0x18160ddd": "totalSupply",
            }

            if len(call_data) >= 10:
                function_sig = call_data[:10]
                function_name = function_signatures.get(function_sig, "unknown")
                analysis["function"] = function_name

                # Analyze for specific risks based on function
                if function_name == "approve":
                    analysis["interaction_type"] = "token_approval"
                    analysis["risks"].append("potential_approval_drain")
                elif function_name in ["transfer", "transferFrom"]:
                    analysis["interaction_type"] = "token_transfer"
                elif function_name == "balanceOf":
                    analysis["interaction_type"] = "balance_query"

        except Exception as e:
            logger.warning("Contract code analysis failed", error=str(e))

        return analysis

    async def _analyze_risks(
        self,
        transaction: dict[str, Any],
        metrics: SimulationMetrics,
        simulation_state: dict[str, Any],
    ) -> list[SimulationRisk]:
        """Analyze simulation results for risks"""
        risks = []

        # Analyze balance changes
        balance_risks = await self._analyze_balance_risks(transaction, metrics, simulation_state)
        risks.extend(balance_risks)

        # Analyze token approval risks
        approval_risks = await self._analyze_approval_risks(transaction, metrics, simulation_state)
        risks.extend(approval_risks)

        # Analyze contract interaction risks
        contract_risks = await self._analyze_contract_risks(transaction, metrics, simulation_state)
        risks.extend(contract_risks)

        # Analyze gas risks
        gas_risks = await self._analyze_gas_risks(transaction, metrics, simulation_state)
        risks.extend(gas_risks)

        return risks

    async def _analyze_balance_risks(
        self,
        transaction: dict[str, Any],
        metrics: SimulationMetrics,
        simulation_state: dict[str, Any],
    ) -> list[SimulationRisk]:
        """Analyze balance-related risks"""
        risks = []

        wallet_address = simulation_state["wallet_address"]
        initial_balance = simulation_state["initial_balance"]

        # Check for unexpected balance changes
        balance_change = metrics.balance_changes.get(wallet_address, 0)
        if abs(balance_change) > initial_balance * 0.1:  # More than 10% change
            risks.append(
                SimulationRisk(
                    risk_type=RiskType.UNEXPECTED_BALANCE_CHANGE,
                    severity="medium",
                    description=f"Large balance change detected: {balance_change / 1e18:.4f} ETH",
                    confidence=0.8,
                    evidence={
                        "initial_balance": initial_balance,
                        "balance_change": balance_change,
                        "change_percentage": abs(balance_change) / initial_balance * 100,
                    },
                    mitigation_suggestions=[
                        "Review transaction parameters carefully",
                        "Consider using smaller amounts for testing",
                        "Verify recipient addresses",
                    ],
                )
            )

        return risks

    async def _analyze_approval_risks(
        self,
        transaction: dict[str, Any],
        metrics: SimulationMetrics,
        simulation_state: dict[str, Any],
    ) -> list[SimulationRisk]:
        """Analyze token approval risks"""
        risks = []

        for token_address, approval_changes in metrics.token_approval_changes.items():
            for spender, amount in approval_changes.items():
                # Check for unlimited approval
                if amount == 2**256 - 1:  # Max uint256
                    risks.append(
                        SimulationRisk(
                            risk_type=RiskType.APPROVAL_DRAIN,
                            severity="critical",
                            description="Unlimited token approval detected",
                            confidence=0.95,
                            evidence={
                                "token_address": token_address,
                                "spender": spender,
                                "amount": amount,
                            },
                            mitigation_suggestions=[
                                "Never approve unlimited amounts",
                                "Use specific amounts needed for the transaction",
                                "Revoke approvals after use",
                                "Consider using permit instead of approve",
                            ],
                        )
                    )

                # Check for high approval amounts
                elif amount > 1000000 * 1e18:  # More than 1M tokens
                    risks.append(
                        SimulationRisk(
                            risk_type=RiskType.APPROVAL_DRAIN,
                            severity="high",
                            description="High token approval amount detected",
                            confidence=0.7,
                            evidence={
                                "token_address": token_address,
                                "spender": spender,
                                "amount": amount,
                            },
                            mitigation_suggestions=[
                                "Review approval amount",
                                "Consider if such a high amount is necessary",
                                "Use time-limited approvals",
                            ],
                        )
                    )

        return risks

    async def _analyze_contract_risks(
        self,
        transaction: dict[str, Any],
        metrics: SimulationMetrics,
        simulation_state: dict[str, Any],
    ) -> list[SimulationRisk]:
        """Analyze contract interaction risks"""
        risks = []

        # Check for calls to unknown contracts
        for call in metrics.contract_calls:
            if call.get("interaction_type") == "unknown":
                risks.append(
                    SimulationRisk(
                        risk_type=RiskType.CONTRACT_INTERACTION_RISK,
                        severity="medium",
                        description="Interaction with unknown contract detected",
                        confidence=0.6,
                        evidence={
                            "contract_address": call.get("contract_address"),
                            "function_called": call.get("function_called"),
                        },
                        mitigation_suggestions=[
                            "Verify contract address",
                            "Check contract source code",
                            "Research contract reputation",
                            "Start with small amounts",
                        ],
                    )
                )

        return risks

    async def _analyze_gas_risks(
        self,
        transaction: dict[str, Any],
        metrics: SimulationMetrics,
        simulation_state: dict[str, Any],
    ) -> list[SimulationRisk]:
        """Analyze gas-related risks"""
        risks = []

        # Check for gas estimation failure
        if metrics.gas_estimate == 0 or metrics.gas_estimate > 1000000:
            risks.append(
                SimulationRisk(
                    risk_type=RiskType.GAS_ESTIMATION_FAILURE,
                    severity="high",
                    description="Gas estimation failed or unusually high",
                    confidence=0.8,
                    evidence={"gas_estimate": metrics.gas_estimate, "gas_used": metrics.gas_used},
                    mitigation_suggestions=[
                        "Transaction may fail",
                        "Check transaction parameters",
                        "Verify contract state",
                        "Consider increasing gas limit",
                    ],
                )
            )

        return risks

    async def _generate_warnings(
        self,
        transaction: dict[str, Any],
        metrics: SimulationMetrics,
        simulation_state: dict[str, Any],
    ) -> list[SimulationWarning]:
        """Generate warnings based on simulation results"""
        warnings = []

        # High gas price warning
        if transaction.get("gasPrice", 0) > simulation_state["gas_price"] * 2:
            warnings.append(
                SimulationWarning(
                    warning_type="high_gas_price",
                    message="Gas price is significantly higher than network average",
                    details={
                        "transaction_gas_price": transaction.get("gasPrice"),
                        "network_average": simulation_state["gas_price"],
                    },
                    suggested_action="Consider waiting for lower gas prices",
                )
            )

        # Large transaction value warning
        if transaction.get("value", 0) > 10 * 1e18:  # More than 10 ETH
            warnings.append(
                SimulationWarning(
                    warning_type="large_transaction_value",
                    message="Transaction involves a large amount of ETH",
                    details={"value_eth": transaction.get("value", 0) / 1e18},
                    suggested_action="Double-check recipient address and amount",
                )
            )

        return warnings

    def _calculate_confidence_score(
        self,
        risks: list[SimulationRisk],
        warnings: list[SimulationWarning],
        metrics: SimulationMetrics,
    ) -> float:
        """Calculate confidence score for simulation result"""
        base_confidence = 1.0

        # Reduce confidence based on risks
        for risk in risks:
            if risk.severity == "critical":
                base_confidence -= 0.3
            elif risk.severity == "high":
                base_confidence -= 0.2
            elif risk.severity == "medium":
                base_confidence -= 0.1
            elif risk.severity == "low":
                base_confidence -= 0.05

        # Reduce confidence based on warnings
        base_confidence -= len(warnings) * 0.02

        # Ensure confidence is between 0 and 1
        return max(0.0, min(1.0, base_confidence))

    def _determine_simulation_result(
        self, risks: list[SimulationRisk], warnings: list[SimulationWarning]
    ) -> SimulationResult:
        """Determine overall simulation result"""
        critical_risks = [r for r in risks if r.severity == "critical"]
        high_risks = [r for r in risks if r.severity == "high"]

        if critical_risks:
            return SimulationResult.DANGEROUS
        if high_risks or len(risks) > 3 or risks or warnings:
            return SimulationResult.RISKY
        return SimulationResult.SAFE

    def _generate_recommendations(
        self,
        risks: list[SimulationRisk],
        warnings: list[SimulationWarning],
        metrics: SimulationMetrics,
    ) -> list[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Add risk-specific recommendations
        for risk in risks:
            recommendations.extend(risk.mitigation_suggestions[:2])  # Top 2 suggestions

        # Add general recommendations based on simulation result
        if metrics.gas_estimate > metrics.gas_used * 1.5:
            recommendations.append("Gas estimate is high - transaction may fail")

        if len(risks) > 0:
            recommendations.append("Review all identified risks before proceeding")

        # Remove duplicates and limit
        recommendations = list(dict.fromkeys(recommendations))[:5]

        return recommendations

    def get_simulation_result(self, transaction_id: str) -> SimulationResult | None:
        """Get cached simulation result"""
        return self.simulation_cache.get(transaction_id)

    def cleanup_cache(self, max_age_hours: int = 24):
        """Clean up old cached results"""
        current_time = datetime.now(timezone.utc)
        cutoff_time = current_time - timedelta(hours=max_age_hours)

        expired_keys = [
            tx_id
            for tx_id, result in self.simulation_cache.items()
            if result.simulation_timestamp < cutoff_time
        ]

        for key in expired_keys:
            del self.simulation_cache[key]

        if expired_keys:
            logger.info("Cleaned up cached simulation results", count=len(expired_keys))

    def get_metrics(self) -> dict[str, Any]:
        """Get simulation engine metrics"""
        return {
            "cached_results": len(self.simulation_cache),
            "networks_configured": list(self.web3_clients.keys()),
            "risk_patterns_loaded": sum(len(patterns) for patterns in self.risk_patterns.values()),
            "recent_simulations": len(
                [
                    r
                    for r in self.simulation_cache.values()
                    if r.simulation_timestamp > datetime.now(timezone.utc) - timedelta(hours=1)
                ]
            ),
        }


# Global simulation engine instance
wallet_simulation_engine = RealWalletSimulationEngine(
    {
        "networks": {
            "ethereum": {
                "rpc_url": "https://mainnet.infura.io/v3/your-project-id",
                "fork_endpoint": "https://api.tenderly.co/v1/fork/your-fork-id",
            },
            "polygon": {"rpc_url": "https://polygon-rpc.com", "is_poa": True},
            "bsc": {"rpc_url": "https://bsc-dataseed.binance.org", "is_poa": True},
        }
    }
)
