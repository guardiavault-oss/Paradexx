-- Unified Mempool Monitoring System Database Schema
-- ================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS unified_mempool;

-- Use the database
\c unified_mempool;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hash VARCHAR(66) UNIQUE NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value NUMERIC(78, 0) NOT NULL,
    gas_price NUMERIC(78, 0) NOT NULL,
    gas_limit NUMERIC(78, 0) NOT NULL,
    data TEXT,
    nonce INTEGER NOT NULL,
    network VARCHAR(20) NOT NULL,
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_suspicious BOOLEAN DEFAULT FALSE,
    mev_type VARCHAR(20),
    profit_estimate NUMERIC(78, 18),
    risk_score DECIMAL(3, 2) DEFAULT 0.0,
    threat_level VARCHAR(10) DEFAULT 'low',
    confidence DECIMAL(3, 2) DEFAULT 0.0,
    analysis_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MEV opportunities table
CREATE TABLE IF NOT EXISTS mev_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_type VARCHAR(20) NOT NULL,
    involved_addresses TEXT[] NOT NULL,
    profit_potential NUMERIC(78, 18) NOT NULL,
    gas_required NUMERIC(78, 0) NOT NULL,
    network VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    quantum_score DECIMAL(3, 2) DEFAULT 0.0,
    was_exploited BOOLEAN DEFAULT FALSE,
    protection_applied BOOLEAN DEFAULT FALSE,
    analysis_depth INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat intelligence table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_id VARCHAR(100) UNIQUE NOT NULL,
    threat_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    source VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    affected_networks TEXT[] NOT NULL,
    indicators JSONB NOT NULL,
    mitigation_strategies TEXT[] NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User behavior profiles table
CREATE TABLE IF NOT EXISTS user_behavior_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) UNIQUE NOT NULL,
    transaction_patterns JSONB NOT NULL,
    risk_factors TEXT[] NOT NULL,
    anomaly_score DECIMAL(3, 2) DEFAULT 0.0,
    behavioral_signature TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 6) NOT NULL,
    metric_unit VARCHAR(20),
    network VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpu_usage DECIMAL(5, 2) NOT NULL,
    memory_usage DECIMAL(5, 2) NOT NULL,
    network_latency JSONB NOT NULL,
    processing_speed DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_is_suspicious ON transactions(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_transactions_mev_type ON transactions(mev_type);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_score ON transactions(risk_score);
CREATE INDEX IF NOT EXISTS idx_transactions_threat_level ON transactions(threat_level);

CREATE INDEX IF NOT EXISTS idx_mev_opportunities_type ON mev_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_mev_opportunities_network ON mev_opportunities(network);
CREATE INDEX IF NOT EXISTS idx_mev_opportunities_timestamp ON mev_opportunities(timestamp);
CREATE INDEX IF NOT EXISTS idx_mev_opportunities_confidence ON mev_opportunities(confidence);

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_threat_id ON threat_intelligence(threat_id);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_severity ON threat_intelligence(severity);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_timestamp ON threat_intelligence(timestamp);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_confidence ON threat_intelligence(confidence);

CREATE INDEX IF NOT EXISTS idx_user_profiles_address ON user_behavior_profiles(address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_anomaly_score ON user_behavior_profiles(anomaly_score);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_updated ON user_behavior_profiles(last_updated);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_network ON system_metrics(network);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW recent_suspicious_transactions AS
SELECT 
    hash,
    from_address,
    to_address,
    value,
    gas_price,
    network,
    timestamp,
    mev_type,
    risk_score,
    threat_level
FROM transactions 
WHERE is_suspicious = TRUE 
    AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

CREATE OR REPLACE VIEW high_risk_transactions AS
SELECT 
    hash,
    from_address,
    to_address,
    value,
    gas_price,
    network,
    timestamp,
    mev_type,
    risk_score,
    threat_level
FROM transactions 
WHERE risk_score > 0.7 
    AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY risk_score DESC, timestamp DESC;

CREATE OR REPLACE VIEW mev_opportunities_summary AS
SELECT 
    opportunity_type,
    network,
    COUNT(*) as total_opportunities,
    AVG(profit_potential) as avg_profit,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN was_exploited THEN 1 END) as exploited_count,
    COUNT(CASE WHEN protection_applied THEN 1 END) as protected_count
FROM mev_opportunities 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY opportunity_type, network
ORDER BY total_opportunities DESC;

CREATE OR REPLACE VIEW threat_intelligence_summary AS
SELECT 
    threat_type,
    severity,
    COUNT(*) as threat_count,
    AVG(confidence) as avg_confidence,
    MAX(timestamp) as latest_threat
FROM threat_intelligence 
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY threat_type, severity
ORDER BY threat_count DESC;

-- Create functions for data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete transactions older than 7 days
    DELETE FROM transactions WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete MEV opportunities older than 3 days
    DELETE FROM mev_opportunities WHERE timestamp < NOW() - INTERVAL '3 days';
    
    -- Delete threat intelligence older than 30 days
    DELETE FROM threat_intelligence WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete system metrics older than 7 days
    DELETE FROM system_metrics WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete performance metrics older than 7 days
    DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Create function for getting system statistics
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_transactions BIGINT,
    suspicious_transactions BIGINT,
    mev_attacks BIGINT,
    protected_transactions BIGINT,
    active_threats BIGINT,
    avg_risk_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM transactions WHERE timestamp > NOW() - INTERVAL '24 hours') as total_transactions,
        (SELECT COUNT(*) FROM transactions WHERE is_suspicious = TRUE AND timestamp > NOW() - INTERVAL '24 hours') as suspicious_transactions,
        (SELECT COUNT(*) FROM transactions WHERE mev_type IS NOT NULL AND timestamp > NOW() - INTERVAL '24 hours') as mev_attacks,
        (SELECT COUNT(*) FROM mev_opportunities WHERE protection_applied = TRUE AND timestamp > NOW() - INTERVAL '24 hours') as protected_transactions,
        (SELECT COUNT(*) FROM threat_intelligence WHERE timestamp > NOW() - INTERVAL '1 hour') as active_threats,
        (SELECT AVG(risk_score) FROM transactions WHERE timestamp > NOW() - INTERVAL '24 hours') as avg_risk_score;
END;
$$ LANGUAGE plpgsql;

-- Insert initial configuration data
INSERT INTO system_metrics (metric_name, metric_value, metric_unit, timestamp) VALUES
('system_startup', 1, 'count', NOW()),
('database_initialized', 1, 'count', NOW())
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE unified_mempool TO mempool_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mempool_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mempool_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mempool_user;

-- Create a scheduled job for data cleanup (requires pg_cron extension)
-- This would be set up separately in production
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

COMMENT ON DATABASE unified_mempool IS 'Unified Mempool Monitoring System Database';
COMMENT ON TABLE transactions IS 'Stores all mempool transactions with analysis results';
COMMENT ON TABLE mev_opportunities IS 'Stores detected MEV opportunities';
COMMENT ON TABLE threat_intelligence IS 'Stores threat intelligence data';
COMMENT ON TABLE user_behavior_profiles IS 'Stores user behavior analytics profiles';
COMMENT ON TABLE system_metrics IS 'Stores system performance metrics';
COMMENT ON TABLE performance_metrics IS 'Stores detailed performance metrics';