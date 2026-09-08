const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, isAdmin, userController.getAll);
router.post('/', isAuthenticated, isAdmin, userController.create);
router.put('/:id', isAuthenticated, isAdmin, userController.update);
router.delete('/:id', isAuthenticated, isAdmin, userController.softDelete);

module.exports = router;