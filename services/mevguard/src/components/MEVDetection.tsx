import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle, Search, Shield, TrendingUp } from 'lucide-react';
import { api, DetectMEVData } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function MEVDetection() {
  const [txHash, setTxHash] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<DetectMEVData | null>(null);

  const handleDetect = async () => {
    if (!txHash) {
      toast.error('Please enter a transaction hash');
      return;
    }

    setDetecting(true);
    try {
      const data = await api.detectMEV({ transaction_hash: txHash, network });
      setResult(data);
      
      if (data.is_mev_threat) {
        toast.warning(`MEV threat detected: ${data.threat_type}`);
      } else {
        toast.success('No MEV threat detected');
      }
    } catch (err) {
      toast.error('Failed to detect MEV');
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Detection Form */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h2 className="text-white mb-6">MEV Detection</h2>
        <p className="text-gray-400 text-sm mb-6">
          Analyze any transaction for MEV threats including sandwich attacks, frontrunning, and backrunning.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Transaction Hash</Label>
            <Input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Network</Label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white"
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
            </select>
          </div>

          <Button
            onClick={handleDetect}
            disabled={detecting || !txHash}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {detecting ? (
              <>
                <Search className="w-4 h-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Detect MEV
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className={`p-6 ${result.is_mev_threat ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              result.is_mev_threat ? 'bg-red-500/10' : 'bg-emerald-500/10'
            }`}>
              {result.is_mev_threat ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : (
                <Shield className="w-6 h-6 text-emerald-400" />
              )}
            </div>

            <div className="flex-1">
              <h3 className={`mb-2 ${result.is_mev_threat ? 'text-red-400' : 'text-emerald-400'}`}>
                {result.is_mev_threat ? 'MEV Threat Detected' : 'No MEV Threat Detected'}
              </h3>

              {result.is_mev_threat && (
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Threat Type</p>
                    <Badge className="bg-red-500/20 text-red-400 capitalize">
                      {result.threat_type}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">Severity</p>
                    <Badge className={
                      result.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      result.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      result.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-cyan-500/20 text-cyan-400'
                    }>
                      {result.severity}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">Confidence</p>
                    <p className="text-white">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>

                  {result.estimated_loss !== undefined && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Estimated Loss</p>
                      <p className="text-red-400">${result.estimated_loss.toFixed(2)}</p>
                    </div>
                  )}

                  {result.recommendation && (
                    <div className="mt-4 p-4 bg-[#0f0f0f] rounded-lg">
                      <p className="text-gray-400 text-sm mb-1">Recommendation</p>
                      <p className="text-white text-sm">{result.recommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {!result.is_mev_threat && (
                <p className="text-gray-400 text-sm">
                  This transaction appears to be safe from MEV attacks.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          What is MEV Detection?
        </h3>
        <div className="text-gray-400 text-sm space-y-2">
          <p>
            MEV (Maximal Extractable Value) detection analyzes blockchain transactions to identify potential threats such as:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Sandwich attacks - Trading before and after your transaction</li>
            <li>Frontrunning - Submitting a transaction with higher gas to execute first</li>
            <li>Backrunning - Executing transactions immediately after yours</li>
            <li>Liquidations - Taking advantage of undercollateralized positions</li>
          </ul>
          <p className="mt-4">
            Our detection engine uses advanced heuristics and pattern matching to identify these threats
            in real-time, helping you protect your transactions.
          </p>
        </div>
      </Card>
    </div>
  );
}
