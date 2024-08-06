const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AppController = {
    async getStatus(req, res) {
        try {
            const redisAlive = await redisClient.isAlive();
            const dbAlive = await dbClient.isAlive();

            res.status(200).json({ redis: redisAlive, db: dbAlive });
        } catch (error) {
            console.error('Error checking status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getStats(req, res) {
        try {
            const usersCount = await dbClient.nbUsers();
            const filesCount = await dbClient.nbFiles();

            res.status(200).json({ users: usersCount, files: filesCount });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = AppController;

