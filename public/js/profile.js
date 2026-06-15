let currentProfileUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkProfileAuth();
    await loadProfileOrdersReport();
    await loadCartCount();
});

async function checkProfileAuth() {
    try {
        const res = await fetch("/api/users/me", {
            credentials: "include"
        });

        const user = await res.json();

        if (!res.ok) {
            console.error("USER PROFILE ERROR:", user);
            window.location.href = "login.html";
            return;
        }

        currentProfileUser = user;
        renderProfile(user);

        const adminLink = document.getElementById("adminLink");
        if (adminLink) {
            adminLink.style.display =
                String(user.role).toLowerCase() === "admin"
                    ? "inline-block"
                    : "none";
        }

    } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);
    }
}

function renderProfile(user) {
    setText("profileUsername", user.username || "Користувач");
    setText("profileEmail", user.email || "-");

    setText("userName", user.username || "-");
    setText("userEmail", user.email || "-");
    setText("userPhone", user.phone || "-");
    setText("userAddress", user.address || "-");
    setText("userRole", translateRole(user.role));

    const avatar = document.getElementById("profilePhoto");

    if (avatar) {
        if (user.photo && user.photo.trim()) {
            avatar.innerHTML = `
                <img 
                    src="${user.photo}" 
                    alt="Фото користувача" 
                    class="profile-photo"
                >
            `;
        } else {
            avatar.textContent = "👤";
        }
    }
}

async function loadProfileOrdersReport() {
    const tbody = document.getElementById("profileOrdersTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="empty-row">Завантаження замовлень...</td>
        </tr>
    `;

    try {
        const res = await fetch("/api/orders/my", {
            credentials: "include"
        });

        const orders = await res.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-row">У вас ще немає замовлень</td>
                </tr>
            `;

            setText("myOrdersCount", "0");
            setText("myTotalSpent", "0 грн");
            setText("clientStatus", "Новий");
            return;
        }

        let total = 0;
        let completedCount = 0;

        tbody.innerHTML = "";

        orders.forEach(order => {
            const status = String(order.status || "").toUpperCase();
            const price = Number(order.total_price || 0);

            total += price;

            if (status === "DONE" || status === "COMPLETED") {
                completedCount++;
            }

            tbody.innerHTML += `
                <tr class="${getOrderStatusClass(status)}">
                    <td>${order.id}</td>
                    <td>${price.toFixed(2)} грн</td>
                    <td>${translateStatus(status)}</td>
                    <td>${formatDate(order.created_at)}</td>
                </tr>
            `;
        });

        setText("myOrdersCount", orders.length);
        setText("myTotalSpent", `${total.toFixed(2)} грн`);
        setText("clientStatus", getClientStatus(total, orders.length, completedCount));

    } catch (err) {
        console.error("PROFILE ORDERS ERROR:", err);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-row">Помилка завантаження замовлень</td>
            </tr>
        `;

        setText("myOrdersCount", "0");
        setText("myTotalSpent", "0 грн");
        setText("clientStatus", "Новий");
    }
}

async function loadCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (!cartCount) return;

    try {
        const res = await fetch("/api/cart/count", {
            credentials: "include"
        });

        const data = await res.json();
        cartCount.textContent = data.count || 0;

    } catch (err) {
        console.error("CART COUNT ERROR:", err);
        cartCount.textContent = 0;
    }
}

function openEditProfileModal() {
    if (!currentProfileUser) {
        alert("Дані профілю ще не завантажені");
        return;
    }

    document.getElementById("editUsername").value = currentProfileUser.username || "";
    document.getElementById("editEmail").value = currentProfileUser.email || "";
    document.getElementById("editPhone").value = currentProfileUser.phone || "";
    document.getElementById("editAddress").value = currentProfileUser.address || "";

    document.getElementById("editProfileModal").style.display = "flex";
}

function closeEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "none";
}

document.addEventListener("submit", async (e) => {
    if (e.target.id !== "editProfileForm") return;

    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const res = await fetch("/api/users/me", {
            method: "PUT",
            credentials: "include",
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Помилка оновлення профілю");
            return;
        }

        alert("Профіль оновлено");
        closeEditProfileModal();

        await checkProfileAuth();

    } catch (err) {
        console.error("PROFILE UPDATE ERROR:", err);
        alert("Помилка оновлення профілю");
    }
});

async function downloadReport(url, defaultName) {
    try {
        const res = await fetch(url, {
            credentials: "include"
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.error || "Помилка експорту");
            return;
        }

        const blob = await res.blob();

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (err) {
        console.error("EXPORT ERROR:", err);
        alert("Не вдалося експортувати звіт");
    }
}

function exportMyOrdersExcel() {
    downloadReport("/api/stats/export/my-orders/excel", "my_orders_report.xlsx");
}

function exportMyOrdersPDF() {
    downloadReport("/api/stats/export/my-orders/pdf", "my_orders_report.pdf");
}

async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (err) {
        console.error("LOGOUT ERROR:", err);
    }

    window.location.href = "index.html";
}

function getOrderStatusClass(status) {
    switch (String(status || "").toUpperCase()) {
        case "NEW": return "order-new";
        case "PROCESSING": return "order-processing";
        case "SHIPPED": return "order-shipped";
        case "DONE":
        case "COMPLETED": return "order-completed";
        case "CANCELLED": return "order-cancelled";
        default: return "";
    }
}

function translateStatus(status) {
    switch (String(status || "").toUpperCase()) {
        case "NEW": return "Нове";
        case "PROCESSING": return "Обробляється";
        case "SHIPPED": return "Відправлено";
        case "DONE":
        case "COMPLETED": return "Виконано";
        case "CANCELLED": return "Скасовано";
        default: return status || "-";
    }
}

function translateRole(role) {
    switch (String(role || "").toLowerCase()) {
        case "admin": return "Адміністратор";
        case "user": return "Користувач";
        default: return role || "-";
    }
}

function getClientStatus(total, ordersCount, completedCount) {
    if (total >= 10000 || completedCount >= 8) return "VIP";
    if (total >= 5000 || completedCount >= 4) return "Постійний";
    if (ordersCount > 0) return "Активний";
    return "Новий";
}

function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}