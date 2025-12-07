import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.service';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedTestData() {
    logger.info('🌱 Seeding test data for Sepolia testing...');

    try {
        // Create test user
        const hashedPassword = await bcrypt.hash('test123', 10);
        const testUser = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                passwordHash: hashedPassword,
                emailVerified: new Date(),
            },
        });
        logger.info('✅ Created test user:', testUser.email);

        // Create test wallet
        const testWallet = await prisma.wallet.upsert({
            where: { address: '0x742d35Cc6634C0532925a3b8D6Ac6E1d9C6F2c8B' },
            update: {},
            create: {
                userId: testUser.id,
                address: '0x742d35Cc6634C0532925a3b8D6Ac6E1d9C6F2c8B',
                name: 'Test Wallet',
                chain: 'sepolia',
                walletType: 'mpc',
                isDefault: true,
            },
        });
        logger.info('✅ Created test wallet:', testWallet.address);

        // Create sample transactions
        const transactions = [
            {
                userId: testUser.id,
                walletId: testWallet.id,
                hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                type: 'receive',
                status: 'success',
                from: '0x1234567890123456789012345678901234567890',
                to: testWallet.address,
                value: '1000000000000000000', // 1 ETH
                token: 'ETH',
                blockNumber: 1234567,
                confirmations: 12,
                timestamp: new Date(Date.now() - 86400000), // 1 day ago
            },
            {
                userId: testUser.id,
                walletId: testWallet.id,
                hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                type: 'send',
                status: 'success',
                from: testWallet.address,
                to: '0x9876543210987654321098765432109876543210',
                value: '500000000000000000', // 0.5 ETH
                token: 'ETH',
                blockNumber: 1234568,
                confirmations: 8,
                timestamp: new Date(Date.now() - 43200000), // 12 hours ago
            },
        ];

        for (const tx of transactions) {
            await prisma.transaction.upsert({
                where: { hash: tx.hash },
                update: {},
                create: tx,
            });
        }
        logger.info('✅ Created sample transactions');

        // Create test beneficiaries
        const beneficiaries = [
            {
                userId: testUser.id,
                name: 'John Doe',
                email: 'john.doe@example.com',
                relationship: 'Son',
                percentage: 50,
            },
            {
                userId: testUser.id,
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                relationship: 'Daughter',
                percentage: 50,
            },
        ];

        for (const beneficiary of beneficiaries) {
            await prisma.beneficiary.upsert({
                where: {
                    userId_email: {
                        userId: beneficiary.userId,
                        email: beneficiary.email,
                    },
                },
                update: {},
                create: beneficiary,
            });
        }
        logger.info('✅ Created test beneficiaries');

        // Create test guardians
        const guardians = [
            {
                userId: testUser.id,
                email: 'guardian1@example.com',
                name: 'Alice Johnson',
            },
            {
                userId: testUser.id,
                email: 'guardian2@example.com',
                name: 'Bob Wilson',
            },
        ];

        for (const guardian of guardians) {
            await prisma.guardian.upsert({
                where: {
                    userId_email: {
                        userId: guardian.userId,
                        email: guardian.email,
                    },
                },
                update: {},
                create: guardian,
            });
        }
        logger.info('✅ Created test guardians');

        logger.info('🎉 Test data seeding completed successfully!');
        logger.info('');
        logger.info('📋 Test Credentials:');
        logger.info('Email: test@example.com');
        logger.info('Password: test123');
        logger.info('');
        logger.info('💰 Test Wallet: 0x742d35Cc6634C0532925a3b8D6Ac6E1d9C6F2c8B');
        logger.info('🌐 Network: Sepolia Testnet');

    } catch (error) {
        logger.error('❌ Error seeding test data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestData();
