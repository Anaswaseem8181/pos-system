const { db, run, query } = require('../config/database');

exports.getCustomers = async (req, res, next) => {
	try {
		const customers = await query("SELECT * FROM customers ORDER BY name ASC");
		res.json(customers);
	} catch (err) { next(err); }
};

exports.addCustomer = async (req, res, next) => {
	const { name, phone } = req.body;
	try {
		const result = await run("INSERT INTO customers (name, phone) VALUES (?, ?)", [name, phone]);
		res.status(201).json({ id: result.id, name, phone });
	} catch (err) { next(err); }
};
