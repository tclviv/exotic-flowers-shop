const bcrypt = require("bcryptjs");
const db = require("./db/database");

const username = "admin";
const password = "admin";

const hash = bcrypt.hashSync(password, 10);

db.query(
    `
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, 'ADMIN')
    ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        role = 'ADMIN'
    `,
    [username, "admin@gmail.com", hash],
    (err, result) => {
        if (err) {
            console.log("Помилка:", err.message);
        } else {
            console.log("Адміністратора оновлено");
            console.log("Логін: admin");
            console.log("Пароль: admin");
        }

        db.end();
    }
);