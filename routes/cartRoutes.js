const express = require("express");
const router = express.Router();
const db = require("../db/database");

function isAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Користувач не авторизований" });
    }
    next();
}

router.get("/", isAuth, (req, res) => {
    const userId = req.session.user.id;

    const sql = `
        SELECT 
            c.id AS cart_id,
            c.product_id,
            COALESCE(p.name, CONCAT('Товар ID ', c.product_id)) AS name,
            COALESCE(p.price, 0) AS price,
            COALESCE(p.image, 'img/no-image.png') AS image,
            c.quantity,
            COALESCE(p.price, 0) * c.quantity AS total
        FROM cart c
        LEFT JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post("/add", isAuth, (req, res) => {
    const userId = req.session.user.id;
    const productId = req.body.product_id || req.body.productId;
    const qty = Number(req.body.quantity) || 1;

    if (!productId || qty < 1) {
        return res.status(400).json({ error: "Некоректні дані товару" });
    }

    db.query(
        "SELECT id FROM products WHERE id = ?",
        [productId],
        (err0, products) => {
            if (err0) return res.status(500).json({ error: err0.message });

            if (!products.length) {
                return res.status(404).json({ error: "Товар не знайдено" });
            }

            db.query(
                "SELECT id FROM cart WHERE user_id = ? AND product_id = ?",
                [userId, productId],
                (err, rows) => {
                    if (err) return res.status(500).json({ error: err.message });

                    if (rows.length > 0) {
                        db.query(
                            "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
                            [qty, userId, productId],
                            (err2) => {
                                if (err2) return res.status(500).json({ error: err2.message });
                                res.json({ success: true, message: "Кількість оновлено" });
                            }
                        );
                    } else {
                        db.query(
                            "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
                            [userId, productId, qty],
                            (err3) => {
                                if (err3) return res.status(500).json({ error: err3.message });
                                res.json({ success: true, message: "Товар додано" });
                            }
                        );
                    }
                }
            );
        }
    );
});

router.put("/update", isAuth, (req, res) => {
    const userId = req.session.user.id;
    const { cart_id, change } = req.body;

    db.query(
        "UPDATE cart SET quantity = quantity + ? WHERE id = ? AND user_id = ?",
        [Number(change), cart_id, userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(
                "DELETE FROM cart WHERE id = ? AND user_id = ? AND quantity <= 0",
                [cart_id, userId],
                (err2) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    res.json({ success: true });
                }
            );
        }
    );
});

router.delete("/:cartId", isAuth, (req, res) => {
    const userId = req.session.user.id;
    const cartId = req.params.cartId;

    db.query(
        "DELETE FROM cart WHERE id = ? AND user_id = ?",
        [cartId, userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Товар у кошику не знайдено" });
            }

            res.json({ success: true, message: "Товар видалено" });
        }
    );
});

router.delete("/", isAuth, (req, res) => {
    const userId = req.session.user.id;

    db.query(
        "DELETE FROM cart WHERE user_id = ?",
        [userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Кошик очищено" });
        }
    );
});

module.exports = router;