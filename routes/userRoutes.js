const express = require("express");
const router = express.Router();
const db = require("../db/database");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads", "users");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user_${req.session.user.id}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Можна завантажувати тільки зображення"));
        }
        cb(null, true);
    }
});

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
function isAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Користувач не авторизований" });
    }
    next();
}

router.get("/me", isAuth, (req, res) => {
    const userId = req.session.user.id;

    const sql = `
        SELECT 
            id,
            username,
            email,
            role,
            COALESCE(phone, '') AS phone,
            COALESCE(address, '') AS address,
            COALESCE(photo, '') AS photo,
            created_at
        FROM users
        WHERE id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("GET PROFILE ERROR:", err);
            return res.status(500).json({ error: err.message });
        }

        if (!rows.length) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json(rows[0]);
    });
});

router.get("/me", isAuth, (req, res) => {
    db.query(
        "SELECT id, username, email, role, phone, address, photo, created_at FROM users WHERE id = ?",
        [req.session.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows.length) return res.status(404).json({ error: "Користувача не знайдено" });

            res.json(rows[0]);
        }
    );
});

router.put("/me", isAuth, upload.single("photo"), (req, res) => {
    const { username, email, phone, address } = req.body;
    const photo = req.file ? `/uploads/users/${req.file.filename}` : null;

    let sql = `
        UPDATE users 
        SET username = ?, email = ?, phone = ?, address = ?
    `;

    const params = [
        username,
        email,
        phone || "",
        address || ""
    ];

    if (photo) {
        sql += ", photo = ?";
        params.push(photo);
    }

    sql += " WHERE id = ?";
    params.push(req.session.user.id);

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        req.session.user.username = username;
        req.session.user.email = email;

        res.json({
            success: true,
            message: "Профіль оновлено",
            photo
        });
    });
});

router.get("/all", isAdmin, (req, res) => {
    db.query(
        "SELECT id, username, email, role, phone, address, photo, created_at FROM users ORDER BY id DESC",
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

router.put("/:id/role", isAdmin, (req, res) => {
    const { role } = req.body;

    db.query(
        "UPDATE users SET role = ? WHERE id = ?",
        [role, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                success: true,
                message: "Роль користувача оновлено"
            });
        }
    );
});

router.delete("/:id", isAdmin, (req, res) => {
    db.query(
        "DELETE FROM users WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                success: true,
                message: "Користувача видалено"
            });
        }
    );
});

module.exports = router;