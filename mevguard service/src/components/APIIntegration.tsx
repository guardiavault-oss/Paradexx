import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Code, Copy, Check, Key, RefreshCw, Eye, EyeOff, Terminal, BookOpen } from 'lucide-react';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/protection/start',
    description: 'Start MEV protection for specified networks',
    category: 'Protection'
  },
  {
    method: 'POST',
    path: '/api/v1/protection/stop',
    description: 'Stop MEV protection',
    category: 'Protection'
  },
  {
    method: 'GET',
    path: '/api/v1/protection/status',
    description: 'Get current protection status',
    category: 'Protection'
  },
  {
    method: 'POST',
    path: '/api/v1/transactions/protect',
    description: 'Protect a specific transaction',
    category: 'Transactions'
  },
  {
    method: 'GET',
    path: '/api/v1/threats',
    description: 'Get detected MEV threats',
    category: 'Threats'
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Get protection statistics',
    category: 'Analytics'
  },
  {
    method: 'GET',
    path: '/api/v1/mev/metrics',
    description: 'Get MEV saved metrics',
    category: 'Analytics'
  },
  {
    method: 'GET',
    path: '/api/v1/relays',
    description: 'Get private relay connection status',
    category: 'Relays'
  }
];

const CODE_EXAMPLES = {
  javascript: `// Initialize MEVGUARD Client
import { MEVGuardClient } from '@mevguard/sdk';

const client = new MEVGuardClient({
  apiKey: 'your-api-key-here',
  baseUrl: 'https://api.mevguard.io'
});

// Start Protection
const protection = await client.protection.start({
  networks: ['ethereum', 'polygon'],
  protection_level: 'high'
});

// Protect Transaction
const result = await client.transactions.protect({
  transaction_hash: '0x1234...',
  network: 'ethereum',
  protection_level: 'high',
  private_mempool: true
});

console.log('Protected:', result);`,

  python: `# Initialize MEVGUARD Client
from mevguard import MEVGuardClient

client = MEVGuardClient(
    api_key='your-api-key-here',
    base_url='https://api.mevguard.io'
)

# Start Protection
protection = client.protection.start(
    networks=['ethereum', 'polygon'],
    protection_level='high'
)

# Protect Transaction
result = client.transactions.protect(
    transaction_hash='0x1234...',
    network='ethereum',
    protection_level='high',
    private_mempool=True
)

print('Protected:', result)`,

  curl: `# Start Protection
curl -X POST https://api.mevguard.io/api/v1/protection/start \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "networks": ["ethereum", "polygon"],
    "protection_level": "high"
  }'

# Protect Transaction
curl -X POST https://api.mevguard.io/api/v1/transactions/protect \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_hash": "0x1234...",
    "network": "ethereum",
    "protection_level": "high",
    "private_mempool": true
  }'`
};

export function APIIntegration() {
  const [apiKey, setApiKey] = useState('mevguard_live_1234567890abcdefghijklmnop');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(`https://api.mevguard.io${endpoint}`);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[selectedLanguage as keyof typeof CODE_EXAMPLES]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegenerateKey = () => {
    // API call to regenerate key
    console.log('Regenerating API key...');
  };

  return (
    <div className="space-y-6">
      {/* API Key Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-6">
              <Key className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white">API Key</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Active
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2">Your API Key</Label>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 relative">
                    <Input
                      value={showApiKey ? apiKey : '•'.repeat(apiKey.length)}
                      readOnly
                      className="bg-[#0f0f0f] border-[#2a2a2a] text-white pr-10 font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyApiKey}
                    className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Keep your API key secret. Do not share it in publicly accessible areas.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRegenerateKey}
                  className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Key
                </Button>
                <Button
                  variant="outline"
                  className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* API Stats */}
        <div className="space-y-6">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-2">API Calls (24h)</p>
            <p className="text-white tracking-tight mb-1">12,847</p>
            <p className="text-emerald-400 text-sm">+23% from yesterday</p>
          </Card>

          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-2">Rate Limit</p>
            <p className="text-white tracking-tight mb-1">1,000 / min</p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Used</span>
                <span>234 / 1,000</span>
              </div>
              <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '23.4%' }} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-2">Success Rate</p>
            <p className="text-white tracking-tight mb-1">99.8%</p>
            <p className="text-gray-500 text-sm">Last 7 days</p>
          </Card>
        </div>
      </div>

      {/* API Documentation */}
      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white">Available Endpoints</h3>
              <Button variant="outline" className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]">
                <BookOpen className="w-4 h-4 mr-2" />
                Full Documentation
              </Button>
            </div>

            <div className="space-y-2">
              {API_ENDPOINTS.map((endpoint, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge
                      className={
                        endpoint.method === 'GET'
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }
                    >
                      {endpoint.method}
                    </Badge>
                    <div className="flex-1">
                      <code className="text-gray-300 text-sm">{endpoint.path}</code>
                      <p className="text-gray-500 text-xs mt-1">{endpoint.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyEndpoint(endpoint.path)}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedEndpoint === endpoint.path ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white">Quick Start Examples</h3>
              <div className="flex gap-2">
                {['javascript', 'python', 'curl'].map((lang) => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedLanguage(lang)}
                    className={selectedLanguage === lang ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-gray-400'}
                  >
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 overflow-x-auto">
                <code className="text-gray-300 text-sm">
                  {CODE_EXAMPLES[selectedLanguage as keyof typeof CODE_EXAMPLES]}
                </code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="absolute top-4 right-4 border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
              >
                {copiedCode ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedCode ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex gap-3">
                <Code className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-400 mb-1">SDK Installation</p>
                  <code className="text-gray-300 text-sm">
                    npm install @mevguard/sdk
                  </code>
                  <p className="text-gray-400 text-xs mt-2">
                    Or use pip for Python: <code className="text-gray-300">pip install mevguard</code>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white">Webhook Configuration</h3>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Add Webhook
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-gray-300">Webhook URL</Label>
                <Input
                  placeholder="https://your-domain.com/webhooks/mevguard"
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Event Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['threat_detected', 'protection_applied', 'transaction_protected', 'relay_status_changed'].map((event) => (
                    <div key={event} className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f0f]">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-gray-300 text-sm">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[#2a2a2a] pt-6">
              <h4 className="text-white mb-4">Active Webhooks</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f]">
                  <div>
                    <code className="text-gray-300 text-sm">https://api.example.com/webhook</code>
                    <p className="text-gray-500 text-xs mt-1">4 events • Last triggered 2m ago</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                    <Button variant="ghost" size="sm" className="text-gray-400">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}