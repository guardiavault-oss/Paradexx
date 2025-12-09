#!/usr/bin/env python3
"""
Security Hardening - Enterprise-grade security hardening and best practices
"""

import ipaddress
import logging
import re
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import jwt
import rate_limiter
from cryptography.fernet import Fernet
from passlib.context import CryptContext

logger = logging.getLogger(__name__)


class SecurityLevel(str, Enum):
    """Security levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ThreatType(str, Enum):
    """Threat types"""

    BRUTE_FORCE = "brute_force"
    DDoS = "ddos"
    INJECTION = "injection"
    XSS = "xss"
    CSRF = "csrf"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    DATA_EXFILTRATION = "data_exfiltration"
    MALICIOUS_IP = "malicious_ip"
    SUSPICIOUS_PATTERN = "suspicious_pattern"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"


@dataclass
class SecurityEvent:
    """Security event record"""

    event_id: str
    threat_type: ThreatType
    severity: SecurityLevel
    source_ip: str
    user_agent: str
    timestamp: datetime
    details: dict[str, Any]
    action_taken: str
    resolved: bool = False


@dataclass
class SecurityPolicy:
    """Security policy configuration"""

    max_login_attempts: int = 5
    lockout_duration: int = 900  # 15 minutes
    password_min_length: int = 12
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_special: bool = True
    session_timeout: int = 3600  # 1 hour
    max_sessions_per_user: int = 3
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    enable_2fa: bool = True
    require_https: bool = True
    enable_cors: bool = True
    allowed_origins: list[str] = None
    enable_csrf_protection: bool = True
    enable_xss_protection: bool = True
    enable_content_security_policy: bool = True


class SecurityHardening:
    """Enterprise-grade security hardening system"""

    def __init__(self):
        self.security_events: deque = deque(maxlen=100000)
        self.failed_attempts: dict[str, list[datetime]] = defaultdict(list)
        self.blocked_ips: dict[str, datetime] = {}
        self.suspicious_patterns: dict[str, int] = defaultdict(int)
        self.rate_limiter = rate_limiter.RateLimiter()

        # Security policies
        self.policy = SecurityPolicy()

        # Password hashing
        self.password_context = CryptContext(
            schemes=["argon2", "bcrypt"],
            default="argon2",
            argon2__rounds=3,
            argon2__memory_cost=65536,
            argon2__parallelism=4,
            argon2__hash_len=32,
            argon2__salt_len=16,
        )

        # Encryption
        self.encryption_key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.encryption_key)

        # JWT configuration
        self.jwt_secret = secrets.token_urlsafe(32)
        self.jwt_algorithm = "HS256"
        self.jwt_expiration = 3600

        # Security headers
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        }

        # Threat intelligence
        self.malicious_ips: set = set()
        self.suspicious_user_agents: set = set()
        self.known_attack_patterns: dict[str, re.Pattern] = {}

        # Initialize security patterns
        self._initialize_attack_patterns()

        logger.info("SecurityHardening initialized")

    def _initialize_attack_patterns(self):
        """Initialize known attack patterns"""
        self.known_attack_patterns = {
            "sql_injection": re.compile(
                r"('|(\\')|(;)|(\\;)|(--)|(\\--)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter))",
                re.IGNORECASE,
            ),
            "xss": re.compile(
                r"<script|javascript:|onload=|onerror=|onclick=|onmouseover=|onfocus=|onblur=|onchange=|onsubmit=|onreset=|onselect=|onkeydown=|onkeyup=|onkeypress=",
                re.IGNORECASE,
            ),
            "path_traversal": re.compile(r"\.\./|\.\.\\|%2e%2e%2f|%2e%2e%5c", re.IGNORECASE),
            "command_injection": re.compile(r"(\||&|;|`|\$\(|\${|\\n|\\r)", re.IGNORECASE),
            "ldap_injection": re.compile(r"[()=*!&|]", re.IGNORECASE),
            "no_sql_injection": re.compile(
                r"(\$where|\$ne|\$gt|\$lt|\$regex|\$exists|\$in|\$nin)", re.IGNORECASE
            ),
        }

    async def validate_password(self, password: str) -> tuple[bool, list[str]]:
        """Validate password strength"""
        errors = []

        if len(password) < self.policy.password_min_length:
            errors.append(
                f"Password must be at least {self.policy.password_min_length} characters long"
            )

        if self.policy.password_require_uppercase and not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter")

        if self.policy.password_require_lowercase and not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter")

        if self.policy.password_require_numbers and not re.search(r"\d", password):
            errors.append("Password must contain at least one number")

        if self.policy.password_require_special and not re.search(
            r'[!@#$%^&*(),.?":{}|<>]', password
        ):
            errors.append("Password must contain at least one special character")

        # Check for common passwords
        if self._is_common_password(password):
            errors.append("Password is too common and easily guessable")

        # Check for patterns
        if self._has_weak_patterns(password):
            errors.append("Password contains weak patterns")

        return len(errors) == 0, errors

    def _is_common_password(self, password: str) -> bool:
        """Check if password is in common passwords list"""
        common_passwords = {
            "password",
            "123456",
            "123456789",
            "qwerty",
            "abc123",
            "password123",
            "admin",
            "letmein",
            "welcome",
            "monkey",
            "1234567890",
            "dragon",
            "master",
            "hello",
            "freedom",
        }
        return password.lower() in common_passwords

    def _has_weak_patterns(self, password: str) -> bool:
        """Check for weak password patterns"""
        # Sequential characters
        if re.search(r"(.)\1{2,}", password):
            return True

        # Keyboard patterns
        keyboard_patterns = [
            "qwerty",
            "asdf",
            "zxcv",
            "1234",
            "abcd",
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm",
        ]

        password_lower = password.lower()
        for pattern in keyboard_patterns:
            if pattern in password_lower:
                return True

        return False

    def hash_password(self, password: str) -> str:
        """Hash password using secure algorithm"""
        return self.password_context.hash(password)

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        try:
            return self.password_context.verify(password, hashed)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    def generate_jwt_token(self, user_id: str, additional_claims: dict[str, Any] = None) -> str:
        """Generate JWT token"""
        now = datetime.utcnow()
        payload = {
            "user_id": user_id,
            "iat": now,
            "exp": now + timedelta(seconds=self.jwt_expiration),
            "iss": "bridge-security-service",
            "aud": "bridge-security-users",
        }

        if additional_claims:
            payload.update(additional_claims)

        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)

    def verify_jwt_token(self, token: str) -> tuple[bool, dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm],
                options={"verify_exp": True, "verify_iat": True},
            )
            return True, payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return False, {}
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return False, {}

    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        try:
            encrypted_data = self.cipher_suite.encrypt(data.encode())
            return encrypted_data.decode()
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            return data

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            decrypted_data = self.cipher_suite.decrypt(encrypted_data.encode())
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            return encrypted_data

    async def check_rate_limit(
        self, identifier: str, limit: int = None, window: int = None
    ) -> bool:
        """Check if request is within rate limit"""
        limit = limit or self.policy.rate_limit_requests
        window = window or self.policy.rate_limit_window

        try:
            return await self.rate_limiter.is_allowed(identifier, limit, window)
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return False

    async def check_brute_force(self, identifier: str) -> tuple[bool, int]:
        """Check for brute force attempts"""
        now = datetime.utcnow()
        cutoff_time = now - timedelta(seconds=self.policy.lockout_duration)

        # Clean old attempts
        self.failed_attempts[identifier] = [
            attempt for attempt in self.failed_attempts[identifier] if attempt > cutoff_time
        ]

        attempts = len(self.failed_attempts[identifier])
        is_blocked = attempts >= self.policy.max_login_attempts

        if is_blocked:
            await self._log_security_event(
                ThreatType.BRUTE_FORCE,
                SecurityLevel.HIGH,
                identifier,
                "Brute force attack detected",
                {"attempts": attempts, "lockout_duration": self.policy.lockout_duration},
            )

        return is_blocked, attempts

    async def record_failed_attempt(self, identifier: str):
        """Record failed authentication attempt"""
        self.failed_attempts[identifier].append(datetime.utcnow())

    async def reset_failed_attempts(self, identifier: str):
        """Reset failed attempts for identifier"""
        if identifier in self.failed_attempts:
            del self.failed_attempts[identifier]

    async def check_malicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is malicious"""
        try:
            ip_obj = ipaddress.ip_address(ip_address)

            # Check if IP is in blocked list
            if ip_address in self.blocked_ips:
                block_time = self.blocked_ips[ip_address]
                if datetime.utcnow() - block_time < timedelta(hours=24):
                    return True

            # Check if IP is in malicious list
            if ip_address in self.malicious_ips:
                return True

            # Check for suspicious patterns
            if self._is_suspicious_ip(ip_address):
                return True

            return False

        except ValueError:
            logger.warning(f"Invalid IP address: {ip_address}")
            return True

    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address has suspicious characteristics"""
        try:
            ip_obj = ipaddress.ip_address(ip_address)

            # Check for private IPs (should not be accessing public API)
            if ip_obj.is_private:
                return True

            # Check for reserved IPs
            if ip_obj.is_reserved:
                return True

            # Check for loopback
            if ip_obj.is_loopback:
                return True

            # Check for multicast
            if ip_obj.is_multicast:
                return True

            return False

        except ValueError:
            return True

    async def check_suspicious_pattern(self, input_data: str) -> tuple[bool, list[str]]:
        """Check input for suspicious patterns"""
        detected_patterns = []

        for pattern_name, pattern in self.known_attack_patterns.items():
            if pattern.search(input_data):
                detected_patterns.append(pattern_name)

        if detected_patterns:
            await self._log_security_event(
                ThreatType.SUSPICIOUS_PATTERN,
                SecurityLevel.MEDIUM,
                "unknown",
                f"Suspicious patterns detected: {', '.join(detected_patterns)}",
                {"patterns": detected_patterns, "input_length": len(input_data)},
            )

        return len(detected_patterns) > 0, detected_patterns

    async def check_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious"""
        if not user_agent:
            return True

        user_agent_lower = user_agent.lower()

        # Check for known malicious user agents
        if user_agent_lower in self.suspicious_user_agents:
            return True

        # Check for suspicious patterns
        suspicious_patterns = [
            "sqlmap",
            "nmap",
            "nikto",
            "w3af",
            "havij",
            "acunetix",
            "nessus",
            "openvas",
            "burp",
            "scanner",
            "bot",
            "crawler",
            "spider",
        ]

        for pattern in suspicious_patterns:
            if pattern in user_agent_lower:
                return True

        return False

    async def validate_input(
        self, input_data: str, input_type: str = "general"
    ) -> tuple[bool, list[str]]:
        """Validate input data for security"""
        errors = []

        # Check for suspicious patterns
        is_suspicious, patterns = await self.check_suspicious_pattern(input_data)
        if is_suspicious:
            errors.append(f"Suspicious patterns detected: {', '.join(patterns)}")

        # Type-specific validation
        if input_type == "email":
            if not self._is_valid_email(input_data):
                errors.append("Invalid email format")
        elif input_type == "url":
            if not self._is_valid_url(input_data):
                errors.append("Invalid URL format")
        elif input_type == "ip":
            if not self._is_valid_ip(input_data):
                errors.append("Invalid IP address format")

        # Length validation
        if len(input_data) > 10000:  # Arbitrary limit
            errors.append("Input too long")

        return len(errors) == 0, errors

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format"""
        pattern = r"^https?://[^\s/$.?#].[^\s]*$"
        return re.match(pattern, url) is not None

    def _is_valid_ip(self, ip: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False

    async def block_ip(self, ip_address: str, duration_hours: int = 24):
        """Block IP address"""
        self.blocked_ips[ip_address] = datetime.utcnow()
        self.malicious_ips.add(ip_address)

        await self._log_security_event(
            ThreatType.MALICIOUS_IP,
            SecurityLevel.HIGH,
            ip_address,
            f"IP address blocked for {duration_hours} hours",
            {"block_duration_hours": duration_hours},
        )

        logger.warning(f"IP address {ip_address} blocked for {duration_hours} hours")

    async def unblock_ip(self, ip_address: str):
        """Unblock IP address"""
        if ip_address in self.blocked_ips:
            del self.blocked_ips[ip_address]

        if ip_address in self.malicious_ips:
            self.malicious_ips.remove(ip_address)

        logger.info(f"IP address {ip_address} unblocked")

    async def _log_security_event(
        self,
        threat_type: ThreatType,
        severity: SecurityLevel,
        source_ip: str,
        description: str,
        details: dict[str, Any],
    ):
        """Log security event"""
        event = SecurityEvent(
            event_id=f"sec_{int(time.time())}_{secrets.token_hex(4)}",
            threat_type=threat_type,
            severity=severity,
            source_ip=source_ip,
            user_agent="unknown",  # Would be passed from request
            timestamp=datetime.utcnow(),
            details=details,
            action_taken=description,
        )

        self.security_events.append(event)

        # Log to structured logger
        logger.warning(
            "Security event detected",
            event_id=event.event_id,
            threat_type=threat_type.value,
            severity=severity.value,
            source_ip=source_ip,
            description=description,
            details=details,
        )

    def get_security_headers(self) -> dict[str, str]:
        """Get security headers for HTTP responses"""
        return self.security_headers.copy()

    def get_cors_config(self) -> dict[str, Any]:
        """Get CORS configuration"""
        return {
            "allow_origins": self.policy.allowed_origins or ["*"],
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["*"],
            "expose_headers": ["*"],
            "max_age": 600,
        }

    async def get_security_metrics(self) -> dict[str, Any]:
        """Get security metrics"""
        now = datetime.utcnow()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)

        # Count events by type and severity
        events_last_hour = [e for e in self.security_events if e.timestamp > last_hour]
        events_last_24h = [e for e in self.security_events if e.timestamp > last_24h]

        threat_counts = defaultdict(int)
        severity_counts = defaultdict(int)

        for event in events_last_24h:
            threat_counts[event.threat_type.value] += 1
            severity_counts[event.severity.value] += 1

        return {
            "total_events_24h": len(events_last_24h),
            "total_events_1h": len(events_last_hour),
            "threat_breakdown": dict(threat_counts),
            "severity_breakdown": dict(severity_counts),
            "blocked_ips": len(self.blocked_ips),
            "malicious_ips": len(self.malicious_ips),
            "failed_attempts": len(self.failed_attempts),
            "suspicious_patterns": len(self.suspicious_patterns),
        }

    async def cleanup_old_data(self, max_age_hours: int = 24):
        """Clean up old security data"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)

        # Clean old security events
        self.security_events = deque(
            [e for e in self.security_events if e.timestamp > cutoff_time], maxlen=100000
        )

        # Clean old failed attempts
        for identifier in list(self.failed_attempts.keys()):
            self.failed_attempts[identifier] = [
                attempt for attempt in self.failed_attempts[identifier] if attempt > cutoff_time
            ]
            if not self.failed_attempts[identifier]:
                del self.failed_attempts[identifier]

        # Clean old blocked IPs
        expired_blocks = [
            ip for ip, block_time in self.blocked_ips.items() if block_time < cutoff_time
        ]
        for ip in expired_blocks:
            del self.blocked_ips[ip]

        logger.info(f"Cleaned up security data older than {max_age_hours} hours")

    async def generate_security_report(self) -> dict[str, Any]:
        """Generate comprehensive security report"""
        metrics = await self.get_security_metrics()

        # Recent high-severity events
        recent_critical_events = [
            {
                "event_id": e.event_id,
                "threat_type": e.threat_type.value,
                "severity": e.severity.value,
                "source_ip": e.source_ip,
                "timestamp": e.timestamp.isoformat(),
                "action_taken": e.action_taken,
            }
            for e in list(self.security_events)[-100:]  # Last 100 events
            if e.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]
        ]

        # Security recommendations
        recommendations = []

        if metrics["total_events_24h"] > 100:
            recommendations.append(
                "High number of security events detected - consider reviewing security policies"
            )

        if metrics["blocked_ips"] > 50:
            recommendations.append(
                "Many IPs blocked - consider implementing additional DDoS protection"
            )

        if metrics["failed_attempts"] > 20:
            recommendations.append(
                "High number of failed authentication attempts - consider implementing CAPTCHA"
            )

        return {
            "report_timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics,
            "recent_critical_events": recent_critical_events,
            "recommendations": recommendations,
            "security_policy": {
                "max_login_attempts": self.policy.max_login_attempts,
                "lockout_duration": self.policy.lockout_duration,
                "rate_limit_requests": self.policy.rate_limit_requests,
                "rate_limit_window": self.policy.rate_limit_window,
                "enable_2fa": self.policy.enable_2fa,
                "require_https": self.policy.require_https,
            },
        }
