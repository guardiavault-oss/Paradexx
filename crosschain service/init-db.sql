-- Cross-Chain Bridge Service Database Schema
-- PostgreSQL initialization script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS bridge_service;

-- Use the database
\c bridge_service;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS bridge;
CREATE SCHEMA IF NOT EXISTS network;
CREATE SCHEMA IF NOT EXISTS transaction;
CREATE SCHEMA IF NOT EXISTS vulnerability;

-- Bridge-related tables
CREATE TABLE IF NOT EXISTS bridge.bridges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    source_network VARCHAR(50) NOT NULL,
    target_network VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    total_value_locked DECIMAL(20, 8),
    daily_volume DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address, source_network)
);

CREATE TABLE IF NOT EXISTS bridge.analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_address VARCHAR(42) NOT NULL,
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    security_score DECIMAL(3, 1) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    code_quality_score DECIMAL(3, 1) NOT NULL,
    audit_status TEXT,
    governance_analysis JSONB,
    validator_set_analysis JSONB,
    economic_security_analysis JSONB,
    operational_security_analysis JSONB,
    vulnerabilities JSONB DEFAULT '[]',
    recommendations TEXT[],
    liquidity_analysis JSONB,
    token_flow_analysis JSONB,
    source_network_analysis JSONB,
    target_network_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network-related tables
CREATE TABLE IF NOT EXISTS network.networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    rpc_url TEXT NOT NULL,
    explorer_url TEXT,
    native_token VARCHAR(10) NOT NULL,
    block_time DECIMAL(8, 2),
    gas_limit BIGINT,
    is_testnet BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network.status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network VARCHAR(100) NOT NULL,
    chain_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_block BIGINT,
    block_time DECIMAL(8, 2),
    gas_price DECIMAL(10, 2),
    pending_transactions INTEGER,
    network_hashrate DECIMAL(15, 2),
    difficulty DECIMAL(20, 2),
    total_supply DECIMAL(20, 8),
    market_cap DECIMAL(20, 2),
    response_time DECIMAL(8, 2),
    uptime_percentage DECIMAL(5, 2),
    error_rate DECIMAL(5, 2),
    bridge_connections TEXT[],
    cross_chain_volume_24h DECIMAL(20, 2),
    active_bridges INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction-related tables
CREATE TABLE IF NOT EXISTS transaction.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    source_network VARCHAR(50) NOT NULL,
    target_network VARCHAR(50) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    token_address VARCHAR(42),
    token_symbol VARCHAR(20),
    transaction_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    gas_used INTEGER,
    gas_price DECIMAL(10, 2),
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    bridge_address VARCHAR(42),
    cross_chain_tx_hash VARCHAR(66),
    confirmation_blocks INTEGER,
    finality_time TIMESTAMP WITH TIME ZONE,
    is_validated BOOLEAN DEFAULT FALSE,
    validation_timestamp TIMESTAMP WITH TIME ZONE,
    validation_errors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction.validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) NOT NULL,
    source_network VARCHAR(50) NOT NULL,
    target_network VARCHAR(50) NOT NULL,
    is_valid BOOLEAN NOT NULL,
    validation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount_matches BOOLEAN,
    recipient_matches BOOLEAN,
    finality_confirmed BOOLEAN,
    slippage_within_limits BOOLEAN,
    expected_amount DECIMAL(20, 8),
    actual_amount DECIMAL(20, 8),
    expected_recipient VARCHAR(42),
    actual_recipient VARCHAR(42),
    slippage_percentage DECIMAL(5, 2),
    validation_errors TEXT[],
    warnings TEXT[],
    validation_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerability-related tables
CREATE TABLE IF NOT EXISTS vulnerability.vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_contracts TEXT[] NOT NULL,
    affected_networks TEXT[] NOT NULL,
    cwe_id VARCHAR(20),
    cvss_score DECIMAL(3, 1),
    exploitability VARCHAR(20),
    impact VARCHAR(20),
    file_path TEXT,
    line_number INTEGER,
    function_name VARCHAR(100),
    detection_method VARCHAR(50) NOT NULL,
    remediation TEXT NOT NULL,
    references TEXT[],
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_fixed BOOLEAN DEFAULT FALSE,
    fixed_at TIMESTAMP WITH TIME ZONE,
    cross_chain_impact TEXT,
    bridge_affected BOOLEAN,
    propagation_risk VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS vulnerability.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(50) NOT NULL UNIQUE,
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scan_type VARCHAR(30) NOT NULL,
    target_contracts TEXT[] NOT NULL,
    target_networks TEXT[] NOT NULL,
    total_vulnerabilities INTEGER NOT NULL,
    critical_count INTEGER NOT NULL,
    high_count INTEGER NOT NULL,
    medium_count INTEGER NOT NULL,
    low_count INTEGER NOT NULL,
    info_count INTEGER NOT NULL,
    overall_risk_score DECIMAL(3, 1) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    security_recommendation TEXT NOT NULL,
    vulnerabilities JSONB NOT NULL,
    cross_chain_risks JSONB DEFAULT '[]',
    shared_vulnerabilities JSONB DEFAULT '[]',
    bridge_vulnerabilities JSONB DEFAULT '[]',
    immediate_actions TEXT[],
    short_term_recommendations TEXT[],
    long_term_recommendations TEXT[],
    scanner_version VARCHAR(20) NOT NULL,
    scan_duration DECIMAL(8, 2),
    scan_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bridges_address ON bridge.bridges(address);
CREATE INDEX IF NOT EXISTS idx_bridges_networks ON bridge.bridges(source_network, target_network);
CREATE INDEX IF NOT EXISTS idx_analyses_bridge ON bridge.analyses(bridge_address);
CREATE INDEX IF NOT EXISTS idx_analyses_timestamp ON bridge.analyses(analysis_timestamp);

CREATE INDEX IF NOT EXISTS idx_networks_name ON network.networks(name);
CREATE INDEX IF NOT EXISTS idx_networks_chain_id ON network.networks(chain_id);
CREATE INDEX IF NOT EXISTS idx_status_history_network ON network.status_history(network);
CREATE INDEX IF NOT EXISTS idx_status_history_timestamp ON network.status_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transaction.transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_networks ON transaction.transactions(source_network, target_network);
CREATE INDEX IF NOT EXISTS idx_transactions_addresses ON transaction.transactions(from_address, to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transaction.transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_validations_tx_hash ON transaction.validations(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_validations_timestamp ON transaction.validations(validation_timestamp);

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_id ON vulnerability.vulnerabilities(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_type ON vulnerability.vulnerabilities(type);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerability.vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_contracts ON vulnerability.vulnerabilities USING GIN(affected_contracts);
CREATE INDEX IF NOT EXISTS idx_reports_id ON vulnerability.reports(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON vulnerability.reports(scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_reports_contracts ON vulnerability.reports USING GIN(target_contracts);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bridges_updated_at BEFORE UPDATE ON bridge.bridges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON network.networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial network data
INSERT INTO network.networks (name, chain_id, type, rpc_url, explorer_url, native_token, block_time, gas_limit, is_testnet) VALUES
('ethereum', 1, 'mainnet', 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID', 'https://etherscan.io', 'ETH', 12.0, 30000000, false),
('polygon', 137, 'mainnet', 'https://polygon-rpc.com', 'https://polygonscan.com', 'MATIC', 2.0, 30000000, false),
('bsc', 56, 'mainnet', 'https://bsc-dataseed.binance.org', 'https://bscscan.com', 'BNB', 3.0, 30000000, false),
('avalanche', 43114, 'mainnet', 'https://api.avax.network/ext/bc/C/rpc', 'https://snowtrace.io', 'AVAX', 2.0, 8000000, false),
('arbitrum', 42161, 'mainnet', 'https://arb1.arbitrum.io/rpc', 'https://arbiscan.io', 'ETH', 0.25, 100000000, false),
('optimism', 10, 'mainnet', 'https://mainnet.optimism.io', 'https://optimistic.etherscan.io', 'ETH', 2.0, 30000000, false),
('goerli', 5, 'testnet', 'https://goerli.infura.io/v3/YOUR_PROJECT_ID', 'https://goerli.etherscan.io', 'ETH', 12.0, 30000000, true),
('mumbai', 80001, 'testnet', 'https://rpc-mumbai.maticvigil.com', 'https://mumbai.polygonscan.com', 'MATIC', 2.0, 30000000, true)
ON CONFLICT (name) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW bridge.bridge_summary AS
SELECT 
    b.address,
    b.name,
    b.type,
    b.source_network,
    b.target_network,
    b.is_verified,
    b.total_value_locked,
    b.daily_volume,
    a.security_score,
    a.risk_level,
    a.analysis_timestamp
FROM bridge.bridges b
LEFT JOIN LATERAL (
    SELECT security_score, risk_level, analysis_timestamp
    FROM bridge.analyses
    WHERE bridge_address = b.address
    ORDER BY analysis_timestamp DESC
    LIMIT 1
) a ON true;

CREATE OR REPLACE VIEW network.network_health AS
SELECT 
    n.name,
    n.chain_id,
    n.type,
    n.is_testnet,
    s.status,
    s.last_block,
    s.gas_price,
    s.pending_transactions,
    s.uptime_percentage,
    s.error_rate,
    s.timestamp as last_updated
FROM network.networks n
LEFT JOIN LATERAL (
    SELECT status, last_block, gas_price, pending_transactions, uptime_percentage, error_rate, timestamp
    FROM network.status_history
    WHERE network = n.name
    ORDER BY timestamp DESC
    LIMIT 1
) s ON true;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bridge TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA network TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA transaction TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA vulnerability TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bridge TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA network TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA transaction TO bridge_service_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA vulnerability TO bridge_service_user;