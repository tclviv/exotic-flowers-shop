const express = require("express");
const router = express.Router();
const db = require("../db/database");

function isAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Користувач не авторизований" });
    }
    next();
}

function isAdmin(req, res, next) {
    if (!req.session.user || String(req.session.user.role).toLowerCase() !== "admin") {
        return res.status(403).json({ error: "Доступ заборонено" });
    }
    next();
}

router.post("/create", isAuth, (req, res) => {
    const userId = req.session.user.id;

    const {
        customer_name,
        phone,
        city,
        address,
        comment
    } = req.body;

    const cartSql = `
        SELECT
            cart.product_id,
            cart.quantity,
            products.price
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    `;

    db.query(cartSql, [userId], (err, cartItems) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!cartItems.length) {
            return res.status(400).json({ error: "Кошик порожній" });
        }

        const total = cartItems.reduce((sum, item) => {
            return sum + Number(item.price) * Number(item.quantity);
        }, 0);

        const orderSql = `
            INSERT INTO orders
            (user_id, full_name, phone, city, address, comment, total_price, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            orderSql,
            [
                userId,
                customer_name,
                phone,
                city,
                address,
                comment,
                total,
                "NEW"
            ],
            (err2, result) => {
                if (err2) return res.status(500).json({ error: err2.message });

                const orderId = result.insertId;

                const values = cartItems.map(item => [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price
                ]);

                db.query(
                    "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
                    [values],
                    (err3) => {
                        if (err3) return res.status(500).json({ error: err3.message });

                        db.query(
                            "DELETE FROM cart WHERE user_id = ?",
                            [userId],
                            (err4) => {
                                if (err4) return res.status(500).json({ error: err4.message });

                                res.json({
                                    success: true,
                                    order_id: orderId,
                                    total
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

router.get("/my", isAuth, (req, res) => {
    const userId = req.session.user.id;

    db.query(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

router.get("/all", isAdmin, (req, res) => {
    const sql = `
        SELECT 
            orders.id,
            users.username,
            users.email,
            orders.total_price,
            orders.status,
            orders.created_at
        FROM orders
        JOIN users ON orders.user_id = users.id
        ORDER BY orders.created_at DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.put("/status/:id", isAdmin, (req, res) => {
    const { status } = req.body;

    db.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Статус оновлено" });
        }
    );
});

module.exports = router;