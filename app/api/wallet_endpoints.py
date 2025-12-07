#!/usr/bin/env python3
"""
Wallet Transaction API Endpoints
Handles wallet operations including transaction sending, signing, and broadcasting
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any, List
import structlog

# Import core modules
try:
    from app.core.wallet_engine import get_wallet_engine
    from app.core.autonomous_defense import get_autonomous_defense
    from app.core.blockchain import blockchain_manager
    from app.core.transaction_queue import get_transaction_queue
    from web3 import Web3
except ImportError as e:
    print(f"Warning: Could not import wallet modules: {e}")
    get_wallet_engine = None
    get_autonomous_defense = None
    blockchain_manager = None
    Web3 = None

# Import error handlers and helpers
from app.api.error_handlers import handle_endpoint_errors, create_service_unavailable_error
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/wallet", tags=["wallet"])


# Request/Response Models
class SignTransactionRequest(BaseModel):
    """Request model for signing and sending transactions"""
    to: str = Field(..., description="Recipient address")
    value: str = Field(..., description="Amount in wei or token units")
    token: Optional[str] = Field(None, description="Token symbol or address (optional)")
    chainId: int = Field(1, description="Chain ID (defaults to 1 for Ethereum)")
    gas: Optional[int] = Field(None, description="Gas limit")
    gasPrice: Optional[str] = Field(None, description="Gas price in wei")
    nonce: Optional[int] = Field(None, description="Transaction nonce")
    data: Optional[str] = Field("0x", description="Transaction data (hex string)")


class TransactionResponse(BaseModel):
    """Response model for transaction sending"""
    success: bool
    transactionHash: Optional[str] = None
    status: str = "pending"
    message: Optional[str] = None
    network: Optional[str] = None
    from_address: Optional[str] = None
    protection: Optional[dict[str, Any]] = None


class CreateWalletRequest(BaseModel):
    """Request model for creating a new wallet"""
    password: str = Field(..., description="Password for encrypting wallet")


class ImportWalletRequest(BaseModel):
    """Request model for importing a wallet"""
    mnemonic: Optional[str] = Field(None, description="Mnemonic phrase (12 or 24 words)")
    private_key: Optional[str] = Field(None, description="Private key (hex string)")
    password: str = Field(..., description="Password for encrypting wallet")


class UnlockWalletRequest(BaseModel):
    """Request model for unlocking wallet"""
    password: str = Field(..., description="Wallet password")


class AddAccountRequest(BaseModel):
    """Request model for adding a new account"""
    label: Optional[str] = Field(None, description="Optional label for the account")


class SwitchAccountRequest(BaseModel):
    """Request model for switching active account"""
    account_index: int = Field(..., description="Index of account to switch to")


class WalletAccountResponse(BaseModel):
    """Response model for wallet account"""
    address: str
    public_key: str
    derivation_path: str
    label: str
    created_at: str
    is_active: bool


class WalletStateResponse(BaseModel):
    """Response model for wallet state"""
    status: str
    is_locked: bool
    accounts: List[WalletAccountResponse]
    active_account_index: int
    active_account: Optional[WalletAccountResponse] = None


@router.post("/send", response_model=TransactionResponse)
@handle_endpoint_errors("send transaction")
async def send_transaction(request: SignTransactionRequest):
    """
    Sign and send a transaction with GuardianX Autonomous Defense
    
    This endpoint automatically:
    - Rewrites dangerous transactions
    - Routes through private mempool
    - Blocks attacks on-chain
    - Learns from your habits
    
    Just like MetaMask, but with built-in security!
    """
    if not get_wallet_engine or not get_autonomous_defense or not blockchain_manager:
        raise create_service_unavailable_error("Wallet service unavailable. Please ensure all dependencies are installed.")
    
    engine = get_wallet_engine()
    
    if not engine.state or engine.state.is_locked:
        raise HTTPException(status_code=401, detail="Wallet is locked")
    
    account = engine.get_active_account()
    if not account:
        raise HTTPException(status_code=404, detail="No active account")
    
    # Get network name from chainId
    network_map = {
        1: "ethereum",
        137: "polygon",
        42161: "arbitrum",
        10: "optimism",
        8453: "base",
        56: "bsc",
        43114: "avalanche",
        250: "fantom"
    }
    network = network_map.get(request.chainId, "ethereum")
    
    # Get provider
    provider = blockchain_manager.get_provider(network)
    if not provider:
        raise HTTPException(
            status_code=400,
            detail=f"Network {network} (chain ID {request.chainId}) not supported. Please configure RPC endpoints."
        )
    
    w3, _ = provider.get_best_provider()
    
    # Validate connection
    try:
        latest_block = w3.eth.block_number
        if latest_block <= 0:
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to {network} network. Please check RPC configuration."
            )
    except Exception as e:
        logger.error(f"RPC connection error for {network}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to {network} network: {str(e)}"
        )
    
    # Get nonce if not provided
    if request.nonce is None:
        try:
            nonce = await provider.get_transaction_count(account.address)
        except Exception as e:
            logger.error(f"Error getting nonce: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get transaction nonce: {str(e)}"
            )
    else:
        nonce = request.nonce
    
    # Get gas price if not provided
    if not request.gasPrice:
        try:
            gas_price = w3.eth.gas_price
        except Exception as e:
            logger.error(f"Error getting gas price: {e}")
            # Fallback to reasonable default
            gas_price = Web3.to_wei(20, "gwei") if Web3 else int(20e9)
    else:
        gas_price = int(request.gasPrice)
    
    # Get gas limit if not provided
    if not request.gas:
        try:
            # Estimate gas for simple transfer
            gas_estimate = w3.eth.estimate_gas({
                "from": account.address,
                "to": request.to,
                "value": int(request.value) if request.value else 0,
                "data": bytes.fromhex(request.data[2:]) if request.data and request.data.startswith("0x") and len(request.data) > 2 else b""
            })
            gas = gas_estimate
        except Exception as e:
            logger.warning(f"Gas estimation failed: {e}, using default")
            gas = 21000  # Default for simple transfer
    else:
        gas = request.gas
    
    # Build transaction
    tx_dict = {
        "from": account.address,
        "to": request.to,
        "value": int(request.value) if request.value else 0,
        "data": bytes.fromhex(request.data[2:]) if request.data and request.data.startswith("0x") and len(request.data) > 2 else (bytes.fromhex(request.data) if request.data and len(request.data) > 2 else b""),
        "gas": gas,
        "gasPrice": gas_price,
        "nonce": nonce,
        "chainId": request.chainId
    }
    
    # ============================================================
    # GUARDIANX AUTONOMOUS DEFENSE SYSTEM
    # ============================================================
    # Protect transaction using unified defense system
    try:
        defense = get_autonomous_defense()
        defense_result = await defense.protect_transaction(
            transaction=tx_dict,
            wallet_address=account.address,
            chain_id=request.chainId,
            network=network,
            auto_execute=True  # Automatically execute if safe
        )
    except Exception as e:
        logger.error(f"Defense system error: {e}")
        # Continue without defense if defense system fails
        defense_result = None
    
    # Handle defense actions
    if defense_result and defense_result.action.value == "block":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Transaction blocked by GuardianX",
                "reason": f"Risk score: {defense_result.risk_score:.2f}",
                "threats": defense_result.threat_types if hasattr(defense_result, 'threat_types') else [],
                "recommendation": defense_result.ai_recommendation if hasattr(defense_result, 'ai_recommendation') else "Transaction deemed too risky"
            }
        )
    
    # Use protected transaction (may be rewritten)
    protected_tx = defense_result.final_transaction if defense_result and hasattr(defense_result, 'final_transaction') and defense_result.final_transaction else tx_dict
    
    # Sign protected transaction
    try:
        signed_tx = engine.sign_transaction(protected_tx)
    except Exception as e:
        logger.error(f"Transaction signing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sign transaction: {str(e)}"
        )
    
    # Send transaction (already routed through private mempool if configured)
    try:
        if defense_result and hasattr(defense_result, 'private_mempool_routed') and defense_result.private_mempool_routed:
            # Transaction already routed, just send
            tx_hash = w3.eth.send_raw_transaction(signed_tx)
        else:
            # Route through private mempool if available
            try:
                from app.core.mempool_defense import get_mempool_defense
                mempool = get_mempool_defense()
                mempool_result = await mempool.route_transaction(
                    protected_tx,
                    request.chainId,
                    protection_level="high"
                )
                
                if mempool_result and mempool_result.success:
                    tx_hash = mempool_result.transaction_hash
                else:
                    # Fallback to standard send
                    tx_hash = w3.eth.send_raw_transaction(signed_tx)
            except ImportError:
                # Mempool defense not available, use standard send
                tx_hash = w3.eth.send_raw_transaction(signed_tx)
    except Exception as e:
        logger.error(f"Transaction broadcast error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast transaction: {str(e)}"
        )
    
    # Get transaction hash as hex string
    tx_hash_hex = tx_hash.hex() if hasattr(tx_hash, 'hex') else str(tx_hash)
    
    # Add to transaction queue
    try:
        queue = get_transaction_queue()
        queued_tx = await queue.add_transaction(
            tx_data=protected_tx,
            chain_id=request.chainId,
            network=network,
            account_index=engine.state.active_account_index,
            priority=1,
            metadata={
                "from": account.address,
                "to": request.to,
                "value": request.value,
            }
        )
        await queue.mark_broadcasting(tx_hash_hex, queued_tx)
    except Exception as e:
        logger.warning("Failed to add transaction to queue", error=str(e))
    
    logger.info(
        "Transaction sent successfully",
        tx_hash=tx_hash_hex,
        network=network,
        from_address=account.address,
        to_address=request.to
    )
    
    return TransactionResponse(
        success=True,
        transactionHash=tx_hash_hex,
        status="pending",
        message="Transaction sent successfully. Waiting for confirmation.",
        network=network,
        from_address=account.address,
        protection={
            "action": defense_result.action.value if defense_result and hasattr(defense_result, 'action') else "allow",
            "risk_score": defense_result.risk_score if defense_result and hasattr(defense_result, 'risk_score') else 0.0,
            "rewritten": defense_result.action.value == "rewrite" if defense_result and hasattr(defense_result, 'action') else False,
            "private_mempool_routed": defense_result.private_mempool_routed if defense_result and hasattr(defense_result, 'private_mempool_routed') else False,
        } if defense_result else None
    )


@router.post("/create", response_model=dict)
@handle_endpoint_errors("create wallet")
async def create_wallet(request: CreateWalletRequest):
    """Create a new wallet with mnemonic phrase"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    try:
        result = engine.create_wallet(request.password)
        return format_response(
            success=True,
            data={
                "mnemonic": result["mnemonic"],
                "account": result["account"],
                "warning": result.get("warning")
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to create wallet", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create wallet: {str(e)}")


@router.get("/queue/status", response_model=dict)
@handle_endpoint_errors("get transaction queue status")
async def get_queue_status():
    """Get transaction queue status"""
    try:
        queue = get_transaction_queue()
        status = await queue.get_queue_status()
        return format_response(
            success=True,
            data=status,
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Failed to get queue status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get queue status: {str(e)}")


@router.get("/queue/transaction/{tx_hash}", response_model=dict)
@handle_endpoint_errors("get transaction from queue")
async def get_queue_transaction(tx_hash: str):
    """Get transaction from queue by hash"""
    try:
        queue = get_transaction_queue()
        tx = await queue.get_transaction(tx_hash)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return format_response(
            success=True,
            data={
                "tx_hash": tx.tx_hash,
                "status": tx.status.value,
                "network": tx.network,
                "chain_id": tx.chain_id,
                "confirmations": tx.confirmations,
                "required_confirmations": tx.required_confirmations,
                "error": tx.error,
                "created_at": tx.created_at.isoformat(),
                "broadcast_at": tx.broadcast_at.isoformat() if tx.broadcast_at else None,
                "confirmed_at": tx.confirmed_at.isoformat() if tx.confirmed_at else None,
            },
            timestamp=get_utc_timestamp()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get transaction", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get transaction: {str(e)}")


@router.post("/queue/cancel/{tx_hash}", response_model=dict)
@handle_endpoint_errors("cancel transaction")
async def cancel_transaction(tx_hash: str):
    """Cancel a pending transaction"""
    try:
        queue = get_transaction_queue()
        cancelled = await queue.cancel_transaction(tx_hash)
        if not cancelled:
            raise HTTPException(status_code=404, detail="Transaction not found or cannot be cancelled")
        
        return format_response(
            success=True,
            data={"tx_hash": tx_hash, "cancelled": True},
            timestamp=get_utc_timestamp()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to cancel transaction", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to cancel transaction: {str(e)}")


@router.post("/import", response_model=dict)
@handle_endpoint_errors("import wallet")
async def import_wallet(request: ImportWalletRequest):
    """Import wallet from mnemonic or private key"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    try:
        if request.mnemonic:
            result = engine.import_wallet(request.mnemonic, request.password)
        elif request.private_key:
            result = engine.import_private_key(request.private_key, request.password)
        else:
            raise HTTPException(status_code=400, detail="Either mnemonic or private_key must be provided")
        
        return format_response(
            success=True,
            data=result,
            timestamp=get_utc_timestamp()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to import wallet", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to import wallet: {str(e)}")


@router.post("/unlock", response_model=dict)
@handle_endpoint_errors("unlock wallet")
async def unlock_wallet(request: UnlockWalletRequest):
    """Unlock wallet with password"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    try:
        success = engine.unlock_wallet(request.password)
        if not success:
            raise HTTPException(status_code=401, detail="Invalid password")
        
        account = engine.get_active_account()
        return format_response(
            success=True,
            data={
                "status": "unlocked",
                "account": {
                    "address": account.address if account else None,
                    "public_key": account.public_key if account else None
                }
            },
            timestamp=get_utc_timestamp()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to unlock wallet", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to unlock wallet: {str(e)}")


@router.post("/lock", response_model=dict)
@handle_endpoint_errors("lock wallet")
async def lock_wallet():
    """Lock wallet and clear sensitive data"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    engine.lock_wallet()
    
    return format_response(
        success=True,
        data={"status": "locked"},
        timestamp=get_utc_timestamp()
    )


@router.post("/account/add", response_model=dict)
@handle_endpoint_errors("add account")
async def add_account(request: AddAccountRequest):
    """Add a new account derived from mnemonic"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    if not engine.state or engine.state.is_locked:
        raise HTTPException(status_code=401, detail="Wallet must be unlocked")
    
    try:
        account = engine.add_account(request.label)
        return format_response(
            success=True,
            data={
                "address": account.address,
                "public_key": account.public_key,
                "derivation_path": account.derivation_path,
                "label": account.label,
                "index": len(engine.state.accounts) - 1
            },
            timestamp=get_utc_timestamp()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to add account", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to add account: {str(e)}")


@router.post("/account/switch", response_model=dict)
@handle_endpoint_errors("switch account")
async def switch_account(request: SwitchAccountRequest):
    """Switch to a different account"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    if not engine.state:
        raise HTTPException(status_code=400, detail="Wallet not initialized")
    
    try:
        engine.switch_account(request.account_index)
        account = engine.get_active_account()
        return format_response(
            success=True,
            data={
                "active_account_index": request.account_index,
                "account": {
                    "address": account.address if account else None,
                    "public_key": account.public_key if account else None
                }
            },
            timestamp=get_utc_timestamp()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to switch account", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to switch account: {str(e)}")


@router.get("/accounts", response_model=dict)
@handle_endpoint_errors("list accounts")
async def list_accounts():
    """Get all wallet accounts"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    if not engine.state:
        return format_response(
            success=True,
            data={"accounts": [], "active_account_index": 0},
            timestamp=get_utc_timestamp()
        )
    
    accounts = [
        {
            "address": acc.address,
            "public_key": acc.public_key,
            "derivation_path": acc.derivation_path,
            "label": acc.label,
            "created_at": acc.created_at.isoformat(),
            "is_active": acc.is_active
        }
        for acc in engine.state.accounts
    ]
    
    active_account = engine.get_active_account()
    active_account_data = None
    if active_account:
        active_account_data = {
            "address": active_account.address,
            "public_key": active_account.public_key,
            "derivation_path": active_account.derivation_path,
            "label": active_account.label,
            "created_at": active_account.created_at.isoformat(),
            "is_active": active_account.is_active
        }
    
    return format_response(
        success=True,
        data={
            "accounts": accounts,
            "active_account_index": engine.state.active_account_index,
            "active_account": active_account_data,
            "is_locked": engine.state.is_locked
        },
        timestamp=get_utc_timestamp()
    )


@router.get("/status")
@handle_endpoint_errors("get wallet status")
async def get_wallet_status():
    """Get wallet status"""
    if not get_wallet_engine:
        raise create_service_unavailable_error("Wallet service unavailable")
    
    engine = get_wallet_engine()
    
    if not engine.state:
        return format_response(
            success=False,
            data={
                "status": "uninitialized",
                "message": "Wallet not initialized"
            },
            timestamp=get_utc_timestamp()
        )
    
    account = engine.get_active_account()
    
    return format_response(
        success=True,
        data={
            "status": "unlocked" if not engine.state.is_locked else "locked",
            "has_account": account is not None,
            "address": account.address if account else None,
            "accounts_count": len(engine.state.accounts) if engine.state else 0
        },
        timestamp=get_utc_timestamp()
    )

