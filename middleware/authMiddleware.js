import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export const authenticateUser = async (req, res, next) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.userId = userId;
  next();
};

export const authorizeUser = async (req, res, next) => {
  const { id } = req.params;
  const file = await dbClient.db.collection('files').findOne({ _id: id, userId: req.userId });

  if (!file) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.file = file;
  next();
};

