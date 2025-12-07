#!/usr/bin/env python3
"""
GuardiaVault Integration Module for GuardianX
Bridges GuardiaVault's digital inheritance system with GuardianX's security infrastructure
"""

import asyncio
import hashlib
import secrets
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import structlog
from web3 import Web3

from .async_task_manager import schedule_background_task

# Import GuardianX core modules
try:
    from .threat_detection import threat_detection_engine
    from .contract_analysis import contract_analysis_engine
    from .blockchain import blockchain_manager
    from .mpc_hsm_integration import MPCHSMIntegration
    from .memory_graph import memory_graph
    from .local_ml_model import LocalMLModel
    from .autonomous_defense import AutonomousDefenseSystem
    from .guardian_contracts import GuardianContracts
    from .scarlette_integration import get_scarlette_integration
except ImportError as e:
    print(f"Warning: Some GuardianX modules not available: {e}")
    threat_detection_engine = None
    contract_analysis_engine = None
    blockchain_manager = None
    memory_graph = None
    MPCHSMIntegration = None
    LocalMLModel = None
    AutonomousDefenseSystem = None
    GuardianContracts = None

    def get_scarlette_integration():
        return None

logger = structlog.get_logger(__name__)


@dataclass
class VaultConfig:
    """Configuration for an inheritance vault"""
    check_in_frequency: int  # Days between check-ins
    grace_period: int  # Days before triggering after missed check-in
    revoke_window: int  # Days owner can revoke false trigger
    death_verification_delay: int  # Days after verification before claim
    min_guardians: int  # Minimum number of guardians
    max_guardians: int  # Maximum number of guardians
    required_attestations: int  # Required guardian attestations for trigger
    enable_yield: bool = True  # Enable yield generation
    enable_mpc: bool = True  # Use MPC for key management
    enable_ml_risk: bool = True  # Use ML for risk assessment


@dataclass
class Guardian:
    """Guardian information"""
    address: str
    email: Optional[str] = None
    email_hash: Optional[str] = None
    invite_status: str = "pending"  # pending, invited, onboarding, active, revoked
    onboarding_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    last_invited_at: Optional[datetime] = None
    onboarding_completed_at: Optional[datetime] = None
    mfa_enabled: bool = False
    portal_url: Optional[str] = None
    mpc_shard_id: Optional[str] = None
    assigned_vaults: List[str] = field(default_factory=list)
    is_active: bool = True
    has_attested: bool = False
    attested_at: Optional[datetime] = None
    trust_score: float = 0.0  # GuardianX addition: ML-based trust score
    risk_level: str = "low"  # GuardianX addition: Risk assessment


@dataclass
class Beneficiary:
    """Beneficiary information"""
    address: str
    share_percentage: float  # Percentage of inheritance
    has_claimed: bool = False
    yield_vault_id: Optional[str] = None
    verification_status: str = "pending"  # GuardianX addition
    risk_score: float = 0.0  # GuardianX addition


@dataclass
class InheritanceVault:
    """Complete vault information"""
    vault_id: str
    owner_address: str
    config: VaultConfig
    guardians: List[Guardian] = field(default_factory=list)
    beneficiaries: List[Beneficiary] = field(default_factory=list)
    status: str = "active"  # active, warning, triggered, verified, claimed, closed
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_check_in: datetime = field(default_factory=datetime.utcnow)
    eth_balance: float = 0.0
    erc20_allocations: Dict[str, Dict[str, float]] = field(default_factory=dict)
    nft_allocations: Dict[str, List[int]] = field(default_factory=dict)
    
    # GuardianX additions
    security_score: float = 100.0  # Overall security rating
    threat_level: str = "low"  # Current threat assessment
    guardian_contract_address: Optional[str] = None  # Deployed guardian contract
    mpc_key_id: Optional[str] = None  # MPC key management ID


@dataclass
class SeedlessRecoverySession:
    """Guardian-backed recovery session"""
    session_id: str
    initiator: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    approvals: List[str] = field(default_factory=list)
    status: str = "pending"  # pending, approved, ready, completed
    recovery_token: Optional[str] = None


@dataclass
class SeedlessWalletProfile:
    """Seedless wallet orchestrated via guardians"""
    wallet_id: str
    owner_address: str
    guardians: List[str]
    threshold: int
    mpc_key_id: Optional[str] = None
    status: str = "active"
    created_at: datetime = field(default_factory=datetime.utcnow)
    recovery_sessions: Dict[str, SeedlessRecoverySession] = field(default_factory=dict)


class GuardiaVaultIntegration:
    """
    Main integration class bridging GuardiaVault with GuardianX
    """
    
    def __init__(self):
        """Initialize the integration"""
        self.vaults: Dict[str, InheritanceVault] = {}
        self.seedless_wallets: Dict[str, SeedlessWalletProfile] = {}
        self.w3 = Web3()
        self.mpc_integration = MPCHSMIntegration() if MPCHSMIntegration else None
        self.guardian_contracts = GuardianContracts() if GuardianContracts else None
        self.ml_model = LocalMLModel() if LocalMLModel else None
        self.defense_system = AutonomousDefenseSystem() if AutonomousDefenseSystem else None
        
        # Load contract ABIs
        self._load_contract_abis()
        
        # Initialize monitoring
        self._start_monitoring()
        
        logger.info("GuardiaVault integration initialized")
    
    def _load_contract_abis(self):
        """Load GuardiaVault contract ABIs"""
        # Simplified ABI - in production would load from actual contract files
        self.vault_abi = [
            {
                "name": "createVault",
                "type": "function",
                "inputs": [
                    {"name": "vaultName", "type": "string"},
                    {"name": "config", "type": "tuple"},
                    {"name": "guardians", "type": "tuple[]"},
                    {"name": "beneficiaries", "type": "tuple[]"}
                ],
                "outputs": [{"name": "vaultId", "type": "uint256"}]
            },
            {
                "name": "checkIn",
                "type": "function",
                "inputs": [{"name": "vaultId", "type": "uint256"}],
                "outputs": []
            },
            {
                "name": "attestDeath",
                "type": "function",
                "inputs": [{"name": "vaultId", "type": "uint256"}],
                "outputs": []
            },
            {
                "name": "claimAll",
                "type": "function",
                "inputs": [{"name": "vaultId", "type": "uint256"}],
                "outputs": []
            }
        ]
        
        self.recovery_abi = [
            {
                "name": "initiateRecovery",
                "type": "function",
                "inputs": [
                    {"name": "vaultId", "type": "uint256"},
                    {"name": "reason", "type": "string"}
                ],
                "outputs": [{"name": "recoveryId", "type": "uint256"}]
            }
        ]
        
        self.yield_abi = [
            {
                "name": "depositToYield",
                "type": "function",
                "inputs": [
                    {"name": "vaultId", "type": "uint256"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "protocol", "type": "string"}
                ],
                "outputs": []
            }
        ]

    # -------------------------------------------------------------------------
    # Guardian onboarding & seedless wallet helpers
    # -------------------------------------------------------------------------

    def _generate_magic_link(
        self,
        vault_id: str,
        guardian: Guardian,
        expiry_hours: int = 24,
    ) -> Dict[str, Any]:
        """Create a one-time onboarding token for a guardian."""
        token_seed = (
            f"{guardian.address}{vault_id}{datetime.utcnow().isoformat()}{secrets.token_hex(16)}"
        )
        token = hashlib.sha256(token_seed.encode()).hexdigest()

        guardian.onboarding_token = token
        guardian.token_expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
        guardian.last_invited_at = datetime.utcnow()
        guardian.invite_status = "invited"
        guardian.portal_url = guardian.portal_url or f"https://guardianx.app/guardians/{guardian.address.lower()}"

        magic_link = f"https://guardianx.app/onboarding?token={token}&vault_id={vault_id}"

        return {
            "magic_link": magic_link,
            "token": token,
            "expires_at": guardian.token_expires_at.isoformat(),
            "portal_url": guardian.portal_url,
        }

    def _find_guardian_by_token(self, token: str) -> Optional[Tuple[InheritanceVault, Guardian]]:
        """Locate guardian + vault pair by onboarding token."""
        for vault in self.vaults.values():
            for guardian in vault.guardians:
                if guardian.onboarding_token == token:
                    return vault, guardian
        return None

    async def _provision_guardian_mpc_shard(self, guardian_address: str, vault_id: Optional[str]) -> str:
        """Allocate or simulate an MPC shard for a guardian."""
        shard_id = f"shard_{hashlib.sha256(f'{guardian_address}{vault_id or 'global'}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:16]}"

        if self.mpc_integration:
            try:
                await self.mpc_integration.setup_multi_party_key(
                    parties=[guardian_address],
                    threshold=1,
                    key_type="guardian_shard",
                )
            except Exception as exc:
                logger.warning("MPC shard provisioning failed, using fallback", error=str(exc))

        return shard_id

    def _ensure_guardian_vault_link(self, guardian: Guardian, vault_id: str) -> None:
        if vault_id not in guardian.assigned_vaults:
            guardian.assigned_vaults.append(vault_id)

    async def initiate_guardian_onboarding(
        self,
        vault_id: str,
        guardian_address: str,
        email: Optional[str] = None,
        expiry_hours: int = 24,
    ) -> Dict[str, Any]:
        """Send (or re-send) a guardian magic-link onboarding invitation."""
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")

        guardian = next((g for g in vault.guardians if g.address == guardian_address), None)
        if not guardian:
            raise ValueError("Guardian not associated with this vault")

        if email:
            guardian.email = email
            guardian.email_hash = hashlib.sha256(email.encode()).hexdigest()

        self._ensure_guardian_vault_link(guardian, vault_id)
        link_payload = self._generate_magic_link(vault_id, guardian, expiry_hours=expiry_hours)

        logger.info(
            "Guardian onboarding initiated",
            guardian=guardian_address,
            vault=vault_id,
            invite_status=guardian.invite_status,
        )

        return {
            "guardian_address": guardian.address,
            "vault_id": vault_id,
            "invite_status": guardian.invite_status,
            **link_payload,
        }

    async def complete_guardian_onboarding(
        self,
        token: str,
        mfa_method: str = "email",
    ) -> Dict[str, Any]:
        """Redeem a magic link, enable MFA, and provision MPC shards."""
        lookup = self._find_guardian_by_token(token)
        if not lookup:
            raise ValueError("Invalid or expired onboarding token")

        vault, guardian = lookup
        if guardian.token_expires_at and guardian.token_expires_at < datetime.utcnow():
            raise ValueError("Onboarding token expired")

        guardian.invite_status = "active"
        guardian.onboarding_token = None
        guardian.token_expires_at = None
        guardian.onboarding_completed_at = datetime.utcnow()
        guardian.mfa_enabled = True
        guardian.is_active = True

        shard_id = await self._provision_guardian_mpc_shard(guardian.address, vault.vault_id)
        guardian.mpc_shard_id = shard_id
        guardian.portal_url = guardian.portal_url or f"https://guardianx.app/guardians/{guardian.address.lower()}"

        logger.info(
            "Guardian onboarding completed",
            guardian=guardian.address,
            vault=vault.vault_id,
            mfa_method=mfa_method,
        )

        return {
            "guardian_address": guardian.address,
            "vault_id": vault.vault_id,
            "status": "active",
            "mfa_method": mfa_method,
            "mpc_shard_id": shard_id,
            "assigned_vaults": guardian.assigned_vaults,
            "portal_url": guardian.portal_url,
        }

    def _generate_seedless_wallet_id(self, owner_address: str) -> str:
        seed = f"{owner_address}_{datetime.utcnow().isoformat()}_{secrets.token_hex(8)}"
        return hashlib.sha256(seed.encode()).hexdigest()[:16]

    def _serialize_seedless_wallet(self, profile: SeedlessWalletProfile) -> Dict[str, Any]:
        return {
            "wallet_id": profile.wallet_id,
            "owner_address": profile.owner_address,
            "guardians": profile.guardians,
            "threshold": profile.threshold,
            "mpc_key_id": profile.mpc_key_id,
            "status": profile.status,
            "created_at": profile.created_at.isoformat(),
            "recovery_sessions": [
                self._serialize_recovery_session(session)
                for session in profile.recovery_sessions.values()
            ],
        }

    def _serialize_recovery_session(self, session: SeedlessRecoverySession) -> Dict[str, Any]:
        return {
            "session_id": session.session_id,
            "initiator": session.initiator,
            "status": session.status,
            "approvals": session.approvals,
            "created_at": session.created_at.isoformat(),
            "recovery_token": session.recovery_token,
        }

    async def create_seedless_wallet(
        self,
        owner_address: str,
        guardians: List[str],
        threshold: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create a guardian-backed seedless wallet profile."""
        if not guardians:
            raise ValueError("At least one guardian is required for a seedless wallet")

        unique_guardians = sorted(set(guardians))
        computed_threshold = threshold or max(2, min(len(unique_guardians), (len(unique_guardians) // 2) + 1))

        wallet_id = self._generate_seedless_wallet_id(owner_address)
        mpc_key_id = None
        if self.mpc_integration:
            try:
                mpc_key_id = await self.mpc_integration.setup_multi_party_key(
                    parties=unique_guardians + [owner_address],
                    threshold=computed_threshold,
                    key_type="seedless_wallet",
                )
            except Exception as exc:
                logger.warning("Seedless wallet MPC setup failed", error=str(exc))

        profile = SeedlessWalletProfile(
            wallet_id=wallet_id,
            owner_address=owner_address,
            guardians=unique_guardians,
            threshold=computed_threshold,
            mpc_key_id=mpc_key_id,
        )
        self.seedless_wallets[wallet_id] = profile

        logger.info(
            "Seedless wallet created",
            wallet_id=wallet_id,
            owner=owner_address,
            guardians=len(unique_guardians),
            threshold=computed_threshold,
        )

        return self._serialize_seedless_wallet(profile)

    def get_seedless_wallet(self, wallet_id: str) -> Optional[SeedlessWalletProfile]:
        return self.seedless_wallets.get(wallet_id)

    def list_seedless_wallets(self, owner_address: Optional[str] = None) -> List[SeedlessWalletProfile]:
        """List seedless wallets, optionally filtered by owner."""
        if owner_address:
            return [
                wallet for wallet in self.seedless_wallets.values()
                if wallet.owner_address.lower() == owner_address.lower()
            ]
        return list(self.seedless_wallets.values())

    def list_seedless_recovery_sessions(
        self,
        wallet_id: str,
        session_id: Optional[str] = None,
    ) -> List[SeedlessRecoverySession]:
        """List recovery sessions for a wallet (all or specific)."""
        wallet = self.seedless_wallets.get(wallet_id)
        if not wallet:
            raise ValueError("Seedless wallet not found")

        if session_id:
            session = wallet.recovery_sessions.get(session_id)
            if not session:
                raise ValueError("Recovery session not found")
            return [session]

        return list(wallet.recovery_sessions.values())

    async def initiate_seedless_recovery(
        self,
        wallet_id: str,
        initiator: str,
    ) -> Dict[str, Any]:
        """Create a new guardian-backed recovery session."""
        wallet = self.seedless_wallets.get(wallet_id)
        if not wallet:
            raise ValueError("Seedless wallet not found")

        if initiator not in wallet.guardians and initiator != wallet.owner_address:
            raise ValueError("Initiator not authorized for this wallet")

        session_id = f"rec_{hashlib.sha256(f'{wallet_id}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:12]}"
        session = SeedlessRecoverySession(session_id=session_id, initiator=initiator)
        wallet.recovery_sessions[session_id] = session
        wallet.status = "recovering"

        logger.info(
            "Seedless recovery session created",
            wallet_id=wallet_id,
            session_id=session_id,
            threshold=wallet.threshold,
        )

        return {
            "wallet_id": wallet_id,
            "session": self._serialize_recovery_session(session),
            "required_approvals": wallet.threshold,
            "eligible_guardians": wallet.guardians,
        }

    async def approve_seedless_recovery(
        self,
        wallet_id: str,
        session_id: str,
        guardian_address: str,
    ) -> Dict[str, Any]:
        """Guardian approval for a recovery session."""
        wallet = self.seedless_wallets.get(wallet_id)
        if not wallet:
            raise ValueError("Seedless wallet not found")

        session = wallet.recovery_sessions.get(session_id)
        if not session:
            raise ValueError("Recovery session not found")

        if guardian_address not in wallet.guardians:
            raise ValueError("Guardian not part of this wallet")

        if guardian_address in session.approvals:
            return self._serialize_recovery_session(session)

        session.approvals.append(guardian_address)

        if len(session.approvals) >= wallet.threshold and session.status == "pending":
            session.status = "ready"
            session.recovery_token = (
                f"rebuild_{hashlib.sha256(f'{wallet_id}{session.session_id}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:16]}"
            )
            wallet.status = "ready_for_recovery"
            logger.info(
                "Seedless recovery ready",
                wallet_id=wallet_id,
                session_id=session_id,
            )

        return {
            "wallet_id": wallet_id,
            "session": self._serialize_recovery_session(session),
            "approvals": session.approvals,
            "threshold": wallet.threshold,
        }
    
    def _start_monitoring(self):
        """Start monitoring vaults for security and check-ins"""
        schedule_background_task(self._monitor_vaults(), name="guardia_vault_monitor")
        logger.info("Vault monitoring scheduled")
    
    async def _monitor_vaults(self):
        """Continuous monitoring of all vaults"""
        while True:
            try:
                for vault_id, vault in self.vaults.items():
                    # Check for missed check-ins
                    await self._check_vault_liveness(vault)
                    
                    # Update security scores
                    await self._update_vault_security(vault)
                    
                    # Monitor for threats
                    await self._monitor_vault_threats(vault)
                    
                    # Check guardian health
                    await self._verify_guardians(vault)
                
                # Sleep for monitoring interval
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error("Vault monitoring error", error=str(e))
                await asyncio.sleep(60)
    
    async def create_vault(
        self,
        owner_address: str,
        vault_name: str,
        config: VaultConfig,
        guardians: List[Dict[str, Any]],
        beneficiaries: List[Dict[str, Any]]
    ) -> str:
        """
        Create a new inheritance vault with GuardianX security
        """
        logger.info(f"Creating vault for {owner_address}")
        
        # Step 1: Analyze configuration for security risks
        risk_analysis = await self._analyze_vault_configuration(
            config, guardians, beneficiaries
        )
        
        if risk_analysis["risk_level"] == "critical":
            raise ValueError(f"Vault configuration too risky: {risk_analysis['reasons']}")
        
        # Step 2: Deploy guardian contract for enhanced protection
        guardian_contract = None
        if self.guardian_contracts and config.enable_mpc:
            rules = self._generate_vault_rules(config)
            guardian_contract = await self.guardian_contracts.create_guardian_contract(
                wallet_address=owner_address,
                chain_id=1,  # Ethereum mainnet
                rules=rules
            )
            logger.info(f"Deployed guardian contract: {guardian_contract.contract_address}")
        
        # Step 3: Setup MPC key management for guardians
        mpc_key_id = None
        if self.mpc_integration and config.enable_mpc:
            mpc_key_id = await self.mpc_integration.setup_multi_party_key(
                parties=[g["address"] for g in guardians],
                threshold=config.required_attestations,
                key_type="vault_recovery"
            )
            logger.info(f"Setup MPC key: {mpc_key_id}")
        
        # Step 4: Create vault object
        vault = InheritanceVault(
            vault_id=self._generate_vault_id(owner_address),
            owner_address=owner_address,
            config=config,
            guardians=[
                Guardian(
                    address=g["address"],
                    email_hash=g.get("email_hash"),
                    trust_score=await self._calculate_guardian_trust(g["address"])
                )
                for g in guardians
            ],
            beneficiaries=[
                Beneficiary(
                    address=b["address"],
                    share_percentage=b["share_percentage"],
                    risk_score=await self._calculate_beneficiary_risk(b["address"])
                )
                for b in beneficiaries
            ],
            guardian_contract_address=guardian_contract.contract_address if guardian_contract else None,
            mpc_key_id=mpc_key_id,
            security_score=risk_analysis["security_score"]
        )
        
        # Step 5: Deploy to blockchain (if connected)
        if self.w3.is_connected():
            tx_hash = await self._deploy_vault_contract(vault, vault_name)
            logger.info(f"Vault deployed on-chain: {tx_hash}")
        
        # Step 6: Store vault
        self.vaults[vault.vault_id] = vault
        
        # Step 7: Register with threat detection
        if threat_detection_engine:
            await threat_detection_engine.register_protected_wallet(
                owner_address,
                protection_level="inheritance_max"
            )
        
        # Step 8: Update memory graph
        if memory_graph:
            await memory_graph.add_relationship(
                entity1=owner_address,
                entity2=vault.vault_id,
                relationship_type="owns_vault"
            )
            
            for guardian in vault.guardians:
                await memory_graph.add_relationship(
                    entity1=vault.vault_id,
                    entity2=guardian.address,
                    relationship_type="guardian_of"
                )
        
        logger.info(f"Vault created successfully: {vault.vault_id}")
        return vault.vault_id
    
    async def check_in(self, vault_id: str, owner_address: str) -> bool:
        """
        Process owner check-in to prove they're alive
        """
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")
        
        if vault.owner_address != owner_address:
            raise ValueError("Only vault owner can check in")
        
        # Update check-in timestamp
        vault.last_check_in = datetime.utcnow()
        vault.status = "active"
        
        # Reset guardian attestations
        for guardian in vault.guardians:
            guardian.has_attested = False
            guardian.attested_at = None
        
        # Update security score for regular check-ins
        vault.security_score = min(100.0, vault.security_score + 1.0)
        
        # Record in memory graph
        if memory_graph:
            await memory_graph.record_activity(
                wallet=owner_address,
                activity_type="vault_checkin",
                metadata={"vault_id": vault_id}
            )
        
        logger.info(f"Check-in successful for vault {vault_id}")
        return True
    
    async def guardian_attest(
        self,
        vault_id: str,
        guardian_address: str,
        signature: Optional[str] = None
    ) -> bool:
        """
        Process guardian attestation of owner's death
        """
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")
        
        # Find guardian
        guardian = None
        for g in vault.guardians:
            if g.address == guardian_address:
                guardian = g
                break
        
        if not guardian:
            raise ValueError("Not a guardian of this vault")
        
        if guardian.has_attested:
            raise ValueError("Guardian has already attested")
        
        # Verify guardian using ML risk assessment
        if self.ml_model:
            risk_score = await self.ml_model.assess_transaction_risk({
                "type": "guardian_attestation",
                "vault_id": vault_id,
                "guardian": guardian_address
            })
            
            if risk_score > 0.8:
                logger.warning(f"High-risk attestation detected: {risk_score}")
                # Could require additional verification here
        
        # Update attestation
        guardian.has_attested = True
        guardian.attested_at = datetime.utcnow()
        
        # Check if enough attestations
        attested_count = sum(1 for g in vault.guardians if g.has_attested)
        
        if attested_count >= vault.config.required_attestations:
            await self._trigger_vault(vault_id, "guardian_consensus")
        
        logger.info(f"Guardian attestation recorded: {guardian_address} for vault {vault_id}")
        return True
    
    async def claim_inheritance(
        self,
        vault_id: str,
        beneficiary_address: str
    ) -> Dict[str, Any]:
        """
        Process beneficiary claim with security checks
        """
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")
        
        if vault.status != "ready_for_claim":
            raise ValueError(f"Vault not ready for claims: {vault.status}")
        
        # Find beneficiary
        beneficiary = None
        for b in vault.beneficiaries:
            if b.address == beneficiary_address:
                beneficiary = b
                break
        
        if not beneficiary:
            raise ValueError("Not a beneficiary of this vault")
        
        if beneficiary.has_claimed:
            raise ValueError("Beneficiary has already claimed")
        
        # Security check before distribution
        if threat_detection_engine:
            threat = await threat_detection_engine.analyze_transaction({
                "from": vault.owner_address,
                "to": beneficiary_address,
                "value": vault.eth_balance * (beneficiary.share_percentage / 100),
                "type": "inheritance_claim"
            })
            
            if threat and threat.severity == "critical":
                logger.error(f"Threat detected in claim: {threat}")
                raise ValueError("Security threat detected in claim")
        
        # Calculate distributions
        eth_amount = vault.eth_balance * (beneficiary.share_percentage / 100)
        erc20_distributions = {}
        nft_distributions = {}
        
        for token, allocations in vault.erc20_allocations.items():
            if beneficiary_address in allocations:
                erc20_distributions[token] = allocations[beneficiary_address]
        
        for contract, token_ids in vault.nft_allocations.items():
            # Simplified NFT distribution
            share_count = int(len(token_ids) * (beneficiary.share_percentage / 100))
            nft_distributions[contract] = token_ids[:share_count]
        
        # Mark as claimed
        beneficiary.has_claimed = True
        
        # Update vault status if all beneficiaries have claimed
        all_claimed = all(b.has_claimed for b in vault.beneficiaries)
        if all_claimed:
            vault.status = "closed"
        
        result = {
            "vault_id": vault_id,
            "beneficiary": beneficiary_address,
            "eth_amount": eth_amount,
            "erc20_tokens": erc20_distributions,
            "nfts": nft_distributions,
            "claimed_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Inheritance claimed: {beneficiary_address} from vault {vault_id}")
        return result
    
    async def add_guardian(
        self,
        vault_id: str,
        guardian_address: str,
        email: Optional[str] = None
    ) -> bool:
        """
        Add a guardian to an existing vault
        """
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")
        
        # Check if already a guardian
        for g in vault.guardians:
            if g.address == guardian_address:
                raise ValueError("Address is already a guardian")
        
        # Check max guardians limit
        if len(vault.guardians) >= vault.config.max_guardians:
            raise ValueError(f"Maximum guardians ({vault.config.max_guardians}) reached")
        
        # Calculate trust score
        trust_score = await self._calculate_guardian_trust(guardian_address)
        
        # Create guardian
        new_guardian = Guardian(
            address=guardian_address,
            email=email,
            email_hash=hashlib.sha256(email.encode()).hexdigest() if email else None,
            trust_score=trust_score
        )
        
        # Add to vault
        vault.guardians.append(new_guardian)

        # Kick off onboarding flow
        await self.initiate_guardian_onboarding(vault_id, guardian_address, email=email)
        
        # Update security score
        await self._update_vault_security(vault)
        
        # Update memory graph
        if memory_graph:
            await memory_graph.add_relationship(
                entity1=vault.owner_address,
                entity2=guardian_address,
                relationship_type="guardian_of"
            )
        
        logger.info(f"Guardian added: {guardian_address} to vault {vault_id}")
        return True
    
    async def add_beneficiary(
        self,
        vault_id: str,
        beneficiary_address: str,
        share_percentage: float,
        relationship: Optional[str] = None
    ) -> bool:
        """
        Add a beneficiary to an existing vault
        """
        vault = self.vaults.get(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")
        
        # Check if already a beneficiary
        for b in vault.beneficiaries:
            if b.address == beneficiary_address:
                raise ValueError("Address is already a beneficiary")
        
        # Check total allocation
        total_allocation = sum(b.share_percentage for b in vault.beneficiaries)
        if total_allocation + share_percentage > 100.0:
            raise ValueError(f"Total allocation would exceed 100% (current: {total_allocation}%)")
        
        # Calculate risk score
        risk_score = await self._calculate_beneficiary_risk(beneficiary_address)
        
        # Create beneficiary
        new_beneficiary = Beneficiary(
            address=beneficiary_address,
            share_percentage=share_percentage,
            risk_score=risk_score
        )
        
        # Store relationship if provided (would need to add field to Beneficiary dataclass)
        # For now, we'll just add the beneficiary
        
        # Add to vault
        vault.beneficiaries.append(new_beneficiary)
        
        # Update security score
        await self._update_vault_security(vault)
        
        # Update memory graph
        if memory_graph:
            await memory_graph.add_relationship(
                entity1=vault.owner_address,
                entity2=beneficiary_address,
                relationship_type="beneficiary_of"
            )
        
        logger.info(f"Beneficiary added: {beneficiary_address} to vault {vault_id}")
        return True
    
    async def _check_vault_liveness(self, vault: InheritanceVault):
        """Check if vault owner has missed check-ins"""
        if vault.status != "active":
            return
        
        time_since_checkin = datetime.utcnow() - vault.last_check_in
        check_in_frequency = timedelta(days=vault.config.check_in_frequency)
        grace_period = timedelta(days=vault.config.grace_period)
        
        if time_since_checkin > check_in_frequency + grace_period:
            # Trigger vault due to timeout
            await self._trigger_vault(vault.vault_id, "timeout")
        elif time_since_checkin > check_in_frequency:
            # Enter warning state
            vault.status = "warning"
            logger.warning(f"Vault {vault.vault_id} in warning state")
    
    async def _trigger_vault(self, vault_id: str, reason: str):
        """Trigger vault for inheritance process"""
        vault = self.vaults.get(vault_id)
        if not vault:
            return
        
        if vault.status in ["triggered", "verified", "ready_for_claim", "closed"]:
            return  # Already triggered
        
        vault.status = "triggered"
        
        # Notify all systems
        logger.warning(f"Vault triggered: {vault_id}, reason: {reason}")
        
        # Start death verification process
        # In production, this would integrate with death oracles
        # For now, we'll simulate a verification delay
        asyncio.create_task(self._verify_death(vault_id))
    
    async def _verify_death(self, vault_id: str):
        """Verify death through multiple sources"""
        vault = self.vaults.get(vault_id)
        if not vault:
            return
        
        # Simulate verification delay
        await asyncio.sleep(vault.config.death_verification_delay * 86400)  # Convert days to seconds
        
        # In production, check death oracles, government databases, etc.
        # For now, we'll auto-verify after delay
        vault.status = "verified"
        
        # Wait for final delay before allowing claims
        await asyncio.sleep(7 * 86400)  # 7 day final delay
        vault.status = "ready_for_claim"
        
        logger.info(f"Vault {vault_id} ready for beneficiary claims")
    
    async def _update_vault_security(self, vault: InheritanceVault):
        """Update vault security score based on various factors"""
        score = 100.0
        
        # Check guardian health
        active_guardians = sum(1 for g in vault.guardians if g.is_active)
        if active_guardians < vault.config.min_guardians:
            score -= 20.0
        
        # Check configuration security
        if vault.config.check_in_frequency > 180:  # More than 6 months
            score -= 10.0
        
        if vault.config.required_attestations < 2:
            score -= 15.0
        
        # Check for suspicious activity
        if vault.threat_level != "low":
            score -= 30.0
        
        vault.security_score = max(0.0, score)
        
        # Update threat level based on score
        if score < 30:
            vault.threat_level = "critical"
        elif score < 60:
            vault.threat_level = "high"
        elif score < 80:
            vault.threat_level = "medium"
        else:
            vault.threat_level = "low"
    
    async def _monitor_vault_threats(self, vault: InheritanceVault):
        """Monitor vault for security threats"""
        if not threat_detection_engine:
            return
        
        # Check for MEV attacks on vault assets
        for token, allocations in vault.erc20_allocations.items():
            threat = await threat_detection_engine.check_mev_risk(
                token_address=token,
                amount=sum(allocations.values())
            )
            
            if threat and threat.severity == "critical":
                logger.error(f"MEV threat detected for vault {vault.vault_id}: {threat}")
                vault.threat_level = "critical"
    
    async def _verify_guardians(self, vault: InheritanceVault):
        """Verify guardian status and trust"""
        for guardian in vault.guardians:
            # Update trust score based on behavior
            if memory_graph:
                activities = await memory_graph.get_wallet_activities(
                    guardian.address,
                    days=30
                )
                
                # Simple trust calculation
                suspicious_activities = sum(
                    1 for a in activities
                    if a.get("risk_level") == "high"
                )
                
                if suspicious_activities > 5:
                    guardian.trust_score = max(0.0, guardian.trust_score - 10.0)
                    guardian.risk_level = "high"
                else:
                    guardian.trust_score = min(100.0, guardian.trust_score + 1.0)
                    guardian.risk_level = "low"
    
    async def _analyze_vault_configuration(
        self,
        config: VaultConfig,
        guardians: List[Dict[str, Any]],
        beneficiaries: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze vault configuration for security risks"""
        risk_level = "low"
        reasons = []
        security_score = 100.0
        
        # Check guardian count
        if len(guardians) < config.min_guardians:
            risk_level = "high"
            reasons.append("Insufficient guardians")
            security_score -= 30.0
        
        # Check attestation requirements
        if config.required_attestations < 2:
            risk_level = "medium"
            reasons.append("Low attestation threshold")
            security_score -= 20.0
        
        # Check time windows
        if config.check_in_frequency < 7:
            risk_level = "high"
            reasons.append("Check-in frequency too short")
            security_score -= 25.0
        
        # Check beneficiary allocation
        total_percentage = sum(b["share_percentage"] for b in beneficiaries)
        if total_percentage > 100:
            risk_level = "critical"
            reasons.append("Beneficiary shares exceed 100%")
            security_score = 0.0
        
        # ML-based risk assessment
        if self.ml_model:
            ml_risk = await self.ml_model.assess_transaction_risk({
                "type": "vault_creation",
                "guardians": len(guardians),
                "beneficiaries": len(beneficiaries),
                "config": config.__dict__
            })
            
            if ml_risk > 0.7:
                risk_level = "high"
                reasons.append(f"ML risk score: {ml_risk:.2f}")
                security_score -= ml_risk * 30
        
        return {
            "risk_level": risk_level,
            "reasons": reasons,
            "security_score": max(0.0, security_score)
        }
    
    def _generate_vault_rules(self, config: VaultConfig) -> List[Any]:
        """Generate guardian contract rules for vault"""
        rules = []
        
        # Rule: Prevent transfers during grace period
        rules.append({
            "type": "time_lock",
            "description": "Block transfers during inheritance trigger",
            "parameters": {
                "lock_duration": config.grace_period * 86400,
                "exception_addresses": []  # No exceptions
            }
        })
        
        # Rule: Limit daily transfers
        rules.append({
            "type": "daily_limit",
            "description": "Limit daily transfer amount",
            "parameters": {
                "max_daily_amount": "1000000000000000000",  # 1 ETH
                "reset_time": 86400
            }
        })
        
        # Rule: Require multi-sig for large transfers
        rules.append({
            "type": "multi_sig",
            "description": "Require guardian approval for large transfers",
            "parameters": {
                "threshold_amount": "5000000000000000000",  # 5 ETH
                "required_signatures": config.required_attestations
            }
        })
        
        return rules
    
    async def _calculate_guardian_trust(self, address: str) -> float:
        """Calculate trust score for a guardian"""
        trust_score = 50.0  # Start neutral
        
        if memory_graph:
            # Check guardian history
            relationships = await memory_graph.get_relationships(address)
            
            # Positive factors
            if len(relationships) > 10:
                trust_score += 10.0  # Well-connected
            
            # Check for previous guardian roles
            guardian_roles = [
                r for r in relationships
                if r.get("type") == "guardian_of"
            ]
            trust_score += min(20.0, len(guardian_roles) * 5.0)
        
        # ML assessment
        if self.ml_model:
            risk = await self.ml_model.assess_transaction_risk({
                "type": "guardian_evaluation",
                "address": address
            })
            trust_score -= risk * 30.0
        
        return max(0.0, min(100.0, trust_score))
    
    async def _calculate_beneficiary_risk(self, address: str) -> float:
        """Calculate risk score for a beneficiary"""
        risk_score = 0.0
        
        if threat_detection_engine:
            # Check for known malicious addresses
            is_malicious = await threat_detection_engine.check_address_reputation(address)
            if is_malicious:
                risk_score = 100.0
        
        if memory_graph:
            # Check beneficiary history
            activities = await memory_graph.get_wallet_activities(address, days=90)
            
            # Look for suspicious patterns
            suspicious_count = sum(
                1 for a in activities
                if a.get("type") in ["rug_pull", "honeypot", "scam"]
            )
            
            if suspicious_count > 0:
                risk_score = min(100.0, risk_score + suspicious_count * 20.0)
        
        return risk_score
    
    def _generate_vault_id(self, owner_address: str) -> str:
        """Generate unique vault ID"""
        import hashlib
        timestamp = datetime.utcnow().isoformat()
        data = f"{owner_address}_{timestamp}".encode()
        return hashlib.sha256(data).hexdigest()[:16]
    
    async def _deploy_vault_contract(
        self,
        vault: InheritanceVault,
        vault_name: str
    ) -> Optional[str]:
        """Deploy vault contract to blockchain"""
        if not self.w3.is_connected():
            logger.warning("Web3 not connected, skipping contract deployment")
            return None
        
        try:
            # In production, this would deploy the actual GuardiaVault contract
            # For now, we'll simulate deployment
            logger.info(f"Simulating vault contract deployment for {vault_name}")
            
            # Generate mock transaction hash
            import hashlib
            tx_data = f"{vault.vault_id}_{vault_name}_{datetime.utcnow().isoformat()}"
            tx_hash = "0x" + hashlib.sha256(tx_data.encode()).hexdigest()
            
            return tx_hash
            
        except Exception as e:
            logger.error(f"Contract deployment failed: {e}")
            return None
    
    def get_vault(self, vault_id: str) -> Optional[InheritanceVault]:
        """Get vault by ID"""
        return self.vaults.get(vault_id)
    
    def get_user_vaults(self, user_address: str) -> List[InheritanceVault]:
        """Get all vaults for a user (as owner, guardian, or beneficiary)"""
        user_vaults = []
        
        for vault in self.vaults.values():
            # Check if user is owner
            if vault.owner_address == user_address:
                user_vaults.append(vault)
                continue
            
            # Check if user is guardian
            for guardian in vault.guardians:
                if guardian.address == user_address:
                    user_vaults.append(vault)
                    break
            
            # Check if user is beneficiary
            for beneficiary in vault.beneficiaries:
                if beneficiary.address == user_address:
                    user_vaults.append(vault)
                    break
        
        return user_vaults


# Singleton instance
_guardia_vault_integration = None


def get_guardia_vault_integration() -> GuardiaVaultIntegration:
    """Get or create the GuardiaVault integration instance"""
    global _guardia_vault_integration
    if _guardia_vault_integration is None:
        _guardia_vault_integration = GuardiaVaultIntegration()
    return _guardia_vault_integration


# Export for easy access
guardia_vault_integration = get_guardia_vault_integration()

