#!/usr/bin/env python3
"""
Legal and Compliance API Endpoints
Terms of Service, Privacy Policy, Cookie Policy, etc.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from typing import Any, Dict
import structlog

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/legal", tags=["legal"])


# Legal Documents
TERMS_OF_SERVICE = """
# GuardianX Terms of Service

**Last Updated: January 15, 2024**

## 1. Acceptance of Terms

By accessing and using GuardianX ("Service"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.

## 2. Description of Service

GuardianX is a self-custodial cryptocurrency wallet service with advanced security features including:
- Multi-signature wallet protection
- MEV attack defense
- Digital inheritance vaults
- Cross-chain trading capabilities

## 3. User Responsibilities

You are solely responsible for:
- Maintaining the confidentiality of your wallet credentials
- All activities that occur under your account
- Compliance with all applicable laws and regulations
- Determining whether the Service is suitable for your needs

## 4. Financial Services Disclaimer

**IMPORTANT DISCLAIMERS:**
- GuardianX is NOT an investment advisor
- GuardianX does NOT provide investment, legal, or tax advice
- Cryptocurrencies are NOT insured by FDIC, SIPC, or any other government agency
- Cryptocurrency transactions are irreversible
- You may lose all funds if you lose access to your wallet

## 5. Restricted Jurisdictions

You may not use the Service if you are:
- Located in a country subject to U.S. sanctions (OFAC)
- Located in a country where cryptocurrency services are prohibited
- Listed on any sanctions or denied persons list

## 6. Age Requirement

You must be at least 18 years old to use GuardianX.

## 7. Export Compliance

Cryptocurrency software may be subject to export control regulations. You agree to comply with all applicable export and import laws.

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUARDIANX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.

## 9. Force Majeure

GuardianX shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control.

## 10. Changes to Terms

We reserve the right to modify these Terms at any time. Continued use of the Service constitutes acceptance of modified Terms.

## 11. Contact Information

For questions about these Terms, contact: legal@guardianx.io

**Version: 2.0.0**
"""

PRIVACY_POLICY = """
# GuardianX Privacy Policy

**Last Updated: January 15, 2024**

## 1. Information We Collect

### 1.1 Information You Provide
- Email address
- Phone number (optional)
- Wallet addresses
- Transaction history

### 1.2 Automatically Collected Information
- Device information
- IP address
- Usage analytics
- Error logs

## 2. How We Use Your Information

We use your information to:
- Provide and improve the Service
- Detect and prevent fraud
- Comply with legal obligations
- Send important notifications

## 3. Information Sharing

We do NOT:
- Sell your personal information
- Share your private keys
- Share your transaction data with third parties (except as required by law)

## 4. Data Security

We implement industry-standard security measures:
- End-to-end encryption
- Secure key storage
- Regular security audits

## 5. Your Rights (GDPR/CCPA)

You have the right to:
- Access your data
- Export your data
- Delete your account
- Opt-out of non-essential data collection

## 6. Data Retention

We retain your data:
- While your account is active
- For 30 days after account deletion (for security purposes)
- As required by law

## 7. Cookies and Tracking

We use cookies for:
- Authentication
- Security
- Analytics (optional)

You can manage cookie preferences in Settings.

## 8. Children's Privacy

GuardianX is not intended for users under 18. We do not knowingly collect information from children.

## 9. Changes to Privacy Policy

We will notify users of material changes to this Privacy Policy.

## 10. Contact Us

For privacy-related questions: privacy@guardianx.io

**Version: 2.0.0**
"""

COOKIE_POLICY = """
# GuardianX Cookie Policy

**Last Updated: January 15, 2024**

## 1. What Are Cookies?

Cookies are small text files stored on your device when you visit our website.

## 2. Types of Cookies We Use

### 2.1 Essential Cookies
Required for basic functionality:
- Authentication
- Security
- Session management

### 2.2 Analytics Cookies (Optional)
Help us improve the service:
- Usage statistics
- Error tracking
- Performance monitoring

## 3. Managing Cookies

You can manage cookie preferences in:
- Browser settings
- GuardianX Settings > Privacy

## 4. Third-Party Cookies

We may use third-party services that set their own cookies:
- Analytics providers
- Security services

## 5. Contact Us

For questions: privacy@guardianx.io
"""

BIOMETRIC_CONSENT = """
# Biometric Data Consent

**Last Updated: January 15, 2024**

## 1. What Biometric Data We Collect

GuardianX may collect:
- Fingerprint data (local only)
- Face ID data (local only)
- Touch ID data (local only)

**IMPORTANT:** Biometric data is stored ONLY on your device. We never transmit or store biometric data on our servers.

## 2. How We Use Biometric Data

Biometric data is used ONLY for:
- Local device authentication
- Unlocking your wallet
- Authorizing transactions

## 3. Your Rights

You can:
- Enable/disable biometric authentication in Settings
- Use PIN/password instead of biometrics
- Revoke consent at any time

## 4. Security

Biometric data is protected by:
- Device-level encryption
- Secure enclave storage (iOS)
- Hardware security module (Android)

## 5. Third-Party Access

We do NOT share biometric data with third parties.

By enabling biometric authentication, you consent to local processing of biometric data as described above.
"""


# Endpoints
@router.get("/terms-of-service")
async def get_terms_of_service():
    """Get Terms of Service"""
    return HTMLResponse(content=TERMS_OF_SERVICE, media_type="text/html")


@router.get("/privacy-policy")
async def get_privacy_policy():
    """Get Privacy Policy"""
    return HTMLResponse(content=PRIVACY_POLICY, media_type="text/html")


@router.get("/cookie-policy")
async def get_cookie_policy():
    """Get Cookie Policy"""
    return HTMLResponse(content=COOKIE_POLICY, media_type="text/html")


@router.get("/biometric-consent")
async def get_biometric_consent():
    """Get Biometric Data Consent"""
    return HTMLResponse(content=BIOMETRIC_CONSENT, media_type="text/html")


@router.get("/versions")
async def get_legal_versions():
    """Get current versions of legal documents"""
    return {
        "success": True,
        "versions": {
            "terms_of_service": "2.0.0",
            "privacy_policy": "2.0.0",
            "cookie_policy": "2.0.0",
            "biometric_consent": "2.0.0"
        },
        "last_updated": "2024-01-15"
    }


# Export router
__all__ = ["router"]

