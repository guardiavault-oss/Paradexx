-- Migration: Production Features
-- Referrals, Analytics, Achievements, Protocol Health, DCA, Education CMS
-- Generated: 2025-01-05

BEGIN;

-- ============ YIELD VAULTS TABLE ============
-- Create yield_vaults table if it doesn't exist (required for yield_analytics FK)
CREATE TABLE IF NOT EXISTS yield_vaults (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  principal VARCHAR(50) NOT NULL,
  yield_accumulated VARCHAR(50) NOT NULL DEFAULT '0',
  total_value VARCHAR(50) NOT NULL,
  protocol VARCHAR(20) NOT NULL,
  category VARCHAR(20) NOT NULL,
  apy VARCHAR(10) NOT NULL,
  last_yield_update TIMESTAMP NOT NULL DEFAULT NOW(),
  contract_address TEXT,
  tx_hash TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yield_vaults_user_id ON yield_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_yield_vaults_vault_id ON yield_vaults(vault_id);
CREATE INDEX IF NOT EXISTS idx_yield_vaults_status ON yield_vaults(status);

-- ============ REFERRAL PROGRAM ============
CREATE TABLE IF NOT EXISTS referral_codes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  stripe_coupon_id VARCHAR,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(20, 8) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code_id VARCHAR NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  signup_at TIMESTAMP NOT NULL DEFAULT NOW(),
  first_deposit_at TIMESTAMP,
  reward_amount NUMERIC(20, 8),
  stripe_payout_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============ YIELD ANALYTICS ============
CREATE TABLE IF NOT EXISTS yield_analytics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  yield_vault_id VARCHAR REFERENCES yield_vaults(id) ON DELETE CASCADE,
  protocol VARCHAR(20) NOT NULL,
  asset VARCHAR(10) NOT NULL,
  principal NUMERIC(20, 8) NOT NULL,
  current_value NUMERIC(20, 8) NOT NULL,
  yield_earned NUMERIC(20, 8) NOT NULL,
  apy NUMERIC(10, 4) NOT NULL,
  apy_source VARCHAR(20) DEFAULT 'api',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_yield_analytics_user_id ON yield_analytics(user_id);
CREATE INDEX idx_yield_analytics_timestamp ON yield_analytics(timestamp);
CREATE INDEX idx_yield_analytics_protocol ON yield_analytics(protocol);

-- ============ PROTOCOL HEALTH ============
CREATE TABLE IF NOT EXISTS protocol_health (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'healthy',
  apy NUMERIC(10, 4),
  tvl NUMERIC(30, 2),
  last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
  health_data JSONB,
  alerts JSONB
);

CREATE INDEX idx_protocol_health_protocol ON protocol_health(protocol);
CREATE INDEX idx_protocol_health_status ON protocol_health(status);
CREATE INDEX idx_protocol_health_last_checked ON protocol_health(last_checked);

-- ============ ACHIEVEMENTS ============
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_data JSONB,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reward_amount NUMERIC(20, 8)
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- ============ YIELD CHALLENGES ============
CREATE TABLE IF NOT EXISTS yield_challenges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  apy_bonus NUMERIC(10, 4),
  reward_pool NUMERIC(20, 8),
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_challenge_participation (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id VARCHAR NOT NULL REFERENCES yield_challenges(id) ON DELETE CASCADE,
  current_earnings NUMERIC(20, 8) DEFAULT 0,
  rank INTEGER,
  reward_earned NUMERIC(20, 8),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_challenge_participation_user_id ON user_challenge_participation(user_id);
CREATE INDEX idx_challenge_participation_challenge_id ON user_challenge_participation(challenge_id);
CREATE INDEX idx_challenge_participation_rank ON user_challenge_participation(challenge_id, rank);

-- ============ DCA SCHEDULES ============
CREATE TABLE IF NOT EXISTS dca_schedules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR,
  amount NUMERIC(20, 8) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  asset VARCHAR(10) NOT NULL,
  protocol VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  next_execution_at TIMESTAMP,
  total_executions INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dca_schedules_user_id ON dca_schedules(user_id);
CREATE INDEX idx_dca_schedules_next_execution ON dca_schedules(next_execution_at) WHERE status = 'active';

-- ============ EDUCATION CMS ============
CREATE TABLE IF NOT EXISTS education_articles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  emoji VARCHAR(10),
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(50),
  read_time INTEGER,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  author_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_education_articles_slug ON education_articles(slug);
CREATE INDEX idx_education_articles_published ON education_articles(published, published_at);
CREATE INDEX idx_education_articles_category ON education_articles(category);

CREATE TABLE IF NOT EXISTS user_article_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id VARCHAR NOT NULL REFERENCES education_articles(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  read_progress INTEGER DEFAULT 0,
  last_read_at TIMESTAMP,
  UNIQUE(user_id, article_id)
);

CREATE INDEX idx_article_progress_user_id ON user_article_progress(user_id);
CREATE INDEX idx_article_progress_article_id ON user_article_progress(article_id);

COMMIT;

