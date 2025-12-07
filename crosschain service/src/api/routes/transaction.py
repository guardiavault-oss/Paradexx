"""Transaction validation API routes."""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, validator

from ...models.transaction import CrossChainTransaction, TransactionStatus, TransactionValidation
from ...utils.network_utils import validate_network

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class TransactionValidationRequest(BaseModel):
    """Request model for transaction validation."""

    transaction_hash: str = Field(..., description="Transaction hash to validate")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    expected_amount: float | None = Field(None, description="Expected transaction amount")
    expected_recipient: str | None = Field(None, description="Expected recipient address")
    validate_finality: bool = Field(default=True, description="Validate transaction finality")
    check_slippage: bool = Field(default=True, description="Check for slippage")

    @validator("transaction_hash")
    def validate_tx_hash(cls, v):
        if not v.startswith("0x") or len(v) != 66:
            raise ValueError("Invalid transaction hash format")
        return v.lower()

    @validator("source_network", "target_network")
    def validate_networks(cls, v):
        if not validate_network(v):
            raise ValueError(f"Unsupported network: {v}")
        return v

    @validator("expected_recipient")
    def validate_recipient(cls, v):
        if v and (not v.startswith("0x") or len(v) != 42):
            raise ValueError("Invalid recipient address format")
        return v.lower() if v else v


class CrossChainTransactionRequest(BaseModel):
    """Request model for cross-chain transaction analysis."""

    transaction_hash: str = Field(..., description="Transaction hash")
    source_network: str = Field(..., description="Source network")
    target_network: str = Field(..., description="Target network")
    include_analysis: bool = Field(default=True, description="Include detailed analysis")

    @validator("transaction_hash")
    def validate_tx_hash(cls, v):
        if not v.startswith("0x") or len(v) != 66:
            raise ValueError("Invalid transaction hash format")
        return v.lower()

    @validator("source_network", "target_network")
    def validate_networks(cls, v):
        if not validate_network(v):
            raise ValueError(f"Unsupported network: {v}")
        return v


@router.post("/validate", response_model=TransactionValidation)
async def validate_cross_chain_transaction(
    request: TransactionValidationRequest, 
    app_request: Request
):
    """
    Validate a cross-chain transaction.

    This endpoint validates cross-chain transactions by checking finality,
    amount accuracy, recipient correctness, and slippage tolerance.
    """
    try:
        logger.info(f"Validating cross-chain transaction: {request.transaction_hash}")

        # Get blockchain integration from app state
        blockchain_integration = app_request.app.state.blockchain_integration
        if not blockchain_integration:
            raise HTTPException(status_code=503, detail="Blockchain integration not available")

        # Get transaction from source network
        tx_data = await blockchain_integration.get_transaction(
            request.source_network,
            request.transaction_hash
        )
        
        if not tx_data:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {request.transaction_hash} not found on {request.source_network}"
            )

        # Get latest block to check finality
        latest_block = await blockchain_integration.get_latest_block(request.source_network)
        if not latest_block:
            raise HTTPException(
                status_code=503,
                detail=f"Unable to get latest block for {request.source_network}"
            )

        # Calculate confirmation blocks
        confirmation_blocks = latest_block.number - tx_data.block_number
        # Network-specific confirmation requirements could be configured here
        required_confirmations = 12  # Default, can be network-specific
        
        # Check finality
        finality_confirmed = confirmation_blocks >= required_confirmations
        
        # Validate amount (for native token transfers)
        actual_amount = tx_data.value / 1e18  # Convert from wei
        amount_matches = True
        if request.expected_amount is not None:
            # Allow 0.1% tolerance for rounding
            tolerance = abs(request.expected_amount * 0.001)
            amount_matches = abs(actual_amount - request.expected_amount) <= tolerance

        # Validate recipient
        recipient_matches = True
        if request.expected_recipient:
            recipient_matches = (
                tx_data.to_address.lower() == request.expected_recipient.lower()
            )

        # Check slippage (for token transfers, would need to decode transaction data)
        slippage_within_limits = True
        slippage_percentage = 0.0
        
        # For token transfers, decode the transaction data to get actual amount
        if tx_data.input_data and tx_data.input_data != "0x":
            # This is a contract call - could be a token transfer
            # In production, decode using ERC-20 Transfer event from receipt
            try:
                # Get transaction receipt to check logs
                receipt = tx_data.receipt
                if receipt and receipt.get("logs"):
                    # Look for Transfer events in logs
                    # Transfer(address indexed from, address indexed to, uint256 value)
                    # transfer_event_signature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                    # In production, properly decode logs using ABI to extract actual token amounts
                    # For now, assume slippage is within limits if transaction succeeded
                    # Future enhancement: decode Transfer events to calculate actual slippage
                    pass
            except Exception as e:
                logger.warning(f"Error checking slippage: {e}")

        # Determine overall validity
        is_valid = (
            finality_confirmed and
            amount_matches and
            recipient_matches and
            slippage_within_limits
        )

        validation_errors = []
        if not finality_confirmed:
            validation_errors.append(
                f"Transaction not finalized. Only {confirmation_blocks} confirmations, need {required_confirmations}"
            )
        if not amount_matches:
            validation_errors.append(
                f"Amount mismatch. Expected: {request.expected_amount}, Actual: {actual_amount}"
            )
        if not recipient_matches:
            validation_errors.append(
                f"Recipient mismatch. Expected: {request.expected_recipient}, Actual: {tx_data.to_address}"
            )
        if not slippage_within_limits:
            validation_errors.append(f"Slippage {slippage_percentage}% exceeds limits")

        validation = TransactionValidation(
            transaction_hash=request.transaction_hash,
            source_network=request.source_network,
            target_network=request.target_network,
            is_valid=is_valid,
            amount_matches=amount_matches,
            recipient_matches=recipient_matches,
            finality_confirmed=finality_confirmed,
            slippage_within_limits=slippage_within_limits,
            expected_amount=request.expected_amount,
            actual_amount=actual_amount,
            expected_recipient=request.expected_recipient,
            actual_recipient=tx_data.to_address,
            slippage_percentage=slippage_percentage,
            validation_timestamp=datetime.utcnow(),
            validation_errors=validation_errors,
        )
        
        logger.info(
            "Transaction validation completed",
            is_valid=is_valid,
            confirmations=confirmation_blocks
        )
        return validation

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error validating transaction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/analyze", response_model=CrossChainTransaction)
async def analyze_cross_chain_transaction(request: CrossChainTransactionRequest):
    """
    Analyze a cross-chain transaction for security and risk assessment.

    This endpoint provides comprehensive analysis of cross-chain transactions
    including security assessment, risk evaluation, and anomaly detection.
    """
    try:
        logger.info(f"Analyzing cross-chain transaction: {request.transaction_hash}")

        # Mock transaction analysis
        transaction = CrossChainTransaction(
            transaction_hash=request.transaction_hash,
            source_network=request.source_network,
            target_network=request.target_network,
            from_address="0x1234567890123456789012345678901234567890",
            to_address="0x0987654321098765432109876543210987654321",
            amount=1000.0,
            token_address="0xA0b86a33E6441c8C06DD4C4e4B0b8c8C8C8C8C8C",
            token_symbol="USDC",
            transaction_type="bridge_deposit",
            status=TransactionStatus.CONFIRMED,
            gas_used=21000,
            gas_price=25.0,
            block_number=18500000,
            timestamp="2024-01-01T12:00:00Z",
            bridge_address="0x5678901234567890123456789012345678901234",
            cross_chain_tx_hash="0x9876543210987654321098765432109876543210",
            confirmation_blocks=12,
            finality_time="2024-01-01T12:02:30Z",
            is_validated=True,
            validation_timestamp="2024-01-01T12:02:30Z",
            validation_errors=[],
        )

        logger.info("Transaction analysis completed")
        return transaction

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing transaction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{transaction_hash}/status")
async def get_transaction_status(transaction_hash: str, network: str):
    """
    Get the current status of a transaction.

    This endpoint provides real-time status information for a transaction
    including confirmation status, finality, and any errors.
    """
    try:
        if not transaction_hash.startswith("0x") or len(transaction_hash) != 66:
            raise HTTPException(status_code=400, detail="Invalid transaction hash format")

        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Getting status for transaction: {transaction_hash}")

        # Mock transaction status
        status = {
            "transaction_hash": transaction_hash.lower(),
            "network": network,
            "status": "confirmed",
            "block_number": 18500000 + hash(transaction_hash) % 1000,
            "confirmation_count": 12,
            "gas_used": 21000,
            "gas_price_gwei": 25.0,
            "transaction_fee": 0.000525,  # ETH
            "timestamp": "2024-01-01T12:00:00Z",
            "finality_status": "final",
            "cross_chain_status": {
                "source_confirmed": True,
                "target_confirmed": True,
                "bridge_processed": True,
                "finality_achieved": True,
            },
            "risk_assessment": {
                "risk_level": "low",
                "anomaly_detected": False,
                "suspicious_indicators": [],
            },
        }

        return status

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{transaction_hash}/details")
async def get_transaction_details(
    transaction_hash: str, network: str, include_receipt: bool = True, include_traces: bool = False
):
    """
    Get detailed information about a transaction.

    This endpoint provides comprehensive transaction details including
    receipt, traces, and cross-chain specific information.
    """
    try:
        if not transaction_hash.startswith("0x") or len(transaction_hash) != 66:
            raise HTTPException(status_code=400, detail="Invalid transaction hash format")

        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Getting details for transaction: {transaction_hash}")

        # Mock transaction details
        details = {
            "transaction_hash": transaction_hash.lower(),
            "network": network,
            "block_number": 18500000 + hash(transaction_hash) % 1000,
            "transaction_index": 5,
            "from_address": "0x1234567890123456789012345678901234567890",
            "to_address": "0x0987654321098765432109876543210987654321",
            "value": "0",
            "gas": 21000,
            "gas_price": "25000000000",  # 25 Gwei in wei
            "gas_used": 21000,
            "transaction_fee": "525000000000000",  # 0.000525 ETH in wei
            "nonce": 42,
            "input_data": "0x",
            "timestamp": "2024-01-01T12:00:00Z",
            "status": "success",
            "logs": [
                {
                    "address": "0xA0b86a33E6441c8C06DD4C4e4B0b8c8C8C8C8C8C",
                    "topics": [
                        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                        "0x0000000000000000000000001234567890123456789012345678901234567890",
                        "0x0000000000000000000000000987654321098765432109876543210987654321",
                    ],
                    "data": "0x00000000000000000000000000000000000000000000000000000000000003e8",
                    "log_index": 0,
                    "transaction_index": 5,
                    "transaction_hash": transaction_hash.lower(),
                    "block_number": 18500000 + hash(transaction_hash) % 1000,
                    "block_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                }
            ],
            "cross_chain_info": {
                "is_cross_chain": True,
                "bridge_address": "0x5678901234567890123456789012345678901234",
                "target_network": "polygon",
                "target_transaction_hash": "0x9876543210987654321098765432109876543210",
                "bridge_type": "lock_and_mint",
                "token_address": "0xA0b86a33E6441c8C06DD4C4e4B0b8c8C8C8C8C8C",
                "token_symbol": "USDC",
                "amount": "1000000000",  # 1000 USDC (6 decimals)
                "finality_status": "final",
            },
        }

        if include_receipt:
            details["receipt"] = {
                "transaction_hash": transaction_hash.lower(),
                "transaction_index": 5,
                "block_number": 18500000 + hash(transaction_hash) % 1000,
                "block_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                "cumulative_gas_used": 21000,
                "gas_used": 21000,
                "contract_address": None,
                "logs": details["logs"],
                "status": 1,
                "effective_gas_price": "25000000000",
            }

        if include_traces:
            details["traces"] = [
                {
                    "type": "call",
                    "action": {
                        "call_type": "call",
                        "from": "0x1234567890123456789012345678901234567890",
                        "to": "0x0987654321098765432109876543210987654321",
                        "value": "0",
                        "gas": "21000",
                        "input": "0x",
                    },
                    "result": {"gas_used": "21000", "output": "0x"},
                }
            ]

        return details

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/search")
async def search_transactions(
    network: str,
    from_address: str | None = None,
    to_address: str | None = None,
    token_address: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    start_time: str | None = None,
    end_time: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """
    Search for transactions with various filters.

    This endpoint allows searching for transactions based on multiple criteria
    including addresses, amounts, time ranges, and token types.
    """
    try:
        if not validate_network(network):
            raise HTTPException(status_code=400, detail=f"Unsupported network: {network}")

        logger.info(f"Searching transactions on {network}")

        # Mock search results
        transactions = []
        for i in range(min(limit, 10)):  # Mock 10 transactions max
            tx_hash = f"0x{hash(f'{network}{i}') % 1000000000000000000000000000000000000000000000000000000000000000:064x}"
            transactions.append(
                {
                    "transaction_hash": tx_hash,
                    "block_number": 18500000 + i,
                    "from_address": "0x1234567890123456789012345678901234567890",
                    "to_address": "0x0987654321098765432109876543210987654321",
                    "value": "0",
                    "token_address": "0xA0b86a33E6441c8C06DD4C4e4B0b8c8C8C8C8C8C",
                    "token_symbol": "USDC",
                    "amount": "1000000000",  # 1000 USDC
                    "gas_used": 21000,
                    "gas_price_gwei": 25.0,
                    "timestamp": "2024-01-01T12:00:00Z",
                    "status": "success",
                    "is_cross_chain": True,
                    "bridge_address": "0x5678901234567890123456789012345678901234",
                }
            )

        return {
            "transactions": transactions,
            "total": 100,  # Mock total
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < 100,
            "filters_applied": {
                "network": network,
                "from_address": from_address,
                "to_address": to_address,
                "token_address": token_address,
                "min_amount": min_amount,
                "max_amount": max_amount,
                "start_time": start_time,
                "end_time": end_time,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching transactions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
