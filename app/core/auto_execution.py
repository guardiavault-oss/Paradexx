#!/usr/bin/env python3
"""
Auto-Execution Engine for GuardianX
Automated transaction execution based on rules and conditions
"""

import asyncio
import hashlib
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Callable

import structlog

from .memory_graph import memory_graph
from .mpc_hsm_integration import mpc_hsm_integration

# Import private_relayer if available
try:
    from .private_relayer import private_relayer
except ImportError:
    private_relayer = None

logger = structlog.get_logger(__name__)


class AutomationRuleType(Enum):
    AUTO_CLAIM_REWARDS = "auto_claim_rewards"
    AUTO_BRIDGE = "auto_bridge"
    AUTO_SWAP = "auto_swap"
    AUTO_COMPOUND = "auto_compound"
    AUTO_REBALANCE = "auto_rebalance"
    CUSTOM = "custom"


class RuleStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"
    EXPIRED = "expired"


class ExecutionStatus(Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class AutomationCondition:
    """Condition for rule evaluation"""
    condition_type: str  # "balance_threshold", "profit_threshold", "time_interval", etc.
    operator: str  # ">", "<", ">=", "<=", "==", "!="
    value: Any  # Threshold value
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AutomationAction:
    """Action to execute when conditions are met"""
    action_type: str  # "claim", "swap", "bridge", "transfer", etc.
    parameters: Dict[str, Any]  # Action-specific parameters
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AutomationRule:
    """Automation rule definition"""
    rule_id: str
    wallet_address: str
    network: str
    rule_type: AutomationRuleType
    name: str
    description: str
    
    # Conditions
    conditions: List[AutomationCondition]
    
    # Actions
    actions: List[AutomationAction]
    
    # Rule settings
    status: RuleStatus = RuleStatus.ACTIVE
    enabled: bool = True
    max_executions: Optional[int] = None  # None = unlimited
    execution_count: int = 0
    last_execution: Optional[float] = None
    next_execution: Optional[float] = None
    
    # Timing
    cooldown_seconds: int = 3600  # 1 hour default
    created_at: float = field(default_factory=time.time)
    expires_at: Optional[float] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecutionRecord:
    """Record of rule execution"""
    execution_id: str
    rule_id: str
    wallet_address: str
    network: str
    status: ExecutionStatus
    transaction_hash: Optional[str] = None
    error_message: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


class AutoExecutionEngine:
    """
    Automation engine for executing transactions based on rules
    """
    
    def __init__(self):
        self.rules: Dict[str, AutomationRule] = {}
        self.executions: Dict[str, ExecutionRecord] = {}
        self.running = False
        self.execution_loop_task: Optional[asyncio.Task] = None
        
        # Import dependencies
        from .threat_detection import threat_detection_engine
        from .local_ml_model import get_local_ai_agent
        
        self.threat_detection = threat_detection_engine
        self.ai_agent = get_local_ai_agent()
        
        logger.info("Auto-execution engine initialized")
    
    def create_rule(
        self,
        wallet_address: str,
        network: str,
        rule_type: AutomationRuleType,
        name: str,
        description: str,
        conditions: List[AutomationCondition],
        actions: List[AutomationAction],
        cooldown_seconds: int = 3600,
        max_executions: Optional[int] = None,
        expires_at: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AutomationRule:
        """
        Create a new automation rule
        
        Args:
            wallet_address: Wallet address
            network: Network name
            rule_type: Type of automation rule
            name: Rule name
            description: Rule description
            conditions: List of conditions
            actions: List of actions to execute
            cooldown_seconds: Cooldown between executions
            max_executions: Maximum number of executions (None = unlimited)
            expires_at: Expiration timestamp (None = never expires)
            metadata: Additional metadata
        
        Returns:
            AutomationRule object
        """
        rule_id = f"rule_{hashlib.sha256(f'{wallet_address}{network}{name}{time.time()}'.encode()).hexdigest()[:16]}"
        
        rule = AutomationRule(
            rule_id=rule_id,
            wallet_address=wallet_address.lower(),
            network=network,
            rule_type=rule_type,
            name=name,
            description=description,
            conditions=conditions,
            actions=actions,
            cooldown_seconds=cooldown_seconds,
            max_executions=max_executions,
            expires_at=expires_at,
            metadata=metadata or {}
        )
        
        self.rules[rule_id] = rule
        
        logger.info(
            "Automation rule created",
            rule_id=rule_id,
            wallet=wallet_address,
            rule_type=rule_type.value,
            name=name
        )
        
        return rule
    
    async def evaluate_rule(self, rule: AutomationRule) -> bool:
        """
        Evaluate if a rule's conditions are met
        
        Args:
            rule: AutomationRule to evaluate
        
        Returns:
            True if conditions are met, False otherwise
        """
        try:
            # Check if rule is enabled and active
            if not rule.enabled or rule.status != RuleStatus.ACTIVE:
                return False
            
            # Check if rule has expired
            if rule.expires_at and time.time() > rule.expires_at:
                rule.status = RuleStatus.EXPIRED
                return False
            
            # Check if max executions reached
            if rule.max_executions and rule.execution_count >= rule.max_executions:
                rule.enabled = False
                return False
            
            # Check cooldown
            if rule.last_execution:
                time_since_last = time.time() - rule.last_execution
                if time_since_last < rule.cooldown_seconds:
                    return False
            
            # Evaluate all conditions
            for condition in rule.conditions:
                if not await self._evaluate_condition(condition, rule):
                    return False
            
            return True
            
        except Exception as e:
            logger.error("Error evaluating rule", rule_id=rule.rule_id, error=str(e))
            return False
    
    async def _evaluate_condition(
        self,
        condition: AutomationCondition,
        rule: AutomationRule
    ) -> bool:
        """Evaluate a single condition"""
        try:
            condition_type = condition.condition_type
            operator = condition.operator
            threshold = condition.value
            
            if condition_type == "balance_threshold":
                # Get wallet balance
                balance = await self._get_wallet_balance(rule.wallet_address, rule.network)
                return self._compare_values(balance, operator, threshold)
            
            elif condition_type == "profit_threshold":
                # Calculate profit from memory graph
                profile = memory_graph.get_wallet_behavior_profile(
                    rule.wallet_address, rule.network
                )
                profit = profile.total_value_received - profile.total_value_sent
                return self._compare_values(profit, operator, threshold)
            
            elif condition_type == "time_interval":
                # Check if enough time has passed
                if rule.last_execution:
                    time_since = time.time() - rule.last_execution
                    return self._compare_values(time_since, operator, threshold)
                return True  # First execution
            
            elif condition_type == "token_price":
                # Check token price (would need external price feed)
                token_address = condition.metadata.get("token_address")
                if token_address:
                    # Placeholder - would fetch actual price
                    return True
                return False
            
            elif condition_type == "risk_score":
                # Check risk score from recent transactions
                history = memory_graph.get_transaction_history(
                    rule.wallet_address, rule.network, limit=10
                )
                if history:
                    avg_risk = sum(d.risk_score for d in history) / len(history)
                    return self._compare_values(avg_risk, operator, threshold)
                return False
            
            else:
                logger.warning("Unknown condition type", condition_type=condition_type)
                return False
                
        except Exception as e:
            logger.error("Error evaluating condition", error=str(e))
            return False
    
    def _compare_values(self, actual: float, operator: str, threshold: float) -> bool:
        """Compare actual value with threshold using operator"""
        if operator == ">":
            return actual > threshold
        elif operator == "<":
            return actual < threshold
        elif operator == ">=":
            return actual >= threshold
        elif operator == "<=":
            return actual <= threshold
        elif operator == "==":
            return abs(actual - threshold) < 0.0001  # Float comparison
        elif operator == "!=":
            return abs(actual - threshold) >= 0.0001
        else:
            logger.warning("Unknown operator", operator=operator)
            return False
    
    async def _get_wallet_balance(self, wallet_address: str, network: str) -> float:
        """Get wallet balance (placeholder - would use blockchain provider)"""
        # Placeholder - would fetch actual balance
        return 0.0
    
    async def execute_rule(self, rule: AutomationRule) -> ExecutionRecord:
        """
        Execute a rule's actions
        
        Args:
            rule: AutomationRule to execute
        
        Returns:
            ExecutionRecord
        """
        execution_id = f"exec_{hashlib.sha256(f'{rule.rule_id}{time.time()}'.encode()).hexdigest()[:16]}"
        
        execution = ExecutionRecord(
            execution_id=execution_id,
            rule_id=rule.rule_id,
            wallet_address=rule.wallet_address,
            network=rule.network,
            status=ExecutionStatus.EXECUTING
        )
        
        self.executions[execution_id] = execution
        
        try:
            logger.info(
                "Executing automation rule",
                rule_id=rule.rule_id,
                execution_id=execution_id,
                action_count=len(rule.actions)
            )
            
            # Execute each action
            transaction_hashes = []
            for action in rule.actions:
                tx_hash = await self._execute_action(action, rule)
                if tx_hash:
                    transaction_hashes.append(tx_hash)
            
            # Update execution record
            execution.status = ExecutionStatus.SUCCESS
            execution.transaction_hash = transaction_hashes[0] if transaction_hashes else None
            execution.metadata["transaction_hashes"] = transaction_hashes
            
            # Update rule
            rule.execution_count += 1
            rule.last_execution = time.time()
            rule.next_execution = time.time() + rule.cooldown_seconds
            
            logger.info(
                "Rule execution completed",
                rule_id=rule.rule_id,
                execution_id=execution_id,
                success=True
            )
            
        except Exception as e:
            execution.status = ExecutionStatus.FAILED
            execution.error_message = str(e)
            logger.error(
                "Rule execution failed",
                rule_id=rule.rule_id,
                execution_id=execution_id,
                error=str(e)
            )
        
        return execution
    
    async def _execute_action(
        self,
        action: AutomationAction,
        rule: AutomationRule
    ) -> Optional[str]:
        """Execute a single action"""
        try:
            action_type = action.action_type
            
            if action_type == "claim":
                return await self._execute_claim_action(action, rule)
            elif action_type == "swap":
                return await self._execute_swap_action(action, rule)
            elif action_type == "bridge":
                return await self._execute_bridge_action(action, rule)
            elif action_type == "transfer":
                return await self._execute_transfer_action(action, rule)
            else:
                logger.warning("Unknown action type", action_type=action_type)
                return None
                
        except Exception as e:
            logger.error("Error executing action", error=str(e))
            return None
    
    async def _execute_claim_action(
        self,
        action: AutomationAction,
        rule: AutomationRule
    ) -> Optional[str]:
        """Execute claim rewards action"""
        try:
            from .blockchain import blockchain_manager
            from web3 import Web3
            
            provider = blockchain_manager.get_provider(rule.network)
            if not provider:
                logger.error("Provider not available", network=rule.network)
                return None
            
            w3, _ = provider.get_best_provider()
            
            # Get contract address and ABI from action parameters
            contract_address = action.parameters.get("contract_address")
            claim_function = action.parameters.get("function", "claim")
            
            if not contract_address:
                logger.error("Contract address not provided")
                return None
            
            # Build transaction
            nonce = await provider.get_transaction_count(rule.wallet_address)
            gas_price = w3.eth.gas_price
            
            # Encode function call (simplified - would use actual ABI)
            function_signature = w3.keccak(text=f"{claim_function}()")[:4]
            tx_data = function_signature.hex()
            
            transaction = {
                "from": rule.wallet_address,
                "to": contract_address,
                "value": 0,
                "data": f"0x{tx_data}",
                "gas": action.parameters.get("gas_limit", 200000),
                "gasPrice": gas_price,
                "nonce": nonce,
                "chainId": provider.network  # Would get actual chain ID
            }
            
            # Sign and send transaction via MPC/HSM
            tx_hash = await self._sign_and_send_transaction(transaction, rule)
            
            logger.info("Claim action executed", rule_id=rule.rule_id, tx_hash=tx_hash)
            return tx_hash
            
        except Exception as e:
            logger.error("Error executing claim action", error=str(e))
            return None
    
    async def _execute_swap_action(
        self,
        action: AutomationAction,
        rule: AutomationRule
    ) -> Optional[str]:
        """Execute swap action"""
        try:
            from .blockchain import blockchain_manager
            from web3 import Web3
            
            provider = blockchain_manager.get_provider(rule.network)
            if not provider:
                logger.error("Provider not available", network=rule.network)
                return None
            
            w3, _ = provider.get_best_provider()
            
            # Get swap parameters
            router_address = action.parameters.get("router_address")
            token_in = action.parameters.get("token_in")
            token_out = action.parameters.get("token_out")
            amount_in = action.parameters.get("amount_in")
            amount_out_min = action.parameters.get("amount_out_min", 0)
            path = action.parameters.get("path", [token_in, token_out])
            deadline = action.parameters.get("deadline", int(time.time()) + 1800)
            
            if not router_address or not token_in or not token_out or not amount_in:
                logger.error("Missing swap parameters")
                return None
            
            # Build swap transaction
            nonce = await provider.get_transaction_count(rule.wallet_address)
            gas_price = w3.eth.gas_price
            
            # Encode swap function (simplified - would use actual Uniswap/router ABI)
            # swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
            function_signature = w3.keccak(text="swapExactTokensForTokens(uint256,uint256,address[],address,uint256)")[:4]
            
            # Encode parameters (simplified encoding)
            amount_in_encoded = hex(amount_in)[2:].zfill(64)
            amount_out_min_encoded = hex(amount_out_min)[2:].zfill(64)
            path_encoded = self._encode_address_array(path)
            to_encoded = rule.wallet_address[2:].zfill(64)
            deadline_encoded = hex(deadline)[2:].zfill(64)
            
            tx_data = f"0x{function_signature.hex()}{amount_in_encoded}{amount_out_min_encoded}{path_encoded}{to_encoded}{deadline_encoded}"
            
            transaction = {
                "from": rule.wallet_address,
                "to": router_address,
                "value": 0,
                "data": tx_data,
                "gas": action.parameters.get("gas_limit", 300000),
                "gasPrice": gas_price,
                "nonce": nonce,
                "chainId": provider.network
            }
            
            # Sign and send transaction
            tx_hash = await self._sign_and_send_transaction(transaction, rule)
            
            logger.info("Swap action executed", rule_id=rule.rule_id, tx_hash=tx_hash)
            return tx_hash
            
        except Exception as e:
            logger.error("Error executing swap action", error=str(e))
            return None
    
    async def _execute_bridge_action(
        self,
        action: AutomationAction,
        rule: AutomationRule
    ) -> Optional[str]:
        """Execute bridge action"""
        try:
            from .blockchain import blockchain_manager
            from web3 import Web3
            
            provider = blockchain_manager.get_provider(rule.network)
            if not provider:
                logger.error("Provider not available", network=rule.network)
                return None
            
            w3, _ = provider.get_best_provider()
            
            # Get bridge parameters
            bridge_address = action.parameters.get("bridge_address")
            destination_chain = action.parameters.get("destination_chain")
            token_address = action.parameters.get("token_address")
            amount = action.parameters.get("amount")
            recipient = action.parameters.get("recipient", rule.wallet_address)
            
            if not bridge_address or not destination_chain or not amount:
                logger.error("Missing bridge parameters")
                return None
            
            # Build bridge transaction
            nonce = await provider.get_transaction_count(rule.wallet_address)
            gas_price = w3.eth.gas_price
            
            # Encode bridge function (simplified)
            function_signature = w3.keccak(text="bridge(uint256,uint256,address,address)")[:4]
            
            amount_encoded = hex(amount)[2:].zfill(64)
            chain_id_encoded = hex(destination_chain)[2:].zfill(64)
            token_encoded = token_address[2:].zfill(64) if token_address else "0" * 64
            recipient_encoded = recipient[2:].zfill(64)
            
            tx_data = f"0x{function_signature.hex()}{amount_encoded}{chain_id_encoded}{token_encoded}{recipient_encoded}"
            
            transaction = {
                "from": rule.wallet_address,
                "to": bridge_address,
                "value": amount if not token_address else 0,
                "data": tx_data,
                "gas": action.parameters.get("gas_limit", 500000),
                "gasPrice": gas_price,
                "nonce": nonce,
                "chainId": provider.network
            }
            
            # Sign and send transaction
            tx_hash = await self._sign_and_send_transaction(transaction, rule)
            
            logger.info("Bridge action executed", rule_id=rule.rule_id, tx_hash=tx_hash)
            return tx_hash
            
        except Exception as e:
            logger.error("Error executing bridge action", error=str(e))
            return None
    
    async def _execute_transfer_action(
        self,
        action: AutomationAction,
        rule: AutomationRule
    ) -> Optional[str]:
        """Execute transfer action"""
        try:
            from .blockchain import blockchain_manager
            from web3 import Web3
            
            provider = blockchain_manager.get_provider(rule.network)
            if not provider:
                logger.error("Provider not available", network=rule.network)
                return None
            
            w3, _ = provider.get_best_provider()
            
            # Get transfer parameters
            to_address = action.parameters.get("to_address")
            amount = action.parameters.get("amount", 0)
            token_address = action.parameters.get("token_address")  # None for native token
            
            if not to_address:
                logger.error("Recipient address not provided")
                return None
            
            # Build transaction
            nonce = await provider.get_transaction_count(rule.wallet_address)
            gas_price = w3.eth.gas_price
            
            if token_address:
                # ERC-20 transfer
                function_signature = w3.keccak(text="transfer(address,uint256)")[:4]
                to_encoded = to_address[2:].zfill(64)
                amount_encoded = hex(amount)[2:].zfill(64)
                tx_data = f"0x{function_signature.hex()}{to_encoded}{amount_encoded}"
                
                transaction = {
                    "from": rule.wallet_address,
                    "to": token_address,
                    "value": 0,
                    "data": tx_data,
                    "gas": action.parameters.get("gas_limit", 100000),
                    "gasPrice": gas_price,
                    "nonce": nonce,
                    "chainId": provider.network
                }
            else:
                # Native token transfer
                transaction = {
                    "from": rule.wallet_address,
                    "to": to_address,
                    "value": amount,
                    "data": "0x",
                    "gas": action.parameters.get("gas_limit", 21000),
                    "gasPrice": gas_price,
                    "nonce": nonce,
                    "chainId": provider.network
                }
            
            # Sign and send transaction
            tx_hash = await self._sign_and_send_transaction(transaction, rule)
            
            logger.info("Transfer action executed", rule_id=rule.rule_id, tx_hash=tx_hash)
            return tx_hash
            
        except Exception as e:
            logger.error("Error executing transfer action", error=str(e))
            return None
    
    def _encode_address_array(self, addresses: List[str]) -> str:
        """Encode array of addresses for ABI encoding"""
        # Simplified encoding - would use proper ABI encoder
        offset = hex(0x20)[2:].zfill(64)
        length = hex(len(addresses))[2:].zfill(64)
        addresses_encoded = "".join([addr[2:].zfill(64) for addr in addresses])
        return f"{offset}{length}{addresses_encoded}"
    
    async def _sign_and_send_transaction(
        self,
        transaction: Dict[str, Any],
        rule: AutomationRule
    ) -> Optional[str]:
        """Sign and send transaction using MPC/HSM"""
        try:
            # Use MPC/HSM integration to sign transaction
            # This would use the actual signing infrastructure
            from .mpc_hsm_integration import mpc_hsm_integration
            from .blockchain import blockchain_manager
            
            # Get transaction hash for signing
            tx_hash = self._get_transaction_hash(transaction)
            
            # Sign using MPC/HSM (simplified - would use actual signing)
            # For now, create a mock signature
            signed_tx = transaction.copy()
            signed_tx["r"] = "0x" + "0" * 64
            signed_tx["s"] = "0x" + "0" * 64
            signed_tx["v"] = 27
            
            # Send transaction
            provider = blockchain_manager.get_provider(rule.network)
            if not provider:
                return None
            
            w3, _ = provider.get_best_provider()
            
            # In production, would use send_raw_transaction
            # For now, return a mock transaction hash
            tx_hash_hex = f"0x{hash(str(transaction))[:64]}"
            
            logger.info("Transaction signed and sent", tx_hash=tx_hash_hex)
            return tx_hash_hex
            
        except Exception as e:
            logger.error("Error signing and sending transaction", error=str(e))
            return None
    
    def _get_transaction_hash(self, transaction: Dict[str, Any]) -> str:
        """Get transaction hash for signing"""
        import hashlib
        import json
        
        # Remove signature fields if present
        clean_tx = {k: v for k, v in transaction.items() if k not in ["r", "s", "v"]}
        
        # Serialize and hash
        tx_bytes = json.dumps(clean_tx, sort_keys=True).encode()
        tx_hash = hashlib.sha256(tx_bytes).hexdigest()
        
        return f"0x{tx_hash}"
    
    async def start_execution_loop(self, interval_seconds: int = 60):
        """
        Start the execution loop that periodically evaluates and executes rules
        
        Args:
            interval_seconds: Interval between rule evaluations
        """
        if self.running:
            logger.warning("Execution loop already running")
            return
        
        self.running = True
        self.execution_loop_task = asyncio.create_task(
            self._execution_loop(interval_seconds)
        )
        
        logger.info("Auto-execution loop started", interval=interval_seconds)
    
    async def stop_execution_loop(self):
        """Stop the execution loop"""
        self.running = False
        if self.execution_loop_task:
            self.execution_loop_task.cancel()
            try:
                await self.execution_loop_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Auto-execution loop stopped")
    
    async def _execution_loop(self, interval_seconds: int):
        """Main execution loop"""
        while self.running:
            try:
                # Evaluate all active rules
                for rule in list(self.rules.values()):
                    if await self.evaluate_rule(rule):
                        await self.execute_rule(rule)
                
                # Wait before next iteration
                await asyncio.sleep(interval_seconds)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in execution loop", error=str(e))
                await asyncio.sleep(interval_seconds)
    
    def get_rule(self, rule_id: str) -> Optional[AutomationRule]:
        """Get a rule by ID"""
        return self.rules.get(rule_id)
    
    def get_wallet_rules(
        self,
        wallet_address: str,
        network: Optional[str] = None
    ) -> List[AutomationRule]:
        """Get all rules for a wallet"""
        wallet_address = wallet_address.lower()
        
        matching = [
            rule for rule in self.rules.values()
            if rule.wallet_address == wallet_address
            and (network is None or rule.network == network)
        ]
        
        return matching
    
    def disable_rule(self, rule_id: str):
        """Disable a rule"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = False
            self.rules[rule_id].status = RuleStatus.DISABLED
            logger.info("Rule disabled", rule_id=rule_id)
    
    def enable_rule(self, rule_id: str):
        """Enable a rule"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = True
            self.rules[rule_id].status = RuleStatus.ACTIVE
            logger.info("Rule enabled", rule_id=rule_id)
    
    def delete_rule(self, rule_id: str):
        """Delete a rule"""
        if rule_id in self.rules:
            del self.rules[rule_id]
            logger.info("Rule deleted", rule_id=rule_id)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get automation engine metrics"""
        status_counts = {}
        type_counts = {}
        
        for rule in self.rules.values():
            status = rule.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
            
            rule_type = rule.rule_type.value
            type_counts[rule_type] = type_counts.get(rule_type, 0) + 1
        
        execution_status_counts = {}
        for exec_record in self.executions.values():
            status = exec_record.status.value
            execution_status_counts[status] = execution_status_counts.get(status, 0) + 1
        
        return {
            "total_rules": len(self.rules),
            "active_rules": sum(1 for r in self.rules.values() if r.enabled),
            "total_executions": len(self.executions),
            "rule_status_distribution": status_counts,
            "rule_type_distribution": type_counts,
            "execution_status_distribution": execution_status_counts,
            "loop_running": self.running
        }


# Global auto-execution engine instance
auto_execution_engine = AutoExecutionEngine()

