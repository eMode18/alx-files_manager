/*
 * File contanins the end points for our API
 * */
const express = require('express');
const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const FilesController = require('../controllers/FilesController');
import { authenticateUser, authorizeUser } from '../middleware/authMiddleware';

// Defining endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// Define the endpoint for creating a new user
router.post('/users', UsersController.postNew);

// Define the authentication endpoints
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', authenticateUser, AuthController.getDisconnect);
router.get('/users/me', authenticateUser, UsersController.getMe);

// Define the endpoint for uploading files
router.post('/files', authenticateUser, FilesController.postUpload);

// Define the endpoints for retrieving and listing files
router.get('/files/:id', authenticateUser, authorizeUser, FilesController.getShow);
router.get('/files', authenticateUser, FilesController.getIndex);

// Define the endpoints for publishing and unpublishing files
router.put('/files/:id/publish', authenticateUser, authorizeUser, FilesController.putPublish);
router.put('/files/:id/unpublish', authenticateUser, authorizeUser, FilesController.putUnpublish);

// Define the endpoint for retrieving file data
router.get('/files/:id/data', FilesController.getFile);

module.exports = router;

