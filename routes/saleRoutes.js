const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { isAuthenticated, isAdmin, isManagerOrAdmin } = require('../middleware/authMiddleware');

router.post('/checkout', isAuthenticated, saleController.checkout);
router.get('/report', isAuthenticated, isManagerOrAdmin, saleController.getSalesReport);
router.get('/top-products', isAuthenticated, isManagerOrAdmin, saleController.getTopProducts);
router.get('/:id', isAuthenticated, isManagerOrAdmin, saleController.getSaleDetails);

module.exports = router;