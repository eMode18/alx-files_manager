const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const FilesController = {
    async postUpload(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = await redisClient.get(`auth_${token}`);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { name, type, parentId = 0, isPublic = false, data } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Missing name' });
            }
            if (!type || !['folder', 'file', 'image'].includes(type)) {
                return res.status(400).json({ error: 'Missing type' });
            }
            if (type !== 'folder' && !data) {
                return res.status(400).json({ error: 'Missing data' });
            }

            if (parentId !== 0) {
                const parentFile = await dbClient.getFileById(parentId);
                if (!parentFile) {
                    return res.status(400).json({ error: 'Parent not found' });
                }
                if (parentFile.type !== 'folder') {
                    return res.status(400).json({ error: 'Parent is not a folder' });
                }
            }

            const newFile = {
                userId,
                name,
                type,
                isPublic,
                parentId,
            };

            if (type === 'folder') {
                const savedFile = await dbClient.createFile(newFile);
                return res.status(201).json(savedFile);
            }

            const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            const localPath = path.join(folderPath, uuidv4());
            fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

            newFile.localPath = localPath;
            const savedFile = await dbClient.createFile(newFile);

            res.status(201).json(savedFile);
        } catch (error) {
            console.error('Error uploading file:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getShow(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = await redisClient.get(`auth_${token}`);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = req.params.id;
            const file = await dbClient.getFileById(fileId);

            if (!file || file.userId.toString() !== userId) {
                return res.status(404).json({ error: 'Not found' });
            }

            res.status(200).json(file);
        } catch (error) {
            console.error('Error retrieving file:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getIndex(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = await redisClient.get(`auth_${token}`);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { parentId = 0, page = 0 } = req.query;
            const pageSize = 20;
            const skip = page * pageSize;

            const files = await dbClient.getFilesByUserIdAndParentId(userId, parentId, skip, pageSize);

            res.status(200).json(files);
        } catch (error) {
            console.error('Error listing files:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async putPublish(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = await redisClient.get(`auth_${token}`);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = req.params.id;
            const file = await dbClient.getFileById(fileId);

            if (!file || file.userId.toString() !== userId) {
                return res.status(404).json({ error: 'Not found' });
            }

            file.isPublic = true;
            await dbClient.updateFile(fileId, { isPublic: true });

            res.status(200).json(file);
        } catch (error) {
            console.error('Error publishing file:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async putUnpublish(req, res) {
        try {
            const token = req.headers['x-token'];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = await redisClient.get(`auth_${token}`);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const fileId = req.params.id;
            const file = await dbClient.getFileById(fileId);

            if (!file || file.userId.toString() !== userId) {
                return res.status(404).json({ error: 'Not found' });
            }

            file.isPublic = false;
            await dbClient.updateFile(fileId, { isPublic: false });

            res.status(200).json(file);
        } catch (error) {
            console.error('Error unpublishing file:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

  async getFile(req, res) {
    try {
      const fileId = req.params.id;
      const size = req.query.size;
      
      // `authorizeUser` middleware ensures `req.file` is set if authorized
      const file = req.file; // Set by `authorizeUser` middleware

      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      let filePath = file.localPath;
      if (size && ['100', '250', '500'].includes(size)) {
        filePath = `${file.localPath}_${size}`;
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const mimeType = mime.lookup(file.name);
      res.setHeader('Content-Type', mimeType);
      const fileContent = fs.readFileSync(filePath);
      res.send(fileContent);
    } catch (error) {
      console.error('Error retrieving file data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = FilesController;

