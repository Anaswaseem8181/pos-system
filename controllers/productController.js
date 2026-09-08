const Product = require('../models/Product');
const catchAsync = require('../utils/asyncHandler');

exports.getAll = catchAsync(async (req, res) => {
	const activeOnly = req.query.activeOnly === 'true';
	const limit = parseInt(req.query.limit) || 100;
	const offset = parseInt(req.query.offset) || 0;
	const products = await Product.getMany(activeOnly, limit, offset);
	res.json(products);
});

exports.create = catchAsync(async (req, res) => {
	await Product.create(req.body);
	res.status(201).json({ success: true });
});

exports.update = catchAsync(async (req, res) => {
	const { price, quantity } = req.body;
	if (price <= 0) throw new Error("Price must be greater than 0");
	if (quantity < 0) throw new Error("Quantity cannot be negative");

	await Product.update(req.params.id, req.body);
	res.json({ success: true, message: "Product updated successfully" });
});

exports.delete = catchAsync(async (req, res) => {
	await Product.delete(req.params.id);
	res.json({ success: true });
});

exports.toggleStatus = catchAsync(async (req, res) => {
	await Product.toggleStatus(req.params.id);
	res.json({ success: true });
});

exports.getInventoryStats = catchAsync(async (req, res) => {
	const stats = await Product.getInventorySummary();
	res.json(stats);
});
