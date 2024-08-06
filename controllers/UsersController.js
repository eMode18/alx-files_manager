const crypto = require('crypto'); // For hashing the password
const dbClient = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const userQueue = require('../utils/queue'); // Import the queue
const redisClient = require('../utils/redis');

const UsersController = {
    async postNew(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email) {
                return res.status(400).json({ error: 'Missing email' });
            }
            if (!password) {
                return res.status(400).json({ error: 'Missing password' });
            }

            // Check if email already exists
            const existingUser = await dbClient.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Already exist' });
            }

            // Hash the password (SHA1)
            const hashedPassword = crypto
                .createHash('sha1')
                .update(password)
                .digest('hex');

            // Create the new user
            const newUser = {
                email,
                password: hashedPassword,
            };

            userQueue.add({ userId: newUser._id });

            // Save the user in the database
            const savedUser = await dbClient.createUser(newUser);

            // Return the new user with only email and id
            res.status(201).json({ id: savedUser._id, email: savedUser.email });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getMe(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Retrieve the user based on the token
            const userId = await redisClient.get(`auth_${token}`);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Fetch the user details from the database
            const user = await dbClient.getUserById(userId);

            res.status(200).json({ id: user._id, email: user.email });
        } catch (error) {
            console.error('Error fetching user details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = UsersController;

