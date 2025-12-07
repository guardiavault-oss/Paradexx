#!/usr/bin/env python3
"""
Fiat On-Ramp Service for GuardianX
Integrates with payment providers (Stripe, Google Pay, Apple Pay, PayPal, etc.)
to allow users to buy crypto with fiat currency
"""

import asyncio
import hashlib
import json
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger(__name__)


class PaymentProvider(Enum):
    """Supported payment providers"""
    STRIPE = "stripe"
    GOOGLE_PAY = "google_pay"
    APPLE_PAY = "apple_pay"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    WIRE_TRANSFER = "wire_transfer"


class PaymentStatus(Enum):
    """Payment status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class PaymentMethod:
    """Payment method configuration"""
    provider: PaymentProvider
    enabled: bool
    min_amount: float
    max_amount: float
    fee_percentage: float
    processing_time: str
    requires_kyc: bool = False


@dataclass
class PurchaseOrder:
    """Crypto purchase order"""
    order_id: str
    wallet_address: str
    token: str
    fiat_amount: float
    crypto_amount: float
    payment_provider: PaymentProvider
    payment_method_id: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING
    created_at: float = 0
    completed_at: Optional[float] = None
    transaction_hash: Optional[str] = None
    payment_url: Optional[str] = None
    metadata: Dict[str, Any] = None


class FiatOnRamp:
    """
    Fiat on-ramp service for buying crypto with fiat
    Integrates with multiple payment providers
    """
    
    def __init__(self):
        self.orders: Dict[str, PurchaseOrder] = {}
        self.payment_methods: Dict[PaymentProvider, PaymentMethod] = {}
        self._initialize_payment_methods()
        
        # Payment provider clients (would be initialized with API keys)
        self.stripe_client = None
        self.paypal_client = None
        
        logger.info("Fiat On-Ramp service initialized")
    
    def _initialize_payment_methods(self):
        """Initialize payment method configurations"""
        self.payment_methods[PaymentProvider.STRIPE] = PaymentMethod(
            provider=PaymentProvider.STRIPE,
            enabled=True,
            min_amount=10.0,
            max_amount=10000.0,
            fee_percentage=3.5,
            processing_time="Instant",
            requires_kyc=False
        )
        
        self.payment_methods[PaymentProvider.GOOGLE_PAY] = PaymentMethod(
            provider=PaymentProvider.GOOGLE_PAY,
            enabled=True,
            min_amount=5.0,
            max_amount=5000.0,
            fee_percentage=2.9,
            processing_time="Instant",
            requires_kyc=False
        )
        
        self.payment_methods[PaymentProvider.APPLE_PAY] = PaymentMethod(
            provider=PaymentProvider.APPLE_PAY,
            enabled=True,
            min_amount=5.0,
            max_amount=5000.0,
            fee_percentage=2.9,
            processing_time="Instant",
            requires_kyc=False
        )
        
        self.payment_methods[PaymentProvider.PAYPAL] = PaymentMethod(
            provider=PaymentProvider.PAYPAL,
            enabled=True,
            min_amount=10.0,
            max_amount=10000.0,
            fee_percentage=3.0,
            processing_time="1-2 minutes",
            requires_kyc=False
        )
        
        self.payment_methods[PaymentProvider.BANK_TRANSFER] = PaymentMethod(
            provider=PaymentProvider.BANK_TRANSFER,
            enabled=True,
            min_amount=50.0,
            max_amount=50000.0,
            fee_percentage=1.5,
            processing_time="1-3 business days",
            requires_kyc=True
        )
        
        self.payment_methods[PaymentProvider.WIRE_TRANSFER] = PaymentMethod(
            provider=PaymentProvider.WIRE_TRANSFER,
            enabled=True,
            min_amount=1000.0,
            max_amount=100000.0,
            fee_percentage=0.5,
            processing_time="1-2 business days",
            requires_kyc=True
        )
    
    async def create_purchase_order(
        self,
        wallet_address: str,
        token: str,
        fiat_amount: float,
        payment_provider: PaymentProvider,
        payment_method_id: Optional[str] = None
    ) -> PurchaseOrder:
        """
        Create a new purchase order
        
        Args:
            wallet_address: Wallet address to receive crypto
            token: Token symbol (ETH, USDC, etc.)
            fiat_amount: Amount in fiat currency (USD)
            payment_provider: Payment provider to use
            payment_method_id: Optional payment method ID (for saved cards, etc.)
        
        Returns:
            PurchaseOrder object
        """
        # Validate payment method
        if payment_provider not in self.payment_methods:
            raise ValueError(f"Payment provider {payment_provider} not supported")
        
        method = self.payment_methods[payment_provider]
        if not method.enabled:
            raise ValueError(f"Payment provider {payment_provider} is not enabled")
        
        if fiat_amount < method.min_amount or fiat_amount > method.max_amount:
            raise ValueError(
                f"Amount must be between ${method.min_amount} and ${method.max_amount}"
            )
        
        # Get exchange rate (would fetch from API)
        exchange_rate = await self._get_exchange_rate(token)
        
        # Calculate crypto amount
        fee_amount = fiat_amount * (method.fee_percentage / 100)
        net_amount = fiat_amount - fee_amount
        crypto_amount = net_amount / exchange_rate
        
        # Generate order ID
        order_id = hashlib.sha256(
            f"{wallet_address}{token}{fiat_amount}{time.time()}".encode()
        ).hexdigest()[:16]
        
        # Create order
        order = PurchaseOrder(
            order_id=order_id,
            wallet_address=wallet_address,
            token=token,
            fiat_amount=fiat_amount,
            crypto_amount=crypto_amount,
            payment_provider=payment_provider,
            payment_method_id=payment_method_id,
            status=PaymentStatus.PENDING,
            created_at=time.time(),
            metadata={}
        )
        
        self.orders[order_id] = order
        
        # Create payment with provider
        payment_url = await self._create_payment(order)
        order.payment_url = payment_url
        
        logger.info(
            "Purchase order created",
            order_id=order_id,
            token=token,
            fiat_amount=fiat_amount,
            crypto_amount=crypto_amount,
            provider=payment_provider.value
        )
        
        return order
    
    async def _get_exchange_rate(self, token: str) -> float:
        """Get current exchange rate for token"""
        # Mock exchange rates (would fetch from CoinGecko, CoinMarketCap, etc.)
        rates = {
            'ETH': 2500.0,
            'USDC': 1.0,
            'USDT': 1.0,
            'BTC': 45000.0,
            'SOL': 100.0
        }
        return rates.get(token.upper(), 1.0)
    
    async def _create_payment(self, order: PurchaseOrder) -> str:
        """Create payment with payment provider"""
        try:
            if order.payment_provider == PaymentProvider.STRIPE:
                return await self._create_stripe_payment(order)
            elif order.payment_provider == PaymentProvider.PAYPAL:
                return await self._create_paypal_payment(order)
            elif order.payment_provider in [PaymentProvider.GOOGLE_PAY, PaymentProvider.APPLE_PAY]:
                return await self._create_mobile_payment(order)
            else:
                # Bank/wire transfer - return instructions
                return f"http://localhost:8003/api/wallet/buy-crypto/instructions/{order.order_id}"
        except Exception as e:
            logger.error("Payment creation failed", error=str(e), order_id=order.order_id)
            raise
    
    async def _create_stripe_payment(self, order: PurchaseOrder) -> str:
        """Create Stripe payment session"""
        # Mock Stripe integration
        # In production, would use: stripe.checkout.Session.create()
        payment_url = f"https://checkout.stripe.com/pay/{order.order_id}"
        logger.info("Stripe payment created", order_id=order.order_id, url=payment_url)
        return payment_url
    
    async def _create_paypal_payment(self, order: PurchaseOrder) -> str:
        """Create PayPal payment"""
        # Mock PayPal integration
        # In production, would use PayPal SDK
        payment_url = f"https://paypal.com/checkout/{order.order_id}"
        logger.info("PayPal payment created", order_id=order.order_id, url=payment_url)
        return payment_url
    
    async def _create_mobile_payment(self, order: PurchaseOrder) -> str:
        """Create Google Pay / Apple Pay payment"""
        # Mobile payments would use their respective SDKs
        payment_url = f"http://localhost:8003/api/wallet/buy-crypto/mobile/{order.order_id}"
        logger.info("Mobile payment created", order_id=order.order_id, provider=order.payment_provider.value)
        return payment_url
    
    async def process_payment_webhook(
        self,
        provider: PaymentProvider,
        webhook_data: Dict[str, Any]
    ) -> Optional[PurchaseOrder]:
        """
        Process payment webhook from provider
        
        Args:
            provider: Payment provider
            webhook_data: Webhook payload
        
        Returns:
            Updated PurchaseOrder if found
        """
        # Extract order ID from webhook
        order_id = webhook_data.get('order_id') or webhook_data.get('metadata', {}).get('order_id')
        
        if not order_id or order_id not in self.orders:
            logger.warning("Order not found in webhook", order_id=order_id)
            return None
        
        order = self.orders[order_id]
        
        # Update order status based on webhook
        if webhook_data.get('status') == 'succeeded' or webhook_data.get('paid'):
            order.status = PaymentStatus.COMPLETED
            order.completed_at = time.time()
            
            # Send crypto to wallet
            await self._send_crypto_to_wallet(order)
        elif webhook_data.get('status') == 'failed':
            order.status = PaymentStatus.FAILED
        elif webhook_data.get('status') == 'cancelled':
            order.status = PaymentStatus.CANCELLED
        
        logger.info(
            "Payment webhook processed",
            order_id=order_id,
            status=order.status.value
        )
        
        return order
    
    async def _send_crypto_to_wallet(self, order: PurchaseOrder):
        """Send purchased crypto to user's wallet"""
        try:
            from .blockchain import blockchain_manager
            from .wallet_engine import get_wallet_engine
            
            # Get network for token
            network_map = {
                'ETH': 'ethereum',
                'USDC': 'ethereum',  # Could be on multiple chains
                'USDT': 'ethereum',
                'BTC': 'bitcoin',
                'SOL': 'solana'
            }
            network = network_map.get(order.token.upper(), 'ethereum')
            
            # Get provider
            provider = blockchain_manager.get_provider(network)
            if not provider:
                raise ValueError(f"Network {network} not supported")
            
            # In production, this would:
            # 1. Use a hot wallet or exchange API to send crypto
            # 2. Or use a third-party service like MoonPay, Ramp, etc.
            # 3. Or integrate with a DEX aggregator
            
            # For now, log the transaction
            logger.info(
                "Crypto sent to wallet",
                order_id=order.order_id,
                wallet=order.wallet_address,
                token=order.token,
                amount=order.crypto_amount
            )
            
            # Mock transaction hash
            order.transaction_hash = f"0x{hashlib.sha256(order.order_id.encode()).hexdigest()[:64]}"
            
        except Exception as e:
            logger.error("Failed to send crypto", error=str(e), order_id=order.order_id)
            raise
    
    def get_order(self, order_id: str) -> Optional[PurchaseOrder]:
        """Get purchase order by ID"""
        return self.orders.get(order_id)
    
    def get_payment_methods(self) -> List[PaymentMethod]:
        """Get all available payment methods"""
        return [method for method in self.payment_methods.values() if method.enabled]


# Global instance
_fiat_onramp: Optional[FiatOnRamp] = None


def get_fiat_onramp() -> FiatOnRamp:
    """Get or create the global fiat on-ramp instance"""
    global _fiat_onramp
    if _fiat_onramp is None:
        _fiat_onramp = FiatOnRamp()
    return _fiat_onramp

