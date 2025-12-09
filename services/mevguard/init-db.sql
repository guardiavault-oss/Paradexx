-- MEV Protection Service Database Initialization
-- This script initializes the database with necessary extensions and permissions

-- Create database if it doesn't exist
CREATE DATABASE mev_protection;

-- Connect to the database
\c mev_protection;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mev_user') THEN
        CREATE ROLE mev_user WITH LOGIN PASSWORD 'mev_password';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE mev_protection TO mev_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO mev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mev_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mev_user;

-- Create indexes for performance
-- These will be created when the tables are created by SQLAlchemy
-- but we can add some additional performance indexes here

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete threats older than 30 days
    DELETE FROM mev_threats WHERE detected_at < NOW() - INTERVAL '30 days';
    
    -- Delete protection results older than 30 days
    DELETE FROM protection_results WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old system metrics (keep only 7 days)
    DELETE FROM system_metrics WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete old network statistics (keep only 90 days)
    DELETE FROM network_statistics WHERE date < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up old data (requires pg_cron extension)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Create views for common queries
CREATE OR REPLACE VIEW recent_threats AS
SELECT 
    threat_id,
    threat_type,
    target_transaction,
    attacker_address,
    profit_potential,
    confidence,
    severity,
    network,
    detected_at,
    protection_applied
FROM mev_threats
WHERE detected_at > NOW() - INTERVAL '24 hours'
ORDER BY detected_at DESC;

CREATE OR REPLACE VIEW protection_statistics AS
SELECT 
    network,
    COUNT(*) as total_threats,
    COUNT(CASE WHEN protection_applied THEN 1 END) as threats_mitigated,
    AVG(profit_potential) as avg_profit_potential,
    AVG(confidence) as avg_confidence,
    MAX(detected_at) as last_threat_detected
FROM mev_threats
WHERE detected_at > NOW() - INTERVAL '24 hours'
GROUP BY network;

CREATE OR REPLACE VIEW daily_protection_summary AS
SELECT 
    DATE(detected_at) as date,
    network,
    COUNT(*) as threats_detected,
    COUNT(CASE WHEN protection_applied THEN 1 END) as threats_mitigated,
    SUM(profit_potential) as total_profit_potential,
    SUM(estimated_loss) as total_estimated_loss,
    AVG(confidence) as avg_confidence
FROM mev_threats
WHERE detected_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(detected_at), network
ORDER BY date DESC, network;

-- Grant permissions on views
GRANT SELECT ON recent_threats TO mev_user;
GRANT SELECT ON protection_statistics TO mev_user;
GRANT SELECT ON daily_protection_summary TO mev_user;

-- Create a function to get threat statistics
CREATE OR REPLACE FUNCTION get_threat_statistics(
    p_network TEXT DEFAULT NULL,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    network TEXT,
    total_threats BIGINT,
    threats_mitigated BIGINT,
    total_profit_potential NUMERIC,
    total_estimated_loss NUMERIC,
    avg_confidence NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.network::TEXT,
        COUNT(*) as total_threats,
        COUNT(CASE WHEN t.protection_applied THEN 1 END) as threats_mitigated,
        SUM(t.profit_potential) as total_profit_potential,
        SUM(t.estimated_loss) as total_estimated_loss,
        AVG(t.confidence) as avg_confidence,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN t.protection_applied THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
            ELSE 0
        END as success_rate
    FROM mev_threats t
    WHERE t.detected_at > NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_network IS NULL OR t.network::TEXT = p_network)
    GROUP BY t.network
    ORDER BY total_threats DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_threat_statistics(TEXT, INTEGER) TO mev_user;

-- Create a function to get network performance metrics
CREATE OR REPLACE FUNCTION get_network_performance(
    p_network TEXT DEFAULT NULL,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    network TEXT,
    avg_detection_time NUMERIC,
    avg_protection_time NUMERIC,
    total_gas_saved BIGINT,
    total_value_protected NUMERIC,
    protection_efficiency NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.network::TEXT,
        AVG(pr.execution_time) as avg_detection_time,
        AVG(pr.execution_time) as avg_protection_time,
        SUM(pr.gas_saved) as total_gas_saved,
        SUM(pr.value_protected) as total_value_protected,
        CASE 
            WHEN COUNT(t.id) > 0 THEN 
                (COUNT(CASE WHEN t.protection_applied THEN 1 END)::NUMERIC / COUNT(t.id)::NUMERIC) * 100
            ELSE 0
        END as protection_efficiency
    FROM mev_threats t
    LEFT JOIN protection_results pr ON t.protection_result_id = pr.id
    WHERE t.detected_at > NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_network IS NULL OR t.network::TEXT = p_network)
    GROUP BY t.network
    ORDER BY protection_efficiency DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_network_performance(TEXT, INTEGER) TO mev_user;

-- Insert some initial configuration data
INSERT INTO network_statistics (
    network, date, hour, threats_detected, threats_mitigated, 
    transactions_protected, value_protected, gas_saved,
    sandwich_attacks, arbitrage_attacks, liquidation_attacks,
    front_running_attacks, flash_loan_attacks,
    avg_detection_time, avg_protection_time, success_rate
) VALUES 
('ethereum', NOW(), EXTRACT(HOUR FROM NOW()), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
('polygon', NOW(), EXTRACT(HOUR FROM NOW()), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
('bsc', NOW(), EXTRACT(HOUR FROM NOW()), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
('arbitrum', NOW(), EXTRACT(HOUR FROM NOW()), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- Create a trigger to automatically update the updated_at column
-- This will be applied to tables that have an updated_at column

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'MEV Protection Service database initialized successfully!';
    RAISE NOTICE 'Database: mev_protection';
    RAISE NOTICE 'User: mev_user';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_stat_statements, pg_trgm';
    RAISE NOTICE 'Views created: recent_threats, protection_statistics, daily_protection_summary';
    RAISE NOTICE 'Functions created: get_threat_statistics, get_network_performance, cleanup_old_data';
END
$$;