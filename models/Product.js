const { query, run } = require('../config/database');

class Product {
	static async getMany(activeOnly = false, limit = 100, offset = 0) {
		let sql = "SELECT * FROM products";
		if (activeOnly) sql += " WHERE isActive = 1";
		sql += " ORDER BY name ASC LIMIT ? OFFSET ?";
		return await query(sql, [limit, offset]);
	}

	static async getOne(id) {
		const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
		return rows[0];
	}

	static async create(data) {
		const { name, price, quantity, category, barcode } = data;
		return await run(
			"INSERT INTO products (name, price, quantity, category, barcode) VALUES (?, ?, ?, ?, ?)",
			[name, price, quantity, category, barcode]
		);
	}

	static async update(id, data) {
		const { name, price, quantity, category, barcode } = data;
		return await run(
			"UPDATE products SET name=?, price=?, quantity=?, category=?, barcode=? WHERE id=?",
			[name, price, quantity, category, barcode, id]
		);
	}

	static async delete(id) {
		const usage = await query("SELECT id FROM sale_items WHERE product_id = ? LIMIT 1", [id]);
		if (usage.length > 0) throw new Error("Cannot delete: Product has sales history");

		return await run("DELETE FROM products WHERE id = ?", [id]);
	}

	static async toggleStatus(id) {
		return await run("UPDATE products SET isActive = 1 - isActive WHERE id = ?", [id]);
	}

	static async getInventorySummary() {
		const result = await query(`
            SELECT 
                SUM(quantity) as total_stock,
                SUM(price * quantity) as total_value,
                COUNT(*) as item_count
            FROM products
            WHERE isActive = 1
        `);
		return result[0];
	}
}

module.exports = Product;
