const express = require("express");
const router = express.Router();
const db = require("../db/database");

function isAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Користувач не авторизований" });
    }

    if (String(req.session.user.role).toLowerCase() !== "admin") {
        return res.status(403).json({ error: "Доступ лише для адміністратора" });
    }

    next();
}

router.get("/", (req, res) => {
    const sql = `
        SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.image,
    p.country,
    p.stock AS quantity,
    p.category_id,
    c.name AS category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.id DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post("/", isAdmin, (req, res) => {
    const {
        name,
        description,
        price,
        image,
        category_id,
        quantity
    } = req.body;

    const sql = `
        INSERT INTO products
        (name, description, price, image, category_id, stock)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            description,
            price,
            image,
            category_id || 1,
            quantity || 0
        ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                success: true,
                productId: result.insertId
            });
        }
    );
});

router.put("/:id", isAdmin, (req, res) => {
    const {
        name,
        description,
        price,
        image,
        category_id,
        quantity
    } = req.body;

    const sql = `
        UPDATE products
        SET name = ?,
            description = ?,
            price = ?,
            image = ?,
            category_id = ?,
            stock = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            description,
            price,
            image,
            category_id || 1,
            quantity || 0,
            req.params.id
        ],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

router.put("/:id/quantity", isAdmin, (req, res) => {
    const { quantity } = req.body;

    db.query(
        "UPDATE products SET stock = ? WHERE id = ?",
        [quantity, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

router.delete("/:id", isAdmin, (req, res) => {
    db.query(
        "DELETE FROM products WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

module.exports = router;