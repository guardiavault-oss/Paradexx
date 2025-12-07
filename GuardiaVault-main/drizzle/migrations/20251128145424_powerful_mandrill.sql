CREATE TYPE "public"."attestation_decision" AS ENUM('pending', 'approve', 'reject');--> statement-breakpoint
CREATE TYPE "public"."biometric_data_type" AS ENUM('typing_pattern', 'mouse_movement', 'interaction_signature', 'device_fingerprint');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."contract_deployment_status" AS ENUM('pending', 'deployed', 'failed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."hardware_device_status" AS ENUM('active', 'offline', 'suspended', 'lost');--> statement-breakpoint
CREATE TYPE "public"."legacy_message_status" AS ENUM('draft', 'ready', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."legacy_message_type" AS ENUM('video', 'letter');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('check_in_reminder', 'check_in_warning', 'check_in_critical', 'guardian_invitation', 'beneficiary_notification', 'attestor_request');--> statement-breakpoint
CREATE TYPE "public"."party_role" AS ENUM('guardian', 'beneficiary', 'attestor');--> statement-breakpoint
CREATE TYPE "public"."party_status" AS ENUM('pending', 'active', 'declined', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."recovery_status" AS ENUM('active', 'triggered', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."security_event_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."security_event_type" AS ENUM('suspicious_login', 'unusual_activity', 'failed_authentication', 'biometric_mismatch', 'ip_address_change', 'device_change', 'location_change');--> statement-breakpoint
CREATE TYPE "public"."vault_status" AS ENUM('active', 'warning', 'critical', 'triggered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."will_guardian_type" AS ENUM('email', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."will_status" AS ENUM('draft', 'active', 'triggered', 'executed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."will_trigger_type" AS ENUM('time_lock', 'death_oracle', 'multisig_recovery', 'manual');--> statement-breakpoint
CREATE TYPE "public"."yield_category" AS ENUM('lending', 'dex_yield', 'staking');--> statement-breakpoint
CREATE TYPE "public"."yield_protocol" AS ENUM('aave', 'compound', 'uniswap', 'curve', 'balancer', 'rocketpool', 'lido', 'frax');--> statement-breakpoint
CREATE TYPE "public"."death_verification_source" AS ENUM('ssdi', 'obituary', 'death_certificate', 'death_certificate_official', 'insurance_claim', 'hospital_ehr', 'funeral_home');--> statement-breakpoint
CREATE TYPE "public"."death_verification_status" AS ENUM('pending', 'confirmed', 'rejected', 'disputed', 'needs_confirmation');--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"action" varchar(100) NOT NULL,
	"resource" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_data" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_risk_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"vault_id" varchar,
	"event_type" "security_event_type" NOT NULL,
	"severity" "security_event_severity" NOT NULL,
	"description" text NOT NULL,
	"metadata" text,
	"ip_address" text,
	"user_agent" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavioral_biometrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"data_type" "biometric_data_type" NOT NULL,
	"signature" text NOT NULL,
	"confidence" varchar(5),
	"metadata" text,
	"device_id" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"signature" text NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "claim_attestations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"party_id" varchar NOT NULL,
	"role" "party_role" NOT NULL,
	"decision" "attestation_decision" DEFAULT 'pending' NOT NULL,
	"signature" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dao_verifiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"verifier_address" text NOT NULL,
	"stake_amount" text NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"deregistered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dao_verifiers_verifier_address_unique" UNIQUE("verifier_address")
);
--> statement-breakpoint
CREATE TABLE "death_certificates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ipfs_hash" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"verification_status" varchar(20) DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "fragments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"guardian_id" varchar NOT NULL,
	"fragment_index" integer NOT NULL,
	"encrypted_data" text NOT NULL,
	"derivation_salt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_referral_discounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" varchar NOT NULL,
	"vault_id" varchar NOT NULL,
	"guardian_email" text NOT NULL,
	"discount_code" varchar(50) NOT NULL,
	"discount_percentage" integer DEFAULT 50 NOT NULL,
	"used" boolean DEFAULT false,
	"used_by_user_id" varchar,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_referral_discounts_discount_code_unique" UNIQUE("discount_code")
);
--> statement-breakpoint
CREATE TABLE "hardware_devices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"device_name" text,
	"public_key" text NOT NULL,
	"last_ping" timestamp,
	"status" "hardware_device_status" DEFAULT 'active' NOT NULL,
	"alert_threshold_minutes" integer DEFAULT 1440,
	"last_alert_sent" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hardware_devices_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "hardware_ping_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"user_id" varchar NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"signature_valid" boolean NOT NULL,
	"response_time_ms" integer,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "legacy_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"beneficiary_id" varchar,
	"type" "legacy_message_type" NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"file_url" text,
	"file_hash" text,
	"encrypted" boolean DEFAULT true NOT NULL,
	"status" "legacy_message_status" DEFAULT 'draft' NOT NULL,
	"scheduled_delivery_date" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"recipient" text NOT NULL,
	"channel" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimization_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"vault_id" varchar,
	"old_allocation" text NOT NULL,
	"new_allocation" text NOT NULL,
	"reason" text,
	"estimated_apy_gain" varchar(10),
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"applied_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"role" "party_role" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"invite_token" text,
	"invite_expires_at" timestamp,
	"status" "party_status" DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "party_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" text NOT NULL,
	"metadata" text,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol" varchar(50) NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"asset" varchar(20),
	"data" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recoveries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"contract_recovery_id" integer,
	"wallet_address" text NOT NULL,
	"encrypted_data" text NOT NULL,
	"status" "recovery_status" DEFAULT 'active' NOT NULL,
	"initiation_tx_hash" text,
	"completion_tx_hash" text,
	"fee_amount" varchar(50),
	"triggered_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recovery_id" varchar NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text,
	"invite_token" text NOT NULL,
	"invite_expires_at" timestamp NOT NULL,
	"has_attested" boolean DEFAULT false,
	"signature" text,
	"tx_hash" text,
	"attested_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_keys_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar,
	CONSTRAINT "system_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "totp_secrets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"secret" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "totp_secrets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"wallet_address" text,
	"wallet_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"ssn_hash" text,
	"full_name" text,
	"date_of_birth" timestamp,
	"last_known_location" text,
	"death_monitoring_enabled" boolean DEFAULT false,
	"verification_tier" integer DEFAULT 1,
	"last_ssdi_check" timestamp,
	"ssdi_consent_given" boolean DEFAULT false,
	"ssdi_consent_date" timestamp,
	"ssdi_consent_ip_address" text,
	"death_verified_at" timestamp,
	"death_confidence_score" varchar(5),
	"status" varchar(20) DEFAULT 'active',
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false,
	"backup_codes" text,
	"role" varchar(50) DEFAULT 'user',
	"is_admin" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "vault_smart_contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"contract_address" text,
	"network" text DEFAULT 'ethereum' NOT NULL,
	"deployment_tx_hash" text,
	"deployment_status" "contract_deployment_status" DEFAULT 'pending' NOT NULL,
	"deployed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vault_smart_contracts_contract_address_unique" UNIQUE("contract_address")
);
--> statement-breakpoint
CREATE TABLE "vault_trigger_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"claimant_email" text NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaults" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" text NOT NULL,
	"check_in_interval_days" integer DEFAULT 90 NOT NULL,
	"grace_period_days" integer DEFAULT 14 NOT NULL,
	"status" "vault_status" DEFAULT 'active' NOT NULL,
	"last_check_in_at" timestamp DEFAULT now() NOT NULL,
	"next_check_in_due" timestamp NOT NULL,
	"fragment_scheme" varchar(10) DEFAULT '2-of-3',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text,
	"device_name" text,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "will_asset_allowances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"will_id" varchar NOT NULL,
	"token_address" text NOT NULL,
	"token_symbol" text,
	"token_name" text,
	"spender_address" text NOT NULL,
	"allowance_amount" text,
	"network" varchar(20) DEFAULT 'ethereum',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "will_beneficiaries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"will_id" varchar NOT NULL,
	"address" text NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"percent" integer NOT NULL,
	"token_address" text,
	"is_nft_only" boolean DEFAULT false,
	"is_charity_dao" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "will_execution_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"will_id" varchar NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"transaction_hash" text,
	"block_number" text,
	"event_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "will_guardians" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"will_id" varchar NOT NULL,
	"guardian_type" "will_guardian_type" NOT NULL,
	"identifier" text NOT NULL,
	"wallet_address" text,
	"verified" boolean DEFAULT false,
	"verification_token" text,
	"verification_expires_at" timestamp,
	"verified_at" timestamp,
	"public_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "will_triggers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"will_id" varchar NOT NULL,
	"trigger_type" "will_trigger_type" NOT NULL,
	"check_in_interval_days" integer,
	"grace_period_days" integer,
	"last_check_in_at" timestamp,
	"next_check_in_due" timestamp,
	"death_oracle_address" text,
	"required_confidence_score" varchar(5),
	"recovery_contract_address" text,
	"recovery_keys" text,
	"threshold" integer,
	"executor_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "will_wizard_state" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"will_id" varchar,
	"encrypted_state" text NOT NULL,
	"current_step" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"contract_address" text,
	"contract_will_id" integer,
	"pdf_s3_key" text,
	"metadata_hash" text,
	"status" "will_status" DEFAULT 'draft' NOT NULL,
	"deployment_tx_hash" text,
	"is_deployed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"finalized_at" timestamp,
	"triggered_at" timestamp,
	"executed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "yield_vaults" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"asset" varchar(10) NOT NULL,
	"principal" varchar(50) NOT NULL,
	"yield_accumulated" varchar(50) DEFAULT '0' NOT NULL,
	"total_value" varchar(50) NOT NULL,
	"protocol" "yield_protocol" NOT NULL,
	"category" "yield_category" NOT NULL,
	"apy" varchar(10) NOT NULL,
	"last_yield_update" timestamp DEFAULT now() NOT NULL,
	"contract_address" text,
	"tx_hash" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"granted" boolean NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "death_certificate_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"order_id" varchar(100) NOT NULL,
	"vendor" varchar(50),
	"state" varchar(2),
	"status" varchar(20) DEFAULT 'pending',
	"estimated_delivery" timestamp,
	"delivered_at" timestamp,
	"certificate_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "death_certificate_orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "death_verification_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"source" "death_verification_source" NOT NULL,
	"confidence_score" numeric(3, 2),
	"verification_data" jsonb,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"verified_by" varchar(100),
	"reported_death_date" timestamp,
	"reported_location" varchar(255),
	"death_certificate_url" text,
	"status" "death_verification_status" DEFAULT 'pending' NOT NULL,
	"requires_review" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "proof_of_life_challenges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"challenge_code" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ssdi_check_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"check_date" timestamp DEFAULT now() NOT NULL,
	"ssdi_provider" varchar(50),
	"match_found" boolean,
	"match_data" jsonb,
	"api_response_time_ms" integer
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risk_events" ADD CONSTRAINT "ai_risk_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risk_events" ADD CONSTRAINT "ai_risk_events_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risk_events" ADD CONSTRAINT "ai_risk_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavioral_biometrics" ADD CONSTRAINT "behavioral_biometrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_attestations" ADD CONSTRAINT "claim_attestations_claim_id_vault_trigger_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."vault_trigger_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_attestations" ADD CONSTRAINT "claim_attestations_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_files" ADD CONSTRAINT "claim_files_claim_id_vault_trigger_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."vault_trigger_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dao_verifiers" ADD CONSTRAINT "dao_verifiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "death_certificates" ADD CONSTRAINT "death_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_guardian_id_parties_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_referral_discounts" ADD CONSTRAINT "guardian_referral_discounts_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_referral_discounts" ADD CONSTRAINT "guardian_referral_discounts_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_referral_discounts" ADD CONSTRAINT "guardian_referral_discounts_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_devices" ADD CONSTRAINT "hardware_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_ping_logs" ADD CONSTRAINT "hardware_ping_logs_device_id_hardware_devices_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."hardware_devices"("device_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_ping_logs" ADD CONSTRAINT "hardware_ping_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_messages" ADD CONSTRAINT "legacy_messages_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_messages" ADD CONSTRAINT "legacy_messages_beneficiary_id_parties_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."parties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_history" ADD CONSTRAINT "optimization_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_history" ADD CONSTRAINT "optimization_history_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_history" ADD CONSTRAINT "party_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recoveries" ADD CONSTRAINT "recoveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_keys" ADD CONSTRAINT "recovery_keys_recovery_id_recoveries_id_fk" FOREIGN KEY ("recovery_id") REFERENCES "public"."recoveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "totp_secrets" ADD CONSTRAINT "totp_secrets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_smart_contracts" ADD CONSTRAINT "vault_smart_contracts_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_trigger_claims" ADD CONSTRAINT "vault_trigger_claims_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_asset_allowances" ADD CONSTRAINT "will_asset_allowances_will_id_wills_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."wills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_beneficiaries" ADD CONSTRAINT "will_beneficiaries_will_id_wills_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."wills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_execution_events" ADD CONSTRAINT "will_execution_events_will_id_wills_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."wills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_guardians" ADD CONSTRAINT "will_guardians_will_id_wills_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."wills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_triggers" ADD CONSTRAINT "will_triggers_will_id_wills_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."wills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_wizard_state" ADD CONSTRAINT "will_wizard_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "will_wizard_state" ADD CONSTRAINT "will_wizard_state_will_id_wills_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."wills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wills" ADD CONSTRAINT "wills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yield_vaults" ADD CONSTRAINT "yield_vaults_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yield_vaults" ADD CONSTRAINT "yield_vaults_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "death_certificate_orders" ADD CONSTRAINT "death_certificate_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "death_verification_events" ADD CONSTRAINT "death_verification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_life_challenges" ADD CONSTRAINT "proof_of_life_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ssdi_check_log" ADD CONSTRAINT "ssdi_check_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;