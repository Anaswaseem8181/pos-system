const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.post('/checkout', isAuthenticated, saleController.checkout);
router.get('/report', isAuthenticated, isAdmin, saleController.getSalesReport);

module.exports = router;