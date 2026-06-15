const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "mysql://root:ubzMjiHxTPgyMqqiWijvjBCEcAnUnYjp@mainline.proxy.rlwy.net:18426/railway",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "ubzMjiHxTPgyMqiWi1jvjBCEcAnUnYjp",
    database: process.env.DB_NAME || "railway",
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error("Помилка підключення до MySQL:", err);
        return;
    }

    console.log("MySQL підключено");
});

module.exports = db;
