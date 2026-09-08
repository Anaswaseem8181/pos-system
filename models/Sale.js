const { query, run, db } = require('../config/database');

class Sale {
	static async create(data) {
		const { items, discountPercent, customerId, userId } = data;

		try {
			await run("BEGIN IMMEDIATE TRANSACTION");

			let calculatedSubtotal = 0;
			const validatedItems = [];

			for (const item of items) {
				const product = await query("SELECT * FROM products WHERE id = ?", [item.id]);
				const p = product[0];

				if (!p) throw new Error(`Product ${item.id} not found`);

				if (p.isActive === 0) {
					throw new Error(`Product "${p.name}" is deactivated and cannot be sold.`);
				}

				if (p.quantity < item.cartQuantity) {
					throw new Error(`Insufficient stock for ${p.name}. Available: ${p.quantity}`);
				}

				calculatedSubtotal += p.price * item.cartQuantity;
				validatedItems.push({
					...item,
					price: p.price,
					name: p.name
				});
			}

			// 2. Recalculate Totals (Addresses "Price Manipulation")
			const discountAmount = (calculatedSubtotal * (discountPercent || 0)) / 100;
			const finalTotal = Math.max(0, calculatedSubtotal - discountAmount);

			// 3. Create Sale record
			const saleResult = await run(
				"INSERT INTO sales (total, discount, user_id, customer_id) VALUES (?, ?, ?, ?)",
				[finalTotal, discountAmount, userId, customerId]
			);
			const saleId = saleResult.id;

			// 4. Create Sale Items and update Stock (Addresses "Race Conditions")
			for (const item of validatedItems) {
				await run(
					"INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
					[saleId, item.id, item.cartQuantity, item.price]
				);

				const updateResult = await run(
					"UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
					[item.cartQuantity, item.id, item.cartQuantity]
				);

				if (updateResult.changes === 0) {
					throw new Error(`Stock for ${item.name} is no longer sufficient.`);
				}
			}

			await run("COMMIT");
			return { saleId };

		} catch (err) {
			try {
				await run("ROLLBACK");
			} catch (rollbackErr) {
				// Rollback might fail if no transaction started, ignore
			}
			throw err;
		}
	}

	static async getSalesReport(startDate, endDate, limit = 50, offset = 0) {
		let sql = `
            SELECT s.*, u.username, c.name as customer_name
            FROM sales s 
            JOIN users u ON s.user_id = u.id 
            LEFT JOIN customers c ON s.customer_id = c.id
        `;
		const params = [];

		if (startDate && endDate) {
			sql += ` WHERE DATE(s.date) BETWEEN ? AND ?`;
			params.push(startDate, endDate);
		}

		sql += ` ORDER BY s.date DESC LIMIT ? OFFSET ?`;
		params.push(limit, offset);
		return await query(sql, params);
	}

	static async getSaleById(id) {
		const sale = await query(`
            SELECT s.*, u.username, c.name as customer_name, c.phone as customer_phone
            FROM sales s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `, [id]);

		if (!sale[0]) return null;

		const items = await query(`
            SELECT si.*, p.name as product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `, [id]);

		return { ...sale[0], items };
	}

	static async getTopPerformers(startDate, endDate, limit = 5) {
		let sql = `
            SELECT 
                p.name, 
                p.category, 
                SUM(si.quantity) as total_sold,
                SUM(si.quantity * si.price) as total_revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
        `;
		const params = [];

		if (startDate && endDate) {
			sql += ` WHERE DATE(s.date) BETWEEN ? AND ? `;
			params.push(startDate, endDate);
		}

		sql += `
            GROUP BY si.product_id
            ORDER BY total_sold DESC
            LIMIT ?
        `;
		params.push(limit);
		return await query(sql, params);
	}
}

module.exports = Sale;
