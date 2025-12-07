#!/usr/bin/env python3
"""
Advanced Threat Detection Module
Sophisticated algorithms for detecting MEV attacks, flash loans, and other threats
"""

import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import structlog

from config.settings import settings

from .blockchain import MempoolTransaction, TransactionData, blockchain_manager

logger = structlog.get_logger(__name__)


class ThreatType(Enum):
    MEV_FRONT_RUNNING = "mev_front_running"
    MEV_BACK_RUNNING = "mev_back_running"
    SANDWICH_ATTACK = "sandwich_attack"
    FLASH_LOAN_ATTACK = "flash_loan_attack"
    ARBITRAGE_ATTACK = "arbitrage_attack"
    LIQUIDITY_MANIPULATION = "liquidity_manipulation"
    DUST_ATTACK = "dust_attack"
    PHISHING_CONTRACT = "phishing_contract"
    HONEYPOT_CONTRACT = "honeypot_contract"
    RUG_PULL = "rug_pull"
    WASH_TRADING = "wash_trading"
    UNUSUAL_GAS_USAGE = "unusual_gas_usage"
    RAPID_TRANSFERS = "rapid_transfers"
    LARGE_BALANCE_CHANGE = "large_balance_change"
    SUSPICIOUS_CONTRACT_CREATION = "suspicious_contract_creation"


class ThreatSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ThreatDetection:
    threat_id: str
    threat_type: ThreatType
    severity: ThreatSeverity
    wallet_address: str
    network: str
    description: str
    confidence: float
    timestamp: float
    metadata: dict[str, Any] = field(default_factory=dict)
    related_transactions: list[str] = field(default_factory=list)
    related_contracts: list[str] = field(default_factory=list)


@dataclass
class MEVPattern:
    front_run_tx: TransactionData | None = None
    target_tx: TransactionData | None = None
    back_run_tx: TransactionData | None = None
    profit: float = 0.0
    gas_cost: int = 0
    net_profit: float = 0.0


@dataclass
class FlashLoanPattern:
    loan_tx: TransactionData
    manipulation_txs: list[TransactionData]
    repayment_tx: TransactionData
    profit: float = 0.0
    loan_amount: int = 0


class MEVDetector:
    """Detect MEV (Maximal Extractable Value) attacks"""

    def __init__(self):
        self.pending_transactions: dict[str, MempoolTransaction] = {}
        self.transaction_pools: dict[str, list[MempoolTransaction]] = defaultdict(list)
        self.mev_patterns: list[MEVPattern] = []
        self.threshold_profit_eth = settings.mev_detection_threshold

    async def analyze_mempool_transaction(
        self, tx: MempoolTransaction, network: str
    ) -> list[ThreatDetection]:
        """Analyze mempool transaction for MEV patterns"""
        threats = []

        # Store transaction for pattern analysis
        self.pending_transactions[tx.hash] = tx

        # Check for front-running patterns
        front_run_threats = await self._detect_front_running(tx, network)
        threats.extend(front_run_threats)

        # Check for sandwich attacks
        sandwich_threats = await self._detect_sandwich_attack(tx, network)
        threats.extend(sandwich_threats)

        # Check for arbitrage patterns
        arbitrage_threats = await self._detect_arbitrage(tx, network)
        threats.extend(arbitrage_threats)

        return threats

    async def _detect_front_running(
        self, target_tx: MempoolTransaction, network: str
    ) -> list[ThreatDetection]:
        """Detect front-running attacks"""
        threats = []

        # Look for transactions with higher gas price that interact with same contracts
        for tx_hash, pending_tx in self.pending_transactions.items():
            if (
                pending_tx.gas_price > target_tx.gas_price
                and pending_tx.to_address == target_tx.to_address
                and pending_tx.from_address != target_tx.from_address
            ):
                # Calculate potential profit
                profit = await self._calculate_mev_profit(pending_tx, target_tx, network)

                if profit > self.threshold_profit_eth:
                    threat = ThreatDetection(
                        threat_id=f"mev_front_run_{tx_hash}_{target_tx.hash}",
                        threat_type=ThreatType.MEV_FRONT_RUNNING,
                        severity=ThreatSeverity.HIGH if profit > 1.0 else ThreatSeverity.MEDIUM,
                        wallet_address=pending_tx.from_address,
                        network=network,
                        description=f"Front-running attack detected with potential profit of {profit:.4f} ETH",
                        confidence=0.85,
                        timestamp=time.time(),
                        metadata={
                            "front_run_tx": pending_tx.hash,
                            "target_tx": target_tx.hash,
                            "profit_eth": profit,
                            "gas_price_diff": pending_tx.gas_price - target_tx.gas_price,
                        },
                        related_transactions=[pending_tx.hash, target_tx.hash],
                    )
                    threats.append(threat)

        return threats

    async def _detect_sandwich_attack(
        self, target_tx: MempoolTransaction, network: str
    ) -> list[ThreatDetection]:
        """Detect sandwich attacks"""
        threats = []

        # Look for pairs of transactions that sandwich the target
        front_runs = []
        back_runs = []

        for tx_hash, pending_tx in self.pending_transactions.items():
            if (
                pending_tx.gas_price > target_tx.gas_price
                and pending_tx.to_address == target_tx.to_address
            ):
                front_runs.append(pending_tx)
            elif (
                pending_tx.gas_price < target_tx.gas_price
                and pending_tx.to_address == target_tx.to_address
            ):
                back_runs.append(pending_tx)

        # Check for sandwich patterns
        for front_tx in front_runs:
            for back_tx in back_runs:
                if (
                    front_tx.from_address == back_tx.from_address
                    and front_tx.to_address == target_tx.to_address
                ):
                    profit = await self._calculate_sandwich_profit(
                        front_tx, target_tx, back_tx, network
                    )

                    if profit > settings.sandwich_attack_threshold:
                        threat = ThreatDetection(
                            threat_id=f"sandwich_{front_tx.hash}_{target_tx.hash}_{back_tx.hash}",
                            threat_type=ThreatType.SANDWICH_ATTACK,
                            severity=(
                                ThreatSeverity.CRITICAL if profit > 1.0 else ThreatSeverity.HIGH
                            ),
                            wallet_address=front_tx.from_address,
                            network=network,
                            description=f"Sandwich attack detected with profit of {profit:.4f} ETH",
                            confidence=0.92,
                            timestamp=time.time(),
                            metadata={
                                "front_run_tx": front_tx.hash,
                                "target_tx": target_tx.hash,
                                "back_run_tx": back_tx.hash,
                                "profit_eth": profit,
                            },
                            related_transactions=[front_tx.hash, target_tx.hash, back_tx.hash],
                        )
                        threats.append(threat)

        return threats

    async def _detect_arbitrage(
        self, tx: MempoolTransaction, network: str
    ) -> list[ThreatDetection]:
        """Detect arbitrage opportunities"""
        threats = []

        # Look for transactions that interact with multiple DEXs
        dex_contracts = self._get_known_dex_contracts(network)

        if tx.to_address in dex_contracts:
            # Check for complex arbitrage patterns
            arbitrage_profit = await self._calculate_arbitrage_profit(tx, network)

            if arbitrage_profit > settings.mev_detection_threshold:
                threat = ThreatDetection(
                    threat_id=f"arbitrage_{tx.hash}",
                    threat_type=ThreatType.ARBITRAGE_ATTACK,
                    severity=ThreatSeverity.MEDIUM,
                    wallet_address=tx.from_address,
                    network=network,
                    description=f"Arbitrage opportunity detected with potential profit of {arbitrage_profit:.4f} ETH",
                    confidence=0.75,
                    timestamp=time.time(),
                    metadata={
                        "arbitrage_tx": tx.hash,
                        "profit_eth": arbitrage_profit,
                        "dex_contract": tx.to_address,
                    },
                    related_transactions=[tx.hash],
                )
                threats.append(threat)

        return threats

    async def _calculate_mev_profit(
        self, front_tx: MempoolTransaction, target_tx: MempoolTransaction, network: str
    ) -> float:
        """Calculate potential MEV profit"""
        # This is a simplified calculation
        # In production, you'd analyze the actual transaction data and token prices

        gas_cost = (front_tx.gas * front_tx.gas_price) / 1e18  # Convert to ETH
        estimated_profit = 0.1  # Placeholder - would calculate based on actual data

        return max(0, estimated_profit - gas_cost)

    async def _calculate_sandwich_profit(
        self,
        front_tx: MempoolTransaction,
        target_tx: MempoolTransaction,
        back_tx: MempoolTransaction,
        network: str,
    ) -> float:
        """Calculate sandwich attack profit"""
        # Simplified calculation
        total_gas_cost = (
            (front_tx.gas * front_tx.gas_price) + (back_tx.gas * back_tx.gas_price)
        ) / 1e18

        estimated_profit = 0.2  # Placeholder - would calculate based on price impact
        return max(0, estimated_profit - total_gas_cost)

    async def _calculate_arbitrage_profit(self, tx: MempoolTransaction, network: str) -> float:
        """Calculate arbitrage profit"""
        # Simplified calculation
        gas_cost = (tx.gas * tx.gas_price) / 1e18
        estimated_profit = 0.05  # Placeholder
        return max(0, estimated_profit - gas_cost)

    def _get_known_dex_contracts(self, network: str) -> set[str]:
        """Get known DEX contract addresses"""
        dex_contracts = {
            "ethereum": {
                "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap V2 Router
                "0xE592427A0AEce92De3Edee1F18E0157C05861564",  # Uniswap V3 Router
                "0x1F98431c8aD98523631AE4a59f267346ea31F984",  # Uniswap V3 Factory
                "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",  # Uniswap V3 Router 2
                "0x1111111254fb6c44bAC0beD2854e76F90643097d",  # 1inch V4 Router
                "0x1111111254EEB25477B68fb85Ed929f73A960582",  # 1inch V5 Router
            },
            "polygon": {
                "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",  # QuickSwap Router
                "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",  # SushiSwap Router
            },
            "bsc": {
                "0x10ED43C718714eb63d5aA57B78B54704E256024E",  # PancakeSwap Router V2
                "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F",  # PancakeSwap Router V1
            },
        }

        return dex_contracts.get(network, set())


class FlashLoanDetector:
    """Detect flash loan attacks"""

    def __init__(self):
        self.flash_loan_contracts = self._get_flash_loan_contracts()
        self.pending_loans: dict[str, FlashLoanPattern] = {}

    async def analyze_transaction(self, tx: TransactionData, network: str) -> list[ThreatDetection]:
        """Analyze transaction for flash loan patterns"""
        threats = []

        # Check if transaction interacts with flash loan contracts
        if tx.to_address in self.flash_loan_contracts.get(network, set()):
            flash_loan_threats = await self._detect_flash_loan_attack(tx, network)
            threats.extend(flash_loan_threats)

        return threats

    async def _detect_flash_loan_attack(
        self, loan_tx: TransactionData, network: str
    ) -> list[ThreatDetection]:
        """Detect flash loan attacks"""
        threats = []

        # Look for manipulation transactions in the same block
        block = await blockchain_manager.get_provider(network).get_block(loan_tx.block_number)

        manipulation_txs = []
        for tx_data in block.transactions:
            if (
                tx_data.get("from", "").lower() == loan_tx.from_address.lower()
                and tx_data.get("hash", "") != loan_tx.hash
            ):
                manipulation_txs.append(tx_data)

        if manipulation_txs:
            # Calculate potential profit
            loan_amount = loan_tx.value
            estimated_profit = await self._calculate_flash_loan_profit(
                loan_tx, manipulation_txs, network
            )

            if estimated_profit > settings.flash_loan_threshold:
                threat = ThreatDetection(
                    threat_id=f"flash_loan_{loan_tx.hash}",
                    threat_type=ThreatType.FLASH_LOAN_ATTACK,
                    severity=(
                        ThreatSeverity.CRITICAL if estimated_profit > 1000 else ThreatSeverity.HIGH
                    ),
                    wallet_address=loan_tx.from_address,
                    network=network,
                    description=f"Flash loan attack detected with potential profit of {estimated_profit:.4f} ETH",
                    confidence=0.88,
                    timestamp=time.time(),
                    metadata={
                        "loan_tx": loan_tx.hash,
                        "loan_amount": loan_amount,
                        "profit_eth": estimated_profit,
                        "manipulation_txs": len(manipulation_txs),
                    },
                    related_transactions=[loan_tx.hash]
                    + [tx.get("hash", "") for tx in manipulation_txs],
                )
                threats.append(threat)

        return threats

    async def _calculate_flash_loan_profit(
        self, loan_tx: TransactionData, manipulation_txs: list[dict], network: str
    ) -> float:
        """Calculate flash loan attack profit"""
        # Simplified calculation
        # In production, you'd analyze the actual transaction data

        total_gas_cost = loan_tx.gas_used * loan_tx.gas_price / 1e18

        # Estimate profit based on manipulation complexity
        estimated_profit = len(manipulation_txs) * 0.1  # Placeholder

        return max(0, estimated_profit - total_gas_cost)

    def _get_flash_loan_contracts(self) -> dict[str, set[str]]:
        """Get known flash loan contract addresses"""
        return {
            "ethereum": {
                "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",  # Aave LendingPool
                "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",  # SushiSwap Flash Loan
                "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap Flash Loan
            },
            "polygon": {
                "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf",  # Aave LendingPool
            },
            "bsc": {
                "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F",  # PancakeSwap Flash Loan
            },
        }


class ContractAnalyzer:
    """Analyze smart contracts for malicious patterns"""

    def __init__(self):
        self.known_malicious_patterns = self._load_malicious_patterns()
        self.contract_cache: dict[str, dict[str, Any]] = {}

    async def analyze_contract(self, contract_address: str, network: str) -> list[ThreatDetection]:
        """Analyze contract for malicious patterns"""
        threats = []

        # Get contract code
        provider = blockchain_manager.get_provider(network)
        if not provider:
            return threats

        try:
            code = await provider.get_code(contract_address)

            if code == b"":
                return threats  # Not a contract

            # Analyze bytecode patterns
            bytecode_threats = await self._analyze_bytecode(code, contract_address, network)
            threats.extend(bytecode_threats)

            # Check against known malicious patterns
            pattern_threats = await self._check_malicious_patterns(code, contract_address, network)
            threats.extend(pattern_threats)

        except Exception as e:
            logger.error(
                f"Error analyzing contract {contract_address}", network=network, error=str(e)
            )

        return threats

    async def _analyze_bytecode(
        self, code: bytes, contract_address: str, network: str
    ) -> list[ThreatDetection]:
        """Analyze contract bytecode for suspicious patterns"""
        threats = []

        # Convert to hex string for analysis
        code_hex = code.hex()

        # Check for common malicious patterns
        if self._has_honeypot_pattern(code_hex):
            threat = ThreatDetection(
                threat_id=f"honeypot_{contract_address}",
                threat_type=ThreatType.HONEYPOT_CONTRACT,
                severity=ThreatSeverity.CRITICAL,
                wallet_address=contract_address,
                network=network,
                description="Honeypot contract detected - tokens cannot be sold",
                confidence=0.85,
                timestamp=time.time(),
                metadata={"contract_address": contract_address, "pattern": "honeypot"},
            )
            threats.append(threat)

        if self._has_rug_pull_pattern(code_hex):
            threat = ThreatDetection(
                threat_id=f"rug_pull_{contract_address}",
                threat_type=ThreatType.RUG_PULL,
                severity=ThreatSeverity.CRITICAL,
                wallet_address=contract_address,
                network=network,
                description="Rug pull contract detected - owner can drain liquidity",
                confidence=0.80,
                timestamp=time.time(),
                metadata={"contract_address": contract_address, "pattern": "rug_pull"},
            )
            threats.append(threat)

        return threats

    async def _check_malicious_patterns(
        self, code: bytes, contract_address: str, network: str
    ) -> list[ThreatDetection]:
        """Check against known malicious bytecode patterns"""
        threats = []

        code_hex = code.hex()

        for pattern_name, pattern_data in self.known_malicious_patterns.items():
            if pattern_data["signature"] in code_hex:
                threat = ThreatDetection(
                    threat_id=f"malicious_{contract_address}_{pattern_name}",
                    threat_type=ThreatType.PHISHING_CONTRACT,
                    severity=ThreatSeverity.HIGH,
                    wallet_address=contract_address,
                    network=network,
                    description=f"Known malicious pattern detected: {pattern_data['description']}",
                    confidence=0.90,
                    timestamp=time.time(),
                    metadata={
                        "contract_address": contract_address,
                        "pattern": pattern_name,
                        "description": pattern_data["description"],
                    },
                )
                threats.append(threat)

        return threats

    def _has_honeypot_pattern(self, code_hex: str) -> bool:
        """Check for honeypot patterns in bytecode"""
        # Simplified honeypot detection
        honeypot_signatures = [
            "608060405234801561001057600080fd5b50",  # Common honeypot pattern
            "600080fd5b600080fd5b600080fd5b600080fd5b",  # Revert patterns
        ]

        for signature in honeypot_signatures:
            if signature in code_hex:
                return True

        return False

    def _has_rug_pull_pattern(self, code_hex: str) -> bool:
        """Check for rug pull patterns in bytecode"""
        # Simplified rug pull detection
        rug_pull_signatures = [
            "transferFrom",  # Suspicious transfer functions
            "approve",  # Approval manipulation
            "burn",  # Token burning functions
        ]

        # Convert to bytecode signatures (simplified)
        for signature in rug_pull_signatures:
            if signature.lower() in code_hex.lower():
                return True

        return False

    def _load_malicious_patterns(self) -> dict[str, dict[str, str]]:
        """Load known malicious bytecode patterns"""
        return {
            "phishing_1": {
                "signature": "608060405234801561001057600080fd5b50",
                "description": "Common phishing contract pattern",
            },
            "honeypot_1": {
                "signature": "600080fd5b600080fd5b600080fd5b600080fd5b",
                "description": "Honeypot contract with revert patterns",
            },
            "rug_pull_1": {
                "signature": "transferFrom",
                "description": "Rug pull with transfer manipulation",
            },
        }


class BehavioralAnalyzer:
    """Analyze wallet behavior patterns"""

    def __init__(self):
        self.wallet_activity: dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.suspicious_patterns: dict[str, list[dict]] = defaultdict(list)

    async def analyze_wallet_behavior(
        self, wallet_address: str, network: str
    ) -> list[ThreatDetection]:
        """Analyze wallet behavior for suspicious patterns"""
        threats = []

        # Get recent transactions
        provider = blockchain_manager.get_provider(network)
        if not provider:
            return threats

        try:
            # Analyze transaction patterns
            rapid_transfer_threats = await self._detect_rapid_transfers(wallet_address, network)
            threats.extend(rapid_transfer_threats)

            # Analyze balance changes
            balance_threats = await self._detect_large_balance_changes(wallet_address, network)
            threats.extend(balance_threats)

            # Analyze gas usage patterns
            gas_threats = await self._detect_unusual_gas_usage(wallet_address, network)
            threats.extend(gas_threats)

        except Exception as e:
            logger.error(
                f"Error analyzing wallet behavior for {wallet_address}",
                network=network,
                error=str(e),
            )

        return threats

    async def _detect_rapid_transfers(
        self, wallet_address: str, network: str
    ) -> list[ThreatDetection]:
        """Detect rapid transfer patterns"""
        threats = []

        # This would analyze recent transaction history
        # For now, we'll use a simplified approach

        recent_tx_count = await blockchain_manager.get_transaction_count(wallet_address, network)

        if recent_tx_count > settings.rapid_transfer_threshold:
            threat = ThreatDetection(
                threat_id=f"rapid_transfers_{wallet_address}",
                threat_type=ThreatType.RAPID_TRANSFERS,
                severity=ThreatSeverity.MEDIUM,
                wallet_address=wallet_address,
                network=network,
                description=f"Rapid transfer activity detected: {recent_tx_count} transactions",
                confidence=0.70,
                timestamp=time.time(),
                metadata={"transaction_count": recent_tx_count},
            )
            threats.append(threat)

        return threats

    async def _detect_large_balance_changes(
        self, wallet_address: str, network: str
    ) -> list[ThreatDetection]:
        """Detect large balance changes"""
        threats = []

        # This would compare current balance with historical data
        # For now, we'll use a simplified approach

        current_balance = await blockchain_manager.get_balance(wallet_address, network)
        balance_eth = current_balance / 1e18

        if balance_eth > settings.large_balance_change_threshold:
            threat = ThreatDetection(
                threat_id=f"large_balance_{wallet_address}",
                threat_type=ThreatType.LARGE_BALANCE_CHANGE,
                severity=ThreatSeverity.HIGH if balance_eth > 100 else ThreatSeverity.MEDIUM,
                wallet_address=wallet_address,
                network=network,
                description=f"Large balance change detected: {balance_eth:.4f} ETH",
                confidence=0.80,
                timestamp=time.time(),
                metadata={"balance_eth": balance_eth},
            )
            threats.append(threat)

        return threats

    async def _detect_unusual_gas_usage(
        self, wallet_address: str, network: str
    ) -> list[ThreatDetection]:
        """Detect unusual gas usage patterns"""
        threats = []

        # This would analyze gas usage patterns from recent transactions
        # For now, we'll use a simplified approach

        # Placeholder for gas analysis
        unusual_gas = False

        if unusual_gas:
            threat = ThreatDetection(
                threat_id=f"unusual_gas_{wallet_address}",
                threat_type=ThreatType.UNUSUAL_GAS_USAGE,
                severity=ThreatSeverity.LOW,
                wallet_address=wallet_address,
                network=network,
                description="Unusual gas usage pattern detected",
                confidence=0.60,
                timestamp=time.time(),
                metadata={},
            )
            threats.append(threat)

        return threats


class ThreatDetectionEngine:
    """Main threat detection engine"""

    def __init__(self):
        self.mev_detector = MEVDetector()
        self.flash_loan_detector = FlashLoanDetector()
        self.contract_analyzer = ContractAnalyzer()
        self.behavioral_analyzer = BehavioralAnalyzer()
        self.detected_threats: list[ThreatDetection] = []
        self.threat_callbacks: list[callable] = []

    async def analyze_mempool_transaction(
        self, tx: MempoolTransaction, network: str
    ) -> list[ThreatDetection]:
        """Analyze mempool transaction for threats"""
        all_threats = []

        # MEV detection
        mev_threats = await self.mev_detector.analyze_mempool_transaction(tx, network)
        all_threats.extend(mev_threats)

        return all_threats

    async def analyze_confirmed_transaction(
        self, tx: TransactionData, network: str
    ) -> list[ThreatDetection]:
        """Analyze confirmed transaction for threats"""
        all_threats = []

        # Flash loan detection
        flash_loan_threats = await self.flash_loan_detector.analyze_transaction(tx, network)
        all_threats.extend(flash_loan_threats)

        # Contract analysis for new contracts
        if tx.to_address and tx.to_address != "0x0000000000000000000000000000000000000000":
            contract_threats = await self.contract_analyzer.analyze_contract(tx.to_address, network)
            all_threats.extend(contract_threats)

        return all_threats

    async def analyze_wallet(self, wallet_address: str, network: str) -> list[ThreatDetection]:
        """Analyze wallet for threats"""
        all_threats = []

        # Behavioral analysis
        behavioral_threats = await self.behavioral_analyzer.analyze_wallet_behavior(
            wallet_address, network
        )
        all_threats.extend(behavioral_threats)

        return all_threats

    async def process_threat(self, threat: ThreatDetection):
        """Process detected threat"""
        self.detected_threats.append(threat)

        # Notify callbacks
        for callback in self.threat_callbacks:
            try:
                await callback(threat)
            except Exception as e:
                logger.error("Error in threat callback", error=str(e))

        logger.warning(
            "Threat detected",
            threat_type=threat.threat_type.value,
            severity=threat.severity.value,
            wallet=threat.wallet_address,
            network=threat.network,
            confidence=threat.confidence,
        )

    def add_threat_callback(self, callback: callable):
        """Add callback for threat notifications"""
        self.threat_callbacks.append(callback)

    def remove_threat_callback(self, callback: callable):
        """Remove threat callback"""
        if callback in self.threat_callbacks:
            self.threat_callbacks.remove(callback)

    def get_recent_threats(self, hours: int = 24) -> list[ThreatDetection]:
        """Get recent threats within specified time window"""
        cutoff_time = time.time() - (hours * 3600)
        return [threat for threat in self.detected_threats if threat.timestamp > cutoff_time]

    def get_threat_stats(self) -> dict[str, Any]:
        """Get threat detection statistics"""
        recent_threats = self.get_recent_threats(24)

        stats = {
            "total_threats": len(self.detected_threats),
            "recent_threats_24h": len(recent_threats),
            "threat_types": {},
            "severity_distribution": {},
            "network_distribution": {},
        }

        # Count by threat type
        for threat in recent_threats:
            threat_type = threat.threat_type.value
            stats["threat_types"][threat_type] = stats["threat_types"].get(threat_type, 0) + 1

            severity = threat.severity.value
            stats["severity_distribution"][severity] = (
                stats["severity_distribution"].get(severity, 0) + 1
            )

            network = threat.network
            stats["network_distribution"][network] = (
                stats["network_distribution"].get(network, 0) + 1
            )

        return stats


# Global threat detection engine instance
threat_detection_engine = ThreatDetectionEngine()
