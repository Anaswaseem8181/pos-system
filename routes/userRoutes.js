const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, isAdmin, userController.getAll);
router.post('/', isAuthenticated, isAdmin, userController.create);

module.exports = router;