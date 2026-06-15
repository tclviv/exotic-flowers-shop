const roleNames = {
    CUSTOMER: "Покупець",
    ADMIN: "Адміністратор"
};

async function checkAdmin() {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (!data.loggedIn || data.user.role !== "ADMIN") {
        alert("Доступ дозволено лише адміністратору");
        window.location.href = "login.html";
    }
}

async function loadUsers() {
    const response = await fetch("/api/users");
    const users = await response.json();

    const box = document.getElementById("usersTable");

    if (!response.ok) {
        box.innerHTML = "<p>Немає доступу</p>";
        return;
    }

    let html = `
        <table class="admin-table">
            <tr>
                <th>ID</th>
                <th>Логін</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата реєстрації</th>
                <th>Дії</th>
            </tr>
    `;

    users.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${roleNames[user.role] || user.role}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <select onchange="changeRole(${user.id}, this.value)">
                        <option value="CUSTOMER" ${user.role === "CUSTOMER" ? "selected" : ""}>Покупець</option>
                        <option value="ADMIN" ${user.role === "ADMIN" ? "selected" : ""}>Адміністратор</option>
                    </select>

                    <button onclick="deleteUser(${user.id})">
                        Видалити
                    </button>
                </td>
            </tr>
        `;
    });

    html += "</table>";
    box.innerHTML = html;
}

async function changeRole(id, role) {
    const response = await fetch(`/api/users/${id}/role`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
    });

    const data = await response.json();

    if (data.success) {
        alert("Роль оновлено");
        loadUsers();
    } else {
        alert(data.message || "Помилка");
    }
}

async function deleteUser(id) {
    if (!confirm("Видалити користувача?")) return;

    const response = await fetch(`/api/users/${id}`, {
        method: "DELETE"
    });

    const data = await response.json();

    if (data.success) {
        alert("Користувача видалено");
        loadUsers();
    } else {
        alert(data.message || "Помилка видалення");
    }
}

async function logout() {
    await fetch("/api/auth/logout");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    await checkAdmin();
    await loadUsers();
});