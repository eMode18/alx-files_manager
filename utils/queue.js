const Queue = require('bull');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

module.exports = userQueue;
