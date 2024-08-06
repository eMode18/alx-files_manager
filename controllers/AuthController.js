
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AuthController = {
    async getConnect(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Basic ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            const [email, password] = credentials.split(':');

            // Find user by email and hashed password
            const user = await dbClient.getUserByEmailAndPassword(email, password);
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Generate a random token
            const token = uuidv4();

            // Store the user ID in Redis with the token as the key (valid for 24 hours)
            await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

            res.status(200).json({ token });
        } catch (error) {
            console.error('Error during authentication:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getDisconnect(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Delete the token from Redis
            await redisClient.del(`auth_${token}`);

            res.status(204).end();
        } catch (error) {
            console.error('Error during logout:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = AuthController;

