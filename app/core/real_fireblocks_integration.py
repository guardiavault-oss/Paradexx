"""
Real Fireblocks SDK Integration
Production-ready implementation with proper authentication, vault management, and transaction operations
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any

import structlog
from fireblocks_sdk import (
    CONTRACT_CALL,
    TRANSACTION_TRANSFER,
    DestinationTransferPeerPath,
    FireblocksSDK,
    TransferPeerPath,
)

try:
    from fireblocks_sdk.api_types import CreateTransactionResponse, TransactionRequest
    from fireblocks_sdk.sdk_token_provider import SdkTokenProvider
except ImportError:
    # Handle different SDK versions
    SdkTokenProvider = None
    TransactionRequest = dict
    CreateTransactionResponse = dict


logger = structlog.get_logger(__name__)


class FireblocksTransactionStatus(Enum):
    SUBMITTED = "SUBMITTED"
    QUEUED = "QUEUED"
    PENDING_SIGNATURE = "PENDING_SIGNATURE"
    PENDING_AUTHORIZATION = "PENDING_AUTHORIZATION"
    PENDING_3RD_PARTY_MANUAL_APPROVAL = "PENDING_3RD_PARTY_MANUAL_APPROVAL"
    PENDING_3RD_PARTY = "PENDING_3RD_PARTY"
    AUTHORIZING = "AUTHORIZING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class FireblocksVaultType(Enum):
    VAULT = "VAULT"
    ENDPOINT_WALLET = "ENDPOINT_WALLET"
    EXCHANGE_ACCOUNT = "EXCHANGE_ACCOUNT"
    INTERNAL_WALLET = "INTERNAL_WALLET"
    EXTERNAL_WALLET = "EXTERNAL_WALLET"


class FireblocksAssetType(Enum):
    ETH = "ETH"
    BTC = "BTC"
    USDC = "USDC"
    USDT = "USDT"
    DAI = "DAI"
    LINK = "LINK"
    UNI = "UNI"
    AAVE = "AAVE"
    COMP = "COMP"
    MKR = "MKR"


@dataclass
class FireblocksConfig:
    """Fireblocks configuration"""

    api_key: str
    private_key: str
    base_url: str = "https://api.fireblocks.io"
    timeout: int = 30
    retry_count: int = 3
    rate_limit_per_minute: int = 1200


@dataclass
class FireblocksVaultAccount:
    """Fireblocks vault account"""

    id: str
    name: str
    vault_type: FireblocksVaultType
    assets: list[str]
    status: str
    created_at: datetime


@dataclass
class FireblocksTransaction:
    """Fireblocks transaction"""

    id: str
    status: FireblocksTransactionStatus
    operation: str
    source: dict[str, Any]
    destination: dict[str, Any]
    amount: str
    asset: FireblocksAssetType
    created_at: datetime
    last_updated: datetime
    signed_by: list[str]
    note: str | None = None


@dataclass
class FireblocksSigningResult:
    """Result of Fireblocks signing operation"""

    transaction_id: str
    status: FireblocksTransactionStatus
    signed_by: list[str]
    timestamp: datetime
    request_id: str


class RealFireblocksIntegration:
    """
    Production-ready Fireblocks SDK integration
    """

    def __init__(self, config: FireblocksConfig):
        self.config = config
        self.sdk = None
        self.vault_accounts: dict[str, FireblocksVaultAccount] = {}

        # Initialize Fireblocks SDK
        self._initialize_fireblocks_sdk()

    def _initialize_fireblocks_sdk(self):
        """Initialize Fireblocks SDK with proper authentication"""
        try:
            # Create token provider
            token_provider = SdkTokenProvider(
                api_key=self.config.api_key, private_key=self.config.private_key
            )

            # Create Fireblocks SDK
            self.sdk = FireblocksSDK(
                private_key=self.config.private_key,
                api_key=self.config.api_key,
                base_url=self.config.base_url,
                timeout=self.config.timeout,
            )

            # Verify connection
            self._verify_connection()

            logger.info("Fireblocks SDK initialized and authenticated successfully")

        except Exception as e:
            logger.error("Failed to initialize Fireblocks SDK", error=str(e))
            raise

    def _verify_connection(self):
        """Verify Fireblocks connection"""
        try:
            # Test connection by getting vault accounts
            vault_accounts = self.sdk.get_vault_accounts()
            logger.info(
                "Fireblocks connection verified successfully", vault_count=len(vault_accounts)
            )

        except Exception as e:
            raise RuntimeError(f"Fireblocks connection failed: {e}")

    async def get_vault_accounts(self) -> list[FireblocksVaultAccount]:
        """Get all vault accounts"""
        try:
            response = self.sdk.get_vault_accounts()

            vault_accounts = []
            for account_data in response:
                vault_account = FireblocksVaultAccount(
                    id=account_data["id"],
                    name=account_data["name"],
                    vault_type=FireblocksVaultType(account_data["customerRefId"]),
                    assets=account_data.get("assets", []),
                    status=account_data.get("status", "ACTIVE"),
                    created_at=datetime.fromisoformat(
                        account_data["creationDate"].replace("Z", "+00:00")
                    ),
                )
                vault_accounts.append(vault_account)
                self.vault_accounts[account_data["id"]] = vault_account

            return vault_accounts

        except Exception as e:
            logger.error("Failed to get vault accounts", error=str(e))
            return []

    async def get_vault_account_by_id(self, vault_account_id: str) -> FireblocksVaultAccount | None:
        """Get specific vault account by ID"""
        try:
            response = self.sdk.get_vault_account_by_id(vault_account_id)

            vault_account = FireblocksVaultAccount(
                id=response["id"],
                name=response["name"],
                vault_type=FireblocksVaultType(response["customerRefId"]),
                assets=response.get("assets", []),
                status=response.get("status", "ACTIVE"),
                created_at=datetime.fromisoformat(response["creationDate"].replace("Z", "+00:00")),
            )

            self.vault_accounts[vault_account_id] = vault_account
            return vault_account

        except Exception as e:
            logger.error(
                "Failed to get vault account", vault_account_id=vault_account_id, error=str(e)
            )
            return None

    async def create_vault_account(self, name: str, hidden_on_ui: bool = False) -> str | None:
        """Create a new vault account"""
        try:
            response = self.sdk.create_vault_account(name=name, hiddenOnUI=hidden_on_ui)

            vault_account_id = response["id"]
            logger.info(
                "Vault account created successfully", vault_account_id=vault_account_id, name=name
            )
            return vault_account_id

        except Exception as e:
            logger.error("Failed to create vault account", error=str(e))
            return None

    async def get_vault_account_balance(
        self, vault_account_id: str, asset_id: str
    ) -> dict[str, Any] | None:
        """Get vault account balance for specific asset"""
        try:
            response = self.sdk.get_vault_account_asset(vault_account_id, asset_id)
            return response

        except Exception as e:
            logger.error("Failed to get vault account balance", error=str(e))
            return None

    async def create_transaction(
        self,
        source_vault_id: str,
        destination_address: str,
        asset_id: str,
        amount: str,
        note: str | None = None,
        gas_price: str | None = None,
        gas_limit: str | None = None,
        max_fee: str | None = None,
        priority_fee: str | None = None,
        operation: str = TRANSACTION_TRANSFER,
    ) -> FireblocksTransaction | None:
        """Create a new transaction"""
        try:
            # Create source path
            source = TransferPeerPath(TransferPeerPath.VAULT_ACCOUNT, source_vault_id)

            # Create destination path
            destination = DestinationTransferPeerPath(
                DestinationTransferPeerPath.EXTERNAL_WALLET, destination_address
            )

            # Create transaction request
            tx_request = TransactionRequest(
                assetId=asset_id,
                source=source,
                destination=destination,
                amount=amount,
                operation=operation,
                note=note,
                gasPrice=gas_price,
                gasLimit=gas_limit,
                maxFee=max_fee,
                priorityFee=priority_fee,
            )

            # Submit transaction
            response = self.sdk.create_transaction(tx_request)

            transaction = FireblocksTransaction(
                id=response["id"],
                status=FireblocksTransactionStatus(response["status"]),
                operation=response["operation"],
                source=response["source"],
                destination=response["destination"],
                amount=response["amount"],
                asset=FireblocksAssetType(response["assetId"]),
                created_at=datetime.now(timezone.utc),
                last_updated=datetime.now(timezone.utc),
                signed_by=response.get("signedBy", []),
                note=note,
            )

            logger.info("Transaction created successfully", transaction_id=transaction.id)
            return transaction

        except Exception as e:
            logger.error("Failed to create transaction", error=str(e))
            return None

    async def get_transaction_by_id(self, transaction_id: str) -> FireblocksTransaction | None:
        """Get transaction by ID"""
        try:
            response = self.sdk.get_transaction_by_id(transaction_id)

            transaction = FireblocksTransaction(
                id=response["id"],
                status=FireblocksTransactionStatus(response["status"]),
                operation=response["operation"],
                source=response["source"],
                destination=response["destination"],
                amount=response["amount"],
                asset=FireblocksAssetType(response["assetId"]),
                created_at=datetime.fromisoformat(response["createdAt"].replace("Z", "+00:00")),
                last_updated=datetime.fromisoformat(response["lastUpdated"].replace("Z", "+00:00")),
                signed_by=response.get("signedBy", []),
                note=response.get("note"),
            )

            return transaction

        except Exception as e:
            logger.error("Failed to get transaction", transaction_id=transaction_id, error=str(e))
            return None

    async def cancel_transaction(self, transaction_id: str) -> bool:
        """Cancel a transaction"""
        try:
            self.sdk.cancel_transaction_by_id(transaction_id)
            logger.info("Transaction cancelled successfully", transaction_id=transaction_id)
            return True

        except Exception as e:
            logger.error(
                "Failed to cancel transaction", transaction_id=transaction_id, error=str(e)
            )
            return False

    async def approve_transaction(self, transaction_id: str) -> bool:
        """Approve a transaction"""
        try:
            self.sdk.approve_transaction_by_id(transaction_id)
            logger.info("Transaction approved successfully", transaction_id=transaction_id)
            return True

        except Exception as e:
            logger.error(
                "Failed to approve transaction", transaction_id=transaction_id, error=str(e)
            )
            return False

    async def reject_transaction(self, transaction_id: str, note: str | None = None) -> bool:
        """Reject a transaction"""
        try:
            self.sdk.reject_transaction_by_id(transaction_id, note)
            logger.info("Transaction rejected successfully", transaction_id=transaction_id)
            return True

        except Exception as e:
            logger.error(
                "Failed to reject transaction", transaction_id=transaction_id, error=str(e)
            )
            return False

    async def create_raw_transaction(
        self, vault_account_id: str, raw_transaction_data: str, note: str | None = None
    ) -> FireblocksTransaction | None:
        """Create a raw transaction (for custom smart contract interactions)"""
        try:
            # Create source path
            source = TransferPeerPath(TransferPeerPath.VAULT_ACCOUNT, vault_account_id)

            # Create transaction request for raw transaction
            tx_request = TransactionRequest(
                assetId="ETH",  # Default to ETH for raw transactions
                source=source,
                destination=source,  # Self-transaction for raw data
                amount="0",
                operation="RAW",
                note=note,
                raw_message_data=raw_transaction_data,
            )

            # Submit transaction
            response = self.sdk.create_transaction(tx_request)

            transaction = FireblocksTransaction(
                id=response["id"],
                status=FireblocksTransactionStatus(response["status"]),
                operation=response["operation"],
                source=response["source"],
                destination=response["destination"],
                amount=response["amount"],
                asset=FireblocksAssetType(response["assetId"]),
                created_at=datetime.now(timezone.utc),
                last_updated=datetime.now(timezone.utc),
                signed_by=response.get("signedBy", []),
                note=note,
            )

            logger.info("Raw transaction created successfully", transaction_id=transaction.id)
            return transaction

        except Exception as e:
            logger.error("Failed to create raw transaction", error=str(e))
            return None

    async def sign_message(
        self, vault_account_id: str, message: str, message_type: str = "MESSAGE"
    ) -> FireblocksSigningResult | None:
        """Sign a message using Fireblocks"""
        try:
            # Create source path
            source = TransferPeerPath(TransferPeerPath.VAULT_ACCOUNT, vault_account_id)

            # Create transaction request for signing
            tx_request = TransactionRequest(
                assetId="ETH",
                source=source,
                destination=source,
                amount="0",
                operation=CONTRACT_CALL,
                note="Message signing",
                extra_parameters={
                    "rawMessageData": {"messages": [{"content": message, "type": message_type}]}
                },
            )

            # Submit transaction
            response = self.sdk.create_transaction(tx_request)

            signing_result = FireblocksSigningResult(
                transaction_id=response["id"],
                status=FireblocksTransactionStatus(response["status"]),
                signed_by=response.get("signedBy", []),
                timestamp=datetime.now(timezone.utc),
                request_id=response.get("requestId", ""),
            )

            logger.info("Message signing initiated", transaction_id=signing_result.transaction_id)
            return signing_result

        except Exception as e:
            logger.error("Failed to sign message", error=str(e))
            return None

    async def get_supported_assets(self) -> list[dict[str, Any]]:
        """Get list of supported assets"""
        try:
            response = self.sdk.get_supported_assets()
            return response

        except Exception as e:
            logger.error("Failed to get supported assets", error=str(e))
            return []

    async def get_network_connections(self) -> list[dict[str, Any]]:
        """Get network connections"""
        try:
            response = self.sdk.get_network_connections()
            return response

        except Exception as e:
            logger.error("Failed to get network connections", error=str(e))
            return []

    async def create_external_wallet(
        self, name: str, customer_ref_id: str | None = None
    ) -> str | None:
        """Create an external wallet"""
        try:
            response = self.sdk.create_external_wallet(name=name, customer_ref_id=customer_ref_id)

            wallet_id = response["id"]
            logger.info("External wallet created successfully", wallet_id=wallet_id, name=name)
            return wallet_id

        except Exception as e:
            logger.error("Failed to create external wallet", error=str(e))
            return None

    async def add_external_wallet_asset(
        self, wallet_id: str, asset_id: str, address: str, tag: str | None = None
    ) -> bool:
        """Add asset to external wallet"""
        try:
            self.sdk.create_external_wallet_asset(
                wallet_id=wallet_id, asset_id=asset_id, address=address, tag=tag
            )

            logger.info("Asset added to external wallet", wallet_id=wallet_id, asset_id=asset_id)
            return True

        except Exception as e:
            logger.error("Failed to add asset to external wallet", error=str(e))
            return False

    async def get_transaction_history(
        self,
        before: str | None = None,
        after: str | None = None,
        status: str | None = None,
        order_by: str = "createdAt",
        limit: int = 200,
    ) -> list[FireblocksTransaction]:
        """Get transaction history"""
        try:
            response = self.sdk.get_transactions(
                before=before, after=after, status=status, order_by=order_by, limit=limit
            )

            transactions = []
            for tx_data in response:
                transaction = FireblocksTransaction(
                    id=tx_data["id"],
                    status=FireblocksTransactionStatus(tx_data["status"]),
                    operation=tx_data["operation"],
                    source=tx_data["source"],
                    destination=tx_data["destination"],
                    amount=tx_data["amount"],
                    asset=FireblocksAssetType(tx_data["assetId"]),
                    created_at=datetime.fromisoformat(tx_data["createdAt"].replace("Z", "+00:00")),
                    last_updated=datetime.fromisoformat(
                        tx_data["lastUpdated"].replace("Z", "+00:00")
                    ),
                    signed_by=tx_data.get("signedBy", []),
                    note=tx_data.get("note"),
                )
                transactions.append(transaction)

            return transactions

        except Exception as e:
            logger.error("Failed to get transaction history", error=str(e))
            return []

    async def health_check(self) -> dict[str, Any]:
        """Perform health check on Fireblocks connection"""
        try:
            # Test basic connectivity
            vault_accounts = await self.get_vault_accounts()
            supported_assets = await self.get_supported_assets()

            health_status = {
                "fireblocks_accessible": True,
                "vault_accounts_count": len(vault_accounts),
                "supported_assets_count": len(supported_assets),
                "base_url": self.config.base_url,
                "api_key_configured": bool(self.config.api_key),
            }

            return health_status

        except Exception as e:
            logger.error("Fireblocks health check failed", error=str(e))
            return {
                "fireblocks_accessible": False,
                "error": str(e),
                "base_url": self.config.base_url,
            }

    def get_metrics(self) -> dict[str, Any]:
        """Get Fireblocks integration metrics"""
        return {
            "vault_accounts_cached": len(self.vault_accounts),
            "base_url": self.config.base_url,
            "timeout": self.config.timeout,
            "rate_limit_per_minute": self.config.rate_limit_per_minute,
        }


# Factory function for creating Fireblocks integration
def create_fireblocks_integration(
    api_key: str, private_key: str, base_url: str = "https://api.fireblocks.io", timeout: int = 30
) -> RealFireblocksIntegration:
    """Create a Fireblocks integration instance"""

    config = FireblocksConfig(
        api_key=api_key, private_key=private_key, base_url=base_url, timeout=timeout
    )

    return RealFireblocksIntegration(config)
