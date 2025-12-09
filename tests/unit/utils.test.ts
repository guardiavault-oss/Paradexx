/**
 * Unit tests for utility functions
 */
import { describe, it, expect } from 'vitest';

describe('Crypto Utils', () => {
  describe('Hash Functions', () => {
    it('should create deterministic hash from input', () => {
      const simpleHash = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const hash1 = simpleHash('test');
      const hash2 = simpleHash('test');
      const hash3 = simpleHash('different');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('Hex Encoding', () => {
    it('should convert buffer to hex string', () => {
      const bufferToHex = (buffer: Uint8Array): string => {
        return Array.from(buffer)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      };

      const buffer = new Uint8Array([0, 255, 128]);
      expect(bufferToHex(buffer)).toBe('00ff80');
    });

    it('should convert hex string to buffer', () => {
      const hexToBuffer = (hex: string): Uint8Array => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
      };

      const result = hexToBuffer('00ff80');
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(255);
      expect(result[2]).toBe(128);
    });
  });
});

describe('Number Utils', () => {
  describe('Wei Conversions', () => {
    it('should convert ETH to Wei', () => {
      const ethToWei = (eth: number): bigint => {
        return BigInt(Math.floor(eth * 1e18));
      };

      expect(ethToWei(1)).toBe(BigInt('1000000000000000000'));
      expect(ethToWei(0.5)).toBe(BigInt('500000000000000000'));
    });

    it('should convert Wei to ETH', () => {
      const weiToEth = (wei: bigint): number => {
        return Number(wei) / 1e18;
      };

      expect(weiToEth(BigInt('1000000000000000000'))).toBe(1);
      expect(weiToEth(BigInt('500000000000000000'))).toBe(0.5);
    });

    it('should convert Gwei to Wei', () => {
      const gweiToWei = (gwei: number): bigint => {
        return BigInt(Math.floor(gwei * 1e9));
      };

      expect(gweiToWei(1)).toBe(BigInt('1000000000'));
      expect(gweiToWei(20)).toBe(BigInt('20000000000'));
    });
  });

  describe('Percentage Calculations', () => {
    it('should calculate percentage change', () => {
      const percentChange = (oldValue: number, newValue: number): number => {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
      };

      expect(percentChange(100, 110)).toBe(10);
      expect(percentChange(100, 90)).toBe(-10);
      expect(percentChange(100, 100)).toBe(0);
      expect(percentChange(0, 100)).toBe(0);
    });

    it('should format percentage for display', () => {
      const formatPercent = (value: number): string => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
      };

      expect(formatPercent(10.5)).toBe('+10.50%');
      expect(formatPercent(-5.25)).toBe('-5.25%');
      expect(formatPercent(0)).toBe('+0.00%');
    });
  });

  describe('Rounding', () => {
    it('should round to specified decimals', () => {
      const roundTo = (value: number, decimals: number): number => {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
      };

      expect(roundTo(1.23456, 2)).toBe(1.23);
      expect(roundTo(1.235, 2)).toBe(1.24);
      expect(roundTo(1.234, 0)).toBe(1);
    });
  });
});

describe('String Utils', () => {
  describe('Truncation', () => {
    it('should truncate long strings', () => {
      const truncate = (str: string, maxLen: number): string => {
        if (str.length <= maxLen) return str;
        return str.slice(0, maxLen - 3) + '...';
      };

      expect(truncate('Hello World', 20)).toBe('Hello World');
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });
  });

  describe('Capitalization', () => {
    it('should capitalize first letter', () => {
      const capitalize = (str: string): string => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('')).toBe('');
    });

    it('should convert to title case', () => {
      const titleCase = (str: string): string => {
        return str
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('HELLO WORLD')).toBe('Hello World');
    });
  });
});

describe('Date Utils', () => {
  it('should format timestamp to relative time', () => {
    const getRelativeTime = (timestamp: number): string => {
      const now = Date.now();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    const now = Date.now();
    expect(getRelativeTime(now)).toBe('Just now');
    expect(getRelativeTime(now - 60000)).toBe('1m ago');
    expect(getRelativeTime(now - 3600000)).toBe('1h ago');
    expect(getRelativeTime(now - 86400000)).toBe('1d ago');
  });

  it('should check if date is today', () => {
    const isToday = (date: Date): boolean => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    expect(isToday(new Date())).toBe(true);
    expect(isToday(new Date('2020-01-01'))).toBe(false);
  });
});

describe('Validation Utils', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });

  it('should validate URL format', () => {
    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});
