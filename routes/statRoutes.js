const express = require("express");
const router = express.Router();
const db = require("../db/database");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

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

router.get("/summary", isAdmin, (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users) AS totalUsers,
            (SELECT COUNT(*) FROM products) AS totalProducts,
            (SELECT COUNT(*) FROM orders) AS totalOrders,
            (SELECT IFNULL(SUM(total_price), 0) FROM orders) AS totalSales
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
    });
});

router.get("/sales-by-day", isAdmin, (req, res) => {
    const sql = `
        SELECT DATE(created_at) AS date, SUM(total_price) AS total
        FROM orders
        GROUP BY DATE(created_at)
        ORDER BY date
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get("/top-products", isAdmin, (req, res) => {
    const sql = `
        SELECT products.name, SUM(order_items.quantity) AS sold
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        GROUP BY products.id, products.name
        ORDER BY sold DESC
        LIMIT 10
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

function exportExcel(res, filename, columns, rows) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Звіт");

    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };

    rows.forEach(row => sheet.addRow(row));

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`
    );

    return workbook.xlsx.write(res).then(() => res.end());
}

function exportPDF(res, filename, title, columns, rows) {
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);

    doc.pipe(res);

    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown();

    rows.forEach((row, index) => {
        doc.fontSize(11).text(`№ ${index + 1}`);
        columns.forEach(col => {
            doc.text(`${col.header}: ${row[col.key] ?? "-"}`);
        });
        doc.moveDown();
    });

    doc.end();
}

router.get("/export/orders/excel", isAdmin, (req, res) => {
    const sql = `
        SELECT orders.id, users.username, users.email, orders.total_price, orders.status, orders.created_at
        FROM orders
        LEFT JOIN users ON orders.user_id = users.id
        ORDER BY orders.id DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        exportExcel(res, "orders_report", [
            { header: "ID", key: "id", width: 10 },
            { header: "Користувач", key: "username", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Сума", key: "total_price", width: 15 },
            { header: "Статус", key: "status", width: 18 },
            { header: "Дата", key: "created_at", width: 25 }
        ], rows);
    });
});

router.get("/export/orders/pdf", isAdmin, (req, res) => {
    const sql = `
        SELECT orders.id, users.username, users.email, orders.total_price, orders.status, orders.created_at
        FROM orders
        LEFT JOIN users ON orders.user_id = users.id
        ORDER BY orders.id DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        exportPDF(res, "orders_report", "Звіт по замовленнях", [
            { header: "ID", key: "id" },
            { header: "Користувач", key: "username" },
            { header: "Email", key: "email" },
            { header: "Сума", key: "total_price" },
            { header: "Статус", key: "status" },
            { header: "Дата", key: "created_at" }
        ], rows);
    });
});

router.get("/export/users/excel", isAdmin, (req, res) => {
    db.query(
        "SELECT id, username, email, role, phone, address, created_at FROM users ORDER BY id DESC",
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            exportExcel(res, "users_report", [
                { header: "ID", key: "id", width: 10 },
                { header: "Ім'я", key: "username", width: 25 },
                { header: "Email", key: "email", width: 30 },
                { header: "Роль", key: "role", width: 15 },
                { header: "Телефон", key: "phone", width: 20 },
                { header: "Адреса", key: "address", width: 35 },
                { header: "Дата", key: "created_at", width: 25 }
            ], rows);
        }
    );
});

router.get("/export/users/pdf", isAdmin, (req, res) => {
    db.query(
        "SELECT id, username, email, role, phone, address, created_at FROM users ORDER BY id DESC",
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            exportPDF(res, "users_report", "Звіт по користувачах", [
                { header: "ID", key: "id" },
                { header: "Ім'я", key: "username" },
                { header: "Email", key: "email" },
                { header: "Роль", key: "role" },
                { header: "Телефон", key: "phone" },
                { header: "Адреса", key: "address" },
                { header: "Дата", key: "created_at" }
            ], rows);
        }
    );
});

router.get("/export/products/excel", isAdmin, (req, res) => {
    db.query(
        "SELECT id, name, category, country, price, stock, created_at FROM products ORDER BY id DESC",
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            exportExcel(res, "products_report", [
                { header: "ID", key: "id", width: 10 },
                { header: "Назва", key: "name", width: 30 },
                { header: "Категорія", key: "category", width: 20 },
                { header: "Країна", key: "country", width: 20 },
                { header: "Ціна", key: "price", width: 15 },
                { header: "Залишок", key: "stock", width: 15 },
                { header: "Дата", key: "created_at", width: 25 }
            ], rows);
        }
    );
});

router.get("/export/products/pdf", isAdmin, (req, res) => {
    db.query(
        "SELECT id, name, category, country, price, stock, created_at FROM products ORDER BY id DESC",
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            exportPDF(res, "products_report", "Звіт по товарах", [
                { header: "ID", key: "id" },
                { header: "Назва", key: "name" },
                { header: "Категорія", key: "category" },
                { header: "Країна", key: "country" },
                { header: "Ціна", key: "price" },
                { header: "Залишок", key: "stock" },
                { header: "Дата", key: "created_at" }
            ], rows);
        }
    );
});

router.get("/export/my-orders/excel", isAuth, (req, res) => {
    db.query(
        "SELECT id, total_price, status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC",
        [req.session.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            exportExcel(res, "my_orders_report", [
                { header: "ID", key: "id", width: 10 },
                { header: "Сума", key: "total_price", width: 15 },
                { header: "Статус", key: "status", width: 18 },
                { header: "Дата", key: "created_at", width: 25 }
            ], rows);
        }
    );
});

router.get("/export/my-orders/pdf", isAuth, (req, res) => {
    db.query(
        "SELECT id, total_price, status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC",
        [req.session.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            exportPDF(res, "my_orders_report", "Мої замовлення", [
                { header: "ID", key: "id" },
                { header: "Сума", key: "total_price" },
                { header: "Статус", key: "status" },
                { header: "Дата", key: "created_at" }
            ], rows);
        }
    );
});

module.exports = router;