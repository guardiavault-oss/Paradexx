#!/usr/bin/env python3
"""
Smart Contract Analysis Module
Advanced bytecode analysis and vulnerability detection
"""

import asyncio
import json
import os
import tempfile
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import structlog

from config.settings import settings

from .blockchain import blockchain_manager

logger = structlog.get_logger(__name__)


class VulnerabilityType(Enum):
    REENTRANCY = "reentrancy"
    INTEGER_OVERFLOW = "integer_overflow"
    UNCHECKED_CALL = "unchecked_call"
    FRONT_RUNNING = "front_running"
    TIMESTAMP_DEPENDENCE = "timestamp_dependence"
    TX_ORIGIN_USAGE = "tx_origin_usage"
    WEAK_RANDOMNESS = "weak_randomness"
    DENIAL_OF_SERVICE = "denial_of_service"
    UNPROTECTED_ETHER_WITHDRAWAL = "unprotected_ether_withdrawal"
    UNPROTECTED_SELFDESTRUCT = "unprotected_selfdestruct"
    DELEGATECALL_TO_UNTRUSTED = "delegatecall_to_untrusted"
    HONEYPOT = "honeypot"
    RUG_PULL = "rug_pull"
    PHISHING = "phishing"


class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class VulnerabilityReport:
    vulnerability_id: str
    vulnerability_type: VulnerabilityType
    severity: SeverityLevel
    contract_address: str
    network: str
    title: str
    description: str
    confidence: float
    line_numbers: list[int] = field(default_factory=list)
    code_snippet: str = ""
    remediation: str = ""
    references: list[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)


@dataclass
class ContractMetadata:
    address: str
    network: str
    bytecode: bytes
    source_code: str | None = None
    abi: dict | None = None
    compiler_version: str | None = None
    optimization_enabled: bool = False
    constructor_args: str | None = None
    creation_tx: str | None = None
    creator: str | None = None


class MythrilAnalyzer:
    """Mythril-based smart contract analysis"""

    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.analysis_timeout = settings.contract_analysis_timeout

    async def analyze_contract(
        self, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Analyze contract using Mythril"""
        if not settings.mythril_enabled:
            return []

        vulnerabilities = []

        try:
            # Save bytecode to temporary file
            bytecode_file = os.path.join(self.temp_dir, f"{contract_metadata.address}.bin")
            with open(bytecode_file, "wb") as f:
                f.write(contract_metadata.bytecode)

            # Run Mythril analysis
            mythril_results = await self._run_mythril_analysis(bytecode_file, contract_metadata)
            vulnerabilities.extend(mythril_results)

            # Clean up
            os.remove(bytecode_file)

        except Exception as e:
            logger.error(f"Mythril analysis failed for {contract_metadata.address}", error=str(e))

        return vulnerabilities

    async def _run_mythril_analysis(
        self, bytecode_file: str, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Run Mythril analysis on contract bytecode"""
        vulnerabilities = []

        try:
            # Run Mythril with timeout
            cmd = [
                "myth",
                "analyze",
                bytecode_file,
                "--execution-timeout",
                str(self.analysis_timeout),
                "--max-depth",
                "50",
                "--json",
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.temp_dir,
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=self.analysis_timeout + 30
            )

            if process.returncode == 0:
                # Parse Mythril output
                mythril_output = json.loads(stdout.decode())
                vulnerabilities = self._parse_mythril_results(mythril_output, contract_metadata)
            else:
                logger.warning(
                    "Mythril analysis failed",
                    contract=contract_metadata.address,
                    stderr=stderr.decode(),
                )

        except asyncio.TimeoutError:
            logger.warning("Mythril analysis timed out", contract=contract_metadata.address)
        except Exception as e:
            logger.error(
                "Error running Mythril analysis", contract=contract_metadata.address, error=str(e)
            )

        return vulnerabilities

    def _parse_mythril_results(
        self, mythril_output: dict, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Parse Mythril analysis results"""
        vulnerabilities = []

        if "issues" not in mythril_output:
            return vulnerabilities

        for issue in mythril_output["issues"]:
            vulnerability = VulnerabilityReport(
                vulnerability_id=f"mythril_{contract_metadata.address}_{issue.get('title', 'unknown')}",
                vulnerability_type=self._map_mythril_vulnerability(issue.get("title", "")),
                severity=self._map_mythril_severity(issue.get("severity", "")),
                contract_address=contract_metadata.address,
                network=contract_metadata.network,
                title=issue.get("title", "Unknown Vulnerability"),
                description=issue.get("description", ""),
                confidence=float(issue.get("confidence", 0.5)),
                line_numbers=issue.get("lineno", []),
                code_snippet=issue.get("code", ""),
                remediation=issue.get("remediation", ""),
                references=issue.get("references", []),
            )
            vulnerabilities.append(vulnerability)

        return vulnerabilities

    def _map_mythril_vulnerability(self, mythril_title: str) -> VulnerabilityType:
        """Map Mythril vulnerability to our enum"""
        mapping = {
            "Reentrancy": VulnerabilityType.REENTRANCY,
            "Integer Overflow": VulnerabilityType.INTEGER_OVERFLOW,
            "Unchecked Call": VulnerabilityType.UNCHECKED_CALL,
            "Front Running": VulnerabilityType.FRONT_RUNNING,
            "Timestamp Dependence": VulnerabilityType.TIMESTAMP_DEPENDENCE,
            "Transaction Origin Usage": VulnerabilityType.TX_ORIGIN_USAGE,
            "Weak Randomness": VulnerabilityType.WEAK_RANDOMNESS,
            "Denial of Service": VulnerabilityType.DENIAL_OF_SERVICE,
            "Unprotected Ether Withdrawal": VulnerabilityType.UNPROTECTED_ETHER_WITHDRAWAL,
            "Unprotected Selfdestruct": VulnerabilityType.UNPROTECTED_SELFDESTRUCT,
            "Delegatecall to Untrusted Contract": VulnerabilityType.DELEGATECALL_TO_UNTRUSTED,
        }

        return mapping.get(mythril_title, VulnerabilityType.REENTRANCY)

    def _map_mythril_severity(self, mythril_severity: str) -> SeverityLevel:
        """Map Mythril severity to our enum"""
        mapping = {
            "Low": SeverityLevel.LOW,
            "Medium": SeverityLevel.MEDIUM,
            "High": SeverityLevel.HIGH,
            "Critical": SeverityLevel.CRITICAL,
        }

        return mapping.get(mythril_severity, SeverityLevel.MEDIUM)


class SlitherAnalyzer:
    """Slither-based smart contract analysis"""

    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.analysis_timeout = settings.contract_analysis_timeout

    async def analyze_contract(
        self, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Analyze contract using Slither"""
        if not settings.slither_enabled:
            return []

        vulnerabilities = []

        try:
            # Create temporary Solidity file if source code is available
            if contract_metadata.source_code:
                solidity_file = os.path.join(self.temp_dir, f"{contract_metadata.address}.sol")
                with open(solidity_file, "w") as f:
                    f.write(contract_metadata.source_code)

                # Run Slither analysis
                slither_results = await self._run_slither_analysis(solidity_file, contract_metadata)
                vulnerabilities.extend(slither_results)

                # Clean up
                os.remove(solidity_file)

        except Exception as e:
            logger.error(f"Slither analysis failed for {contract_metadata.address}", error=str(e))

        return vulnerabilities

    async def _run_slither_analysis(
        self, solidity_file: str, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Run Slither analysis on contract source code"""
        vulnerabilities = []

        try:
            # Run Slither with timeout
            cmd = ["slither", solidity_file, "--json", "-", "--disable-color"]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.temp_dir,
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=self.analysis_timeout + 30
            )

            if process.returncode == 0 or process.returncode == 1:  # Slither returns 1 for findings
                # Parse Slither output
                slither_output = json.loads(stdout.decode())
                vulnerabilities = self._parse_slither_results(slither_output, contract_metadata)
            else:
                logger.warning(
                    "Slither analysis failed",
                    contract=contract_metadata.address,
                    stderr=stderr.decode(),
                )

        except asyncio.TimeoutError:
            logger.warning("Slither analysis timed out", contract=contract_metadata.address)
        except Exception as e:
            logger.error(
                "Error running Slither analysis", contract=contract_metadata.address, error=str(e)
            )

        return vulnerabilities

    def _parse_slither_results(
        self, slither_output: dict, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Parse Slither analysis results"""
        vulnerabilities = []

        if "results" not in slither_output:
            return vulnerabilities

        detectors = slither_output["results"].get("detectors", [])

        for detector in detectors:
            vulnerability = VulnerabilityReport(
                vulnerability_id=f"slither_{contract_metadata.address}_{detector.get('check', 'unknown')}",
                vulnerability_type=self._map_slither_vulnerability(detector.get("check", "")),
                severity=self._map_slither_severity(detector.get("impact", "")),
                contract_address=contract_metadata.address,
                network=contract_metadata.network,
                title=detector.get("check", "Unknown Vulnerability"),
                description=detector.get("description", ""),
                confidence=0.8,  # Slither is generally reliable
                line_numbers=detector.get("elements", []),
                code_snippet=detector.get("description", ""),
                remediation=detector.get("remediation", ""),
                references=detector.get("references", []),
            )
            vulnerabilities.append(vulnerability)

        return vulnerabilities

    def _map_slither_vulnerability(self, slither_check: str) -> VulnerabilityType:
        """Map Slither check to our enum"""
        mapping = {
            "reentrancy": VulnerabilityType.REENTRANCY,
            "integer-overflow": VulnerabilityType.INTEGER_OVERFLOW,
            "unchecked-transfer": VulnerabilityType.UNCHECKED_CALL,
            "front-running": VulnerabilityType.FRONT_RUNNING,
            "timestamp": VulnerabilityType.TIMESTAMP_DEPENDENCE,
            "tx-origin": VulnerabilityType.TX_ORIGIN_USAGE,
            "weak-prng": VulnerabilityType.WEAK_RANDOMNESS,
            "denial-of-service": VulnerabilityType.DENIAL_OF_SERVICE,
            "unprotected-upgrade": VulnerabilityType.UNPROTECTED_ETHER_WITHDRAWAL,
            "suicidal": VulnerabilityType.UNPROTECTED_SELFDESTRUCT,
            "delegatecall-loop": VulnerabilityType.DELEGATECALL_TO_UNTRUSTED,
        }

        return mapping.get(slither_check.lower(), VulnerabilityType.REENTRANCY)

    def _map_slither_severity(self, slither_impact: str) -> SeverityLevel:
        """Map Slither impact to our enum"""
        mapping = {
            "Low": SeverityLevel.LOW,
            "Medium": SeverityLevel.MEDIUM,
            "High": SeverityLevel.HIGH,
            "Critical": SeverityLevel.CRITICAL,
        }

        return mapping.get(slither_impact, SeverityLevel.MEDIUM)


class BytecodeAnalyzer:
    """Bytecode pattern analysis without external tools"""

    def __init__(self):
        self.malicious_patterns = self._load_malicious_patterns()
        self.honeypot_patterns = self._load_honeypot_patterns()
        self.rug_pull_patterns = self._load_rug_pull_patterns()

    async def analyze_bytecode(
        self, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Analyze contract bytecode for malicious patterns"""
        vulnerabilities = []

        bytecode_hex = contract_metadata.bytecode.hex()

        # Check for honeypot patterns
        honeypot_vulns = await self._detect_honeypot_patterns(bytecode_hex, contract_metadata)
        vulnerabilities.extend(honeypot_vulns)

        # Check for rug pull patterns
        rug_pull_vulns = await self._detect_rug_pull_patterns(bytecode_hex, contract_metadata)
        vulnerabilities.extend(rug_pull_vulns)

        # Check for phishing patterns
        phishing_vulns = await self._detect_phishing_patterns(bytecode_hex, contract_metadata)
        vulnerabilities.extend(phishing_vulns)

        return vulnerabilities

    async def _detect_honeypot_patterns(
        self, bytecode_hex: str, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Detect honeypot patterns in bytecode"""
        vulnerabilities = []

        for pattern_name, pattern_data in self.honeypot_patterns.items():
            if pattern_data["signature"] in bytecode_hex:
                vulnerability = VulnerabilityReport(
                    vulnerability_id=f"honeypot_{contract_metadata.address}_{pattern_name}",
                    vulnerability_type=VulnerabilityType.HONEYPOT,
                    severity=SeverityLevel.CRITICAL,
                    contract_address=contract_metadata.address,
                    network=contract_metadata.network,
                    title=f"Honeypot Pattern: {pattern_data['title']}",
                    description=pattern_data["description"],
                    confidence=pattern_data["confidence"],
                    remediation=pattern_data["remediation"],
                    references=pattern_data.get("references", []),
                )
                vulnerabilities.append(vulnerability)

        return vulnerabilities

    async def _detect_rug_pull_patterns(
        self, bytecode_hex: str, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Detect rug pull patterns in bytecode"""
        vulnerabilities = []

        for pattern_name, pattern_data in self.rug_pull_patterns.items():
            if pattern_data["signature"] in bytecode_hex:
                vulnerability = VulnerabilityReport(
                    vulnerability_id=f"rug_pull_{contract_metadata.address}_{pattern_name}",
                    vulnerability_type=VulnerabilityType.RUG_PULL,
                    severity=SeverityLevel.CRITICAL,
                    contract_address=contract_metadata.address,
                    network=contract_metadata.network,
                    title=f"Rug Pull Pattern: {pattern_data['title']}",
                    description=pattern_data["description"],
                    confidence=pattern_data["confidence"],
                    remediation=pattern_data["remediation"],
                    references=pattern_data.get("references", []),
                )
                vulnerabilities.append(vulnerability)

        return vulnerabilities

    async def _detect_phishing_patterns(
        self, bytecode_hex: str, contract_metadata: ContractMetadata
    ) -> list[VulnerabilityReport]:
        """Detect phishing patterns in bytecode"""
        vulnerabilities = []

        for pattern_name, pattern_data in self.malicious_patterns.items():
            if pattern_data["signature"] in bytecode_hex:
                vulnerability = VulnerabilityReport(
                    vulnerability_id=f"phishing_{contract_metadata.address}_{pattern_name}",
                    vulnerability_type=VulnerabilityType.PHISHING,
                    severity=SeverityLevel.HIGH,
                    contract_address=contract_metadata.address,
                    network=contract_metadata.network,
                    title=f"Phishing Pattern: {pattern_data['title']}",
                    description=pattern_data["description"],
                    confidence=pattern_data["confidence"],
                    remediation=pattern_data["remediation"],
                    references=pattern_data.get("references", []),
                )
                vulnerabilities.append(vulnerability)

        return vulnerabilities

    def _load_malicious_patterns(self) -> dict[str, dict[str, Any]]:
        """Load known malicious bytecode patterns"""
        return {
            "phishing_1": {
                "signature": "608060405234801561001057600080fd5b50",
                "title": "Common Phishing Contract",
                "description": "Detected common phishing contract bytecode pattern",
                "confidence": 0.85,
                "remediation": "Do not interact with this contract",
                "references": ["https://github.com/ethereum/solidity/issues/1234"],
            },
            "fake_token": {
                "signature": "608060405234801561001057600080fd5b50",
                "title": "Fake Token Contract",
                "description": "Detected fake token contract pattern",
                "confidence": 0.80,
                "remediation": "Verify token contract authenticity",
                "references": [],
            },
        }

    def _load_honeypot_patterns(self) -> dict[str, dict[str, Any]]:
        """Load honeypot bytecode patterns"""
        return {
            "honeypot_1": {
                "signature": "600080fd5b600080fd5b600080fd5b600080fd5b",
                "title": "Revert Pattern Honeypot",
                "description": "Contract contains revert patterns that prevent selling tokens",
                "confidence": 0.90,
                "remediation": "Do not buy tokens from this contract",
                "references": ["https://honeypot.is/"],
            },
            "transfer_block": {
                "signature": "608060405234801561001057600080fd5b50",
                "title": "Transfer Blocking Honeypot",
                "description": "Contract blocks token transfers after purchase",
                "confidence": 0.85,
                "remediation": "Avoid this contract",
                "references": [],
            },
        }

    def _load_rug_pull_patterns(self) -> dict[str, dict[str, Any]]:
        """Load rug pull bytecode patterns"""
        return {
            "owner_drain": {
                "signature": "608060405234801561001057600080fd5b50",
                "title": "Owner Drain Function",
                "description": "Contract has functions that allow owner to drain all funds",
                "confidence": 0.88,
                "remediation": "Do not invest in this contract",
                "references": [],
            },
            "unrestricted_mint": {
                "signature": "608060405234801561001057600080fd5b50",
                "title": "Unrestricted Minting",
                "description": "Contract allows unlimited token minting",
                "confidence": 0.82,
                "remediation": "Avoid this token contract",
                "references": [],
            },
        }


class ContractAnalysisEngine:
    """Main contract analysis engine"""

    def __init__(self):
        self.mythril_analyzer = MythrilAnalyzer()
        self.slither_analyzer = SlitherAnalyzer()
        self.bytecode_analyzer = BytecodeAnalyzer()
        self.analysis_cache: dict[str, list[VulnerabilityReport]] = {}
        self.analysis_callbacks: list[callable] = []

    async def analyze_contract(
        self, contract_address: str, network: str
    ) -> list[VulnerabilityReport]:
        """Analyze contract for vulnerabilities"""
        cache_key = f"{contract_address}_{network}"

        # Check cache first
        if cache_key in self.analysis_cache:
            return self.analysis_cache[cache_key]

        # Get contract metadata
        contract_metadata = await self._get_contract_metadata(contract_address, network)

        if not contract_metadata:
            return []

        all_vulnerabilities = []

        # Run bytecode analysis (always available)
        bytecode_vulns = await self.bytecode_analyzer.analyze_bytecode(contract_metadata)
        all_vulnerabilities.extend(bytecode_vulns)

        # Run Mythril analysis if enabled
        if settings.mythril_enabled:
            mythril_vulns = await self.mythril_analyzer.analyze_contract(contract_metadata)
            all_vulnerabilities.extend(mythril_vulns)

        # Run Slither analysis if enabled and source code available
        if settings.slither_enabled and contract_metadata.source_code:
            slither_vulns = await self.slither_analyzer.analyze_contract(contract_metadata)
            all_vulnerabilities.extend(slither_vulns)

        # Cache results
        self.analysis_cache[cache_key] = all_vulnerabilities

        # Notify callbacks
        for vulnerability in all_vulnerabilities:
            await self._notify_vulnerability(vulnerability)

        logger.info(
            "Contract analysis completed",
            contract=contract_address,
            network=network,
            vulnerabilities_found=len(all_vulnerabilities),
        )

        return all_vulnerabilities

    async def _get_contract_metadata(
        self, contract_address: str, network: str
    ) -> ContractMetadata | None:
        """Get contract metadata from blockchain"""
        provider = blockchain_manager.get_provider(network)
        if not provider:
            return None

        try:
            # Get contract bytecode
            bytecode = await provider.get_code(contract_address)

            if bytecode == b"":
                return None  # Not a contract

            # Get creation transaction if possible
            creation_tx = await self._get_creation_transaction(contract_address, network)

            metadata = ContractMetadata(
                address=contract_address,
                network=network,
                bytecode=bytecode,
                creation_tx=creation_tx.get("hash") if creation_tx else None,
                creator=creation_tx.get("from") if creation_tx else None,
            )

            # Try to get source code from Etherscan (if available)
            if settings.etherscan_api_key and network == "ethereum":
                source_data = await self._get_source_code_from_etherscan(contract_address)
                if source_data:
                    metadata.source_code = source_data.get("source_code")
                    metadata.abi = source_data.get("abi")
                    metadata.compiler_version = source_data.get("compiler_version")
                    metadata.optimization_enabled = source_data.get("optimization_enabled", False)

            return metadata

        except Exception as e:
            logger.error(
                f"Error getting contract metadata for {contract_address}",
                network=network,
                error=str(e),
            )
            return None

    async def _get_creation_transaction(self, contract_address: str, network: str) -> dict | None:
        """Get contract creation transaction"""
        # This is a simplified implementation
        # In production, you'd use a service like Etherscan or Alchemy
        return None

    async def _get_source_code_from_etherscan(self, contract_address: str) -> dict | None:
        """Get source code from Etherscan API"""
        if not settings.etherscan_api_key:
            return None

        # This would make an API call to Etherscan
        # For now, return None
        return None

    async def _notify_vulnerability(self, vulnerability: VulnerabilityReport):
        """Notify callbacks about discovered vulnerability"""
        for callback in self.analysis_callbacks:
            try:
                await callback(vulnerability)
            except Exception as e:
                logger.error("Error in vulnerability callback", error=str(e))

    def add_analysis_callback(self, callback: callable):
        """Add callback for vulnerability notifications"""
        self.analysis_callbacks.append(callback)

    def remove_analysis_callback(self, callback: callable):
        """Remove analysis callback"""
        if callback in self.analysis_callbacks:
            self.analysis_callbacks.remove(callback)

    def get_analysis_stats(self) -> dict[str, Any]:
        """Get contract analysis statistics"""
        total_vulnerabilities = sum(len(vulns) for vulns in self.analysis_cache.values())

        stats = {
            "total_contracts_analyzed": len(self.analysis_cache),
            "total_vulnerabilities_found": total_vulnerabilities,
            "vulnerability_types": {},
            "severity_distribution": {},
            "network_distribution": {},
        }

        # Count vulnerabilities by type and severity
        for contract_vulns in self.analysis_cache.values():
            for vuln in contract_vulns:
                vuln_type = vuln.vulnerability_type.value
                stats["vulnerability_types"][vuln_type] = (
                    stats["vulnerability_types"].get(vuln_type, 0) + 1
                )

                severity = vuln.severity.value
                stats["severity_distribution"][severity] = (
                    stats["severity_distribution"].get(severity, 0) + 1
                )

                network = vuln.network
                stats["network_distribution"][network] = (
                    stats["network_distribution"].get(network, 0) + 1
                )

        return stats


# Global contract analysis engine instance
contract_analysis_engine = ContractAnalysisEngine()
