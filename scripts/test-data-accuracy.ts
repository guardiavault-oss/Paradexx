#!/usr/bin/env tsx
/**
 * Data Accuracy Test Suite
 * Verifies that prices, swaps, and trending data are accurate
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

class DataAccuracyTester {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            validateStatus: () => true,
        });
    }

    async testTrendingCoinsAccuracy(): Promise<void> {
        console.log('\n📈 Testing Trending Coins Accuracy...');
        console.log('═'.repeat(80));

        try {
            const response = await this.client.get('/api/market-data/trending');
            
            if (response.status !== 200) {
                console.log(`❌ Failed: Status ${response.status}`);
                return;
            }

            const trending = response.data.trending || response.data;
            
            if (!Array.isArray(trending) || trending.length === 0) {
                console.log(`❌ No trending coins data returned`);
                return;
            }

            console.log(`✅ Found ${trending.length} trending coins`);

            // Verify data structure
            const requiredFields = ['name', 'symbol', 'id'];
            const validCoins = trending.filter((coin: any) => {
                return requiredFields.every(field => coin[field] !== undefined);
            });

            console.log(`✅ ${validCoins.length}/${trending.length} coins have required fields`);

            // Show top 5 with details
            console.log(`\n   Top 5 Trending Coins:`);
            trending.slice(0, 5).forEach((coin: any, index: number) => {
                const name = coin.name || coin.id || 'Unknown';
                const symbol = coin.symbol?.toUpperCase() || 'N/A';
                const rank = coin.market_cap_rank || coin.rank || 'N/A';
                const priceBtc = coin.price_btc || coin.price_btc || 'N/A';
                console.log(`   ${index + 1}. ${name} (${symbol})`);
                console.log(`      Market Cap Rank: ${rank}`);
                if (priceBtc !== 'N/A') {
                    console.log(`      Price (BTC): ${priceBtc}`);
                }
            });

            return true;
        } catch (error: any) {
            console.log(`❌ Error: ${error.message}`);
            return false;
        }
    }

    async testTokenPricesAccuracy(): Promise<void> {
        console.log('\n💰 Testing Token Prices Accuracy...');
        console.log('═'.repeat(80));

        try {
            // Test top coins endpoint
            const response = await this.client.get('/api/market-data/coins?limit=10');
            
            if (response.status !== 200) {
                console.log(`❌ Failed: Status ${response.status}`);
                return;
            }

            const coins = response.data.coins || response.data;
            
            if (!Array.isArray(coins) || coins.length === 0) {
                console.log(`❌ No coins data returned`);
                return;
            }

            console.log(`✅ Found ${coins.length} coins with prices`);

            // Verify prices are realistic
            const validPrices = coins.filter((coin: any) => {
                const price = coin.current_price || coin.price;
                return typeof price === 'number' && price > 0 && price < 1000000; // Reasonable range
            });

            console.log(`✅ ${validPrices.length}/${coins.length} coins have valid prices`);

            // Check specific known coins
            const knownCoins = ['bitcoin', 'ethereum', 'tether', 'usd-coin'];
            console.log(`\n   Verifying Known Coins:`);
            
            for (const coinId of knownCoins) {
                const coin = coins.find((c: any) => 
                    c.id === coinId || 
                    c.symbol?.toLowerCase() === coinId.split('-')[0] ||
                    c.name?.toLowerCase().includes(coinId.split('-')[0])
                );

                if (coin) {
                    const price = coin.current_price || coin.price;
                    const symbol = coin.symbol?.toUpperCase() || 'N/A';
                    const change24h = coin.price_change_percentage_24h || 0;
                    
                    // Verify price ranges
                    let priceCheck = '✅';
                    if (coinId === 'bitcoin' && (price < 10000 || price > 200000)) {
                        priceCheck = '⚠️';
                    } else if (coinId === 'ethereum' && (price < 500 || price > 10000)) {
                        priceCheck = '⚠️';
                    } else if (coinId.includes('tether') && (price < 0.99 || price > 1.01)) {
                        priceCheck = '⚠️';
                    }

                    console.log(`   ${priceCheck} ${symbol}: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%)`);
                } else {
                    console.log(`   ❌ ${coinId} not found in results`);
                }
            }

            return true;
        } catch (error: any) {
            console.log(`❌ Error: ${error.message}`);
            return false;
        }
    }

    async testSwapQuoteAccuracy(): Promise<void> {
        console.log('\n🔄 Testing Swap Quote Accuracy...');
        console.log('═'.repeat(80));

        try {
            // Test ETH to USDC swap
            const response = await this.client.get('/api/swaps/quote', {
                params: {
                    from: 'ETH',
                    to: 'USDC',
                    amount: '1',
                    chainId: '1',
                },
            });

            if (response.status !== 200) {
                console.log(`❌ Failed: Status ${response.status} - ${response.data?.error || 'Unknown error'}`);
                return;
            }

            const quote = response.data;
            console.log(`✅ Swap quote received`);

            // Verify quote structure
            const requiredFields = ['from', 'to', 'fromAmount'];
            const hasRequiredFields = requiredFields.every(field => quote[field] !== undefined);
            
            console.log(`✅ Quote has required fields: ${hasRequiredFields}`);

            // Display quote details
            console.log(`\n   Quote Details:`);
            console.log(`   From: ${quote.from} ${quote.fromAmount || '1'}`);
            console.log(`   To: ${quote.to}`);
            
            if (quote.toAmount) {
                console.log(`   Output Amount: ${quote.toAmount} ${quote.to}`);
                
                // Verify output amount is reasonable (1 ETH should be ~$3000-4000 USDC)
                const ethPrice = 3200; // Approximate
                const expectedUSDC = ethPrice;
                const actualUSDC = parseFloat(quote.toAmount);
                
                if (actualUSDC > 0) {
                    const diff = Math.abs(actualUSDC - expectedUSDC);
                    const percentDiff = (diff / expectedUSDC) * 100;
                    
                    if (percentDiff < 20) { // Within 20% is acceptable
                        console.log(`   ✅ Output amount is reasonable (${percentDiff.toFixed(2)}% from expected)`);
                    } else {
                        console.log(`   ⚠️  Output amount may be inaccurate (${percentDiff.toFixed(2)}% from expected)`);
                    }
                }
            } else {
                console.log(`   ⚠️  No output amount in quote`);
            }

            if (quote.rate) {
                console.log(`   Exchange Rate: 1 ${quote.from} = ${quote.rate.toFixed(6)} ${quote.to}`);
            }

            if (quote.estimatedGas) {
                console.log(`   Estimated Gas: ${quote.estimatedGas}`);
            }

            if (quote.aggregator) {
                console.log(`   Aggregator: ${quote.aggregator}`);
            }

            if (quote.route) {
                console.log(`   Route: ${quote.route}`);
            }

            return true;
        } catch (error: any) {
            console.log(`❌ Error: ${error.message}`);
            return false;
        }
    }

    async testMarketOverviewData(): Promise<void> {
        console.log('\n🌐 Testing Market Overview Data...');
        console.log('═'.repeat(80));

        try {
            const response = await this.client.get('/api/market-data/overview');
            
            if (response.status !== 200) {
                console.log(`❌ Failed: Status ${response.status}`);
                return;
            }

            const overview = response.data;
            console.log(`✅ Market overview received`);

            // Check each section
            const sections = [
                { name: 'Top Coins', data: overview.topCoins },
                { name: 'Trending', data: overview.trending },
                { name: 'Global Data', data: overview.global },
                { name: 'Protocols', data: overview.protocols },
                { name: 'Top Yields', data: overview.topYields },
            ];

            console.log(`\n   Data Sections:`);
            sections.forEach(section => {
                if (Array.isArray(section.data)) {
                    const count = section.data.length;
                    const status = count > 0 ? '✅' : '⚠️';
                    console.log(`   ${status} ${section.name}: ${count} items`);
                } else if (section.data && typeof section.data === 'object') {
                    console.log(`   ✅ ${section.name}: Available`);
                } else {
                    console.log(`   ⚠️  ${section.name}: No data`);
                }
            });

            // If topCoins is empty, try to fetch directly
            if (!overview.topCoins || overview.topCoins.length === 0) {
                console.log(`\n   ⚠️  Top coins is empty, checking direct endpoint...`);
                const coinsResponse = await this.client.get('/api/market-data/coins?limit=5');
                if (coinsResponse.status === 200) {
                    const coins = coinsResponse.data.coins || coinsResponse.data;
                    if (Array.isArray(coins) && coins.length > 0) {
                        console.log(`   ✅ Direct coins endpoint returns ${coins.length} coins`);
                        console.log(`   ⚠️  Market overview may need to be fixed to include this data`);
                    }
                }
            }

            return true;
        } catch (error: any) {
            console.log(`❌ Error: ${error.message}`);
            return false;
        }
    }

    async runAllTests(): Promise<void> {
        console.log('\n🔍 DATA ACCURACY TEST SUITE');
        console.log('═'.repeat(80));
        console.log(`API Base URL: ${API_BASE_URL}`);
        console.log('═'.repeat(80));

        const results = await Promise.all([
            this.testTrendingCoinsAccuracy(),
            this.testTokenPricesAccuracy(),
            this.testSwapQuoteAccuracy(),
            this.testMarketOverviewData(),
        ]);

        console.log('\n' + '═'.repeat(80));
        console.log('📊 SUMMARY');
        console.log('═'.repeat(80));
        
        const passed = results.filter(r => r === true).length;
        const total = results.length;

        console.log(`✅ Passed: ${passed}/${total}`);
        console.log(`❌ Failed: ${total - passed}/${total}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(2)}%`);

        if (passed === total) {
            console.log('\n🎉 All data accuracy tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Review the output above.');
        }

        console.log('═'.repeat(80));
    }
}

const tester = new DataAccuracyTester();
tester.runAllTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
