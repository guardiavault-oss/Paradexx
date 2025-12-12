#!/usr/bin/env tsx
/**
 * Core Features Test Suite
 * Tests swaps, trades, trending coins, and token prices
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

interface TestResult {
    name: string;
    success: boolean;
    status: number;
    data?: any;
    error?: string;
    responseTime: number;
}

class CoreFeaturesTester {
    private client: AxiosInstance;
    private results: TestResult[] = [];

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            validateStatus: () => true,
        });

        if (AUTH_TOKEN) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${AUTH_TOKEN}`;
        }
    }

    async testEndpoint(name: string, method: 'GET' | 'POST', path: string, data?: any): Promise<TestResult> {
        const startTime = Date.now();
        try {
            const config: any = {
                method,
                url: path,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (data) {
                config.data = data;
            }

            const response = await this.client.request(config);
            const responseTime = Date.now() - startTime;

            return {
                name,
                success: response.status === 200,
                status: response.status,
                data: response.data,
                error: response.status !== 200 ? (response.data?.error || `Status ${response.status}`) : undefined,
                responseTime,
            };
        } catch (error: any) {
            return {
                name,
                success: false,
                status: 0,
                error: error.message,
                responseTime: Date.now() - startTime,
            };
        }
    }

    async testTrendingCoins(): Promise<void> {
        console.log('\n📈 Testing Trending Coins...');
        console.log('═'.repeat(80));

        // Test market-data trending endpoint
        const trendingResult = await this.testEndpoint(
            'Get Trending Coins (Market Data)',
            'GET',
            '/api/market-data/trending'
        );
        this.results.push(trendingResult);

        if (trendingResult.success && trendingResult.data) {
            const trending = trendingResult.data.trending || trendingResult.data;
            console.log(`✅ Trending coins endpoint working`);
            console.log(`   Found ${Array.isArray(trending) ? trending.length : 0} trending coins`);
            
            if (Array.isArray(trending) && trending.length > 0) {
                console.log(`\n   Top 5 Trending Coins:`);
                trending.slice(0, 5).forEach((coin: any, index: number) => {
                    const name = coin.name || coin.id || 'Unknown';
                    const symbol = coin.symbol || coin.symbol?.toUpperCase() || 'N/A';
                    const rank = coin.market_cap_rank || coin.rank || 'N/A';
                    console.log(`   ${index + 1}. ${name} (${symbol}) - Rank: ${rank}`);
                });
            } else {
                console.log(`   ⚠️  No trending coins data returned`);
            }
        } else {
            console.log(`❌ Failed: ${trendingResult.error}`);
        }
    }

    async testTokenPrices(): Promise<void> {
        console.log('\n💰 Testing Token Prices...');
        console.log('═'.repeat(80));

        // Test top coins (which includes prices)
        const topCoinsResult = await this.testEndpoint(
            'Get Top Coins with Prices',
            'GET',
            '/api/market-data/coins?limit=10'
        );
        this.results.push(topCoinsResult);

        if (topCoinsResult.success && topCoinsResult.data) {
            const coins = topCoinsResult.data.coins || topCoinsResult.data;
            console.log(`✅ Top coins endpoint working`);
            console.log(`   Found ${Array.isArray(coins) ? coins.length : 0} coins`);
            
            if (Array.isArray(coins) && coins.length > 0) {
                console.log(`\n   Top 5 Coins with Prices:`);
                coins.slice(0, 5).forEach((coin: any, index: number) => {
                    const name = coin.name || 'Unknown';
                    const symbol = coin.symbol?.toUpperCase() || 'N/A';
                    const price = coin.current_price || coin.price || 0;
                    const change24h = coin.price_change_percentage_24h || 0;
                    const formattedPrice = typeof price === 'number' ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : 'N/A';
                    const changeColor = change24h >= 0 ? '🟢' : '🔴';
                    console.log(`   ${index + 1}. ${name} (${symbol})`);
                    console.log(`      Price: ${formattedPrice} ${changeColor} ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`);
                });

                // Verify prices are valid numbers
                const validPrices = coins.filter((c: any) => {
                    const price = c.current_price || c.price;
                    return typeof price === 'number' && price > 0;
                });
                console.log(`\n   ✅ ${validPrices.length}/${coins.length} coins have valid prices`);
            }
        } else {
            console.log(`❌ Failed: ${topCoinsResult.error}`);
        }

        // Test specific coin price (Ethereum)
        const ethPriceResult = await this.testEndpoint(
            'Get Ethereum Price',
            'GET',
            '/api/market-data/coins/ethereum'
        );
        this.results.push(ethPriceResult);

        if (ethPriceResult.success && ethPriceResult.data) {
            const eth = ethPriceResult.data;
            const price = eth.current_price || eth.price || 0;
            console.log(`\n✅ Ethereum price: $${typeof price === 'number' ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}`);
        }
    }

    async testSwaps(): Promise<void> {
        console.log('\n🔄 Testing Swap Functionality...');
        console.log('═'.repeat(80));

        // Test swap tokens endpoint
        const tokensResult = await this.testEndpoint(
            'Get Swap Tokens',
            'GET',
            '/api/swaps/tokens?chainId=1'
        );
        this.results.push(tokensResult);

        if (tokensResult.success && tokensResult.data) {
            const tokens = tokensResult.data.tokens || [];
            console.log(`✅ Swap tokens endpoint working`);
            console.log(`   Found ${tokens.length} supported tokens for swaps`);
            
            if (tokens.length > 0) {
                console.log(`\n   Supported Tokens (first 10):`);
                tokens.slice(0, 10).forEach((token: any, index: number) => {
                    const symbol = token.symbol || token.symbol?.toUpperCase() || 'N/A';
                    const name = token.name || symbol;
                    const address = token.address || 'N/A';
                    console.log(`   ${index + 1}. ${name} (${symbol}) - ${address.substring(0, 10)}...`);
                });
            }
        } else {
            console.log(`❌ Failed: ${tokensResult.error}`);
        }

        // Test swap quote (ETH to USDC)
        const quoteResult = await this.testEndpoint(
            'Get Swap Quote (ETH → USDC)',
            'GET',
            '/api/swaps/quote?from=ETH&to=USDC&amount=1&chainId=1'
        );
        this.results.push(quoteResult);

        if (quoteResult.success && quoteResult.data) {
            const quote = quoteResult.data;
            console.log(`\n✅ Swap quote endpoint working`);
            console.log(`   From: ${quote.from || 'ETH'}`);
            console.log(`   To: ${quote.to || 'USDC'}`);
            console.log(`   Amount: ${quote.amount || '1'} ${quote.from || 'ETH'}`);
            if (quote.outputAmount) {
                console.log(`   Output: ${quote.outputAmount} ${quote.to || 'USDC'}`);
            }
            if (quote.estimatedGas) {
                console.log(`   Estimated Gas: ${quote.estimatedGas}`);
            }
            if (quote.priceImpact) {
                console.log(`   Price Impact: ${quote.priceImpact}%`);
            }
        } else {
            console.log(`\n❌ Swap quote failed: ${quoteResult.error}`);
            if (quoteResult.status === 401) {
                console.log(`   ⚠️  This endpoint requires authentication`);
            }
        }

        // Test aggregators endpoint (if authenticated)
        if (AUTH_TOKEN) {
            const aggregatorsResult = await this.testEndpoint(
                'Get Swap Aggregators',
                'POST',
                '/api/swaps/aggregators',
                {
                    fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
                    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
                    amount: '1000000000000000000', // 1 ETH
                    fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                    chainId: 1,
                }
            );
            this.results.push(aggregatorsResult);

            if (aggregatorsResult.success) {
                console.log(`\n✅ Swap aggregators endpoint working`);
                const aggregators = aggregatorsResult.data?.aggregators || aggregatorsResult.data;
                if (Array.isArray(aggregators) && aggregators.length > 0) {
                    console.log(`   Found ${aggregators.length} aggregators`);
                }
            } else {
                console.log(`\n❌ Swap aggregators failed: ${aggregatorsResult.error}`);
            }
        } else {
            console.log(`\n⏭️  Skipping aggregators test (requires authentication)`);
        }
    }

    async testTrades(): Promise<void> {
        console.log('\n📊 Testing Trading Functionality...');
        console.log('═'.repeat(80));

        if (!AUTH_TOKEN) {
            console.log(`⏭️  Trading endpoints require authentication`);
            console.log(`   Set AUTH_TOKEN environment variable to test trading`);
            return;
        }

        // Test trading orders endpoint
        const ordersResult = await this.testEndpoint(
            'Get Trading Orders',
            'GET',
            '/api/trading/orders'
        );
        this.results.push(ordersResult);

        if (ordersResult.success) {
            const orders = ordersResult.data?.orders || ordersResult.data || [];
            console.log(`✅ Trading orders endpoint working`);
            console.log(`   Found ${Array.isArray(orders) ? orders.length : 0} orders`);
        } else {
            console.log(`❌ Trading orders failed: ${ordersResult.error}`);
        }

        // Test trading stats
        const statsResult = await this.testEndpoint(
            'Get Trading Stats',
            'GET',
            '/api/trading/orders/stats'
        );
        this.results.push(statsResult);

        if (statsResult.success) {
            const stats = statsResult.data;
            console.log(`\n✅ Trading stats endpoint working`);
            if (stats) {
                console.log(`   Stats:`, JSON.stringify(stats, null, 2));
            }
        } else {
            console.log(`\n❌ Trading stats failed: ${statsResult.error}`);
        }
    }

    async testMarketOverview(): Promise<void> {
        console.log('\n🌐 Testing Market Overview...');
        console.log('═'.repeat(80));

        const overviewResult = await this.testEndpoint(
            'Get Market Overview',
            'GET',
            '/api/market-data/overview'
        );
        this.results.push(overviewResult);

        if (overviewResult.success && overviewResult.data) {
            const overview = overviewResult.data;
            console.log(`✅ Market overview endpoint working`);
            
            if (overview.topCoins && Array.isArray(overview.topCoins)) {
                console.log(`   Top Coins: ${overview.topCoins.length}`);
            }
            if (overview.trending && Array.isArray(overview.trending)) {
                console.log(`   Trending: ${overview.trending.length}`);
            }
            if (overview.global) {
                console.log(`   Global Data: Available`);
            }
            if (overview.protocols && Array.isArray(overview.protocols)) {
                console.log(`   Protocols: ${overview.protocols.length}`);
            }
            if (overview.topYields && Array.isArray(overview.topYields)) {
                console.log(`   Top Yields: ${overview.topYields.length}`);
            }
        } else {
            console.log(`❌ Failed: ${overviewResult.error}`);
        }
    }

    async runAllTests(): Promise<void> {
        console.log('\n🚀 CORE FEATURES TEST SUITE');
        console.log('═'.repeat(80));
        console.log(`API Base URL: ${API_BASE_URL}`);
        console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Not provided (some tests will be skipped)'}`);
        console.log('═'.repeat(80));

        await this.testTrendingCoins();
        await this.testTokenPrices();
        await this.testSwaps();
        await this.testTrades();
        await this.testMarketOverview();

        // Summary
        console.log('\n' + '═'.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('═'.repeat(80));
        
        const passed = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        const total = this.results.length;

        console.log(`✅ Passed: ${passed}/${total}`);
        console.log(`❌ Failed: ${failed}/${total}`);
        console.log(`📈 Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(2) : 0}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.success).forEach(r => {
                console.log(`   - ${r.name}: ${r.error || `Status ${r.status}`}`);
            });
        }

        console.log('\n' + '═'.repeat(80));

        // Verify data quality
        console.log('\n🔍 DATA QUALITY CHECKS:');
        console.log('═'.repeat(80));

        const trendingTest = this.results.find(r => r.name.includes('Trending'));
        if (trendingTest?.success && trendingTest.data) {
            const trending = trendingTest.data.trending || trendingTest.data;
            const hasData = Array.isArray(trending) && trending.length > 0;
            console.log(`✅ Trending Coins: ${hasData ? 'Data available' : 'No data'}`);
        }

        const pricesTest = this.results.find(r => r.name.includes('Top Coins'));
        if (pricesTest?.success && pricesTest.data) {
            const coins = pricesTest.data.coins || pricesTest.data;
            if (Array.isArray(coins)) {
                const validPrices = coins.filter((c: any) => {
                    const price = c.current_price || c.price;
                    return typeof price === 'number' && price > 0;
                });
                console.log(`✅ Token Prices: ${validPrices.length}/${coins.length} coins have valid prices`);
            }
        }

        const swapsTest = this.results.find(r => r.name.includes('Swap'));
        if (swapsTest?.success) {
            console.log(`✅ Swap Functionality: Working`);
        } else {
            console.log(`❌ Swap Functionality: ${swapsTest?.error || 'Failed'}`);
        }

        console.log('═'.repeat(80));
    }
}

// Run tests
const tester = new CoreFeaturesTester();
tester.runAllTests()
    .then(() => {
        const failedCount = tester['results'].filter(r => !r.success).length;
        process.exit(failedCount > 0 ? 1 : 0);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });

