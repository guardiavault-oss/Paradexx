import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';

const router = Router();

const TERMS_OF_SERVICE = {
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  lastUpdated: '2024-01-01',
  title: 'Terms of Service',
  sections: [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: 'By accessing or using the Paradox platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.',
    },
    {
      id: 'description',
      title: 'Description of Service',
      content: 'Paradox provides a non-custodial cryptocurrency wallet application that allows users to manage digital assets, interact with decentralized applications, and execute blockchain transactions. The service includes wallet management, MEV protection, cross-chain bridging, and inheritance vault features.',
    },
    {
      id: 'eligibility',
      title: 'Eligibility',
      content: 'You must be at least 18 years old and legally able to enter into binding contracts to use our services. By using Paradox, you represent and warrant that you meet these requirements and are not located in any jurisdiction where our services are prohibited.',
    },
    {
      id: 'user-responsibilities',
      title: 'User Responsibilities',
      content: 'You are solely responsible for maintaining the confidentiality of your recovery phrase and private keys. Paradox does not have access to your private keys and cannot recover them if lost. You are responsible for all activities that occur under your account.',
    },
    {
      id: 'risks',
      title: 'Risk Disclosure',
      content: 'Cryptocurrency transactions involve significant risks including price volatility, regulatory uncertainty, and potential total loss of assets. You acknowledge these risks and agree that Paradox is not responsible for any losses you may incur.',
    },
    {
      id: 'prohibited-uses',
      title: 'Prohibited Uses',
      content: 'You may not use Paradox for any illegal activities, money laundering, terrorist financing, or any activity that violates applicable laws. We reserve the right to terminate access for users engaged in prohibited activities.',
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: 'Paradox shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, including but not limited to loss of profits, data, or other intangible losses.',
    },
    {
      id: 'modifications',
      title: 'Modifications to Terms',
      content: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.',
    },
  ],
};

const PRIVACY_POLICY = {
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  lastUpdated: '2024-01-01',
  title: 'Privacy Policy',
  sections: [
    {
      id: 'collection',
      title: 'Information We Collect',
      content: 'We collect information you provide directly, including email address, display name, and account preferences. We also collect usage data such as device information, IP addresses, and interaction patterns to improve our service.',
    },
    {
      id: 'blockchain-data',
      title: 'Blockchain Data',
      content: 'Wallet addresses and transaction history are publicly visible on the blockchain. We do not collect or store your private keys or recovery phrases. Your encrypted private key data is stored locally on your device.',
    },
    {
      id: 'usage',
      title: 'How We Use Your Information',
      content: 'We use collected information to provide and improve our services, communicate with you about updates and security alerts, detect and prevent fraud, and comply with legal obligations.',
    },
    {
      id: 'sharing',
      title: 'Information Sharing',
      content: 'We do not sell your personal information. We may share information with service providers who assist in operating our platform, or when required by law or to protect our rights.',
    },
    {
      id: 'security',
      title: 'Data Security',
      content: 'We implement industry-standard security measures to protect your information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.',
    },
    {
      id: 'retention',
      title: 'Data Retention',
      content: 'We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.',
    },
    {
      id: 'rights',
      title: 'Your Rights',
      content: 'You have the right to access, correct, or delete your personal information. You may also request a copy of your data or opt out of certain data collection practices.',
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: 'For privacy-related questions or concerns, please contact our support team through the app or email privacy@paradoxwallet.io.',
    },
  ],
};

const COOKIE_POLICY = {
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  lastUpdated: '2024-01-01',
  title: 'Cookie Policy',
  sections: [
    {
      id: 'what-are-cookies',
      title: 'What Are Cookies',
      content: 'Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.',
    },
    {
      id: 'types',
      title: 'Types of Cookies We Use',
      content: 'We use essential cookies for authentication and security, functional cookies to remember your preferences, and analytics cookies to understand usage patterns. We do not use advertising or tracking cookies.',
    },
    {
      id: 'management',
      title: 'Managing Cookies',
      content: 'You can control cookies through your browser settings. Disabling essential cookies may prevent you from using some features of our service.',
    },
  ],
};

const BIOMETRIC_CONSENT = {
  version: '1.0.0',
  effectiveDate: '2024-01-01',
  lastUpdated: '2024-01-01',
  title: 'Biometric Data Consent',
  sections: [
    {
      id: 'purpose',
      title: 'Purpose of Biometric Authentication',
      content: 'Biometric authentication (fingerprint, face recognition) provides an additional layer of security for accessing your wallet and authorizing transactions.',
    },
    {
      id: 'data-handling',
      title: 'How Biometric Data is Handled',
      content: 'Your biometric data is processed entirely on your device using the secure enclave. We never receive, store, or have access to your actual biometric data. Only a cryptographic verification result is used for authentication.',
    },
    {
      id: 'consent',
      title: 'Your Consent',
      content: 'By enabling biometric authentication, you consent to using your device\'s biometric capabilities for wallet access and transaction authorization. You may disable this feature at any time in settings.',
    },
    {
      id: 'rights',
      title: 'Your Rights',
      content: 'You have the right to refuse biometric authentication and use alternative methods such as PIN or password. Disabling biometrics will not affect your access to other features.',
    },
  ],
};

router.get('/terms-of-service', async (_req: Request, res: Response) => {
  try {
    res.json({ document: TERMS_OF_SERVICE });
  } catch (error) {
    logger.error('Get terms of service error:', error);
    res.status(500).json({ error: 'Failed to get terms of service' });
  }
});

router.get('/privacy-policy', async (_req: Request, res: Response) => {
  try {
    res.json({ document: PRIVACY_POLICY });
  } catch (error) {
    logger.error('Get privacy policy error:', error);
    res.status(500).json({ error: 'Failed to get privacy policy' });
  }
});

router.get('/cookie-policy', async (_req: Request, res: Response) => {
  try {
    res.json({ document: COOKIE_POLICY });
  } catch (error) {
    logger.error('Get cookie policy error:', error);
    res.status(500).json({ error: 'Failed to get cookie policy' });
  }
});

router.get('/biometric-consent', async (_req: Request, res: Response) => {
  try {
    res.json({ document: BIOMETRIC_CONSENT });
  } catch (error) {
    logger.error('Get biometric consent error:', error);
    res.status(500).json({ error: 'Failed to get biometric consent document' });
  }
});

router.get('/versions', async (_req: Request, res: Response) => {
  try {
    res.json({
      versions: {
        termsOfService: {
          version: TERMS_OF_SERVICE.version,
          effectiveDate: TERMS_OF_SERVICE.effectiveDate,
          lastUpdated: TERMS_OF_SERVICE.lastUpdated,
        },
        privacyPolicy: {
          version: PRIVACY_POLICY.version,
          effectiveDate: PRIVACY_POLICY.effectiveDate,
          lastUpdated: PRIVACY_POLICY.lastUpdated,
        },
        cookiePolicy: {
          version: COOKIE_POLICY.version,
          effectiveDate: COOKIE_POLICY.effectiveDate,
          lastUpdated: COOKIE_POLICY.lastUpdated,
        },
        biometricConsent: {
          version: BIOMETRIC_CONSENT.version,
          effectiveDate: BIOMETRIC_CONSENT.effectiveDate,
          lastUpdated: BIOMETRIC_CONSENT.lastUpdated,
        },
      },
    });
  } catch (error) {
    logger.error('Get legal versions error:', error);
    res.status(500).json({ error: 'Failed to get legal document versions' });
  }
});

export default router;
