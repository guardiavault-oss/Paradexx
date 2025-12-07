"""Contract utility functions."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def get_contract_abi(address: str, network: str) -> list[dict[str, Any]] | None:
    """Get contract ABI from block explorer or other sources."""
    try:
        # This would integrate with block explorer APIs
        # For now, return a mock ABI for common bridge functions

        mock_abi = [
            {
                "type": "function",
                "name": "deposit",
                "inputs": [
                    {"name": "token", "type": "address"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "to", "type": "address"},
                ],
                "outputs": [],
                "stateMutability": "nonpayable",
            },
            {
                "type": "function",
                "name": "withdraw",
                "inputs": [
                    {"name": "token", "type": "address"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "to", "type": "address"},
                ],
                "outputs": [],
                "stateMutability": "nonpayable",
            },
            {
                "type": "function",
                "name": "isValidSignature",
                "inputs": [
                    {"name": "hash", "type": "bytes32"},
                    {"name": "signature", "type": "bytes"},
                ],
                "outputs": [{"name": "", "type": "bytes4"}],
                "stateMutability": "view",
            },
            {
                "type": "event",
                "name": "Deposit",
                "inputs": [
                    {"name": "token", "type": "address", "indexed": True},
                    {"name": "amount", "type": "uint256", "indexed": False},
                    {"name": "to", "type": "address", "indexed": True},
                ],
            },
            {
                "type": "event",
                "name": "Withdrawal",
                "inputs": [
                    {"name": "token", "type": "address", "indexed": True},
                    {"name": "amount", "type": "uint256", "indexed": False},
                    {"name": "to", "type": "address", "indexed": True},
                ],
            },
        ]

        return mock_abi

    except Exception as e:
        logger.error(f"Error getting contract ABI: {e}")
        return None


async def analyze_contract_code(
    address: str, network: str, source_code: str | None = None
) -> dict[str, Any]:
    """Analyze contract source code for security issues."""

    analysis = {
        "has_source_code": source_code is not None,
        "code_quality_score": 0.0,
        "vulnerabilities": [],
        "functions": [],
        "events": [],
        "modifiers": [],
        "inheritance": [],
        "external_calls": [],
        "gas_optimizations": [],
    }

    try:
        if source_code:
            # Basic source code analysis
            analysis["code_quality_score"] = await _analyze_code_quality(source_code)
            analysis["vulnerabilities"] = await _scan_source_vulnerabilities(source_code)
            analysis["functions"] = await _extract_functions(source_code)
            analysis["events"] = await _extract_events(source_code)
            analysis["modifiers"] = await _extract_modifiers(source_code)
            analysis["inheritance"] = await _extract_inheritance(source_code)
            analysis["external_calls"] = await _find_external_calls(source_code)
            analysis["gas_optimizations"] = await _find_gas_optimizations(source_code)
        else:
            # Bytecode analysis
            analysis.update(await _analyze_bytecode(address, network))

    except Exception as e:
        logger.error(f"Error analyzing contract code: {e}")
        analysis["error"] = str(e)

    return analysis


async def _analyze_code_quality(source_code: str) -> float:
    """Analyze code quality metrics."""
    score = 5.0  # Base score

    # Check for common quality indicators
    if "pragma solidity" in source_code:
        score += 1.0

    if "// SPDX-License-Identifier" in source_code:
        score += 0.5

    if "modifier" in source_code:
        score += 0.5

    if "require(" in source_code:
        score += 0.5

    if "assert(" in source_code:
        score += 0.5

    # Check for code smells
    if "selfdestruct" in source_code:
        score -= 1.0

    if "delegatecall" in source_code:
        score -= 0.5

    if "assembly" in source_code:
        score -= 0.5

    return max(0.0, min(10.0, score))


async def _scan_source_vulnerabilities(source_code: str) -> list[dict[str, Any]]:
    """Scan source code for common vulnerabilities."""
    vulnerabilities = []

    # Check for reentrancy vulnerabilities
    if "call.value" in source_code and "nonReentrant" not in source_code:
        vulnerabilities.append(
            {
                "type": "reentrancy",
                "severity": "high",
                "title": "Potential Reentrancy Vulnerability",
                "description": "Contract uses call.value without reentrancy protection",
                "line": source_code.find("call.value"),
            }
        )

    # Check for integer overflow
    if "uint256" in source_code and "SafeMath" not in source_code:
        vulnerabilities.append(
            {
                "type": "integer_overflow",
                "severity": "medium",
                "title": "Potential Integer Overflow",
                "description": "Contract uses uint256 without SafeMath protection",
                "line": source_code.find("uint256"),
            }
        )

    # Check for access control issues
    if "onlyOwner" in source_code and "owner" not in source_code.lower():
        vulnerabilities.append(
            {
                "type": "access_control",
                "severity": "medium",
                "title": "Access Control Issue",
                "description": "onlyOwner modifier used but owner variable not found",
                "line": source_code.find("onlyOwner"),
            }
        )

    return vulnerabilities


async def _extract_functions(source_code: str) -> list[dict[str, Any]]:
    """Extract function information from source code."""
    functions = []

    # Simple regex-like extraction (would use proper parsing in production)
    lines = source_code.split("\n")
    for i, line in enumerate(lines):
        if "function " in line and "{" in line:
            functions.append(
                {
                    "name": line.split("function ")[1].split("(")[0].strip(),
                    "line": i + 1,
                    "visibility": "public" if "public" in line else "private",
                    "state_mutability": "nonpayable" if "payable" not in line else "payable",
                }
            )

    return functions


async def _extract_events(source_code: str) -> list[dict[str, Any]]:
    """Extract event information from source code."""
    events = []

    lines = source_code.split("\n")
    for i, line in enumerate(lines):
        if "event " in line and ";" in line:
            events.append({"name": line.split("event ")[1].split("(")[0].strip(), "line": i + 1})

    return events


async def _extract_modifiers(source_code: str) -> list[dict[str, Any]]:
    """Extract modifier information from source code."""
    modifiers = []

    lines = source_code.split("\n")
    for i, line in enumerate(lines):
        if "modifier " in line and "{" in line:
            modifiers.append(
                {"name": line.split("modifier ")[1].split("(")[0].strip(), "line": i + 1}
            )

    return modifiers


async def _extract_inheritance(source_code: str) -> list[str]:
    """Extract inheritance information from source code."""
    inheritance = []

    lines = source_code.split("\n")
    for line in lines:
        if "is " in line and "contract " in line:
            # Extract inherited contracts
            parts = line.split("is ")[1].split("{")[0].split(",")
            inheritance.extend([part.strip() for part in parts])

    return inheritance


async def _find_external_calls(source_code: str) -> list[dict[str, Any]]:
    """Find external calls in source code."""
    external_calls = []

    lines = source_code.split("\n")
    for i, line in enumerate(lines):
        if any(call in line for call in ["call(", "delegatecall(", "staticcall(", "send("]):
            external_calls.append({"type": "external_call", "line": i + 1, "content": line.strip()})

    return external_calls


async def _find_gas_optimizations(source_code: str) -> list[dict[str, Any]]:
    """Find potential gas optimizations."""
    optimizations = []

    lines = source_code.split("\n")
    for i, line in enumerate(lines):
        # Check for expensive operations
        if "for (" in line and "uint256" in line:
            optimizations.append(
                {
                    "type": "gas_optimization",
                    "severity": "low",
                    "title": "Potential Gas Optimization",
                    "description": "Consider using uint8 for loop counters if possible",
                    "line": i + 1,
                }
            )

        if "string" in line and "memory" in line:
            optimizations.append(
                {
                    "type": "gas_optimization",
                    "severity": "low",
                    "title": "String Storage Optimization",
                    "description": "Consider using bytes32 for fixed-length strings",
                    "line": i + 1,
                }
            )

    return optimizations


async def _analyze_bytecode(address: str, network: str) -> dict[str, Any]:
    """Analyze contract bytecode when source code is not available."""
    return {
        "bytecode_analysis": True,
        "has_constructor": True,  # Mock value
        "has_fallback": True,  # Mock value
        "has_receive": False,  # Mock value
        "bytecode_size": 1024,  # Mock value
        "analysis_limitations": [
            "Source code not available",
            "Limited analysis possible",
            "Recommend verifying contract source",
        ],
    }


def validate_contract_address(address: str) -> bool:
    """Validate contract address format."""
    if not address or not address.startswith("0x"):
        return False

    if len(address) != 42:
        return False

    try:
        int(address[2:], 16)
        return True
    except ValueError:
        return False


def format_contract_address(address: str) -> str:
    """Format contract address consistently."""
    if not validate_contract_address(address):
        raise ValueError("Invalid contract address format")

    return address.lower()


def get_contract_type_from_abi(abi: list[dict[str, Any]]) -> str:
    """Determine contract type from ABI."""
    if not abi:
        return "unknown"

    function_names = [item.get("name", "") for item in abi if item.get("type") == "function"]

    # Check for common contract patterns
    if any("transfer" in name.lower() for name in function_names):
        if any("approve" in name.lower() for name in function_names):
            return "erc20"
        if any("mint" in name.lower() for name in function_names):
            return "erc721"

    if any("deposit" in name.lower() for name in function_names):
        if any("withdraw" in name.lower() for name in function_names):
            return "bridge"

    if any("swap" in name.lower() for name in function_names):
        return "dex"

    if any("lend" in name.lower() for name in function_names):
        return "lending"

    if any("stake" in name.lower() for name in function_names):
        return "staking"

    return "unknown"
