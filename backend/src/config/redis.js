const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 50, 2000);
        },
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.warn('⚠️  Redis connection failed (continuing without cache):', err.message));
} else {
    // Mock Redis for environments where Redis isn't available
    redis = {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 1,
        setex: async () => 'OK',
    };
}

module.exports = redis;
