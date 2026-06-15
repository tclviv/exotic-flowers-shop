const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306)
});

db.connect(err => {
    if (err) {
        console.error("Помилка підключення до MySQL:", err);
        return;
    }

    console.log("MySQL підключено");
});

module.exports = db;
