import Redis from 'ioredis';

const redis = new Redis({
    host: 'localhost',
    port: 6380,
});

async function testRedisConnection() {
    try {
        console.log('Testing Redis connection...');

        // Test basic connection
        redis.on('connect', () => {
            console.log('✅ Redis connection successful!');
        });

        // Test basic operations
        await redis.set('test', 'Hello Redis!');
        const value = await redis.get('test');
        console.log('✅ Redis SET/GET successful:', value);

        // Test ping
        const pong = await redis.ping();
        console.log('✅ Redis PING successful:', pong);

        // Clean up
        await redis.del('test');

        console.log('✅ All Redis tests passed!');

    } catch (error) {
        console.error('❌ Redis connection failed:', error);
    } finally {
        redis.disconnect();
    }
}

testRedisConnection();
