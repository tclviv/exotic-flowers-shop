const bcrypt = require("bcryptjs");
const db = require("./db/database");

const adminHash = bcrypt.hashSync("AdminFlower2026!", 10);
const userHash = bcrypt.hashSync("UserFlower2026!", 10);

db.query(
    "UPDATE users SET password=? WHERE username='admin'",
    [adminHash],
    (err) => {
        if (err) console.log(err.message);

        db.query(
            "UPDATE users SET password=? WHERE role='CUSTOMER'",
            [userHash],
            (err) => {
                if (err) console.log(err.message);
                else {
                    console.log("Паролі оновлено");
                    console.log("admin / AdminFlower2026!");
                    console.log("user1 / UserFlower2026!");
                }

                db.end();
            }
        );
    }
);
