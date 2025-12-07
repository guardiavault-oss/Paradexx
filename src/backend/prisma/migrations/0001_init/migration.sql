-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "username" TEXT,
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "oauthAccessToken" TEXT,
    "oauthRefreshToken" TEXT,
    "displayName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "passwordHash" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "biometricPublicKey" TEXT,
    "biometricCredentialId" TEXT,
    "biometricCounter" INTEGER NOT NULL DEFAULT 0,
    "autoLockEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoLockTimeout" INTEGER NOT NULL DEFAULT 5,
    "pinHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "chain" TEXT NOT NULL DEFAULT 'ethereum',
    "encryptedPrivateKey" TEXT,
    "publicKey" TEXT,
    "walletType" TEXT NOT NULL DEFAULT 'mpc',
    "hardwareType" TEXT,
    "derivationPath" TEXT,
    "balance" TEXT DEFAULT '0',
    "lastSyncedAt" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudBackup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "backupType" TEXT NOT NULL,
    "encryptionMethod" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "iv" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "encryptedKeyShard" TEXT,
    "shardIndex" INTEGER,
    "recoveryKeyShard" TEXT,
    "shardHash" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvalCount" INTEGER NOT NULL DEFAULT 0,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 2,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canExecuteAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "disputedAt" TIMESTAMP(3),
    "disputeReason" TEXT,

    CONSTRAINT "RecoveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianApproval" (
    "id" TEXT NOT NULL,
    "recoveryRequestId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "GuardianApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationship" TEXT,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "requiresDeathCertificate" BOOLEAN NOT NULL DEFAULT false,
    "manualVerification" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'ETH',
    "tokenAddress" TEXT,
    "valueUSD" DOUBLE PRECISION,
    "gasLimit" TEXT,
    "gasPrice" TEXT,
    "gasUsed" TEXT,
    "gasCostUSD" DOUBLE PRECISION,
    "swapFromToken" TEXT,
    "swapFromAmount" TEXT,
    "swapToToken" TEXT,
    "swapToAmount" TEXT,
    "blockNumber" INTEGER,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "nonce" INTEGER,
    "error" TEXT,
    "chain" TEXT NOT NULL DEFAULT 'ethereum',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "spendingLimit" TEXT NOT NULL,
    "spentAmount" TEXT NOT NULL DEFAULT '0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldVault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'default',
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalDeposited" TEXT NOT NULL DEFAULT '0',
    "totalYield" TEXT NOT NULL DEFAULT '0',
    "currentAPY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YieldVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldVaultDeposit" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "expectedYield" TEXT NOT NULL,
    "feeAmount" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YieldVaultDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldVaultWithdrawal" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "yieldEarned" TEXT NOT NULL,
    "feeAmount" TEXT NOT NULL,
    "netYield" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YieldVaultWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressBookEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ensName" TEXT,
    "label" TEXT,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddressBookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletConnectSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "peerName" TEXT NOT NULL,
    "peerUrl" TEXT NOT NULL,
    "peerIcon" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "chainId" INTEGER NOT NULL,
    "accounts" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletConnectSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenApproval" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "spenderAddress" TEXT NOT NULL,
    "spenderName" TEXT,
    "amount" TEXT NOT NULL,
    "isUnlimited" BOOLEAN NOT NULL,
    "risk" TEXT NOT NULL DEFAULT 'low',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "TokenApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhishingReport" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "severity" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhishingReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "properties" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartWill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "onChainId" TEXT,
    "transactionHash" TEXT,
    "metadataHash" TEXT,
    "chainId" INTEGER,
    "requiresGuardianAttestation" BOOLEAN NOT NULL DEFAULT false,
    "guardianThreshold" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SmartWill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WillBeneficiary" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "allocation" INTEGER NOT NULL DEFAULT 0,
    "relationship" TEXT,
    "conditions" TEXT,
    "nftOnly" BOOLEAN NOT NULL DEFAULT false,
    "specificTokens" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WillBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WillGuardian" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'trustee',
    "hasApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WillGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WillCharity" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "allocation" INTEGER NOT NULL DEFAULT 0,
    "cause" TEXT,
    "isVerifiedDAO" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WillCharity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WillCondition" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "beneficiaryId" TEXT,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "vestingPeriod" INTEGER,
    "vestingPercent" INTEGER,
    "isMet" BOOLEAN NOT NULL DEFAULT false,
    "metAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WillCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WillMessage" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientType" TEXT NOT NULL DEFAULT 'beneficiary',
    "type" TEXT NOT NULL DEFAULT 'text',
    "encryptedContent" TEXT,
    "ipfsHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WillMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoredWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'ethereum',
    "walletType" TEXT NOT NULL DEFAULT 'eoa',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "threatLevel" TEXT NOT NULL DEFAULT 'low',
    "protectionLevel" TEXT NOT NULL DEFAULT 'medium',
    "autoProtect" BOOLEAN NOT NULL DEFAULT true,
    "alertChannels" TEXT,
    "maxTransactionValue" TEXT,
    "maxGasPrice" TEXT,
    "suspiciousActivityScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3),

    CONSTRAINT "MonitoredWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletThreat" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "threatType" TEXT NOT NULL,
    "threatLevel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceAddress" TEXT,
    "sourceContract" TEXT,
    "transactionHash" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletThreat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletProtectionAction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "transactionHash" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "WalletProtectionAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletSecurityConfig" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "securityLevel" TEXT NOT NULL DEFAULT 'medium',
    "requiredSigners" INTEGER NOT NULL DEFAULT 1,
    "mpcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hsmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timeLockEnabled" BOOLEAN NOT NULL DEFAULT true,
    "circuitBreakerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "zeroDayProtectionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whitelistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whitelistedAddresses" TEXT,
    "whitelistedContracts" TEXT,
    "alertChannels" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletSecurityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionSimulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'ethereum',
    "toAddress" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "data" TEXT,
    "gasLimit" TEXT,
    "success" BOOLEAN NOT NULL,
    "gasUsed" TEXT,
    "returnData" TEXT,
    "logs" TEXT,
    "stateChanges" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "warnings" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InheritanceVault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'essential',
    "inactivityDays" INTEGER NOT NULL DEFAULT 365,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggerWarningAt" TIMESTAMP(3),
    "timelockStartAt" TIMESTAMP(3),
    "canDistributeAt" TIMESTAMP(3),
    "distributionMethod" TEXT NOT NULL DEFAULT 'automatic',
    "requiresGuardianApproval" BOOLEAN NOT NULL DEFAULT false,
    "guardianApprovalCount" INTEGER NOT NULL DEFAULT 0,
    "requiredGuardianApprovals" INTEGER NOT NULL DEFAULT 1,
    "enableCheckInReminders" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckInReminder" TIMESTAMP(3),
    "warningNotificationsSent" INTEGER NOT NULL DEFAULT 0,
    "walletAddresses" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributedAt" TIMESTAMP(3),

    CONSTRAINT "InheritanceVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultBeneficiary" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "walletAddress" TEXT,
    "relationship" TEXT,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimedAt" TIMESTAMP(3),
    "claimTransactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultActivity" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaultActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultNotification" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'owner',
    "sent" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3),
    "subject" TEXT,

    CONSTRAINT "VaultNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "transactionAlerts" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "shareAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedVersion" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "privacyAcceptedVersion" TEXT,
    "privacyAcceptedAt" TIMESTAMP(3),
    "ageVerified" BOOLEAN NOT NULL DEFAULT false,
    "ageVerifiedAt" TIMESTAMP(3),
    "jurisdiction" TEXT,
    "jurisdictionSetAt" TIMESTAMP(3),
    "deletionScheduledAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremiumPass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expiresAt" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SniperTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tradeValue" TEXT NOT NULL,
    "feeAmount" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SniperTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPremiumFeature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "pricePaid" INTEGER NOT NULL DEFAULT 0,
    "isBundle" BOOLEAN NOT NULL DEFAULT false,
    "bundlePurchaseId" TEXT,

    CONSTRAINT "UserPremiumFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultManagementFee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vaultId" TEXT,
    "aumUsd" DOUBLE PRECISION NOT NULL,
    "feeRate" DOUBLE PRECISION NOT NULL,
    "feeAmountUsd" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaultManagementFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthId_key" ON "User"("oauthId");

-- CreateIndex
CREATE UNIQUE INDEX "User_biometricCredentialId_key" ON "User"("biometricCredentialId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_oauthId_idx" ON "User"("oauthId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "CloudBackup_userId_idx" ON "CloudBackup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_inviteToken_key" ON "Guardian"("inviteToken");

-- CreateIndex
CREATE INDEX "Guardian_userId_idx" ON "Guardian"("userId");

-- CreateIndex
CREATE INDEX "Guardian_email_idx" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "RecoveryRequest_userId_idx" ON "RecoveryRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianApproval_recoveryRequestId_guardianId_key" ON "GuardianApproval"("recoveryRequestId", "guardianId");

-- CreateIndex
CREATE INDEX "Beneficiary_userId_idx" ON "Beneficiary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_hash_idx" ON "Transaction"("hash");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionKey_token_key" ON "SessionKey"("token");

-- CreateIndex
CREATE INDEX "SessionKey_userId_idx" ON "SessionKey"("userId");

-- CreateIndex
CREATE INDEX "SessionKey_walletId_idx" ON "SessionKey"("walletId");

-- CreateIndex
CREATE INDEX "SessionKey_token_idx" ON "SessionKey"("token");

-- CreateIndex
CREATE INDEX "SessionKey_expiresAt_idx" ON "SessionKey"("expiresAt");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_idx" ON "PriceAlert"("userId");

-- CreateIndex
CREATE INDEX "PriceAlert_triggered_idx" ON "PriceAlert"("triggered");

-- CreateIndex
CREATE INDEX "YieldVault_userId_idx" ON "YieldVault"("userId");

-- CreateIndex
CREATE INDEX "YieldVault_address_idx" ON "YieldVault"("address");

-- CreateIndex
CREATE INDEX "YieldVaultDeposit_vaultId_idx" ON "YieldVaultDeposit"("vaultId");

-- CreateIndex
CREATE INDEX "YieldVaultDeposit_userId_idx" ON "YieldVaultDeposit"("userId");

-- CreateIndex
CREATE INDEX "YieldVaultWithdrawal_vaultId_idx" ON "YieldVaultWithdrawal"("vaultId");

-- CreateIndex
CREATE INDEX "YieldVaultWithdrawal_userId_idx" ON "YieldVaultWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "AddressBookEntry_userId_idx" ON "AddressBookEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AddressBookEntry_userId_address_key" ON "AddressBookEntry"("userId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "WalletConnectSession_topic_key" ON "WalletConnectSession"("topic");

-- CreateIndex
CREATE INDEX "WalletConnectSession_userId_idx" ON "WalletConnectSession"("userId");

-- CreateIndex
CREATE INDEX "WalletConnectSession_topic_idx" ON "WalletConnectSession"("topic");

-- CreateIndex
CREATE INDEX "TokenApproval_walletAddress_idx" ON "TokenApproval"("walletAddress");

-- CreateIndex
CREATE INDEX "TokenApproval_tokenAddress_idx" ON "TokenApproval"("tokenAddress");

-- CreateIndex
CREATE INDEX "PhishingReport_domain_idx" ON "PhishingReport"("domain");

-- CreateIndex
CREATE INDEX "PhishingReport_status_idx" ON "PhishingReport"("status");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "SmartWill_userId_idx" ON "SmartWill"("userId");

-- CreateIndex
CREATE INDEX "SmartWill_status_idx" ON "SmartWill"("status");

-- CreateIndex
CREATE INDEX "WillBeneficiary_willId_idx" ON "WillBeneficiary"("willId");

-- CreateIndex
CREATE INDEX "WillGuardian_willId_idx" ON "WillGuardian"("willId");

-- CreateIndex
CREATE INDEX "WillCharity_willId_idx" ON "WillCharity"("willId");

-- CreateIndex
CREATE INDEX "WillCondition_willId_idx" ON "WillCondition"("willId");

-- CreateIndex
CREATE INDEX "WillCondition_beneficiaryId_idx" ON "WillCondition"("beneficiaryId");

-- CreateIndex
CREATE INDEX "WillMessage_willId_idx" ON "WillMessage"("willId");

-- CreateIndex
CREATE INDEX "MonitoredWallet_userId_idx" ON "MonitoredWallet"("userId");

-- CreateIndex
CREATE INDEX "MonitoredWallet_address_idx" ON "MonitoredWallet"("address");

-- CreateIndex
CREATE INDEX "MonitoredWallet_network_idx" ON "MonitoredWallet"("network");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredWallet_userId_address_network_key" ON "MonitoredWallet"("userId", "address", "network");

-- CreateIndex
CREATE INDEX "WalletThreat_walletId_idx" ON "WalletThreat"("walletId");

-- CreateIndex
CREATE INDEX "WalletThreat_threatLevel_idx" ON "WalletThreat"("threatLevel");

-- CreateIndex
CREATE INDEX "WalletThreat_createdAt_idx" ON "WalletThreat"("createdAt");

-- CreateIndex
CREATE INDEX "WalletProtectionAction_walletId_idx" ON "WalletProtectionAction"("walletId");

-- CreateIndex
CREATE INDEX "WalletProtectionAction_actionType_idx" ON "WalletProtectionAction"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "WalletSecurityConfig_walletId_key" ON "WalletSecurityConfig"("walletId");

-- CreateIndex
CREATE INDEX "TransactionSimulation_walletAddress_idx" ON "TransactionSimulation"("walletAddress");

-- CreateIndex
CREATE INDEX "TransactionSimulation_createdAt_idx" ON "TransactionSimulation"("createdAt");

-- CreateIndex
CREATE INDEX "InheritanceVault_userId_idx" ON "InheritanceVault"("userId");

-- CreateIndex
CREATE INDEX "InheritanceVault_status_idx" ON "InheritanceVault"("status");

-- CreateIndex
CREATE INDEX "InheritanceVault_lastActivityAt_idx" ON "InheritanceVault"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VaultBeneficiary_verificationToken_key" ON "VaultBeneficiary"("verificationToken");

-- CreateIndex
CREATE INDEX "VaultBeneficiary_vaultId_idx" ON "VaultBeneficiary"("vaultId");

-- CreateIndex
CREATE INDEX "VaultBeneficiary_email_idx" ON "VaultBeneficiary"("email");

-- CreateIndex
CREATE INDEX "VaultActivity_vaultId_idx" ON "VaultActivity"("vaultId");

-- CreateIndex
CREATE INDEX "VaultActivity_createdAt_idx" ON "VaultActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VaultNotification_vaultId_idx" ON "VaultNotification"("vaultId");

-- CreateIndex
CREATE INDEX "VaultNotification_type_idx" ON "VaultNotification"("type");

-- CreateIndex
CREATE INDEX "VaultNotification_sentAt_idx" ON "VaultNotification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpArticle_slug_key" ON "HelpArticle"("slug");

-- CreateIndex
CREATE INDEX "HelpArticle_category_idx" ON "HelpArticle"("category");

-- CreateIndex
CREATE INDEX "HelpArticle_published_idx" ON "HelpArticle"("published");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketNumber_idx" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "PremiumPass_userId_idx" ON "PremiumPass"("userId");

-- CreateIndex
CREATE INDEX "PremiumPass_expiresAt_idx" ON "PremiumPass"("expiresAt");

-- CreateIndex
CREATE INDEX "SniperTrade_userId_idx" ON "SniperTrade"("userId");

-- CreateIndex
CREATE INDEX "SniperTrade_executedAt_idx" ON "SniperTrade"("executedAt");

-- CreateIndex
CREATE INDEX "UserPremiumFeature_userId_idx" ON "UserPremiumFeature"("userId");

-- CreateIndex
CREATE INDEX "UserPremiumFeature_featureId_idx" ON "UserPremiumFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPremiumFeature_userId_featureId_key" ON "UserPremiumFeature"("userId", "featureId");

-- CreateIndex
CREATE INDEX "VaultManagementFee_userId_idx" ON "VaultManagementFee"("userId");

-- CreateIndex
CREATE INDEX "VaultManagementFee_status_idx" ON "VaultManagementFee"("status");

-- CreateIndex
CREATE INDEX "VaultManagementFee_periodEnd_idx" ON "VaultManagementFee"("periodEnd");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudBackup" ADD CONSTRAINT "CloudBackup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryRequest" ADD CONSTRAINT "RecoveryRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianApproval" ADD CONSTRAINT "GuardianApproval_recoveryRequestId_fkey" FOREIGN KEY ("recoveryRequestId") REFERENCES "RecoveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianApproval" ADD CONSTRAINT "GuardianApproval_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionKey" ADD CONSTRAINT "SessionKey_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldVault" ADD CONSTRAINT "YieldVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldVaultDeposit" ADD CONSTRAINT "YieldVaultDeposit_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "YieldVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldVaultWithdrawal" ADD CONSTRAINT "YieldVaultWithdrawal_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "YieldVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressBookEntry" ADD CONSTRAINT "AddressBookEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletConnectSession" ADD CONSTRAINT "WalletConnectSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WillBeneficiary" ADD CONSTRAINT "WillBeneficiary_willId_fkey" FOREIGN KEY ("willId") REFERENCES "SmartWill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WillGuardian" ADD CONSTRAINT "WillGuardian_willId_fkey" FOREIGN KEY ("willId") REFERENCES "SmartWill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WillCharity" ADD CONSTRAINT "WillCharity_willId_fkey" FOREIGN KEY ("willId") REFERENCES "SmartWill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WillCondition" ADD CONSTRAINT "WillCondition_willId_fkey" FOREIGN KEY ("willId") REFERENCES "SmartWill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WillMessage" ADD CONSTRAINT "WillMessage_willId_fkey" FOREIGN KEY ("willId") REFERENCES "SmartWill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletThreat" ADD CONSTRAINT "WalletThreat_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MonitoredWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletProtectionAction" ADD CONSTRAINT "WalletProtectionAction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MonitoredWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletSecurityConfig" ADD CONSTRAINT "WalletSecurityConfig_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MonitoredWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultBeneficiary" ADD CONSTRAINT "VaultBeneficiary_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "InheritanceVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultActivity" ADD CONSTRAINT "VaultActivity_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "InheritanceVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultNotification" ADD CONSTRAINT "VaultNotification_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "InheritanceVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumPass" ADD CONSTRAINT "PremiumPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SniperTrade" ADD CONSTRAINT "SniperTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

