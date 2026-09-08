const Sale = require('../models/Sale');
const catchAsync = require('../utils/asyncHandler');

exports.checkout = catchAsync(async (req, res) => {
	const result = await Sale.create({
		...req.body,
		userId: req.session.user.id
	});
	res.json({ success: true, saleId: result.saleId });
});

exports.getSalesReport = catchAsync(async (req, res) => {
	const { startDate, endDate } = req.query;
	const limit = parseInt(req.query.limit) || 50;
	const offset = parseInt(req.query.offset) || 0;
	const sales = await Sale.getSalesReport(startDate, endDate, limit, offset);
	res.json(sales);
});

exports.getSaleDetails = catchAsync(async (req, res) => {
	const sale = await Sale.getSaleById(req.params.id);
	if (!sale) return res.status(404).json({ message: "Sale not found" });
	res.json(sale);
});

exports.getTopProducts = catchAsync(async (req, res) => {
	const { startDate, endDate } = req.query;
	const limit = parseInt(req.query.limit) || 5;
	const top = await Sale.getTopPerformers(startDate, endDate, limit);
	res.json(top);
});
