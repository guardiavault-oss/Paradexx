// Phishing Detection & URL Safety System

export interface PhishingCheckResult {
  isSafe: boolean;
  risk: 'safe' | 'warning' | 'danger';
  reasons: string[];
  recommendation: string;
  blockedBy?: ('blacklist' | 'similarity' | 'pattern' | 'certificate')[];
}

export interface SuspiciousDomain {
  domain: string;
  legitimate: string; // The legitimate domain it's impersonating
  addedAt: number;
  reportedBy?: string;
}

// Known scam/phishing domains (updated regularly)
const BLACKLISTED_DOMAINS: string[] = [
  // Fake wallet sites
  'metamask-wallet.com',
  'metamask-support.com',
  'uniswap-app.com',
  'opensea-nft.com',
  
  // Fake exchanges
  'binance-support.com',
  'coinbase-verify.com',
  'kraken-secure.com',
  
  // Common scam patterns
  'claim-airdrop.com',
  'free-crypto.com',
  'eth-doubler.com',
  'bitcoin-giveaway.com',
  
  // Unicode tricks
  'аpple.com', // Cyrillic 'a'
  'metamаsk.io', // Cyrillic 'a'
];

// Legitimate domains (whitelist)
const LEGITIMATE_DOMAINS: string[] = [
  'metamask.io',
  'uniswap.org',
  'opensea.io',
  'etherscan.io',
  'ethereum.org',
  'coinbase.com',
  'binance.com',
  'kraken.com',
  'aave.com',
  'curve.fi',
  'sushi.com',
  'pancakeswap.finance',
  'rarible.com',
  'foundation.app',
  'superrare.com',
  'nft.coinbase.com',
];

// Suspicious patterns in URLs
const SUSPICIOUS_PATTERNS = [
  /claim.*airdrop/i,
  /free.*eth/i,
  /free.*crypto/i,
  /doubl(e|ing).*crypto/i,
  /verify.*wallet/i,
  /support.*metamask/i,
  /wallet.*connect.*urgent/i,
  /your.*wallet.*locked/i,
  /kyc.*verify/i,
  /suspend.*account/i,
  /unusual.*activity/i,
  /confirm.*transaction/i,
  /restore.*access/i,
];

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// Check if domain is blacklisted
export function isBlacklisted(domain: string): boolean {
  const normalized = domain.toLowerCase();
  return BLACKLISTED_DOMAINS.some(blocked => 
    normalized === blocked || normalized.endsWith(`.${blocked}`)
  );
}

// Check if domain is whitelisted
export function isWhitelisted(domain: string): boolean {
  const normalized = domain.toLowerCase();
  return LEGITIMATE_DOMAINS.some(legit => 
    normalized === legit || normalized.endsWith(`.${legit}`)
  );
}

// Calculate Levenshtein distance (string similarity)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Check for typosquatting (similar to legitimate domains)
export function checkTyposquatting(domain: string): SuspiciousDomain | null {
  const normalized = domain.toLowerCase();
  
  for (const legitimate of LEGITIMATE_DOMAINS) {
    const distance = levenshteinDistance(normalized, legitimate);
    const maxAllowedDistance = Math.ceil(legitimate.length * 0.2); // 20% difference
    
    if (distance > 0 && distance <= maxAllowedDistance) {
      return {
        domain: normalized,
        legitimate,
        addedAt: Date.now()
      };
    }
    
    // Check for common character substitutions
    const commonSubs = [
      [normalized.replace(/0/g, 'o'), legitimate], // 0 → o
      [normalized.replace(/1/g, 'l'), legitimate], // 1 → l
      [normalized.replace(/3/g, 'e'), legitimate], // 3 → e
      [normalized.replace(/5/g, 's'), legitimate], // 5 → s
    ];
    
    for (const [subbed, legit] of commonSubs) {
      if (subbed === legit) {
        return {
          domain: normalized,
          legitimate: legit,
          addedAt: Date.now()
        };
      }
    }
  }
  
  return null;
}

// Check for suspicious patterns
export function checkSuspiciousPatterns(url: string): string[] {
  const matches: string[] = [];
  
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      matches.push(pattern.source);
    }
  }
  
  return matches;
}

// Check for Unicode tricks (homograph attack)
export function checkUnicodeTricks(domain: string): boolean {
  // Check for non-ASCII characters
  const hasNonAscii = /[^\x00-\x7F]/.test(domain);
  
  if (!hasNonAscii) return false;
  
  // Check if it looks similar to a legitimate domain
  const punycode = domain; // In production, use punycode library
  
  for (const legitimate of LEGITIMATE_DOMAINS) {
    // Visual similarity check
    const visuallySimilar = domain.length === legitimate.length;
    if (visuallySimilar) return true;
  }
  
  return hasNonAscii;
}

// Check SSL certificate (requires server-side implementation)
export async function checkSSLCertificate(domain: string): Promise<boolean> {
  // In production: Call backend API to verify SSL certificate
  // This is a client-side placeholder
  
  try {
    // Check if site forces HTTPS
    const response = await fetch(`https://${domain}`, { 
      method: 'HEAD',
      mode: 'no-cors' // Limited CORS check
    });
    
    return true; // If HTTPS works, certificate is valid
  } catch {
    return false;
  }
}

// Main phishing detection function
export async function checkPhishing(url: string): Promise<PhishingCheckResult> {
  const domain = extractDomain(url);
  const reasons: string[] = [];
  const blockedBy: PhishingCheckResult['blockedBy'] = [];
  
  // 1. Check whitelist (immediate safe)
  if (isWhitelisted(domain)) {
    return {
      isSafe: true,
      risk: 'safe',
      reasons: ['Domain is on the verified whitelist'],
      recommendation: 'This is a legitimate, verified website.'
    };
  }
  
  // 2. Check blacklist
  if (isBlacklisted(domain)) {
    reasons.push('Domain is on the known scam blacklist');
    blockedBy.push('blacklist');
  }
  
  // 3. Check typosquatting
  const typosquat = checkTyposquatting(domain);
  if (typosquat) {
    reasons.push(`Domain is similar to ${typosquat.legitimate} (possible typosquatting)`);
    blockedBy.push('similarity');
  }
  
  // 4. Check suspicious patterns
  const patterns = checkSuspiciousPatterns(url);
  if (patterns.length > 0) {
    reasons.push(`URL contains suspicious keywords: ${patterns.join(', ')}`);
    blockedBy.push('pattern');
  }
  
  // 5. Check Unicode tricks
  if (checkUnicodeTricks(domain)) {
    reasons.push('Domain contains non-ASCII characters (possible homograph attack)');
    blockedBy.push('pattern');
  }
  
  // 6. Check SSL certificate (async)
  const hasValidSSL = await checkSSLCertificate(domain);
  if (!hasValidSSL && !domain.includes('localhost')) {
    reasons.push('No valid SSL certificate detected');
    blockedBy.push('certificate');
  }
  
  // Determine risk level
  let risk: PhishingCheckResult['risk'];
  let recommendation: string;
  
  if (blockedBy.includes('blacklist')) {
    risk = 'danger';
    recommendation = '⛔ DO NOT PROCEED. This is a known scam site.';
  } else if (blockedBy.length >= 2) {
    risk = 'danger';
    recommendation = '⚠️ DANGER: Multiple red flags detected. Do not connect your wallet.';
  } else if (blockedBy.length === 1) {
    risk = 'warning';
    recommendation = '⚠️ WARNING: Proceed with extreme caution. Verify the URL carefully.';
  } else {
    risk = 'safe';
    recommendation = 'No immediate threats detected, but always verify URLs before connecting.';
  }
  
  return {
    isSafe: blockedBy.length === 0,
    risk,
    reasons: reasons.length > 0 ? reasons : ['No threats detected'],
    recommendation,
    blockedBy: blockedBy.length > 0 ? blockedBy : undefined
  };
}

// Report phishing site
export function reportPhishingSite(url: string, reportedBy: string): void {
  // In production: Send to backend API
  logger.info('Phishing site reported:', { url, reportedBy, timestamp: Date.now() });
  
  // Add to local blacklist immediately
  const domain = extractDomain(url);
  if (!BLACKLISTED_DOMAINS.includes(domain)) {
    BLACKLISTED_DOMAINS.push(domain);
  }
  
  // Store in localStorage for persistence
  const reports = JSON.parse(localStorage.getItem('paradox_phishing_reports') || '[]');
  reports.push({ url, domain, reportedBy, timestamp: Date.now() });
  localStorage.setItem('paradox_phishing_reports', JSON.stringify(reports));
}

// Get phishing statistics
export function getPhishingStats(): {
  blacklisted: number;
  whitelisted: number;
  userReported: number;
} {
  const reports = JSON.parse(localStorage.getItem('paradox_phishing_reports') || '[]');
  
  return {
    blacklisted: BLACKLISTED_DOMAINS.length,
    whitelisted: LEGITIMATE_DOMAINS.length,
    userReported: reports.length
  };
}

// React hook for phishing detection
import { useState, useEffect } from 'react';
import { logger } from '../services/logger.service';

export function usePhishingCheck(url: string | null) {
  const [result, setResult] = useState<PhishingCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setResult(null);
      return;
    }

    setLoading(true);
    checkPhishing(url)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [url]);

  return { result, loading };
}

// URL safety score (0-100)
export function calculateSafetyScore(url: string): number {
  let score = 100;
  
  const domain = extractDomain(url);
  
  // Blacklisted = 0
  if (isBlacklisted(domain)) return 0;
  
  // Whitelisted = 100
  if (isWhitelisted(domain)) return 100;
  
  // Deduct points for issues
  if (checkTyposquatting(domain)) score -= 40;
  if (checkSuspiciousPatterns(url).length > 0) score -= 30;
  if (checkUnicodeTricks(domain)) score -= 30;
  if (!url.startsWith('https://')) score -= 20;
  
  return Math.max(0, score);
}
