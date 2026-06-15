const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "123456789",
    database: "flower_shop_db",
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("Помилка підключення до MySQL:", err);
        return;
    }

    console.log("MySQL підключено");
});

module.exports = db;