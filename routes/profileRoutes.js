const express = require("express");
const router = express.Router();
const db = require("../db/database");

function isAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Потрібно увійти в систему"
        });
    }

    next();
}

router.get("/", isAuth, (req, res) => {
    const userId = req.session.user.id;

    db.query(
        `
        SELECT id, username, email, role, created_at
        FROM users
        WHERE id = ?
        `,
        [userId],
        (err, users) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            db.query(
                `
                SELECT 
                    COUNT(*) AS ordersCount,
                    IFNULL(SUM(total_price), 0) AS totalSpent
                FROM orders
                WHERE user_id = ?
                `,
                [userId],
                (err, stats) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: err.message });
                    }

                    res.json({
                        success: true,
                        user: users[0],
                        stats: stats[0]
                    });
                }
            );
        }
    );
});

module.exports = router;