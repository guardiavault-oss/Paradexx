"""
Dust Collection & Pass It On System
Efficiently collects and redistributes small token amounts to those in need
"""

import asyncio
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from web3 import Web3
from eth_account.messages import encode_defunct
import json
import logging

logger = logging.getLogger(__name__)

@dataclass
class DustToken:
    """Represents a dust token that can be donated"""
    address: str
    symbol: str
    decimals: int
    amount: int  # Raw amount
    usd_value: float
    network: str
    
    @property
    def formatted_amount(self) -> str:
        """Get human-readable amount"""
        return str(Decimal(self.amount) / Decimal(10 ** self.decimals))
    
    def is_dust(self, threshold_usd: float = 1.0) -> bool:
        """Check if token qualifies as dust"""
        return self.usd_value < threshold_usd and self.usd_value > 0


@dataclass
class DustDonation:
    """Represents a dust donation commitment"""
    donor_address: str
    token: DustToken
    signature: str  # EIP-712 signature authorizing donation
    timestamp: datetime
    nonce: int
    expires_at: datetime
    status: str = "pending"  # pending, collected, expired, cancelled
    batch_id: Optional[str] = None
    
    def is_valid(self) -> bool:
        """Check if donation is still valid"""
        return (
            self.status == "pending" and 
            datetime.now() < self.expires_at
        )


@dataclass
class DonationBatch:
    """Groups multiple donations for efficient processing"""
    batch_id: str
    network: str
    donations: List[DustDonation]
    created_at: datetime
    status: str = "pending"  # pending, processing, completed, failed
    gas_price_gwei: Optional[float] = None
    total_usd_value: float = 0.0
    recipient_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    
    def add_donation(self, donation: DustDonation):
        """Add a donation to the batch"""
        self.donations.append(donation)
        self.total_usd_value += donation.token.usd_value
        donation.batch_id = self.batch_id
    
    def is_ready(self, min_value_usd: float = 10.0, min_donations: int = 5) -> bool:
        """Check if batch is ready for processing"""
        return (
            self.total_usd_value >= min_value_usd or 
            len(self.donations) >= min_donations
        )


@dataclass
class Recipient:
    """Represents a recipient in need"""
    address: str
    verification_level: str  # "basic", "verified", "trusted"
    story: Optional[str] = None
    total_received_usd: float = 0.0
    last_received: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class DustCollectionSystem:
    """
    Manages dust collection and redistribution with minimal gas costs
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.pending_donations: Dict[str, List[DustDonation]] = {}
        self.active_batches: Dict[str, DonationBatch] = {}
        self.recipients: List[Recipient] = []
        self.collected_stats = {
            "total_donations": 0,
            "total_usd_collected": 0.0,
            "total_gas_saved": 0.0,
            "unique_donors": set()
        }
        
        # Configuration
        self.dust_threshold_usd = self.config.get("dust_threshold_usd", 1.0)
        self.batch_min_value_usd = self.config.get("batch_min_value_usd", 10.0)
        self.batch_min_donations = self.config.get("batch_min_donations", 10)
        self.signature_expiry_hours = self.config.get("signature_expiry_hours", 72)
        
        # Layer 2 / Sidechain configurations
        self.l2_networks = {
            "polygon": {
                "rpc": "https://polygon-rpc.com",
                "dust_collector_address": None,  # Deploy dust collector contract
                "gas_token": "MATIC",
                "avg_gas_price_gwei": 30
            },
            "arbitrum": {
                "rpc": "https://arb1.arbitrum.io/rpc",
                "dust_collector_address": None,
                "gas_token": "ETH",
                "avg_gas_price_gwei": 0.1
            },
            "optimism": {
                "rpc": "https://mainnet.optimism.io",
                "dust_collector_address": None,
                "gas_token": "ETH", 
                "avg_gas_price_gwei": 0.001
            }
        }
    
    async def identify_dust_tokens(
        self,
        wallet_address: str,
        portfolio_data: Dict[str, Any]
    ) -> List[DustToken]:
        """
        Identify dust tokens in a wallet that can be donated
        """
        dust_tokens = []
        
        for token in portfolio_data.get("tokens", []):
            # Check if token qualifies as dust
            usd_value = token.get("usd_value", 0)
            if usd_value > 0 and usd_value < self.dust_threshold_usd:
                dust_token = DustToken(
                    address=token["address"],
                    symbol=token["symbol"],
                    decimals=token["decimals"],
                    amount=token["balance"],
                    usd_value=usd_value,
                    network=token.get("network", "ethereum")
                )
                dust_tokens.append(dust_token)
        
        logger.info(f"Found {len(dust_tokens)} dust tokens worth ${sum(t.usd_value for t in dust_tokens):.2f}")
        return dust_tokens
    
    async def create_donation_commitment(
        self,
        donor_address: str,
        dust_token: DustToken,
        recipient_suggestion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a donation commitment that user can sign off-chain
        Uses EIP-712 structured data for gas-free signatures
        """
        nonce = await self._get_nonce(donor_address)
        expires_at = datetime.now() + timedelta(hours=self.signature_expiry_hours)
        
        # EIP-712 structured data for donation authorization
        domain = {
            "name": "GuardianX Dust Collection",
            "version": "1",
            "chainId": self._get_chain_id(dust_token.network),
            "verifyingContract": self._get_dust_collector_address(dust_token.network)
        }
        
        types = {
            "DustDonation": [
                {"name": "donor", "type": "address"},
                {"name": "token", "type": "address"},
                {"name": "amount", "type": "uint256"},
                {"name": "recipient", "type": "address"},
                {"name": "nonce", "type": "uint256"},
                {"name": "deadline", "type": "uint256"}
            ]
        }
        
        message = {
            "donor": donor_address,
            "token": dust_token.address,
            "amount": dust_token.amount,
            "recipient": recipient_suggestion or "0x0000000000000000000000000000000000000000",
            "nonce": nonce,
            "deadline": int(expires_at.timestamp())
        }
        
        return {
            "domain": domain,
            "types": types,
            "message": message,
            "primaryType": "DustDonation",
            "dust_token": dust_token,
            "expires_at": expires_at.isoformat()
        }
    
    async def submit_signed_donation(
        self,
        donor_address: str,
        dust_token: DustToken,
        signature: str,
        nonce: int
    ) -> DustDonation:
        """
        Submit a signed donation commitment to the pending pool
        """
        donation = DustDonation(
            donor_address=donor_address,
            token=dust_token,
            signature=signature,
            timestamp=datetime.now(),
            nonce=nonce,
            expires_at=datetime.now() + timedelta(hours=self.signature_expiry_hours)
        )
        
        # Add to pending donations pool
        network = dust_token.network
        if network not in self.pending_donations:
            self.pending_donations[network] = []
        
        self.pending_donations[network].append(donation)
        
        # Update stats
        self.collected_stats["unique_donors"].add(donor_address)
        
        # Check if we should create a new batch
        await self._check_and_create_batch(network)
        
        logger.info(f"Donation submitted: {dust_token.symbol} worth ${dust_token.usd_value:.2f}")
        return donation
    
    async def _check_and_create_batch(self, network: str):
        """
        Check if pending donations should be batched
        """
        if network not in self.pending_donations:
            return
        
        pending = self.pending_donations[network]
        total_value = sum(d.token.usd_value for d in pending if d.is_valid())
        
        if (total_value >= self.batch_min_value_usd or 
            len(pending) >= self.batch_min_donations):
            
            # Create new batch
            batch_id = self._generate_batch_id()
            batch = DonationBatch(
                batch_id=batch_id,
                network=network,
                donations=[],
                created_at=datetime.now()
            )
            
            # Add valid donations to batch
            valid_donations = [d for d in pending if d.is_valid()]
            for donation in valid_donations:
                batch.add_donation(donation)
            
            # Remove batched donations from pending
            self.pending_donations[network] = [
                d for d in pending if d not in valid_donations
            ]
            
            self.active_batches[batch_id] = batch
            logger.info(f"Created batch {batch_id} with {len(batch.donations)} donations worth ${batch.total_usd_value:.2f}")
            
            # Trigger batch processing
            asyncio.create_task(self._process_batch(batch))
    
    async def _process_batch(self, batch: DonationBatch):
        """
        Process a batch of donations using the most efficient method
        """
        try:
            batch.status = "processing"
            
            # Select recipient
            recipient = await self._select_recipient()
            batch.recipient_address = recipient.address
            
            # Determine optimal execution strategy
            strategy = await self._determine_execution_strategy(batch)
            
            if strategy == "meta_transaction":
                # Use meta-transactions (gasless for users)
                tx_hash = await self._execute_meta_transaction_batch(batch)
            elif strategy == "l2_bridge":
                # Bridge to L2 and execute there
                tx_hash = await self._execute_l2_batch(batch)
            elif strategy == "batch_multicall":
                # Use multicall contract for batching
                tx_hash = await self._execute_multicall_batch(batch)
            else:
                # Standard batch execution
                tx_hash = await self._execute_standard_batch(batch)
            
            batch.transaction_hash = tx_hash
            batch.status = "completed"
            
            # Update stats
            self.collected_stats["total_donations"] += len(batch.donations)
            self.collected_stats["total_usd_collected"] += batch.total_usd_value
            
            # Update recipient
            recipient.total_received_usd += batch.total_usd_value
            recipient.last_received = datetime.now()
            
            logger.info(f"Batch {batch.batch_id} processed successfully: {tx_hash}")
            
        except Exception as e:
            batch.status = "failed"
            logger.error(f"Failed to process batch {batch.batch_id}: {e}")
    
    async def _determine_execution_strategy(self, batch: DonationBatch) -> str:
        """
        Determine the most efficient execution strategy
        """
        network = batch.network
        total_value = batch.total_usd_value
        
        # For very small amounts, always use meta-transactions
        if total_value < 5.0:
            return "meta_transaction"
        
        # For L2 networks, use native batching
        if network in ["polygon", "arbitrum", "optimism"]:
            return "batch_multicall"
        
        # For mainnet, consider bridging to L2
        if network == "ethereum" and total_value < 50.0:
            return "l2_bridge"
        
        return "batch_multicall"
    
    async def _execute_meta_transaction_batch(self, batch: DonationBatch) -> str:
        """
        Execute batch using meta-transactions (gasless for users)
        """
        # This would integrate with services like:
        # - Biconomy
        # - OpenZeppelin Defender
        # - Gelato Network
        
        logger.info(f"Executing meta-transaction batch for {batch.batch_id}")
        
        # Simulate meta-transaction execution
        return f"0x{'0' * 64}"  # Mock transaction hash
    
    async def _execute_l2_batch(self, batch: DonationBatch) -> str:
        """
        Bridge donations to L2 and execute there for lower gas costs
        """
        logger.info(f"Executing L2 batch for {batch.batch_id}")
        
        # This would:
        # 1. Bridge tokens to L2 (Polygon/Arbitrum/Optimism)
        # 2. Execute batch on L2 with minimal gas costs
        # 3. Potentially bridge back if needed
        
        return f"0x{'1' * 64}"  # Mock transaction hash
    
    async def _execute_multicall_batch(self, batch: DonationBatch) -> str:
        """
        Execute batch using multicall contract for gas efficiency
        """
        logger.info(f"Executing multicall batch for {batch.batch_id}")
        
        # This would use a multicall contract to batch multiple transfers
        # into a single transaction, significantly reducing gas costs
        
        return f"0x{'2' * 64}"  # Mock transaction hash
    
    async def _execute_standard_batch(self, batch: DonationBatch) -> str:
        """
        Execute batch using standard transfer methods
        """
        logger.info(f"Executing standard batch for {batch.batch_id}")
        return f"0x{'3' * 64}"  # Mock transaction hash
    
    async def _select_recipient(self) -> Recipient:
        """
        Select a recipient for the donation batch
        Uses fair distribution algorithm
        """
        if not self.recipients:
            # Add default recipient for testing
            self.recipients.append(Recipient(
                address="0x0000000000000000000000000000000000000001",
                verification_level="verified"
            ))
        
        # Select recipient with longest time since last donation
        eligible = [r for r in self.recipients if r.verification_level != "basic"]
        if not eligible:
            eligible = self.recipients
        
        recipient = min(eligible, key=lambda r: r.last_received or datetime.min)
        return recipient
    
    async def get_gas_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated gas savings from batching
        """
        total_donations = self.collected_stats["total_donations"]
        
        # Estimate gas costs
        individual_transfer_gas = 65000  # Average gas for ERC20 transfer
        batch_transfer_gas = 30000 + (10000 * min(total_donations, 30))  # Batched transfers
        
        gas_saved = max(0, (individual_transfer_gas * total_donations) - batch_transfer_gas)
        
        # Calculate USD savings (assuming average gas prices)
        eth_price = 2000  # Mock ETH price
        gas_price_gwei = 30
        
        usd_saved = (gas_saved * gas_price_gwei * 1e-9 * eth_price)
        
        return {
            "total_donations": total_donations,
            "gas_saved": gas_saved,
            "usd_saved": usd_saved,
            "batches_processed": len([b for b in self.active_batches.values() if b.status == "completed"]),
            "unique_donors": len(self.collected_stats["unique_donors"]),
            "total_usd_collected": self.collected_stats["total_usd_collected"]
        }
    
    def _get_chain_id(self, network: str) -> int:
        """Get chain ID for network"""
        chain_ids = {
            "ethereum": 1,
            "polygon": 137,
            "arbitrum": 42161,
            "optimism": 10
        }
        return chain_ids.get(network, 1)
    
    def _get_dust_collector_address(self, network: str) -> str:
        """Get dust collector contract address for network"""
        # These would be deployed contracts
        return "0x" + "0" * 40
    
    async def _get_nonce(self, address: str) -> int:
        """Get nonce for address"""
        # Track nonces to prevent replay attacks
        return 1
    
    def _generate_batch_id(self) -> str:
        """Generate unique batch ID"""
        import uuid
        return str(uuid.uuid4())


# Singleton instance
_dust_collection_system: Optional[DustCollectionSystem] = None

def get_dust_collection_system() -> DustCollectionSystem:
    """Get or create the dust collection system singleton"""
    global _dust_collection_system
    if _dust_collection_system is None:
        _dust_collection_system = DustCollectionSystem()
    return _dust_collection_system
