import { createClient } from 'redis';

/**
 * Redis server class.
 */

class RedisClient {
    constructor() {
        // Create a Redis client
        this.client = redis.createClient();

        // Handle errors
        this.client.on('error', (err) => {
            console.error('Error connecting to Redis:', err);
        });
    }

    async isAlive() {
        // Check if the connection to Redis is successful
        return new Promise((resolve) => {
            this.client.ping('PING', (err, reply) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(reply === 'PONG');
                }
            });
        });
    }

    async get(key) {
        return new Promise((resolve) => {
            this.client.get(key, (err, value) => {
                if (err) {
                    console.error('Error fetching value from Redis:', err);
                    resolve(null);
                } else {
                    resolve(value);
                }
            });
        });
    }

    async set(key, value, durationInSeconds) {
        return new Promise((resolve) => {
            this.client.setex(key, durationInSeconds, value, (err) => {
                if (err) {
                    console.error('Error setting value in Redis:', err);
                }
                resolve();
            });
        });
    }

    async del(key) {
        return new Promise((resolve) => {
            this.client.del(key, (err) => {
                if (err) {
                    console.error('Error deleting value from Redis:', err);
                }
                resolve();
            });
        });
    }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;

