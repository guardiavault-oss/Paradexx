-- Ultimate Scanner Database Schema
-- Enterprise vulnerability scanning with quantum threat detection

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE scan_type AS ENUM ('quantum', 'slither', 'mythril', 'manticore', 'unified');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE vulnerability_type AS ENUM ('reentrancy', 'integer_overflow', 'access_control', 'quantum_threat', 'external_call', 'tx_origin', 'timestamp_dependency', 'unchecked_return', 'denial_of_service', 'front_running');

-- ============================================================================
-- CORE SCANNING TABLES
-- ============================================================================

-- Scan Jobs Table
CREATE TABLE scan_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(255) NOT NULL,
    scan_type scan_type NOT NULL,
    contract_address VARCHAR(42),
    contract_source_code TEXT,
    contract_bytecode TEXT,
    scanner_config JSONB DEFAULT '{}',
    status scan_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(255),
    orchestrator_id VARCHAR(255)
);

-- Scan Results Table
CREATE TABLE scan_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_job_id UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
    scanner_type scan_type NOT NULL,
    vulnerabilities_found INTEGER DEFAULT 0,
    total_checks_performed INTEGER DEFAULT 0,
    scan_duration_seconds INTEGER,
    confidence_score DECIMAL(5,4),
    risk_score DECIMAL(5,2),
    raw_output TEXT,
    structured_results JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerability Reports Table
CREATE TABLE vulnerability_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_result_id UUID NOT NULL REFERENCES scan_results(id) ON DELETE CASCADE,
    vulnerability_type vulnerability_type NOT NULL,
    severity severity_level NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    line_number INTEGER,
    function_name VARCHAR(255),
    confidence DECIMAL(5,4),
    impact_description TEXT,
    remediation_advice TEXT,
    references TEXT[],
    cwe_id VARCHAR(20),
    swc_id VARCHAR(20),
    owasp_category VARCHAR(100),
    detected_by scan_type NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUANTUM-SPECIFIC TABLES
-- ============================================================================

-- Quantum Threat Detections
CREATE TABLE quantum_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_result_id UUID REFERENCES scan_results(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    mempool_timestamp TIMESTAMP WITH TIME ZONE,
    threat_type VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    threat_indicators JSONB DEFAULT '{}',
    temporal_clustering_score DECIMAL(5,4),
    fee_uniformity_score DECIMAL(5,4),
    entropy_score DECIMAL(5,4),
    geometric_pattern_score DECIMAL(5,4),
    statistical_anomaly_score DECIMAL(5,4),
    affected_addresses TEXT[],
    estimated_time_to_compromise VARCHAR(50),
    recommended_actions TEXT[],
    emergency_response_triggered BOOLEAN DEFAULT FALSE,
    incident_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quantum Threat Signatures
CREATE TABLE quantum_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signature_name VARCHAR(255) NOT NULL UNIQUE,
    signature_description TEXT,
    detection_algorithm VARCHAR(100) NOT NULL,
    threshold_config JSONB DEFAULT '{}',
    pattern_definition JSONB DEFAULT '{}',
    accuracy_rate DECIMAL(5,4),
    false_positive_rate DECIMAL(5,4),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE AND AUDIT TABLES
-- ============================================================================

-- Compliance Audits
CREATE TABLE compliance_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_job_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE,
    framework VARCHAR(50) NOT NULL, -- SOX, GDPR, PCI_DSS, NIST, ISO_27001
    compliance_score DECIMAL(5,2),
    requirements_checked INTEGER,
    requirements_passed INTEGER,
    requirements_failed INTEGER,
    audit_details JSONB DEFAULT '{}',
    recommendations TEXT[],
    auditor_id VARCHAR(255),
    audit_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_audit_due TIMESTAMP WITH TIME ZONE,
    immutable_hash VARCHAR(64) -- For blockchain audit trail
);

-- Security Events Log
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    severity severity_level NOT NULL,
    event_description TEXT NOT NULL,
    source_service VARCHAR(100),
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    correlation_id UUID,
    incident_id UUID,
    immutable_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM AND PERFORMANCE TABLES
-- ============================================================================

-- Scanner Performance Metrics
CREATE TABLE scanner_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scanner_type scan_type NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6),
    metric_unit VARCHAR(20),
    metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_data JSONB DEFAULT '{}'
);

-- System Health Monitoring
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    health_status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    response_time_ms INTEGER,
    uptime_seconds BIGINT,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    health_details JSONB DEFAULT '{}',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key VARCHAR(255),
    ip_address INET,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION AND ALERT TABLES
-- ============================================================================

-- Alert Configurations
CREATE TABLE alert_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_name VARCHAR(255) NOT NULL UNIQUE,
    alert_description TEXT,
    trigger_conditions JSONB NOT NULL,
    notification_channels TEXT[] DEFAULT '{}',
    severity_threshold severity_level DEFAULT 'medium',
    cooldown_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert History
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_config_id UUID REFERENCES alert_configs(id) ON DELETE CASCADE,
    scan_result_id UUID REFERENCES scan_results(id) ON DELETE CASCADE,
    trigger_data JSONB DEFAULT '{}',
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels_used TEXT[],
    notification_status JSONB DEFAULT '{}',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Scan Jobs Indexes
CREATE INDEX idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX idx_scan_jobs_type ON scan_jobs(scan_type);
CREATE INDEX idx_scan_jobs_created_at ON scan_jobs(created_at);
CREATE INDEX idx_scan_jobs_priority ON scan_jobs(priority DESC);
CREATE INDEX idx_scan_jobs_contract_address ON scan_jobs(contract_address);

-- Scan Results Indexes
CREATE INDEX idx_scan_results_job_id ON scan_results(scan_job_id);
CREATE INDEX idx_scan_results_scanner_type ON scan_results(scanner_type);
CREATE INDEX idx_scan_results_confidence ON scan_results(confidence_score);
CREATE INDEX idx_scan_results_risk_score ON scan_results(risk_score);

-- Vulnerability Reports Indexes
CREATE INDEX idx_vulnerability_reports_scan_result_id ON vulnerability_reports(scan_result_id);
CREATE INDEX idx_vulnerability_reports_severity ON vulnerability_reports(severity);
CREATE INDEX idx_vulnerability_reports_type ON vulnerability_reports(vulnerability_type);
CREATE INDEX idx_vulnerability_reports_confidence ON vulnerability_reports(confidence);

-- Quantum Detections Indexes
CREATE INDEX idx_quantum_detections_scan_result_id ON quantum_detections(scan_result_id);
CREATE INDEX idx_quantum_detections_confidence ON quantum_detections(confidence_score);
CREATE INDEX idx_quantum_detections_threat_type ON quantum_detections(threat_type);
CREATE INDEX idx_quantum_detections_timestamp ON quantum_detections(created_at);
CREATE INDEX idx_quantum_detections_block_number ON quantum_detections(block_number);

-- Security Events Indexes
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_timestamp ON security_events(created_at);
CREATE INDEX idx_security_events_correlation_id ON security_events(correlation_id);

-- Composite Indexes
CREATE INDEX idx_scan_jobs_status_priority ON scan_jobs(status, priority DESC);
CREATE INDEX idx_vulnerability_reports_severity_confidence ON vulnerability_reports(severity, confidence);
CREATE INDEX idx_quantum_detections_confidence_timestamp ON quantum_detections(confidence_score, created_at);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Scanner Performance Summary View
CREATE VIEW scanner_performance_summary AS
SELECT 
    scanner_type,
    COUNT(*) as total_scans,
    AVG(scan_duration_seconds) as avg_duration,
    AVG(confidence_score) as avg_confidence,
    AVG(vulnerabilities_found) as avg_vulnerabilities,
    MAX(created_at) as last_scan
FROM scan_results 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY scanner_type;

-- Critical Vulnerabilities View
CREATE VIEW critical_vulnerabilities AS
SELECT 
    vr.id,
    vr.title,
    vr.vulnerability_type,
    vr.severity,
    vr.confidence,
    sj.contract_address,
    sj.created_at as scan_date,
    vr.detected_by
FROM vulnerability_reports vr
JOIN scan_results sr ON vr.scan_result_id = sr.id
JOIN scan_jobs sj ON sr.scan_job_id = sj.id
WHERE vr.severity IN ('high', 'critical')
AND vr.confidence >= 0.7
ORDER BY vr.confidence DESC, vr.created_at DESC;

-- Quantum Threat Summary View
CREATE VIEW quantum_threat_summary AS
SELECT 
    threat_type,
    COUNT(*) as detection_count,
    AVG(confidence_score) as avg_confidence,
    MAX(confidence_score) as max_confidence,
    COUNT(CASE WHEN emergency_response_triggered THEN 1 END) as emergency_responses,
    DATE_TRUNC('hour', created_at) as detection_hour
FROM quantum_detections 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY threat_type, DATE_TRUNC('hour', created_at)
ORDER BY detection_hour DESC;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update scan job status
CREATE OR REPLACE FUNCTION update_scan_job_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'running' AND OLD.status = 'pending' THEN
        NEW.started_at = NOW();
    ELSIF NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status = 'running' THEN
        NEW.completed_at = NOW();
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scan job status updates
CREATE TRIGGER trigger_update_scan_job_status
    BEFORE UPDATE ON scan_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_scan_job_status();

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(vulnerability_count INTEGER, severity_weights JSONB)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    risk_score DECIMAL(5,2) := 0;
BEGIN
    -- Simplified risk calculation - can be enhanced
    risk_score := LEAST(vulnerability_count * 10.0, 100.0);
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function to generate immutable hash for audit trail
CREATE OR REPLACE FUNCTION generate_audit_hash(data_json JSONB)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(data_json::text || NOW()::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert default quantum signatures
INSERT INTO quantum_signatures (signature_name, signature_description, detection_algorithm, threshold_config, pattern_definition) VALUES
('temporal_clustering', 'Detects coordinated transaction timing patterns', 'temporal_analysis', '{"threshold": 0.7, "window_seconds": 600}', '{"min_transactions": 5, "max_time_variance": 30}'),
('fee_uniformity', 'Identifies automated transaction generation patterns', 'statistical_analysis', '{"threshold": 0.8, "variance_limit": 0.1}', '{"fee_precision": 6, "pattern_length": 10}'),
('entropy_anomaly', 'Detects algorithmic vs human behavior patterns', 'entropy_analysis', '{"threshold": 0.75, "window_size": 100}', '{"entropy_bins": 256, "smoothing_factor": 0.1}'),
('geometric_pattern', 'Mathematical pattern recognition in transaction data', 'pattern_matching', '{"threshold": 0.85, "pattern_complexity": 3}', '{"geometric_types": ["linear", "exponential", "fibonacci"]}'
);

-- Insert default alert configurations
INSERT INTO alert_configs (alert_name, alert_description, trigger_conditions, notification_channels, severity_threshold) VALUES
('critical_vulnerability_detected', 'Alert for critical vulnerabilities found', '{"severity": "critical", "confidence": 0.8}', ARRAY['email', 'slack', 'webhook'], 'critical'),
('quantum_threat_detected', 'Alert for quantum threats detected', '{"threat_type": "quantum", "confidence": 0.7}', ARRAY['email', 'slack', 'webhook'], 'high'),
('scan_failure', 'Alert for failed scan jobs', '{"status": "failed"}', ARRAY['email'], 'medium'),
('high_risk_contract', 'Alert for contracts with high risk scores', '{"risk_score": 80}', ARRAY['email', 'slack'], 'high');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scanner_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scanner_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO scanner_user;
