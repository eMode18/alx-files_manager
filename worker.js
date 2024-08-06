const Queue = require('bull');
const fs = require('fs');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job, done) => {
    const { fileId, userId } = job.data;

    if (!fileId) {
        return done(new Error('Missing fileId'));
    }
    if (!userId) {
        return done(new Error('Missing userId'));
    }

    const file = await dbClient.getFileById(fileId);
    if (!file || file.userId.toString() !== userId) {
        return done(new Error('File not found'));
    }

    const sizes = [500, 250, 100];
    const folderPath = path.dirname(file.localPath);

    try {
        for (const size of sizes) {
            const thumbnail = await imageThumbnail(file.localPath, { width: size });
            const thumbnailPath = `${file.localPath}_${size}`;
            fs.writeFileSync(thumbnailPath, thumbnail);
        }
        done();
    } catch (error) {
        done(error);
    }
});

