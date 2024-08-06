/*
 *Require mongodb
 * */
const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        // Connection URL
        const url = `mongodb://${host}:${port}`;

        // Create a new MongoClient
        this.client = new MongoClient(url, { useUnifiedTopology: true });

        // Connect to MongoDB
        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
        }
    }

    async isAlive() {
        return this.client.isConnected();
    }

    async nbUsers() {
        const usersCollection = this.client.db().collection('users');
        return usersCollection.countDocuments();
    }

    async nbFiles() {
        const filesCollection = this.client.db().collection('files');
        return filesCollection.countDocuments();
    }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;

