const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin, isManagerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, productController.getAll);
router.get('/stats', isAuthenticated, isManagerOrAdmin, productController.getInventoryStats);
router.post('/', isAuthenticated, isManagerOrAdmin, productController.create);
router.put('/:id', isAuthenticated, isManagerOrAdmin, productController.update);
router.delete('/:id', isAuthenticated, isManagerOrAdmin, productController.delete);
router.patch('/:id/toggle-status', isAuthenticated, isAdmin, productController.toggleStatus);

module.exports = router;