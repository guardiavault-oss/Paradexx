#!/usr/bin/env python3
"""
Inheritance Manager for GuardianX
Manages digital asset inheritance workflows and death verification
"""

import asyncio
import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

import structlog
import httpx

from .async_task_manager import schedule_background_task

# Import GuardianX modules
try:
    from .guardia_vault_integration import (
        guardia_vault_integration,
        InheritanceVault,
        Guardian,
        Beneficiary
    )
    from .memory_graph import memory_graph
    from .attestations import attestation_engine
    from .zk_proofs import ZKProofGenerator
except ImportError as e:
    print(f"Warning: Some modules not available: {e}")
    guardia_vault_integration = None
    memory_graph = None
    attestation_engine = None
    ZKProofGenerator = None
    # Create a dummy type for type hints when import fails
    from typing import Any
    InheritanceVault = Any
    Guardian = Any
    Beneficiary = Any

logger = structlog.get_logger(__name__)


class DeathVerificationSource(Enum):
    """Death verification sources with trust weights"""
    GOVERNMENT_REGISTRY = 1.0  # Official government death records
    DEATH_CERTIFICATE = 1.0    # Uploaded death certificate
    SSDI_DATABASE = 0.8        # Social Security Death Index
    OBITUARY_VERIFIED = 0.6    # Verified obituary sources
    NEWS_REPORT = 0.5          # News reports of death
    SOCIAL_MEDIA = 0.3         # Social media reports (low trust)


@dataclass
class DeathVerification:
    """Death verification record"""
    source: DeathVerificationSource
    verification_id: str
    timestamp: datetime
    confidence: float  # 0.0 to 1.0
    document_hash: Optional[str] = None
    verifier_address: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class InheritanceEvent:
    """Record of an inheritance-related event"""
    event_type: str  # check_in, attestation, verification, claim, etc.
    vault_id: str
    timestamp: datetime
    actor_address: str
    details: Dict[str, Any] = field(default_factory=dict)
    risk_score: float = 0.0
    verified: bool = False


@dataclass
class LegacyMessage:
    """Encrypted message from deceased to beneficiary"""
    message_id: str
    vault_id: str
    from_address: str
    to_address: str
    encrypted_content: str
    unlock_condition: str  # death_verified, time_delay, etc.
    created_at: datetime
    delivered: bool = False
    delivered_at: Optional[datetime] = None


class InheritanceManager:
    """
    Manages the complete digital inheritance lifecycle
    """
    
    def __init__(self):
        """Initialize the inheritance manager"""
        self.death_verifications: Dict[str, List[DeathVerification]] = {}
        self.inheritance_events: List[InheritanceEvent] = []
        self.legacy_messages: Dict[str, List[LegacyMessage]] = {}
        self.verification_threshold = 0.7  # 70% confidence required
        self.min_verification_sources = 2  # At least 2 sources required
        
        # Initialize ZK proof generator if available
        self.zk_generator = ZKProofGenerator() if ZKProofGenerator else None
        
        # Start background tasks
        self._start_background_tasks()
        
        logger.info("Inheritance Manager initialized")
    
    def _start_background_tasks(self):
        """Start background monitoring tasks"""
        schedule_background_task(self._monitor_check_ins(), name="inheritance_check_ins")
        schedule_background_task(
            self._process_pending_verifications(),
            name="inheritance_verification_processor",
        )
        schedule_background_task(
            self._deliver_legacy_messages(),
            name="inheritance_legacy_delivery",
        )
    
    async def _monitor_check_ins(self):
        """Monitor vaults for missed check-ins"""
        while True:
            try:
                if not guardia_vault_integration:
                    await asyncio.sleep(300)
                    continue
                
                # Get all active vaults
                for vault_id, vault in guardia_vault_integration.vaults.items():
                    if vault.status != "active":
                        continue
                    
                    # Check if check-in is overdue
                    time_since_checkin = datetime.utcnow() - vault.last_check_in
                    check_in_days = vault.config.check_in_frequency
                    
                    if time_since_checkin > timedelta(days=check_in_days):
                        # Send reminder notification
                        await self._send_checkin_reminder(vault)
                        
                        # Check if in grace period
                        grace_days = vault.config.grace_period
                        if time_since_checkin > timedelta(days=check_in_days + grace_days):
                            # Start death verification process
                            await self.initiate_death_verification(vault_id)
                
                await asyncio.sleep(3600)  # Check every hour
                
            except Exception as e:
                logger.error(f"Check-in monitoring error: {e}")
                await asyncio.sleep(3600)
    
    async def _process_pending_verifications(self):
        """Process pending death verifications"""
        while True:
            try:
                for vault_id, verifications in self.death_verifications.items():
                    if not verifications:
                        continue
                    
                    # Check if we have enough verification
                    if await self._check_verification_consensus(vault_id, verifications):
                        await self._complete_death_verification(vault_id)
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Verification processing error: {e}")
                await asyncio.sleep(300)
    
    async def _deliver_legacy_messages(self):
        """Deliver legacy messages when conditions are met"""
        while True:
            try:
                for vault_id, messages in self.legacy_messages.items():
                    vault = guardia_vault_integration.get_vault(vault_id) if guardia_vault_integration else None
                    
                    if not vault:
                        continue
                    
                    for message in messages:
                        if message.delivered:
                            continue
                        
                        # Check unlock conditions
                        if await self._check_message_unlock_condition(message, vault):
                            await self._deliver_message(message)
                
                await asyncio.sleep(600)  # Check every 10 minutes
                
            except Exception as e:
                logger.error(f"Message delivery error: {e}")
                await asyncio.sleep(600)
    
    async def initiate_death_verification(self, vault_id: str) -> str:
        """
        Initiate death verification process for a vault
        """
        logger.info(f"Initiating death verification for vault {vault_id}")
        
        # Record event
        event = InheritanceEvent(
            event_type="death_verification_initiated",
            vault_id=vault_id,
            timestamp=datetime.utcnow(),
            actor_address="system",
            details={"reason": "missed_checkin"}
        )
        self.inheritance_events.append(event)
        
        # Initialize verification list
        if vault_id not in self.death_verifications:
            self.death_verifications[vault_id] = []
        
        # Start verification from multiple sources
        verification_id = self._generate_verification_id(vault_id)
        
        # Check government databases (simulated)
        asyncio.create_task(self._verify_government_registry(vault_id, verification_id))
        
        # Check SSDI (simulated)
        asyncio.create_task(self._verify_ssdi(vault_id, verification_id))
        
        # Check obituaries (simulated)
        asyncio.create_task(self._verify_obituaries(vault_id, verification_id))
        
        return verification_id
    
    async def submit_death_certificate(
        self,
        vault_id: str,
        document_data: bytes,
        submitter_address: str
    ) -> str:
        """
        Submit a death certificate for verification
        """
        # Generate document hash
        document_hash = hashlib.sha256(document_data).hexdigest()
        
        # Create verification record
        verification = DeathVerification(
            source=DeathVerificationSource.DEATH_CERTIFICATE,
            verification_id=self._generate_verification_id(vault_id),
            timestamp=datetime.utcnow(),
            confidence=0.9,  # High confidence for official documents
            document_hash=document_hash,
            verifier_address=submitter_address,
            metadata={"document_size": len(document_data)}
        )
        
        # Store verification
        if vault_id not in self.death_verifications:
            self.death_verifications[vault_id] = []
        self.death_verifications[vault_id].append(verification)
        
        # Generate ZK proof if available
        if self.zk_generator:
            zk_proof = await self.zk_generator.generate_proof({
                "vault_id": vault_id,
                "document_hash": document_hash,
                "verification_type": "death_certificate",
                "timestamp": verification.timestamp.isoformat()
            })
            verification.metadata["zk_proof"] = zk_proof
        
        # Record event
        event = InheritanceEvent(
            event_type="death_certificate_submitted",
            vault_id=vault_id,
            timestamp=datetime.utcnow(),
            actor_address=submitter_address,
            details={"document_hash": document_hash},
            verified=True
        )
        self.inheritance_events.append(event)
        
        logger.info(f"Death certificate submitted for vault {vault_id}")
        
        # Check if we have consensus
        await self._check_and_trigger_consensus(vault_id)
        
        return verification.verification_id
    
    async def guardian_manual_trigger(
        self,
        vault_id: str,
        guardian_address: str,
        reason: str,
        evidence: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Allow guardian to manually trigger inheritance with evidence
        """
        if not guardia_vault_integration:
            raise ValueError("Vault integration not available")
        
        vault = guardia_vault_integration.get_vault(vault_id)
        if not vault:
            raise ValueError(f"Vault not found: {vault_id}")
        
        # Verify guardian
        is_guardian = False
        for guardian in vault.guardians:
            if guardian.address == guardian_address:
                is_guardian = True
                break
        
        if not is_guardian:
            raise ValueError("Not a guardian of this vault")
        
        # Create verification record
        verification = DeathVerification(
            source=DeathVerificationSource.OBITUARY_VERIFIED,
            verification_id=self._generate_verification_id(vault_id),
            timestamp=datetime.utcnow(),
            confidence=0.7,  # Medium confidence for guardian attestation
            verifier_address=guardian_address,
            metadata={
                "reason": reason,
                "evidence": evidence or {}
            }
        )
        
        # Store verification
        if vault_id not in self.death_verifications:
            self.death_verifications[vault_id] = []
        self.death_verifications[vault_id].append(verification)
        
        # Record event
        event = InheritanceEvent(
            event_type="guardian_manual_trigger",
            vault_id=vault_id,
            timestamp=datetime.utcnow(),
            actor_address=guardian_address,
            details={"reason": reason},
            risk_score=0.3  # Some risk in manual triggers
        )
        self.inheritance_events.append(event)
        
        # Process guardian attestation
        await guardia_vault_integration.guardian_attest(vault_id, guardian_address)
        
        logger.info(f"Guardian {guardian_address} manually triggered vault {vault_id}")
        return True
    
    async def create_legacy_message(
        self,
        vault_id: str,
        from_address: str,
        to_address: str,
        message_content: str,
        unlock_condition: str = "death_verified"
    ) -> str:
        """
        Create an encrypted legacy message
        """
        # Encrypt message (simplified - in production use proper encryption)
        encrypted_content = self._encrypt_message(message_content, to_address)
        
        # Create message record
        message = LegacyMessage(
            message_id=self._generate_message_id(vault_id, to_address),
            vault_id=vault_id,
            from_address=from_address,
            to_address=to_address,
            encrypted_content=encrypted_content,
            unlock_condition=unlock_condition,
            created_at=datetime.utcnow()
        )
        
        # Store message
        if vault_id not in self.legacy_messages:
            self.legacy_messages[vault_id] = []
        self.legacy_messages[vault_id].append(message)
        
        # Record in memory graph if available
        if memory_graph:
            await memory_graph.add_relationship(
                entity1=from_address,
                entity2=to_address,
                relationship_type="legacy_message",
                metadata={"vault_id": vault_id, "message_id": message.message_id}
            )
        
        logger.info(f"Legacy message created for vault {vault_id}")
        return message.message_id
    
    async def get_inheritance_status(self, vault_id: str) -> Dict[str, Any]:
        """
        Get comprehensive inheritance status for a vault
        """
        vault = guardia_vault_integration.get_vault(vault_id) if guardia_vault_integration else None
        
        if not vault:
            return {"error": "Vault not found"}
        
        # Get verifications
        verifications = self.death_verifications.get(vault_id, [])
        
        # Calculate consensus
        total_confidence = sum(v.confidence * v.source.value for v in verifications)
        source_count = len(set(v.source for v in verifications))
        
        # Get recent events
        vault_events = [
            e for e in self.inheritance_events
            if e.vault_id == vault_id
        ][-10:]  # Last 10 events
        
        # Get pending messages
        messages = self.legacy_messages.get(vault_id, [])
        pending_messages = [m for m in messages if not m.delivered]
        
        status = {
            "vault_id": vault_id,
            "vault_status": vault.status,
            "owner_address": vault.owner_address,
            "last_check_in": vault.last_check_in.isoformat(),
            "days_since_checkin": (datetime.utcnow() - vault.last_check_in).days,
            "death_verification": {
                "in_progress": len(verifications) > 0 and vault.status != "verified",
                "verification_count": len(verifications),
                "source_count": source_count,
                "total_confidence": total_confidence,
                "consensus_reached": total_confidence >= self.verification_threshold and source_count >= self.min_verification_sources,
                "verifications": [
                    {
                        "source": v.source.name,
                        "confidence": v.confidence,
                        "timestamp": v.timestamp.isoformat(),
                        "verified_by": v.verifier_address
                    }
                    for v in verifications
                ]
            },
            "guardians": {
                "total": len(vault.guardians),
                "attested": sum(1 for g in vault.guardians if g.has_attested),
                "required": vault.config.required_attestations,
                "details": [
                    {
                        "address": g.address,
                        "attested": g.has_attested,
                        "trust_score": g.trust_score,
                        "risk_level": g.risk_level
                    }
                    for g in vault.guardians
                ]
            },
            "beneficiaries": {
                "total": len(vault.beneficiaries),
                "claimed": sum(1 for b in vault.beneficiaries if b.has_claimed),
                "details": [
                    {
                        "address": b.address,
                        "share_percentage": b.share_percentage,
                        "claimed": b.has_claimed,
                        "risk_score": b.risk_score
                    }
                    for b in vault.beneficiaries
                ]
            },
            "legacy_messages": {
                "total": len(messages),
                "delivered": len(messages) - len(pending_messages),
                "pending": len(pending_messages)
            },
            "recent_events": [
                {
                    "type": e.event_type,
                    "timestamp": e.timestamp.isoformat(),
                    "actor": e.actor_address,
                    "risk_score": e.risk_score
                }
                for e in vault_events
            ],
            "estimated_trigger_date": self._estimate_trigger_date(vault).isoformat() if vault.status == "active" else None
        }
        
        return status
    
    async def _verify_government_registry(self, vault_id: str, verification_id: str):
        """Verify death through government registry (simulated)"""
        try:
            # In production, this would call actual government APIs
            await asyncio.sleep(5)  # Simulate API call
            
            # For demo, randomly determine if verified
            import random
            if random.random() > 0.7:  # 30% chance of finding record
                verification = DeathVerification(
                    source=DeathVerificationSource.GOVERNMENT_REGISTRY,
                    verification_id=verification_id,
                    timestamp=datetime.utcnow(),
                    confidence=1.0,  # Government records are highly trusted
                    metadata={"registry": "simulated_gov_db"}
                )
                
                if vault_id not in self.death_verifications:
                    self.death_verifications[vault_id] = []
                self.death_verifications[vault_id].append(verification)
                
                logger.info(f"Government registry verification complete for vault {vault_id}")
                
        except Exception as e:
            logger.error(f"Government verification error: {e}")
    
    async def _verify_ssdi(self, vault_id: str, verification_id: str):
        """Verify death through SSDI (simulated)"""
        try:
            # In production, this would check Social Security Death Index
            await asyncio.sleep(3)  # Simulate API call
            
            # For demo, randomly determine if verified
            import random
            if random.random() > 0.6:  # 40% chance of finding record
                verification = DeathVerification(
                    source=DeathVerificationSource.SSDI_DATABASE,
                    verification_id=verification_id,
                    timestamp=datetime.utcnow(),
                    confidence=0.9,  # SSDI is trusted but may have delays
                    metadata={"ssdi_entry": "simulated_entry"}
                )
                
                if vault_id not in self.death_verifications:
                    self.death_verifications[vault_id] = []
                self.death_verifications[vault_id].append(verification)
                
                logger.info(f"SSDI verification complete for vault {vault_id}")
                
        except Exception as e:
            logger.error(f"SSDI verification error: {e}")
    
    async def _verify_obituaries(self, vault_id: str, verification_id: str):
        """Verify death through obituaries (simulated)"""
        try:
            # In production, this would search obituary databases
            await asyncio.sleep(2)  # Simulate API call
            
            # For demo, randomly determine if verified
            import random
            if random.random() > 0.5:  # 50% chance of finding obituary
                verification = DeathVerification(
                    source=DeathVerificationSource.OBITUARY_VERIFIED,
                    verification_id=verification_id,
                    timestamp=datetime.utcnow(),
                    confidence=0.6,  # Obituaries are less trusted
                    metadata={"source": "simulated_obituary_site"}
                )
                
                if vault_id not in self.death_verifications:
                    self.death_verifications[vault_id] = []
                self.death_verifications[vault_id].append(verification)
                
                logger.info(f"Obituary verification complete for vault {vault_id}")
                
        except Exception as e:
            logger.error(f"Obituary verification error: {e}")
    
    async def _check_verification_consensus(
        self,
        vault_id: str,
        verifications: List[DeathVerification]
    ) -> bool:
        """Check if death verification has reached consensus"""
        if not verifications:
            return False
        
        # Calculate weighted confidence
        total_confidence = sum(v.confidence * v.source.value for v in verifications)
        
        # Count unique sources
        unique_sources = len(set(v.source for v in verifications))
        
        # Check if consensus reached
        consensus = (
            total_confidence >= self.verification_threshold and
            unique_sources >= self.min_verification_sources
        )
        
        if consensus:
            logger.info(f"Death verification consensus reached for vault {vault_id}")
            logger.info(f"Total confidence: {total_confidence}, Sources: {unique_sources}")
        
        return consensus
    
    async def _check_and_trigger_consensus(self, vault_id: str):
        """Check consensus and trigger vault if reached"""
        verifications = self.death_verifications.get(vault_id, [])
        
        if await self._check_verification_consensus(vault_id, verifications):
            await self._complete_death_verification(vault_id)
    
    async def _complete_death_verification(self, vault_id: str):
        """Complete death verification and update vault status"""
        if not guardia_vault_integration:
            return
        
        vault = guardia_vault_integration.get_vault(vault_id)
        if not vault:
            return
        
        # Update vault status
        vault.status = "verified"
        
        # Create attestation if attestation engine available
        if attestation_engine:
            attestation = await attestation_engine.create_attestation({
                "type": "death_verified",
                "vault_id": vault_id,
                "timestamp": datetime.utcnow().isoformat(),
                "verifications": len(self.death_verifications.get(vault_id, []))
            })
            
            logger.info(f"Death verification attestation created: {attestation}")
        
        # Record event
        event = InheritanceEvent(
            event_type="death_verified",
            vault_id=vault_id,
            timestamp=datetime.utcnow(),
            actor_address="system",
            details={
                "verification_count": len(self.death_verifications.get(vault_id, [])),
                "consensus_reached": True
            },
            verified=True
        )
        self.inheritance_events.append(event)
        
        logger.info(f"Death verification complete for vault {vault_id}")
    
    async def _check_message_unlock_condition(
        self,
        message: LegacyMessage,
        vault: Any  # InheritanceVault type
    ) -> bool:
        """Check if message unlock conditions are met"""
        if message.unlock_condition == "death_verified":
            return vault.status in ["verified", "ready_for_claim", "closed"]
        elif message.unlock_condition == "time_delay":
            # Check if enough time has passed since death verification
            if vault.status == "verified":
                time_since_verification = datetime.utcnow() - vault.last_check_in
                return time_since_verification > timedelta(days=30)  # 30 day delay
        elif message.unlock_condition == "beneficiary_claimed":
            # Check if specific beneficiary has claimed
            for beneficiary in vault.beneficiaries:
                if beneficiary.address == message.to_address:
                    return beneficiary.has_claimed
        
        return False
    
    async def _deliver_message(self, message: LegacyMessage):
        """Deliver a legacy message to beneficiary"""
        message.delivered = True
        message.delivered_at = datetime.utcnow()
        
        # In production, this would notify the beneficiary
        # For now, just log delivery
        logger.info(f"Legacy message delivered: {message.message_id} to {message.to_address}")
        
        # Record event
        event = InheritanceEvent(
            event_type="legacy_message_delivered",
            vault_id=message.vault_id,
            timestamp=datetime.utcnow(),
            actor_address="system",
            details={
                "message_id": message.message_id,
                "recipient": message.to_address
            }
        )
        self.inheritance_events.append(event)
    
    async def _send_checkin_reminder(self, vault: Any):  # InheritanceVault type
        """Send check-in reminder to vault owner"""
        # In production, this would send email/notification
        logger.info(f"Check-in reminder sent for vault {vault.vault_id}")
        
        # Record event
        event = InheritanceEvent(
            event_type="checkin_reminder_sent",
            vault_id=vault.vault_id,
            timestamp=datetime.utcnow(),
            actor_address="system",
            details={
                "days_overdue": (datetime.utcnow() - vault.last_check_in).days,
                "owner": vault.owner_address
            }
        )
        self.inheritance_events.append(event)
    
    def _estimate_trigger_date(self, vault: Any) -> datetime:  # InheritanceVault type
        """Estimate when vault will trigger based on current state"""
        check_in_date = vault.last_check_in
        check_in_days = vault.config.check_in_frequency
        grace_days = vault.config.grace_period
        
        trigger_date = check_in_date + timedelta(days=check_in_days + grace_days)
        return trigger_date
    
    def _encrypt_message(self, content: str, recipient: str) -> str:
        """Encrypt message for recipient (simplified)"""
        # In production, use proper encryption with recipient's public key
        import base64
        encrypted = base64.b64encode(f"{recipient}:{content}".encode()).decode()
        return encrypted
    
    def _generate_verification_id(self, vault_id: str) -> str:
        """Generate unique verification ID"""
        timestamp = datetime.utcnow().isoformat()
        data = f"{vault_id}_{timestamp}_verification".encode()
        return hashlib.sha256(data).hexdigest()[:16]
    
    def _generate_message_id(self, vault_id: str, recipient: str) -> str:
        """Generate unique message ID"""
        timestamp = datetime.utcnow().isoformat()
        data = f"{vault_id}_{recipient}_{timestamp}".encode()
        return hashlib.sha256(data).hexdigest()[:16]


# Singleton instance
_inheritance_manager = None


def get_inheritance_manager() -> InheritanceManager:
    """Get or create the inheritance manager instance"""
    global _inheritance_manager
    if _inheritance_manager is None:
        _inheritance_manager = InheritanceManager()
    return _inheritance_manager


# Export for easy access
inheritance_manager = get_inheritance_manager()

