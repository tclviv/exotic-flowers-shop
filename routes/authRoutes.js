const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../db/database");

// ===============================
// РЕЄСТРАЦІЯ
// ===============================
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: "Заповніть усі поля"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [username, email, hashedPassword, "user"],
            (err, result) => {

                if (err) {

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            success: false,
                            error: "Користувач з таким email вже існує"
                        });
                    }

                    console.error("REGISTER ERROR:", err);

                    return res.status(500).json({
                        success: false,
                        error: "Помилка реєстрації"
                    });
                }

                res.json({
                    success: true,
                    message: "Реєстрація успішна",
                    userId: result.insertId
                });
            }
        );

    } catch (err) {

        console.error("REGISTER SERVER ERROR:", err);

        res.status(500).json({
            success: false,
            error: "Помилка сервера"
        });
    }
});

// ===============================
// ВХІД
// ===============================
router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Введіть email і пароль"
        });
    }

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
    `;

    db.query(sql, [email], async (err, rows) => {

        if (err) {
            console.error("LOGIN DB ERROR:", err);

            return res.status(500).json({
                success: false,
                error: "Помилка входу"
            });
        }

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                error: "Невірний email або пароль"
            });
        }

        const user = rows[0];

        let passwordOk = false;

        try {

            if (
                typeof user.password === "string" &&
                user.password.startsWith("$2")
            ) {
                passwordOk = await bcrypt.compare(
                    password,
                    user.password
                );
            } else {
                passwordOk = password === user.password;
            }

        } catch (e) {
            console.error("BCRYPT ERROR:", e);
        }

        if (!passwordOk) {
            return res.status(401).json({
                success: false,
                error: "Невірний email або пароль"
            });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: String(user.role || "user").toLowerCase()
        };

        req.session.save((err) => {

            if (err) {
                console.error("SESSION SAVE ERROR:", err);

                return res.status(500).json({
                    success: false,
                    error: "Помилка збереження сесії"
                });
            }

            res.json({
                success: true,
                message: "Вхід успішний",
                user: req.session.user
            });
        });
    });
});

// ===============================
// ПЕРЕВІРКА АВТОРИЗАЦІЇ
// ===============================
router.get("/check", (req, res) => {

    if (req.session && req.session.user) {

        return res.json({
            success: true,
            authenticated: true,
            user: req.session.user
        });
    }

    res.json({
        success: false,
        authenticated: false,
        user: null
    });
});

// ===============================
// ВИХІД
// ===============================
router.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.error("LOGOUT ERROR:", err);

            return res.status(500).json({
                success: false,
                error: "Помилка виходу"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Вихід виконано"
        });
    });
});

module.exports = router;