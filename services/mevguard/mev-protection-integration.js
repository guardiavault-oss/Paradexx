/**
 * MEV Protection Integration Script
 * 
 * This script enhances the existing mempool dashboard with MEV protection capabilities
 * Run this to integrate MEV Protection Service (port 8004) with the Mempool Dashboard
 */

const fs = require('fs');
const path = require('path');

// Paths
const MEMPOOL_DASHBOARD_PATH = '../unified-mempool-system/dashboard';
const MEV_PAGE_PATH = path.join(MEMPOOL_DASHBOARD_PATH, 'src/app/mev/page.tsx');
const API_CLIENT_PATH = path.join(MEMPOOL_DASHBOARD_PATH, 'src/lib/api-client.ts');

// Enhanced API client methods for MEV Protection
const MEV_PROTECTION_API_METHODS = `
  // MEV Protection Service Methods (Port 8004)
  async getMEVProtectionStatus() {
    try {
      const response = await axios.get('http://localhost:8004/api/status');
      return {
        isActive: response.data.status === 'active',
        protectionLevel: response.data.protection_level || 'standard',
        networks: response.data.active_networks || [],
        uptime: response.data.uptime_hours || 0,
        threatsDetected: response.data.threats_detected_24h || 0,
        transactionsProtected: response.data.transactions_protected_24h || 0,
        valueProtected: response.data.value_protected_usd || 0
      };
    } catch (error) {
      console.error('MEV Protection service unavailable');
      return { isActive: false, protectionLevel: 'basic', networks: [] };
    }
  }

  async enableMEVProtection(config) {
    try {
      const response = await axios.post('http://localhost:8004/api/protection/enable', config);
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  async disableMEVProtection() {
    try {
      const response = await axios.post('http://localhost:8004/api/protection/disable');
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  async getMEVThreats(limit = 10) {
    try {
      const response = await axios.get('http://localhost:8004/api/threats', { params: { limit } });
      return response.data.threats || [];
    } catch (error) {
      return [];
    }
  }

  async getProtectedTransactions(limit = 10) {
    try {
      const response = await axios.get('http://localhost:8004/api/protection/history', { params: { limit } });
      return response.data.protected_transactions || [];
    } catch (error) {
      return [];
    }
  }
`;

// Enhanced MEV page component additions
const MEV_PROTECTION_COMPONENT = `
  // MEV Protection State
  const [protectionStatus, setProtectionStatus] = useState(null);
  const [protectionLoading, setProtectionLoading] = useState(false);
  
  // Fetch protection status
  useEffect(() => {
    const fetchProtectionStatus = async () => {
      try {
        const status = await apiClient.getMEVProtectionStatus();
        setProtectionStatus(status);
      } catch (error) {
        console.error('Failed to fetch protection status:', error);
      }
    };
    
    fetchProtectionStatus();
    const protectionInterval = setInterval(fetchProtectionStatus, 30000);
    return () => clearInterval(protectionInterval);
  }, []);

  const handleToggleProtection = async () => {
    setProtectionLoading(true);
    try {
      if (protectionStatus?.isActive) {
        await apiClient.disableMEVProtection();
      } else {
        await apiClient.enableMEVProtection({
          networks: ['ethereum'],
          protectionLevel: 'standard'
        });
      }
      // Refresh status
      const status = await apiClient.getMEVProtectionStatus();
      setProtectionStatus(status);
    } catch (error) {
      console.error('Failed to toggle protection:', error);
    } finally {
      setProtectionLoading(false);
    }
  };
`;

const MEV_PROTECTION_UI = `
        {/* MEV Protection Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-dark rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={\`p-2 rounded-lg \${protectionStatus?.isActive ? 'bg-green-900/30' : 'bg-red-900/30'}\`}>
                {protectionStatus?.isActive ? (
                  <Shield className="h-6 w-6 text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">MEV Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Status: {protectionStatus?.isActive ? 'Active' : 'Inactive'} • 
                  Level: {protectionStatus?.protectionLevel || 'Basic'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleToggleProtection}
              disabled={protectionLoading}
              className={\`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all \${
                protectionStatus?.isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } \${protectionLoading ? 'opacity-50 cursor-not-allowed' : ''}\`}
            >
              {protectionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : protectionStatus?.isActive ? (
                'Stop Protection'
              ) : (
                'Start Protection'
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-900/20 border border-green-800">
              <div className="text-xl font-bold text-green-400">
                {protectionStatus?.transactionsProtected || 0}
              </div>
              <p className="text-xs text-green-300">Transactions Protected</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800">
              <div className="text-xl font-bold text-blue-400">
                \${protectionStatus?.valueProtected?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-blue-300">Value Protected</p>
            </div>
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800">
              <div className="text-xl font-bold text-red-400">
                {protectionStatus?.threatsDetected || 0}
              </div>
              <p className="text-xs text-red-300">Threats Blocked</p>
            </div>
          </div>
        </motion.div>
`;

function integrateApiClient() {
  console.log('📡 Integrating MEV Protection API methods...');
  
  try {
    if (!fs.existsSync(API_CLIENT_PATH)) {
      console.error('❌ API client file not found:', API_CLIENT_PATH);
      return false;
    }

    let content = fs.readFileSync(API_CLIENT_PATH, 'utf8');
    
    // Add MEV protection methods before the closing brace
    const insertPoint = content.lastIndexOf('}');
    if (insertPoint === -1) {
      console.error('❌ Could not find insertion point in API client');
      return false;
    }

    content = content.slice(0, insertPoint) + MEV_PROTECTION_API_METHODS + '\n}';
    
    // Add axios import if not present
    if (!content.includes("import axios")) {
      content = "import axios from 'axios'\n" + content;
    }

    fs.writeFileSync(API_CLIENT_PATH, content);
    console.log('✅ MEV Protection methods added to API client');
    return true;
  } catch (error) {
    console.error('❌ Failed to integrate API client:', error.message);
    return false;
  }
}

function integrateMEVPage() {
  console.log('🛡️ Integrating MEV Protection UI components...');
  
  try {
    if (!fs.existsSync(MEV_PAGE_PATH)) {
      console.error('❌ MEV page file not found:', MEV_PAGE_PATH);
      return false;
    }

    let content = fs.readFileSync(MEV_PAGE_PATH, 'utf8');
    
    // Add imports
    if (!content.includes('Shield')) {
      content = content.replace(
        'import { TrendingUp, DollarSign, Zap, Target, AlertTriangle }',
        'import { TrendingUp, DollarSign, Zap, Target, AlertTriangle, Shield }'
      );
    }

    // Add protection state after existing state
    if (!content.includes('protectionStatus')) {
      const stateInsertPoint = content.indexOf('const [stats, setStats]');
      if (stateInsertPoint !== -1) {
        const insertAfter = content.indexOf('}, [])', stateInsertPoint) + 6;
        content = content.slice(0, insertAfter) + '\n\n' + MEV_PROTECTION_COMPONENT + content.slice(insertAfter);
      }
    }

    // Add protection UI after stats grid
    if (!content.includes('MEV Protection Panel')) {
      const statsGridEnd = content.indexOf('</div>', content.indexOf('Stats Grid'));
      if (statsGridEnd !== -1) {
        const insertAfter = statsGridEnd + 6;
        content = content.slice(0, insertAfter) + '\n\n' + MEV_PROTECTION_UI + content.slice(insertAfter);
      }
    }

    fs.writeFileSync(MEV_PAGE_PATH, content);
    console.log('✅ MEV Protection UI integrated');
    return true;
  } catch (error) {
    console.error('❌ Failed to integrate MEV page:', error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting MEV Protection Integration...');
  console.log('');
  
  const apiSuccess = integrateApiClient();
  const pageSuccess = integrateMEVPage();
  
  console.log('');
  if (apiSuccess && pageSuccess) {
    console.log('🎉 MEV Protection integration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start the MEV Protection Service: http://localhost:8004');
    console.log('2. Start the Mempool Dashboard: npm run dev');
    console.log('3. Navigate to /mev to see the integrated protection features');
    console.log('');
    console.log('🔧 Services needed:');
    console.log('- MEV Protection Service (Port 8004)');
    console.log('- Unified Mempool System (Port 8001)');
    console.log('- Dashboard Frontend (Port 3000)');
  } else {
    console.log('❌ Integration failed. Please check the errors above.');
  }
}

// Run integration if called directly
if (require.main === module) {
  main();
}

module.exports = {
  integrateApiClient,
  integrateMEVPage,
  main
};
