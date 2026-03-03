const { query, run } = require('../config/database');

exports.getAll = async (req, res, next) => {
    try {
        const products = await query("SELECT * FROM products");
        res.json(products);
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    const { name, price, quantity, category, barcode } = req.body;
    try {
        await run(
            "INSERT INTO products (name, price, quantity, category, barcode) VALUES (?, ?, ?, ?, ?)",
            [name, price, quantity, category, barcode]
        );
        res.status(201).json({ success: true });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    const { name, price, quantity, category, barcode } = req.body;
    const { id } = req.params;

    try {
        if (price <= 0) throw new Error("Price must be greater than 0");
        if (quantity < 0) throw new Error("Quantity cannot be negative");

        const result = await run(
            "UPDATE products SET name=?, price=?, quantity=?, category=?, barcode=? WHERE id=?",
            [name, price, quantity, category, barcode, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, message: "Product updated successfully" });
    } catch (err) { 
        if (err.message.includes('UNIQUE constraint failed')) {
            err.message = "Barcode already exists for another product";
        }
        next(err); 
    }
};

exports.delete = async (req, res, next) => {
    try {
        const usage = await query("SELECT id FROM sale_items WHERE product_id = ? LIMIT 1", [req.params.id]);
        if (usage.length > 0) return res.status(400).json({ success: false, message: "Cannot delete: Product has sales history" });
        
        await run("DELETE FROM products WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) { next(err); }
};
