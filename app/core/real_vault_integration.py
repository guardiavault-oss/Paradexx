"""
Real HashiCorp Vault Integration with Transit Engine
Production-ready implementation with proper authentication, key management, and signing
"""

import base64
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

import hvac
import structlog

logger = structlog.get_logger(__name__)


class VaultAuthMethod(Enum):
    TOKEN = "token"
    USERPASS = "userpass"
    LDAP = "ldap"
    APPROLE = "approle"
    KUBERNETES = "kubernetes"
    CERT = "cert"


class VaultKeyType(Enum):
    ECDSA_P256 = "ecdsa-p256"
    ECDSA_P384 = "ecdsa-p384"
    ECDSA_P521 = "ecdsa-p521"
    ED25519 = "ed25519"
    RSA_2048 = "rsa-2048"
    RSA_3072 = "rsa-3072"
    RSA_4096 = "rsa-4096"


@dataclass
class VaultKeyConfig:
    """Vault key configuration"""

    key_name: str
    key_type: VaultKeyType
    exportable: bool = False
    allow_plaintext_backup: bool = False
    derived: bool = True
    convergent_encryption: bool = False
    key_size: int | None = None
    auto_rotate_period: str | None = None


@dataclass
class VaultAuthConfig:
    """Vault authentication configuration"""

    auth_method: VaultAuthMethod
    endpoint: str
    credentials: dict[str, Any]
    mount_point: str = "transit"
    verify_ssl: bool = True
    timeout: int = 30
    max_retries: int = 3


@dataclass
class VaultSigningResult:
    """Result of Vault signing operation"""

    signature: str
    key_version: int
    signature_algorithm: str
    timestamp: datetime
    request_id: str


class RealVaultIntegration:
    """
    Production-ready HashiCorp Vault integration with Transit engine
    """

    def __init__(self, config: VaultAuthConfig):
        self.config = config
        self.client = None
        self.token = None
        self.token_expires_at = None
        self.key_cache: dict[str, VaultKeyConfig] = {}

        # Initialize Vault client
        self._initialize_vault_client()

    def _initialize_vault_client(self):
        """Initialize Vault client with proper authentication"""
        try:
            # Create Vault client
            self.client = hvac.Client(
                url=self.config.endpoint, verify=self.config.verify_ssl, timeout=self.config.timeout
            )

            # Authenticate based on method
            if self.config.auth_method == VaultAuthMethod.TOKEN:
                self._authenticate_with_token()
            elif self.config.auth_method == VaultAuthMethod.USERPASS:
                self._authenticate_with_userpass()
            elif self.config.auth_method == VaultAuthMethod.APPROLE:
                self._authenticate_with_approle()
            elif self.config.auth_method == VaultAuthMethod.KUBERNETES:
                self._authenticate_with_kubernetes()
            elif self.config.auth_method == VaultAuthMethod.CERT:
                self._authenticate_with_cert()
            else:
                raise ValueError(f"Unsupported auth method: {self.config.auth_method}")

            # Verify authentication
            if not self.client.is_authenticated():
                raise RuntimeError("Failed to authenticate with Vault")

            logger.info("Vault client initialized and authenticated successfully")

        except Exception as e:
            logger.error("Failed to initialize Vault client", error=str(e))
            raise

    def _authenticate_with_token(self):
        """Authenticate with token"""
        token = self.config.credentials.get("token")
        if not token:
            raise ValueError("Token not provided for token authentication")

        self.client.token = token
        self.token = token

        # Get token info to determine expiration
        try:
            token_info = self.client.lookup_token()
            if "ttl" in token_info["data"]:
                ttl_seconds = token_info["data"]["ttl"]
                self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
        except Exception as e:
            logger.warning("Could not determine token expiration", error=str(e))

    def _authenticate_with_userpass(self):
        """Authenticate with username/password"""
        username = self.config.credentials.get("username")
        password = self.config.credentials.get("password")

        if not username or not password:
            raise ValueError("Username and password required for userpass authentication")

        auth_response = self.client.auth.userpass.login(
            username=username, password=password, mount_point="userpass"
        )

        self.token = auth_response["auth"]["client_token"]
        self.client.token = self.token

        # Set expiration
        ttl_seconds = auth_response["auth"]["lease_duration"]
        self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

    def _authenticate_with_approle(self):
        """Authenticate with AppRole"""
        role_id = self.config.credentials.get("role_id")
        secret_id = self.config.credentials.get("secret_id")

        if not role_id or not secret_id:
            raise ValueError("Role ID and Secret ID required for AppRole authentication")

        auth_response = self.client.auth.approle.login(
            role_id=role_id, secret_id=secret_id, mount_point="approle"
        )

        self.token = auth_response["auth"]["client_token"]
        self.client.token = self.token

        # Set expiration
        ttl_seconds = auth_response["auth"]["lease_duration"]
        self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

    def _authenticate_with_kubernetes(self):
        """Authenticate with Kubernetes service account"""
        role = self.config.credentials.get("role")
        jwt_path = self.config.credentials.get(
            "jwt_path", "/var/run/secrets/kubernetes.io/serviceaccount/token"
        )

        if not role:
            raise ValueError("Role required for Kubernetes authentication")

        # Read JWT token from file
        try:
            with open(jwt_path) as f:
                jwt_token = f.read().strip()
        except Exception as e:
            raise RuntimeError(f"Failed to read JWT token from {jwt_path}: {e}")

        auth_response = self.client.auth.kubernetes.login(
            role=role, jwt=jwt_token, mount_point="kubernetes"
        )

        self.token = auth_response["auth"]["client_token"]
        self.client.token = self.token

        # Set expiration
        ttl_seconds = auth_response["auth"]["lease_duration"]
        self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

    def _authenticate_with_cert(self):
        """Authenticate with client certificate"""
        cert_path = self.config.credentials.get("cert_path")
        key_path = self.config.credentials.get("key_path")

        if not cert_path or not key_path:
            raise ValueError("Certificate and key paths required for cert authentication")

        # Read certificate and key
        try:
            with open(cert_path, "rb") as f:
                cert_data = f.read()
            with open(key_path, "rb") as f:
                key_data = f.read()
        except Exception as e:
            raise RuntimeError(f"Failed to read certificate files: {e}")

        # Create certificate string
        cert_string = base64.b64encode(cert_data).decode("utf-8")

        auth_response = self.client.auth.cert.login(
            cert=cert_string, key=key_data, mount_point="cert"
        )

        self.token = auth_response["auth"]["client_token"]
        self.client.token = self.token

        # Set expiration
        ttl_seconds = auth_response["auth"]["lease_duration"]
        self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

    async def ensure_authenticated(self):
        """Ensure Vault client is authenticated and token is valid"""
        if self.token_expires_at and datetime.now(
            timezone.utc
        ) >= self.token_expires_at - timedelta(minutes=5):
            logger.info("Vault token expired, re-authenticating")
            self._initialize_vault_client()

    async def create_encryption_key(self, key_config: VaultKeyConfig) -> bool:
        """Create a new encryption key in Vault Transit"""
        try:
            await self.ensure_authenticated()

            # Prepare key configuration
            key_data = {
                "type": key_config.key_type.value,
                "exportable": key_config.exportable,
                "allow_plaintext_backup": key_config.allow_plaintext_backup,
                "derived": key_config.derived,
                "convergent_encryption": key_config.convergent_encryption,
            }

            if key_config.key_size:
                key_data["size"] = key_config.key_size

            if key_config.auto_rotate_period:
                key_data["auto_rotate_period"] = key_config.auto_rotate_period

            # Create key
            response = self.client.secrets.transit.create_key(
                name=key_config.key_name, mount_point=self.config.mount_point, **key_data
            )

            if response.status_code == 204:
                self.key_cache[key_config.key_name] = key_config
                logger.info("Encryption key created successfully", key_name=key_config.key_name)
                return True
            logger.error("Failed to create encryption key", status_code=response.status_code)
            return False

        except Exception as e:
            logger.error("Error creating encryption key", error=str(e))
            return False

    async def sign_data(
        self, key_name: str, data: str, context: str | None = None
    ) -> VaultSigningResult | None:
        """Sign data using Vault Transit engine"""
        try:
            await self.ensure_authenticated()

            # Prepare signing request
            sign_data = {"input": data}
            if context:
                sign_data["context"] = context

            # Sign data
            response = self.client.secrets.transit.sign_data(
                name=key_name, mount_point=self.config.mount_point, **sign_data
            )

            if response.status_code == 200:
                result_data = response.json()["data"]

                return VaultSigningResult(
                    signature=result_data["signature"],
                    key_version=result_data.get("key_version", 1),
                    signature_algorithm=result_data.get("signature_algorithm", "ecdsa-p256"),
                    timestamp=datetime.now(timezone.utc),
                    request_id=response.headers.get("X-Vault-Request-ID", ""),
                )
            logger.error("Failed to sign data", status_code=response.status_code)
            return None

        except Exception as e:
            logger.error("Error signing data", error=str(e))
            return None

    async def verify_signature(
        self, key_name: str, data: str, signature: str, context: str | None = None
    ) -> bool:
        """Verify signature using Vault Transit engine"""
        try:
            await self.ensure_authenticated()

            # Prepare verification request
            verify_data = {"input": data, "signature": signature}
            if context:
                verify_data["context"] = context

            # Verify signature
            response = self.client.secrets.transit.verify_signed_data(
                name=key_name, mount_point=self.config.mount_point, **verify_data
            )

            if response.status_code == 200:
                result_data = response.json()["data"]
                return result_data.get("valid", False)
            logger.error("Failed to verify signature", status_code=response.status_code)
            return False

        except Exception as e:
            logger.error("Error verifying signature", error=str(e))
            return False

    async def encrypt_data(
        self, key_name: str, plaintext: str, context: str | None = None
    ) -> str | None:
        """Encrypt data using Vault Transit engine"""
        try:
            await self.ensure_authenticated()

            # Prepare encryption request
            encrypt_data = {"plaintext": base64.b64encode(plaintext.encode()).decode()}
            if context:
                encrypt_data["context"] = context

            # Encrypt data
            response = self.client.secrets.transit.encrypt_data(
                name=key_name, mount_point=self.config.mount_point, **encrypt_data
            )

            if response.status_code == 200:
                result_data = response.json()["data"]
                return result_data["ciphertext"]
            logger.error("Failed to encrypt data", status_code=response.status_code)
            return None

        except Exception as e:
            logger.error("Error encrypting data", error=str(e))
            return None

    async def decrypt_data(
        self, key_name: str, ciphertext: str, context: str | None = None
    ) -> str | None:
        """Decrypt data using Vault Transit engine"""
        try:
            await self.ensure_authenticated()

            # Prepare decryption request
            decrypt_data = {"ciphertext": ciphertext}
            if context:
                decrypt_data["context"] = context

            # Decrypt data
            response = self.client.secrets.transit.decrypt_data(
                name=key_name, mount_point=self.config.mount_point, **decrypt_data
            )

            if response.status_code == 200:
                result_data = response.json()["data"]
                return base64.b64decode(result_data["plaintext"]).decode()
            logger.error("Failed to decrypt data", status_code=response.status_code)
            return None

        except Exception as e:
            logger.error("Error decrypting data", error=str(e))
            return None

    async def generate_data_key(
        self, key_name: str, context: str | None = None, bits: int = 256
    ) -> dict[str, str] | None:
        """Generate a data encryption key"""
        try:
            await self.ensure_authenticated()

            # Prepare key generation request
            keygen_data = {"bits": bits}
            if context:
                keygen_data["context"] = context

            # Generate key
            response = self.client.secrets.transit.generate_data_key(
                name=key_name, mount_point=self.config.mount_point, **keygen_data
            )

            if response.status_code == 200:
                result_data = response.json()["data"]
                return {
                    "plaintext": result_data["plaintext"],
                    "ciphertext": result_data["ciphertext"],
                }
            logger.error("Failed to generate data key", status_code=response.status_code)
            return None

        except Exception as e:
            logger.error("Error generating data key", error=str(e))
            return None

    async def rotate_key(self, key_name: str) -> bool:
        """Rotate encryption key"""
        try:
            await self.ensure_authenticated()

            # Rotate key
            response = self.client.secrets.transit.rotate_key(
                name=key_name, mount_point=self.config.mount_point
            )

            if response.status_code == 204:
                logger.info("Key rotated successfully", key_name=key_name)
                return True
            logger.error("Failed to rotate key", status_code=response.status_code)
            return False

        except Exception as e:
            logger.error("Error rotating key", error=str(e))
            return False

    async def get_key_info(self, key_name: str) -> dict[str, Any] | None:
        """Get information about a key"""
        try:
            await self.ensure_authenticated()

            # Get key info
            response = self.client.secrets.transit.read_key(
                name=key_name, mount_point=self.config.mount_point
            )

            if response.status_code == 200:
                return response.json()["data"]
            logger.error("Failed to get key info", status_code=response.status_code)
            return None

        except Exception as e:
            logger.error("Error getting key info", error=str(e))
            return None

    async def list_keys(self) -> list[str]:
        """List all keys in the Transit engine"""
        try:
            await self.ensure_authenticated()

            # List keys
            response = self.client.secrets.transit.list_keys(mount_point=self.config.mount_point)

            if response.status_code == 200:
                result_data = response.json()["data"]
                return result_data.get("keys", [])
            logger.error("Failed to list keys", status_code=response.status_code)
            return []

        except Exception as e:
            logger.error("Error listing keys", error=str(e))
            return []

    async def delete_key(self, key_name: str, force: bool = False) -> bool:
        """Delete a key (requires force=True for safety)"""
        try:
            if not force:
                raise ValueError("Key deletion requires force=True for safety")

            await self.ensure_authenticated()

            # Delete key
            response = self.client.secrets.transit.delete_key(
                name=key_name, mount_point=self.config.mount_point
            )

            if response.status_code == 204:
                logger.info("Key deleted successfully", key_name=key_name)
                if key_name in self.key_cache:
                    del self.key_cache[key_name]
                return True
            logger.error("Failed to delete key", status_code=response.status_code)
            return False

        except Exception as e:
            logger.error("Error deleting key", error=str(e))
            return False

    async def sign_ethereum_transaction(self, key_name: str, transaction_hash: str) -> str | None:
        """Sign Ethereum transaction hash with Vault"""
        try:
            # Sign the transaction hash
            signing_result = await self.sign_data(key_name, transaction_hash)

            if signing_result:
                # Convert Vault signature to Ethereum format
                ethereum_signature = self._convert_vault_signature_to_ethereum(
                    signing_result.signature, transaction_hash
                )

                return ethereum_signature
            return None

        except Exception as e:
            logger.error("Error signing Ethereum transaction", error=str(e))
            return None

    def _convert_vault_signature_to_ethereum(self, vault_signature: str, message_hash: str) -> str:
        """Convert Vault signature to Ethereum signature format"""
        try:
            # Remove vault: prefix and decode
            vault_signature = vault_signature.removeprefix("vault:v1:")

            signature_bytes = base64.b64decode(vault_signature)

            # Parse signature components
            r = signature_bytes[:32]
            s = signature_bytes[32:64]
            v = signature_bytes[64] if len(signature_bytes) > 64 else 27

            # Ensure v is 27 or 28
            if v < 27:
                v += 27

            # Combine signature
            ethereum_signature = r + s + bytes([v])

            return "0x" + ethereum_signature.hex()

        except Exception as e:
            logger.error("Error converting Vault signature to Ethereum format", error=str(e))
            raise

    async def health_check(self) -> dict[str, Any]:
        """Perform health check on Vault connection"""
        try:
            await self.ensure_authenticated()

            # Check Vault status
            response = self.client.sys.health()

            health_status = {
                "vault_accessible": True,
                "authenticated": self.client.is_authenticated(),
                "token_expires_at": (
                    self.token_expires_at.isoformat() if self.token_expires_at else None
                ),
                "vault_version": response.get("version", "unknown"),
                "vault_initialized": response.get("initialized", False),
                "vault_sealed": response.get("sealed", True),
                "transit_engine_available": False,
                "keys_available": [],
            }

            # Check Transit engine
            try:
                keys = await self.list_keys()
                health_status["transit_engine_available"] = True
                health_status["keys_available"] = keys
            except Exception:
                health_status["transit_engine_available"] = False

            return health_status

        except Exception as e:
            logger.error("Vault health check failed", error=str(e))
            return {"vault_accessible": False, "error": str(e), "authenticated": False}

    def get_metrics(self) -> dict[str, Any]:
        """Get Vault integration metrics"""
        return {
            "authenticated": self.client.is_authenticated() if self.client else False,
            "auth_method": self.config.auth_method.value,
            "mount_point": self.config.mount_point,
            "keys_cached": len(self.key_cache),
            "token_expires_at": (
                self.token_expires_at.isoformat() if self.token_expires_at else None
            ),
            "endpoint": self.config.endpoint,
        }


# Factory function for creating Vault integration
def create_vault_integration(
    endpoint: str,
    auth_method: VaultAuthMethod,
    credentials: dict[str, Any],
    mount_point: str = "transit",
    verify_ssl: bool = True,
) -> RealVaultIntegration:
    """Create a Vault integration instance"""

    config = VaultAuthConfig(
        auth_method=auth_method,
        endpoint=endpoint,
        mount_point=mount_point,
        credentials=credentials,
        verify_ssl=verify_ssl,
    )

    return RealVaultIntegration(config)
