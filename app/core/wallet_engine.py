#!/usr/bin/env python3
"""
GuardianX Wallet Engine
Core wallet functionality: account creation, import, signing, transaction building
"""

import hashlib
import json
import secrets
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pathlib import Path

import structlog
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_keys import keys
from eth_utils import to_checksum_address
from mnemonic import Mnemonic
from web3 import Web3

logger = structlog.get_logger(__name__)


class WalletStatus(Enum):
    """Wallet status"""
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    CREATING = "creating"
    IMPORTING = "importing"


@dataclass
class WalletAccount:
    """Wallet account representation"""
    address: str
    private_key: Optional[str] = None  # Only in memory when unlocked
    public_key: str = ""
    derivation_path: str = "m/44'/60'/0'/0/0"
    created_at: datetime = field(default_factory=datetime.utcnow)
    label: str = ""
    is_active: bool = True


@dataclass
class WalletState:
    """Wallet state"""
    accounts: List[WalletAccount] = field(default_factory=list)
    active_account_index: int = 0
    networks: List[Dict[str, Any]] = field(default_factory=list)
    active_network: str = "ethereum"
    is_locked: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)


class WalletEngine:
    """
    Core wallet engine for account management and transaction signing
    """
    
    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or Path.home() / ".guardianx" / "wallet"
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.state: Optional[WalletState] = None
        self.encryption_key: Optional[bytes] = None
        self.mnemonic: Optional[str] = None
        
        # Default networks
        self.default_networks = [
            {
                "name": "Ethereum Mainnet",
                "chainId": 1,
                "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2/demo",
                "explorer": "https://etherscan.io",
                "symbol": "ETH",
                "decimals": 18
            },
            {
                "name": "Polygon",
                "chainId": 137,
                "rpcUrl": "https://polygon-rpc.com",
                "explorer": "https://polygonscan.com",
                "symbol": "MATIC",
                "decimals": 18
            },
            {
                "name": "Arbitrum One",
                "chainId": 42161,
                "rpcUrl": "https://arb1.arbitrum.io/rpc",
                "explorer": "https://arbiscan.io",
                "symbol": "ETH",
                "decimals": 18
            },
            {
                "name": "Optimism",
                "chainId": 10,
                "rpcUrl": "https://mainnet.optimism.io",
                "explorer": "https://optimistic.etherscan.io",
                "symbol": "ETH",
                "decimals": 18
            },
            {
                "name": "Base",
                "chainId": 8453,
                "rpcUrl": "https://mainnet.base.org",
                "explorer": "https://basescan.org",
                "symbol": "ETH",
                "decimals": 18
            },
            {
                "name": "BSC",
                "chainId": 56,
                "rpcUrl": "https://bsc-dataseed.binance.org",
                "explorer": "https://bscscan.com",
                "symbol": "BNB",
                "decimals": 18
            }
        ]
    
    def create_wallet(self, password: str) -> Dict[str, Any]:
        """
        Create a new wallet with mnemonic phrase
        
        Args:
            password: Password for encrypting wallet data
        
        Returns:
            Dict with mnemonic phrase and first account
        """
        try:
            # Generate mnemonic
            mnemo = Mnemonic("english")
            self.mnemonic = mnemo.generate(strength=128)  # 12 words
            
            # Derive encryption key from password
            self.encryption_key = self._derive_key_from_password(password)
            
            # Create first account
            account = self._derive_account_from_mnemonic(self.mnemonic, 0)
            
            # Initialize wallet state
            self.state = WalletState(
                accounts=[account],
                active_account_index=0,
                networks=self.default_networks.copy(),
                active_network="ethereum",
                is_locked=False
            )
            
            # Save encrypted wallet
            self._save_wallet(password)
            
            logger.info("Wallet created successfully", address=account.address)
            
            return {
                "mnemonic": self.mnemonic,
                "account": {
                    "address": account.address,
                    "public_key": account.public_key
                },
                "warning": "Save your mnemonic phrase securely! It cannot be recovered if lost."
            }
            
        except Exception as e:
            logger.error("Failed to create wallet", error=str(e))
            raise
    
    def import_wallet(self, mnemonic: str, password: str) -> Dict[str, Any]:
        """
        Import wallet from mnemonic phrase
        
        Args:
            mnemonic: 12 or 24 word mnemonic phrase
            password: Password for encrypting wallet data
        
        Returns:
            Dict with imported account
        """
        try:
            # Validate mnemonic
            mnemo = Mnemonic("english")
            if not mnemo.check(mnemonic):
                raise ValueError("Invalid mnemonic phrase")
            
            self.mnemonic = mnemonic
            
            # Derive encryption key
            self.encryption_key = self._derive_key_from_password(password)
            
            # Create first account
            account = self._derive_account_from_mnemonic(self.mnemonic, 0)
            
            # Initialize wallet state
            self.state = WalletState(
                accounts=[account],
                active_account_index=0,
                networks=self.default_networks.copy(),
                active_network="ethereum",
                is_locked=False
            )
            
            # Save encrypted wallet
            self._save_wallet(password)
            
            logger.info("Wallet imported successfully", address=account.address)
            
            return {
                "account": {
                    "address": account.address,
                    "public_key": account.public_key
                }
            }
            
        except Exception as e:
            logger.error("Failed to import wallet", error=str(e))
            raise
    
    def import_private_key(self, private_key: str, password: str) -> Dict[str, Any]:
        """
        Import wallet from private key
        
        Args:
            private_key: Private key (hex string with or without 0x)
            password: Password for encrypting wallet data
        
        Returns:
            Dict with imported account
        """
        try:
            # Validate and normalize private key
            if private_key.startswith("0x"):
                private_key = private_key[2:]
            
            if len(private_key) != 64:
                raise ValueError("Invalid private key length")
            
            # Create account from private key
            account_obj = Account.from_key("0x" + private_key)
            
            account = WalletAccount(
                address=to_checksum_address(account_obj.address),
                private_key="0x" + private_key,
                public_key=account_obj.key.hex()
            )
            
            # Derive encryption key
            self.encryption_key = self._derive_key_from_password(password)
            
            # Initialize wallet state
            self.state = WalletState(
                accounts=[account],
                active_account_index=0,
                networks=self.default_networks.copy(),
                active_network="ethereum",
                is_locked=False
            )
            
            # Save encrypted wallet
            self._save_wallet(password)
            
            logger.info("Wallet imported from private key", address=account.address)
            
            return {
                "account": {
                    "address": account.address,
                    "public_key": account.public_key
                }
            }
            
        except Exception as e:
            logger.error("Failed to import private key", error=str(e))
            raise
    
    def unlock_wallet(self, password: str) -> bool:
        """
        Unlock wallet with password
        
        Args:
            password: Wallet password
        
        Returns:
            True if unlocked successfully
        """
        try:
            # Load encrypted wallet
            encrypted_data = self._load_encrypted_wallet()
            if not encrypted_data:
                raise ValueError("No wallet found. Please create or import a wallet first.")
            
            # Derive key from password
            key = self._derive_key_from_password(password)
            
            # Decrypt wallet data
            wallet_data = self._decrypt_data(encrypted_data, key)
            
            # Parse wallet state
            self.state = self._deserialize_wallet_state(wallet_data)
            
            # If mnemonic exists, derive private keys
            if "mnemonic" in wallet_data:
                self.mnemonic = wallet_data["mnemonic"]
                for i, acc in enumerate(self.state.accounts):
                    derived = self._derive_account_from_mnemonic(self.mnemonic, i)
                    acc.private_key = derived.private_key
                    acc.public_key = derived.public_key
            
            self.encryption_key = key
            self.state.is_locked = False
            
            logger.info("Wallet unlocked successfully", account_count=len(self.state.accounts))
            return True
            
        except Exception as e:
            logger.error("Failed to unlock wallet", error=str(e))
            return False
    
    def lock_wallet(self):
        """Lock wallet and clear sensitive data from memory"""
        if self.state:
            # Clear private keys from memory
            for account in self.state.accounts:
                account.private_key = None
            self.state.is_locked = True
            self.encryption_key = None
            self.mnemonic = None
            logger.info("Wallet locked")
    
    def add_account(self, label: Optional[str] = None) -> WalletAccount:
        """
        Add a new account derived from mnemonic
        
        Args:
            label: Optional label for the account
        
        Returns:
            New wallet account
        """
        if not self.state or self.state.is_locked:
            raise ValueError("Wallet must be unlocked to add accounts")
        
        if not self.mnemonic:
            raise ValueError("Cannot add account: wallet was not created from mnemonic")
        
        # Derive new account
        account_index = len(self.state.accounts)
        account = self._derive_account_from_mnemonic(self.mnemonic, account_index)
        account.label = label or f"Account {account_index + 1}"
        
        self.state.accounts.append(account)
        
        # Save wallet
        self._save_wallet()
        
        logger.info("Account added", address=account.address, index=account_index)
        return account
    
    def get_active_account(self) -> Optional[WalletAccount]:
        """Get the currently active account"""
        if not self.state or self.state.is_locked:
            return None
        
        if not self.state.accounts:
            return None
        
        index = self.state.active_account_index
        if index >= len(self.state.accounts):
            index = 0
        
        return self.state.accounts[index]
    
    def switch_account(self, account_index: int):
        """Switch to a different account"""
        if not self.state:
            raise ValueError("Wallet not initialized")
        
        if account_index < 0 or account_index >= len(self.state.accounts):
            raise ValueError("Invalid account index")
        
        self.state.active_account_index = account_index
        self._save_wallet()
        
        logger.info("Switched account", index=account_index, address=self.state.accounts[account_index].address)
    
    def sign_transaction(self, transaction: Dict[str, Any]) -> str:
        """
        Sign a transaction
        
        Args:
            transaction: Transaction dict with to, value, data, gas, etc.
        
        Returns:
            Signed transaction (raw hex)
        """
        if not self.state or self.state.is_locked:
            raise ValueError("Wallet must be unlocked to sign transactions")
        
        account = self.get_active_account()
        if not account or not account.private_key:
            raise ValueError("No active account or private key not available")
        
        try:
            # Create account object
            account_obj = Account.from_key(account.private_key)
            
            # Build transaction
            tx_dict = {
                "nonce": transaction.get("nonce", 0),
                "gasPrice": transaction.get("gasPrice", Web3.to_wei(20, "gwei")),
                "gas": transaction.get("gas", 21000),
                "to": transaction.get("to"),
                "value": transaction.get("value", 0),
                "data": transaction.get("data", b""),
                "chainId": transaction.get("chainId", 1)
            }
            
            # Sign transaction
            signed_tx = account_obj.sign_transaction(tx_dict)
            
            logger.info("Transaction signed", tx_hash=signed_tx.hash.hex())
            return signed_tx.rawTransaction.hex()
            
        except Exception as e:
            logger.error("Failed to sign transaction", error=str(e))
            raise
    
    def sign_message(self, message: str) -> str:
        """
        Sign a message (EIP-191)
        
        Args:
            message: Message to sign
        
        Returns:
            Signature (hex string)
        """
        if not self.state or self.state.is_locked:
            raise ValueError("Wallet must be unlocked to sign messages")
        
        account = self.get_active_account()
        if not account or not account.private_key:
            raise ValueError("No active account or private key not available")
        
        try:
            account_obj = Account.from_key(account.private_key)
            message_hash = encode_defunct(text=message)
            signed = account_obj.sign_message(message_hash)
            
            logger.info("Message signed", address=account.address)
            return signed.signature.hex()
            
        except Exception as e:
            logger.error("Failed to sign message", error=str(e))
            raise
    
    def sign_typed_data(self, domain: Dict, types: Dict, message: Dict) -> str:
        """
        Sign typed data (EIP-712)
        
        Args:
            domain: EIP-712 domain
            types: Type definitions
            message: Message data
        
        Returns:
            Signature (hex string)
        """
        if not self.state or self.state.is_locked:
            raise ValueError("Wallet must be unlocked to sign typed data")
        
        account = self.get_active_account()
        if not account or not account.private_key:
            raise ValueError("No active account or private key not available")
        
        try:
            from eth_account.messages import encode_structured_data
            
            account_obj = Account.from_key(account.private_key)
            message_hash = encode_structured_data({"domain": domain, "types": types, "primaryType": list(types.keys())[0], "message": message})
            signed = account_obj.sign_message(message_hash)
            
            logger.info("Typed data signed", address=account.address)
            return signed.signature.hex()
            
        except Exception as e:
            logger.error("Failed to sign typed data", error=str(e))
            raise
    
    def _derive_account_from_mnemonic(self, mnemonic: str, index: int) -> WalletAccount:
        """Derive account from mnemonic at given index using BIP44"""
        try:
            from mnemonic import Mnemonic
            
            mnemo = Mnemonic("english")
            seed = mnemo.to_seed(mnemonic)
            
            # Derive private key using BIP44 path: m/44'/60'/0'/0/index (MetaMask compatible)
            derivation_path = f"m/44'/60'/0'/0/{index}"
            private_key = self._derive_private_key(seed, derivation_path)
            
            # Ensure private key is valid format
            if not private_key.startswith("0x"):
                private_key = "0x" + private_key
            
            # Create account
            account_obj = Account.from_key(private_key)
            
            return WalletAccount(
                address=to_checksum_address(account_obj.address),
                private_key=private_key,
                public_key=account_obj.key.hex(),
                derivation_path=derivation_path
            )
            
        except Exception as e:
            logger.error("Failed to derive account", error=str(e))
            raise
    
    def _derive_private_key(self, seed: bytes, path: str) -> str:
        """
        Derive private key from seed using BIP44 path.
        
        Uses proper BIP44 derivation: m/44'/60'/0'/0/index
        Compatible with MetaMask and standard Ethereum wallets.
        """
        try:
            # Try to use bip_utils for proper BIP44 derivation (recommended)
            try:
                from bip_utils import Bip44, Bip44Coins, Bip44Changes
                
                # Parse path: m/44'/60'/0'/0/index
                parts = path.split('/')
                if len(parts) >= 5:
                    account_index = int(parts[4]) if parts[4] else 0
                    
                    # Create BIP44 object from seed
                    # m/44'/60' (Ethereum coin type)
                    bip44_mst_ctx = Bip44.FromSeed(seed, Bip44Coins.ETHEREUM)
                    # m/44'/60'/0' (Account 0)
                    bip44_acc_ctx = bip44_mst_ctx.Purpose().Coin().Account(0)
                    # m/44'/60'/0'/0 (External chain)
                    bip44_chg_ctx = bip44_acc_ctx.Change(Bip44Changes.CHAIN_EXT)
                    # m/44'/60'/0'/0/index (Address index)
                    bip44_addr_ctx = bip44_chg_ctx.AddressIndex(account_index)
                    
                    private_key = "0x" + bip44_addr_ctx.PrivateKey().Raw().ToHex()
                    logger.debug("Derived key using bip_utils", path=path, index=account_index)
                    return private_key
            except ImportError:
                logger.warning("bip_utils not installed, trying alternative derivation")
                # Fallback: Use pycoin for BIP32 derivation
                try:
                    from pycoin.key.BIP32Node import BIP32Node
                    
                    # Parse path: m/44'/60'/0'/0/index
                    parts = path.split('/')
                    account_index = int(parts[4]) if len(parts) > 4 and parts[4] else 0
                    
                    # Create BIP32 node from seed
                    master = BIP32Node.from_master_secret(seed, netcode='BTC')
                    # Derive: m/44'/60'/0'/0/index
                    # pycoin uses H for hardened derivation
                    derived = master.subkey_for_path("44H/60H/0H/0/%d" % account_index)
                    private_key = "0x" + derived.secret_exponent().hex()
                    logger.debug("Derived key using pycoin", path=path, index=account_index)
                    return private_key
                except ImportError:
                    # Final fallback: Use hdwallet library if available
                    try:
                        from hdwallet import HDWallet
                        from hdwallet.symbols import ETH
                        
                        # Create HD wallet from seed
                        hdwallet = HDWallet(symbol=ETH)
                        hdwallet.from_seed(seed.hex())
                        
                        # Derive using path
                        hdwallet.from_path(path)
                        private_key = "0x" + hdwallet.private_key()
                        logger.debug("Derived key using hdwallet", path=path)
                        return private_key
                    except ImportError:
                        # Last resort: Simplified derivation (not BIP44 compliant but functional)
                        logger.warning(
                            "No BIP44 library found. Install 'bip-utils' for proper HD wallet derivation. "
                            "Using simplified derivation (not BIP44 compliant)."
                        )
                        # Use HMAC-SHA512 for key derivation (similar to BIP32 but simplified)
                        import hmac
                        path_bytes = path.encode('utf-8')
                        # Use HMAC-SHA512 with seed as key and path as message
                        derived = hmac.new(seed, path_bytes, hashlib.sha512).digest()
                        # Use left 32 bytes as private key
                        private_key = "0x" + derived[:32].hex()
                        
                        # Ensure valid private key (less than secp256k1 order)
                        max_key = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
                        key_int = int(private_key, 16)
                        if key_int >= max_key or key_int == 0:
                            # If invalid, use modulo to ensure valid range
                            key_int = (key_int % (max_key - 1)) + 1
                        
                        private_key = hex(key_int)
                        logger.warning("Used simplified derivation - results may not match standard wallets")
                        return private_key
        except Exception as e:
            logger.error("Failed to derive private key", error=str(e), path=path)
            raise ValueError(f"Failed to derive private key: {str(e)}")
    
    def _derive_key_from_password(self, password: str) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        import hashlib
        salt = b"guardianx_wallet_salt"  # In production, use unique salt per wallet
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000, 32)
        return key
    
    def _encrypt_data(self, data: bytes, key: bytes) -> bytes:
        """Encrypt data using AES-256-GCM"""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        aesgcm = AESGCM(key)
        nonce = secrets.token_bytes(12)
        ciphertext = aesgcm.encrypt(nonce, data, None)
        return nonce + ciphertext
    
    def _decrypt_data(self, encrypted_data: bytes, key: bytes) -> bytes:
        """Decrypt data using AES-256-GCM"""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        aesgcm = AESGCM(key)
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext
    
    def _save_wallet(self, password: Optional[str] = None):
        """Save encrypted wallet to disk"""
        if not self.state:
            return
        
        # Serialize wallet state (without private keys)
        wallet_data = self._serialize_wallet_state(self.state)
        
        # Add mnemonic if available
        if self.mnemonic:
            wallet_data["mnemonic"] = self.mnemonic
        
        # Encrypt
        data_bytes = json.dumps(wallet_data).encode()
        key = self.encryption_key or self._derive_key_from_password(password or "")
        encrypted = self._encrypt_data(data_bytes, key)
        
        # Save to file
        wallet_file = self.storage_path / "wallet.encrypted"
        wallet_file.write_bytes(encrypted)
        
        logger.info("Wallet saved", path=str(wallet_file))
    
    def _load_encrypted_wallet(self) -> Optional[bytes]:
        """Load encrypted wallet from disk"""
        wallet_file = self.storage_path / "wallet.encrypted"
        if not wallet_file.exists():
            return None
        
        return wallet_file.read_bytes()
    
    def _serialize_wallet_state(self, state: WalletState) -> Dict[str, Any]:
        """Serialize wallet state to dict (without private keys)"""
        return {
            "accounts": [
                {
                    "address": acc.address,
                    "public_key": acc.public_key,
                    "derivation_path": acc.derivation_path,
                    "created_at": acc.created_at.isoformat(),
                    "label": acc.label,
                    "is_active": acc.is_active
                }
                for acc in state.accounts
            ],
            "active_account_index": state.active_account_index,
            "networks": state.networks,
            "active_network": state.active_network,
            "created_at": state.created_at.isoformat()
        }
    
    def _deserialize_wallet_state(self, data: Dict[str, Any]) -> WalletState:
        """Deserialize wallet state from dict"""
        accounts = [
            WalletAccount(
                address=acc["address"],
                public_key=acc.get("public_key", ""),
                derivation_path=acc.get("derivation_path", "m/44'/60'/0'/0/0"),
                created_at=datetime.fromisoformat(acc.get("created_at", datetime.utcnow().isoformat())),
                label=acc.get("label", ""),
                is_active=acc.get("is_active", True)
            )
            for acc in data.get("accounts", [])
        ]
        
        return WalletState(
            accounts=accounts,
            active_account_index=data.get("active_account_index", 0),
            networks=data.get("networks", self.default_networks.copy()),
            active_network=data.get("active_network", "ethereum"),
            is_locked=True,
            created_at=datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat()))
        )


# Global wallet engine instance
_wallet_engine: Optional[WalletEngine] = None


def get_wallet_engine() -> WalletEngine:
    """Get or create global wallet engine instance"""
    global _wallet_engine
    if _wallet_engine is None:
        _wallet_engine = WalletEngine()
    return _wallet_engine

