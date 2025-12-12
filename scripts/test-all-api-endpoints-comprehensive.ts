#!/usr/bin/env tsx
/**
 * COMPREHENSIVE API ENDPOINT TEST SUITE
 * Tests ALL API endpoints and ensures they return 200 status codes
 * 
 * Usage:
 *   npx tsx scripts/test-all-api-endpoints-comprehensive.ts
 *   API_BASE_URL=http://localhost:3001 npx tsx scripts/test-all-api-endpoints-comprehensive.ts
 *   API_BASE_URL=https://your-api.com AUTH_TOKEN=your-token npx tsx scripts/test-all-api-endpoints-comprehensive.ts
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const TEST_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address for testing
const TEST_USER_ID = 'test-user-id';
const TEST_ID = 'test-id';

interface EndpointTest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    name: string;
    category: string;
    requiresAuth?: boolean;
    body?: any;
    params?: Record<string, string>;
    expectedStatus?: number[]; // Acceptable status codes (default: [200])
    skipIfNoAuth?: boolean; // Skip if no auth token provided
}

interface TestResult {
    endpoint: EndpointTest;
    status: number;
    success: boolean;
    responseTime: number;
    error?: string;
    responseData?: any;
}

class ComprehensiveAPITester {
    private client: AxiosInstance;
    private results: TestResult[] = [];
    private authToken: string = AUTH_TOKEN;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            validateStatus: () => true, // Don't throw on any status
        });

        if (this.authToken) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
        }
    }

    // Get all endpoints from API_ROUTES config
    private getAllEndpoints(): EndpointTest[] {
        const endpoints: EndpointTest[] = [];

        // Health & Status
        endpoints.push(
            { method: 'GET', path: '/health', name: 'Health Check', category: 'System' },
            { method: 'GET', path: '/api/health', name: 'API Health Check', category: 'System' },
        );

        // Authentication endpoints
        endpoints.push(
            { method: 'GET', path: '/api/auth/subscription-tiers', name: 'Get Subscription Tiers', category: 'Auth' },
            { method: 'POST', path: '/api/auth/nonce', name: 'Get Nonce', category: 'Auth', body: { walletAddress: TEST_WALLET } },
            { method: 'GET', path: '/api/auth/me', name: 'Get Current User', category: 'Auth', requiresAuth: true, skipIfNoAuth: true },
        );

        // User endpoints
        endpoints.push(
            { method: 'GET', path: '/api/user/profile', name: 'Get User Profile', category: 'User', requiresAuth: true, skipIfNoAuth: true },
        );

        // Wallet endpoints
        endpoints.push(
            { method: 'GET', path: '/api/wallet', name: 'List Wallets', category: 'Wallet', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/wallet/balance', name: 'Get Wallet Balance', category: 'Wallet', requiresAuth: true, skipIfNoAuth: true, params: { address: TEST_WALLET } },
            { method: 'GET', path: '/api/wallet/transactions', name: 'Get Wallet Transactions', category: 'Wallet', requiresAuth: true, skipIfNoAuth: true, params: { address: TEST_WALLET } },
            { method: 'GET', path: '/api/wallet/tokens', name: 'Get Wallet Tokens', category: 'Wallet', requiresAuth: true, skipIfNoAuth: true, params: { address: TEST_WALLET } },
        );

        // Trading endpoints
        endpoints.push(
            { method: 'GET', path: '/api/trading/orders', name: 'Get Trading Orders', category: 'Trading', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/trading/orders/stats', name: 'Get Trading Stats', category: 'Trading', requiresAuth: true, skipIfNoAuth: true },
        );

        // Swaps endpoints
        endpoints.push(
            { method: 'GET', path: '/api/swaps/tokens', name: 'Get Swap Tokens', category: 'Swaps', params: { chainId: '1' } },
            { method: 'GET', path: '/api/swaps/quote', name: 'Get Swap Quote', category: 'Swaps', params: { from: 'ETH', to: 'USDC', amount: '1', chainId: '1' } },
        );

        // DeFi endpoints
        endpoints.push(
            { method: 'GET', path: '/api/defi/yield-vaults', name: 'Get Yield Vaults', category: 'DeFi' },
            { method: 'GET', path: '/api/defi/positions', name: 'Get DeFi Positions', category: 'DeFi', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/defi/apy-rates', name: 'Get APY Rates', category: 'DeFi' },
            { method: 'GET', path: '/api/defi/tokens', name: 'Get DeFi Tokens', category: 'DeFi' },
            { method: 'GET', path: '/api/defi/liquidity-sources', name: 'Get Liquidity Sources', category: 'DeFi' },
            { method: 'GET', path: '/api/defi/rpc/chains', name: 'Get RPC Chains', category: 'DeFi' },
            { method: 'GET', path: '/api/defi/rpc/health', name: 'Get RPC Health', category: 'DeFi' },
        );

        // MEV Guard endpoints
        endpoints.push(
            { method: 'GET', path: '/api/mev/status', name: 'Get MEV Status', category: 'MEV' },
            { method: 'GET', path: '/api/mev-guard/status', name: 'Get MEV Guard Status', category: 'MEV' },
            { method: 'GET', path: '/api/mev-guard/stats', name: 'Get MEV Guard Stats', category: 'MEV' },
            { method: 'GET', path: '/api/mev-guard/mempool/stats', name: 'Get Mempool Stats', category: 'MEV' },
        );

        // Wallet Guard endpoints
        endpoints.push(
            { method: 'GET', path: '/api/wallet-guard/health', name: 'Wallet Guard Health', category: 'Wallet Guard' },
        );

        // Sniper Bot endpoints
        endpoints.push(
            { method: 'GET', path: '/api/sniper/status', name: 'Get Sniper Status', category: 'Sniper', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/sniper/targets', name: 'Get Sniper Targets', category: 'Sniper', requiresAuth: true, skipIfNoAuth: true },
        );

        // Market Data endpoints
        endpoints.push(
            { method: 'GET', path: '/api/market-data/trending', name: 'Get Trending Tokens', category: 'Market Data' },
            { method: 'GET', path: '/api/market-data/overview', name: 'Get Market Overview', category: 'Market Data' },
            { method: 'GET', path: '/api/market-data/global', name: 'Get Global Market Data', category: 'Market Data' },
            { method: 'GET', path: '/api/market-data/coins', name: 'Get Top Coins', category: 'Market Data', params: { limit: '20' } },
        );

        // NFT endpoints
        endpoints.push(
            { method: 'GET', path: '/api/nft/owned', name: 'Get Owned NFTs', category: 'NFT', requiresAuth: true, skipIfNoAuth: true, params: { address: TEST_WALLET } },
        );

        // Fiat endpoints
        endpoints.push(
            { method: 'GET', path: '/api/fiat/providers', name: 'Get Fiat Providers', category: 'Fiat' },
            { method: 'GET', path: '/api/moonpay/status', name: 'MoonPay Status', category: 'Fiat' },
            { method: 'GET', path: '/api/moonpay/currencies', name: 'MoonPay Currencies', category: 'Fiat' },
            { method: 'GET', path: '/api/onramper/status', name: 'Onramper Status', category: 'Fiat' },
            { method: 'GET', path: '/api/changenow/status', name: 'ChangeNOW Status', category: 'Fiat' },
        );

        // Account endpoints
        endpoints.push(
            { method: 'GET', path: '/api/account', name: 'Get Account Info', category: 'Account', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/account/wallets', name: 'Get Account Wallets', category: 'Account', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/account/devices', name: 'Get Account Devices', category: 'Account', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/account/sessions', name: 'Get Account Sessions', category: 'Account', requiresAuth: true, skipIfNoAuth: true },
        );

        // Settings endpoints
        endpoints.push(
            { method: 'GET', path: '/api/settings', name: 'Get Settings', category: 'Settings', requiresAuth: true, skipIfNoAuth: true },
        );

        // Notifications endpoints
        endpoints.push(
            { method: 'GET', path: '/api/notifications', name: 'Get Notifications', category: 'Notifications', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/notifications/badge-count', name: 'Get Badge Count', category: 'Notifications', requiresAuth: true, skipIfNoAuth: true },
        );

        // Biometric endpoints
        endpoints.push(
            { method: 'GET', path: '/api/biometric/status', name: 'Get Biometric Status', category: 'Biometric', requiresAuth: true, skipIfNoAuth: true },
        );

        // Support endpoints
        endpoints.push(
            { method: 'GET', path: '/api/support/help', name: 'Get Help Articles', category: 'Support' },
            { method: 'GET', path: '/api/support/faq', name: 'Get FAQ', category: 'Support' },
        );

        // Legal endpoints
        endpoints.push(
            { method: 'GET', path: '/api/legal/terms-of-service', name: 'Get Terms of Service', category: 'Legal' },
            { method: 'GET', path: '/api/legal/privacy-policy', name: 'Get Privacy Policy', category: 'Legal' },
        );

        // Bridge endpoints
        endpoints.push(
            { method: 'GET', path: '/api/bridge/chains', name: 'Get Bridge Chains', category: 'Bridge' },
        );

        // Cross-Chain endpoints
        endpoints.push(
            { method: 'GET', path: '/api/cross-chain/chains', name: 'Get Cross-Chain Chains', category: 'Cross-Chain' },
        );

        // Airdrop endpoints
        endpoints.push(
            { method: 'GET', path: '/api/airdrops', name: 'Get Airdrops', category: 'Airdrop' },
            { method: 'GET', path: '/api/airdrops/farming', name: 'Get Airdrop Farming', category: 'Airdrop' },
        );

        // Portfolio endpoints
        endpoints.push(
            { method: 'GET', path: '/api/portfolio', name: 'Get Portfolio', category: 'Portfolio', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/portfolio/performance', name: 'Get Portfolio Performance', category: 'Portfolio', requiresAuth: true, skipIfNoAuth: true },
        );

        // AI endpoints
        endpoints.push(
            { method: 'GET', path: '/api/ai/health', name: 'AI Health Check', category: 'AI' },
        );

        // Premium endpoints
        endpoints.push(
            { method: 'GET', path: '/api/premium/features', name: 'Get Premium Features', category: 'Premium' },
            { method: 'GET', path: '/api/premium/lifetime-pass', name: 'Get Lifetime Pass Info', category: 'Premium' },
            { method: 'GET', path: '/api/premium-pass/status', name: 'Get Premium Pass Status', category: 'Premium', requiresAuth: true, skipIfNoAuth: true },
            { method: 'GET', path: '/api/premium-pass/pricing', name: 'Get Premium Pass Pricing', category: 'Premium' },
        );

        // Whale Tracker endpoints
        endpoints.push(
            { method: 'GET', path: '/api/whales/whales', name: 'Get Whales', category: 'Whale Tracker' },
            { method: 'GET', path: '/api/whales/transactions', name: 'Get Whale Transactions', category: 'Whale Tracker' },
            { method: 'GET', path: '/api/whales/alerts', name: 'Get Whale Alerts', category: 'Whale Tracker' },
        );

        // Trading endpoints (advanced)
        endpoints.push(
            { method: 'GET', path: '/api/trading/orders', name: 'Get Trading Orders', category: 'Trading', requiresAuth: true, skipIfNoAuth: true },
        );

        // DApps directory
        endpoints.push(
            { method: 'GET', path: '/api/dapps', name: 'Get DApps Directory', category: 'DApps' },
        );

        // Sniper Bot endpoints (additional)
        endpoints.push(
            { method: 'GET', path: '/api/sniper/analyze/:token', name: 'Analyze Token', category: 'Sniper', requiresAuth: true, skipIfNoAuth: true, params: { token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' } },
            { method: 'GET', path: '/api/sniper/whales', name: 'Get Sniper Whales', category: 'Sniper', requiresAuth: true, skipIfNoAuth: true },
        );

        // Wallet Data endpoints (under /api/wallet, not /api/wallet-data)
        endpoints.push(
            { method: 'GET', path: '/api/wallet/overview', name: 'Get Wallet Overview', category: 'Wallet Data', params: { address: TEST_WALLET, chainId: '1' } },
            { method: 'GET', path: '/api/wallet/tokens', name: 'Get Wallet Tokens', category: 'Wallet Data', params: { address: TEST_WALLET, chainId: '1' } },
        );

        // Gas endpoints
        endpoints.push(
            { method: 'GET', path: '/api/gas/prices', name: 'Get Gas Prices', category: 'Gas' },
            { method: 'GET', path: '/api/market-data/gas/1', name: 'Get Gas Prices (Market Data)', category: 'Gas' },
        );

        return endpoints;
    }

    private replacePathParams(path: string): string {
        return path
            .replace(':userId', TEST_USER_ID)
            .replace(':walletAddress', TEST_WALLET)
            .replace(':address', TEST_WALLET)
            .replace(':chainId', '1')
            .replace(':id', TEST_ID)
            .replace(':tokenAddress', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
            .replace(':network', 'ethereum')
            .replace(':transactionId', 'test-tx-id')
            .replace(':bridgeId', 'test-bridge-id')
            .replace(':txHash', '0x' + '0'.repeat(64))
            .replace(':coinId', 'ethereum')
            .replace(':notificationId', TEST_ID)
            .replace(':sessionId', TEST_ID)
            .replace(':deviceId', TEST_ID)
            .replace(':walletId', TEST_ID)
            .replace(':beneficiaryId', TEST_ID)
            .replace(':year', '2024');
    }

    async testEndpoint(endpoint: EndpointTest): Promise<TestResult> {
        const startTime = Date.now();
        let path = this.replacePathParams(endpoint.path);

        try {
            const config: any = {
                method: endpoint.method,
                url: path,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (endpoint.params) {
                config.params = endpoint.params;
            }

            if (endpoint.body) {
                config.data = endpoint.body;
            }

            const response = await this.client.request(config);
            const responseTime = Date.now() - startTime;

            const expectedStatus = endpoint.expectedStatus || [200];
            const success = expectedStatus.includes(response.status);

            let error: string | undefined;
            if (!success) {
                error = response.data?.error || response.data?.message || `Status ${response.status}`;
            }

            return {
                endpoint,
                status: response.status,
                success,
                responseTime,
                error,
                responseData: response.data,
            };
        } catch (err) {
            const responseTime = Date.now() - startTime;
            const axiosError = err as AxiosError;
            return {
                endpoint,
                status: axiosError.response?.status || 0,
                success: false,
                responseTime,
                error: axiosError.message || 'Unknown error',
            };
        }
    }

    async checkServerHealth(): Promise<boolean> {
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200;
        } catch (err) {
            return false;
        }
    }

    async runTests(): Promise<void> {
        console.log('\n🚀 COMPREHENSIVE API ENDPOINT TEST SUITE');
        console.log('═'.repeat(80));
        console.log(`API Base URL: ${API_BASE_URL}`);
        console.log(`Auth Token: ${this.authToken ? '✅ Provided' : '❌ Not provided (some endpoints will be skipped)'}`);
        console.log('═'.repeat(80));
        console.log('');

        // Check if server is running
        console.log('Checking server availability...');
        const serverAvailable = await this.checkServerHealth();
        if (!serverAvailable) {
            console.log('\n❌ ERROR: Backend server is not running or not accessible!');
            console.log('═'.repeat(80));
            console.log('Please start the backend server before running tests:');
            console.log('');
            console.log('  Option 1 (Node.js/TypeScript backend):');
            console.log('    cd src/backend');
            console.log('    pnpm install');
            console.log('    pnpm start');
            console.log('');
            console.log('  Option 2 (Python FastAPI backend):');
            console.log('    python -m uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000');
            console.log('');
            console.log('  Option 3 (Use production URL):');
            console.log(`    API_BASE_URL=https://your-production-url.com npx tsx scripts/test-all-api-endpoints-comprehensive.ts`);
            console.log('');
            console.log('═'.repeat(80));
            process.exit(1);
        }
        console.log('✅ Server is running!\n');

        const endpoints = this.getAllEndpoints();
        console.log(`Total endpoints to test: ${endpoints.length}\n`);

        const categories: Record<string, TestResult[]> = {};
        let passed = 0;
        let failed = 0;
        let skipped = 0;

        for (const endpoint of endpoints) {
            // Skip if requires auth and no token provided
            if (endpoint.skipIfNoAuth && !this.authToken) {
                console.log(`⏭️  SKIPPED: ${endpoint.name} (${endpoint.method} ${endpoint.path}) - No auth token`);
                skipped++;
                continue;
            }

            process.stdout.write(`Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})... `);
            const result = await this.testEndpoint(endpoint);
            this.results.push(result);

            if (!categories[result.endpoint.category]) {
                categories[result.endpoint.category] = [];
            }
            categories[result.endpoint.category].push(result);

            if (result.success) {
                console.log(`✅ PASSED (${result.status}) - ${result.responseTime}ms`);
                passed++;
            } else {
                console.log(`❌ FAILED (${result.status}) - ${result.error || 'Unknown error'} - ${result.responseTime}ms`);
                failed++;
            }

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Print summary
        console.log('\n' + '═'.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('═'.repeat(80));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`📈 Success Rate: ${passed + failed > 0 ? ((passed / (passed + failed)) * 100).toFixed(2) : 0}%`);
        console.log('═'.repeat(80));

        // Print results by category
        console.log('\n📋 RESULTS BY CATEGORY:');
        console.log('═'.repeat(80));
        for (const [category, results] of Object.entries(categories)) {
            const categoryPassed = results.filter(r => r.success).length;
            const categoryFailed = results.filter(r => !r.success).length;
            const categoryTotal = results.length;
            console.log(`\n${category}: ${categoryPassed}/${categoryTotal} passed`);
            
            if (categoryFailed > 0) {
                console.log('  Failed endpoints:');
                results.filter(r => !r.success).forEach(r => {
                    console.log(`    ❌ ${r.endpoint.name} (${r.endpoint.method} ${r.endpoint.path}) - Status: ${r.status}, Error: ${r.error || 'Unknown'}`);
                });
            }
        }

        // Print all failed endpoints
        if (failed > 0) {
            console.log('\n❌ ALL FAILED ENDPOINTS:');
            console.log('═'.repeat(80));
            this.results
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`  - ${r.endpoint.name}`);
                    console.log(`    Method: ${r.endpoint.method}`);
                    console.log(`    Path: ${r.endpoint.path}`);
                    console.log(`    Status: ${r.status}`);
                    console.log(`    Error: ${r.error || 'Unknown'}`);
                    console.log('');
                });
        }

        // Print all successful endpoints (if requested)
        if (process.env.VERBOSE === 'true') {
            console.log('\n✅ ALL SUCCESSFUL ENDPOINTS:');
            console.log('═'.repeat(80));
            this.results
                .filter(r => r.success)
                .forEach(r => {
                    console.log(`  ✅ ${r.endpoint.name} (${r.endpoint.method} ${r.endpoint.path}) - ${r.status} - ${r.responseTime}ms`);
                });
        }

        console.log('\n' + '═'.repeat(80));
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED! All endpoints return expected status codes.');
        } else {
            console.log(`⚠️  ${failed} endpoint(s) failed. Review the errors above.`);
        }
        console.log('═'.repeat(80));
    }
}

// Run tests
const tester = new ComprehensiveAPITester();
tester.runTests()
    .then(() => {
        const failedCount = tester['results'].filter(r => !r.success).length;
        process.exit(failedCount > 0 ? 1 : 0);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
