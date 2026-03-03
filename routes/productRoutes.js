const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, productController.getAll);
router.post('/', isAuthenticated, isAdmin, productController.create);
router.put('/:id', isAuthenticated, isAdmin, productController.update);
router.delete('/:id', isAuthenticated, isAdmin, productController.delete);

module.exports = router;