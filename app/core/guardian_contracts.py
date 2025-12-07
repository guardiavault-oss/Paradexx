#!/usr/bin/env python3
"""
Guardian Contracts System
On-chain programmable self-defense rules
Enforces rules directly on-chain without server dependency
"""

import json
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from web3 import Web3
import structlog

logger = structlog.get_logger(__name__)


class RuleType(Enum):
    """Types of guardian rules"""
    MAX_TRANSACTION_VALUE = "max_transaction_value"
    MAX_APPROVAL_AMOUNT = "max_approval_amount"
    BLOCK_UNKNOWN_ROUTERS = "block_unknown_routers"
    BLOCK_PROXY_CONTRACTS = "block_proxy_contracts"
    REQUIRED_CONFIRMATION = "required_confirmation"
    TIME_LIMIT = "time_limit"
    DAILY_LIMIT = "daily_limit"
    WHITELIST_ONLY = "whitelist_only"
    CUSTOM = "custom"


@dataclass
class GuardianRule:
    """Guardian contract rule"""
    rule_id: str
    rule_type: RuleType
    parameters: Dict[str, Any]
    enabled: bool = True
    description: str = ""


@dataclass
class GuardianContract:
    """Guardian contract configuration"""
    contract_address: str
    wallet_address: str
    chain_id: int
    rules: List[GuardianRule] = field(default_factory=list)
    deployed: bool = False
    deployment_tx: Optional[str] = None
    gas_estimate: int = 0


class GuardianContracts:
    """
    Guardian Contracts System
    Deploys and manages on-chain programmable self-defense contracts
    """
    
    def __init__(self):
        self.contracts: Dict[str, GuardianContract] = {}
        self.w3 = Web3()
        self._load_contract_abi()
    
    def _load_contract_abi(self):
        """Load Guardian contract ABI"""
        # Simplified ABI - in production would load from file
        self.contract_abi = [
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "value", "type": "uint256"},
                    {"name": "data", "type": "bytes"}
                ],
                "name": "validateTransaction",
                "outputs": [
                    {"name": "allowed", "type": "bool"},
                    {"name": "reason", "type": "string"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "ruleId", "type": "string"},
                    {"name": "ruleType", "type": "uint8"},
                    {"name": "parameters", "type": "bytes"}
                ],
                "name": "addRule",
                "outputs": [],
                "stateMutability": "nonPayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "ruleId", "type": "string"}
                ],
                "name": "removeRule",
                "outputs": [],
                "stateMutability": "nonPayable",
                "type": "function"
            }
        ]
    
    def create_guardian_contract(
        self,
        wallet_address: str,
        chain_id: int,
        rules: List[GuardianRule]
    ) -> GuardianContract:
        """
        Create guardian contract configuration
        """
        contract_id = f"{wallet_address}_{chain_id}"
        
        contract = GuardianContract(
            contract_address="",  # Will be set after deployment
            wallet_address=wallet_address,
            chain_id=chain_id,
            rules=rules,
            deployed=False
        )
        
        self.contracts[contract_id] = contract
        
        # Estimate gas for deployment
        contract.gas_estimate = self._estimate_deployment_gas(contract)
        
        logger.info("Created guardian contract", contract_id=contract_id, rules_count=len(rules))
        
        return contract
    
    def _estimate_deployment_gas(self, contract: GuardianContract) -> int:
        """Estimate gas for contract deployment"""
        # Base gas + gas per rule
        base_gas = 200000
        gas_per_rule = 50000
        return base_gas + (len(contract.rules) * gas_per_rule)
    
    def get_guardian_contract_code(self, contract: GuardianContract) -> str:
        """
        Generate Solidity code for guardian contract
        """
        rules_code = self._generate_rules_code(contract.rules)
        
        solidity_code = f"""
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Guardian Contract - Programmable Self-Defense
 * Automatically enforces rules on-chain
 */
contract Guardian {{
    address public owner;
    address public wallet;
    
    struct Rule {{
        string ruleId;
        uint8 ruleType;
        bytes parameters;
        bool enabled;
    }}
    
    mapping(string => Rule) public rules;
    string[] public ruleIds;
    
    // Rule types
    uint8 constant MAX_TRANSACTION_VALUE = 1;
    uint8 constant MAX_APPROVAL_AMOUNT = 2;
    uint8 constant BLOCK_UNKNOWN_ROUTERS = 3;
    uint8 constant BLOCK_PROXY_CONTRACTS = 4;
    uint8 constant REQUIRED_CONFIRMATION = 5;
    uint8 constant TIME_LIMIT = 6;
    uint8 constant DAILY_LIMIT = 7;
    uint8 constant WHITELIST_ONLY = 8;
    
    modifier onlyOwner() {{
        require(msg.sender == owner, "Not owner");
        _;
    }}
    
    constructor(address _wallet) {{
        owner = msg.sender;
        wallet = _wallet;
        
        // Initialize default rules
        {rules_code}
    }}
    
    /**
     * Validate transaction before execution
     */
    function validateTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external view returns (bool allowed, string memory reason) {{
        // Check each rule
        for (uint i = 0; i < ruleIds.length; i++) {{
            Rule storage rule = rules[ruleIds[i]];
            if (!rule.enabled) continue;
            
            (bool ruleAllowed, string memory ruleReason) = _checkRule(
                rule,
                to,
                value,
                data
            );
            
            if (!ruleAllowed) {{
                return (false, ruleReason);
            }}
        }}
        
        return (true, "");
    }}
    
    function _checkRule(
        Rule storage rule,
        address to,
        uint256 value,
        bytes calldata data
    ) internal view returns (bool, string memory) {{
        if (rule.ruleType == MAX_TRANSACTION_VALUE) {{
            uint256 maxValue = abi.decode(rule.parameters, (uint256));
            if (value > maxValue) {{
                return (false, "Transaction value exceeds maximum");
            }}
        }}
        
        if (rule.ruleType == MAX_APPROVAL_AMOUNT) {{
            // Check if this is an approval
            if (data.length >= 4) {{
                bytes4 sig = bytes4(data[0:4]);
                if (sig == 0x095ea7b3) {{ // approve(address,uint256)
                    uint256 amount = abi.decode(data[4:], (uint256));
                    uint256 maxApproval = abi.decode(rule.parameters, (uint256));
                    if (amount > maxApproval) {{
                        return (false, "Approval amount exceeds maximum");
                    }}
                }}
            }}
        }}
        
        if (rule.ruleType == BLOCK_UNKNOWN_ROUTERS) {{
            // Check if to address is in known routers list
            // Simplified - would check against whitelist
            bool isKnownRouter = _isKnownRouter(to);
            if (!isKnownRouter) {{
                return (false, "Unknown router blocked");
            }}
        }}
        
        if (rule.ruleType == BLOCK_PROXY_CONTRACTS) {{
            // Check if contract is a proxy
            bool isProxy = _isProxyContract(to);
            if (isProxy) {{
                return (false, "Proxy contracts blocked");
            }}
        }}
        
        return (true, "");
    }}
    
    function _isKnownRouter(address router) internal pure returns (bool) {{
        // Known DEX routers (simplified)
        return router == address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D) || // Uniswap V2
               router == address(0xE592427A0AEce92De3Edee1F18E0157C05861564) || // Uniswap V3
               router == address(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F); // SushiSwap
    }}
    
    function _isProxyContract(address contractAddr) internal view returns (bool) {{
        // Check for proxy pattern (simplified)
        // Would check for EIP-1967 proxy storage slot
        bytes32 slot = keccak256("eip1967.proxy.implementation");
        bytes32 value;
        assembly {{
            value := sload(slot)
        }}
        return value != bytes32(0);
    }}
    
    /**
     * Add new rule
     */
    function addRule(
        string memory ruleId,
        uint8 ruleType,
        bytes memory parameters
    ) external onlyOwner {{
        rules[ruleId] = Rule(ruleId, ruleType, parameters, true);
        ruleIds.push(ruleId);
    }}
    
    /**
     * Remove rule
     */
    function removeRule(string memory ruleId) external onlyOwner {{
        delete rules[ruleId];
        // Remove from array (simplified)
    }}
    
    /**
     * Enable/disable rule
     */
    function setRuleEnabled(string memory ruleId, bool enabled) external onlyOwner {{
        rules[ruleId].enabled = enabled;
    }}
}}
"""
        return solidity_code
    
    def _generate_rules_code(self, rules: List[GuardianRule]) -> str:
        """Generate Solidity code for initializing rules"""
        code_lines = []
        
        for rule in rules:
            if rule.rule_type == RuleType.MAX_TRANSACTION_VALUE:
                max_value = rule.parameters.get('max_value_wei', 0)
                code_lines.append(
                    f'addRule("{rule.rule_id}", MAX_TRANSACTION_VALUE, abi.encode({max_value}));'
                )
            elif rule.rule_type == RuleType.MAX_APPROVAL_AMOUNT:
                max_approval = rule.parameters.get('max_approval_wei', 0)
                code_lines.append(
                    f'addRule("{rule.rule_id}", MAX_APPROVAL_AMOUNT, abi.encode({max_approval}));'
                )
            elif rule.rule_type == RuleType.BLOCK_UNKNOWN_ROUTERS:
                code_lines.append(
                    f'addRule("{rule.rule_id}", BLOCK_UNKNOWN_ROUTERS, "");'
                )
            elif rule.rule_type == RuleType.BLOCK_PROXY_CONTRACTS:
                code_lines.append(
                    f'addRule("{rule.rule_id}", BLOCK_PROXY_CONTRACTS, "");'
                )
        
        return '\n        '.join(code_lines)
    
    def validate_transaction_with_guardian(
        self,
        contract_address: str,
        transaction: Dict[str, Any],
        chain_id: int
    ) -> tuple[bool, str]:
        """
        Validate transaction using deployed guardian contract
        """
        contract_id = f"{transaction.get('from', '')}_{chain_id}"
        contract = self.contracts.get(contract_id)
        
        if not contract or not contract.deployed:
            return True, ""  # No guardian contract - allow
        
        if contract.contract_address != contract_address:
            return True, ""  # Different contract
        
        try:
            # Connect to contract
            guardian_contract = self.w3.eth.contract(
                address=contract_address,
                abi=self.contract_abi
            )
            
            # Call validateTransaction
            result = guardian_contract.functions.validateTransaction(
                transaction.get('to', '0x0'),
                int(transaction.get('value', '0'), 16) if isinstance(transaction.get('value'), str) else transaction.get('value', 0),
                bytes.fromhex(transaction.get('data', '0x')[2:])
            ).call()
            
            allowed, reason = result
            return allowed, reason
        
        except Exception as e:
            logger.error("Guardian validation error", error=str(e))
            return True, ""  # On error, allow (fail open)
    
    def get_contract(self, wallet_address: str, chain_id: int) -> Optional[GuardianContract]:
        """Get guardian contract for wallet"""
        contract_id = f"{wallet_address}_{chain_id}"
        return self.contracts.get(contract_id)
    
    def add_rule_to_contract(
        self,
        wallet_address: str,
        chain_id: int,
        rule: GuardianRule
    ):
        """Add rule to existing contract"""
        contract = self.get_contract(wallet_address, chain_id)
        if contract:
            contract.rules.append(rule)
            logger.info("Added rule to contract", contract_id=f"{wallet_address}_{chain_id}", rule_id=rule.rule_id)


# Global instance
_guardian_contracts: Optional[GuardianContracts] = None


def get_guardian_contracts() -> GuardianContracts:
    """Get or create global guardian contracts instance"""
    global _guardian_contracts
    if _guardian_contracts is None:
        _guardian_contracts = GuardianContracts()
    return _guardian_contracts

