/**
 * Example Component - Enhanced API Integration
 * Demonstrates how to use the enhanced API integration
 */

import { useWalletBalance, useWallets, useSendTransaction, useTokenPrices } from '@/hooks/useApiQuery';
import { apiServices } from '@/services';
import { useState } from 'react';

export function EnhancedApiExample() {
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    // Using React Query hooks - automatic caching, refetching, error handling
    const { data: wallets, isLoading: walletsLoading, error: walletsError } = useWallets();
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useWalletBalance(selectedAddress);
    
    // Token prices with auto-refresh every 10 seconds
    const { data: prices } = useTokenPrices(['ETH', 'USDC', 'BTC']);

    // Mutation with automatic cache invalidation
    const sendTx = useSendTransaction({
        onSuccess: () => {
            console.log('Transaction sent successfully!');
            setRecipient('');
            setAmount('');
        },
        onError: (error) => {
            console.error('Transaction failed:', error);
        },
    });

    const handleSendTransaction = () => {
        if (!selectedAddress || !recipient || !amount) return;

        sendTx.mutate({
            address: selectedAddress,
            request: {
                to: recipient,
                value: amount,
            },
        });
    };

    // Direct service layer usage (for one-off calls)
    const handleCheckHealth = async () => {
        const health = await apiServices.health.checkHealth('backend');
        console.log('Service health:', health);
        alert(`Service: ${health.service}\nHealthy: ${health.healthy}\nLatency: ${health.latency}ms`);
    };

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Enhanced API Integration Example</h2>

            {/* Health Check */}
            <div className="p-4 bg-gray-100 rounded-lg">
                <button
                    onClick={handleCheckHealth}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Check Service Health
                </button>
            </div>

            {/* Wallets List */}
            <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Wallets</h3>
                {walletsLoading && <p>Loading wallets...</p>}
                {walletsError && <p className="text-red-500">Error: {walletsError.message}</p>}
                {wallets?.data && (
                    <div className="space-y-2">
                        {wallets.data.map((wallet: any) => (
                            <button
                                key={wallet.id}
                                onClick={() => setSelectedAddress(wallet.address)}
                                className={`block w-full p-3 text-left rounded border ${
                                    selectedAddress === wallet.address
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="font-mono text-sm">{wallet.address}</div>
                                <div className="text-sm text-gray-500">Balance: {wallet.balance} ETH</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Wallet Balance */}
            {selectedAddress && (
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Balance</h3>
                    {balanceLoading && <p>Loading balance...</p>}
                    {balanceError && <p className="text-red-500">Error: {balanceError.message}</p>}
                    {balance?.data && (
                        <div>
                            <p className="text-2xl font-bold">{balance.data.balance} ETH</p>
                            <p className="text-gray-500">${balance.data.usdBalance?.toFixed(2)} USD</p>
                        </div>
                    )}
                </div>
            )}

            {/* Token Prices */}
            {prices?.data && (
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Token Prices</h3>
                    <div className="space-y-2">
                        {prices.data.map((price: any) => (
                            <div key={price.symbol} className="flex justify-between">
                                <span className="font-semibold">{price.symbol}</span>
                                <span>${price.price?.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Send Transaction */}
            {selectedAddress && (
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Send Transaction</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Recipient</label>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="0x..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Amount (ETH)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="0.1"
                            />
                        </div>
                        <button
                            onClick={handleSendTransaction}
                            disabled={sendTx.isPending || !recipient || !amount}
                            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {sendTx.isPending ? 'Sending...' : 'Send Transaction'}
                        </button>
                        {sendTx.isError && (
                            <p className="text-red-500 text-sm">Error: {sendTx.error?.message}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

