const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

function showMessage(text, color = "red") {
    if (!message) return;
    message.textContent = text;
    message.style.color = color;
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("LOGIN RESPONSE:", data);

            if (response.ok && data.success) {
                localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = "profile.html";
            } else {
                showMessage(data.message || data.error || "Помилка входу");
            }
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            showMessage("Помилка з'єднання із сервером");
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            console.log("REGISTER RESPONSE:", data);

            if (response.ok && data.success) {
                showMessage("Реєстрація успішна. Увійдіть у профіль.", "green");

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 800);
            } else {
                showMessage(data.message || data.error || "Помилка реєстрації");
            }
        } catch (error) {
            console.error("REGISTER ERROR:", error);
            showMessage("Помилка з'єднання із сервером");
        }
    });
}