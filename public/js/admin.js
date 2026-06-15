let productsCache = [];
let currentSection = "productsSection";

let salesChartInstance = null;
let topProductsChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkAdmin();
    initTabs();
    await loadCartCount();
    await showAdminSection("productsSection");
});

function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", async () => {
            await showAdminSection(button.dataset.section);
        });
    });
}

async function showAdminSection(sectionId) {
    currentSection = sectionId;
    closeModal();

    document.querySelectorAll(".admin-section").forEach(section => {
        section.style.display = "none";
    });

    document.querySelectorAll(".tab-btn").forEach(button => {
        button.classList.remove("active");
    });

    const section = document.getElementById(sectionId);
    if (section) section.style.display = "block";

    const activeButton = document.querySelector(`.tab-btn[data-section="${sectionId}"]`);
    if (activeButton) activeButton.classList.add("active");

    if (sectionId === "productsSection") await loadProducts();
    if (sectionId === "usersSection") await loadUsers();
    if (sectionId === "ordersSection") await loadOrders();

    if (sectionId === "statsSection") {
        await loadStats();
        await loadCharts();
    }
}

async function checkAdmin() {
    try {
        const res = await fetch("/api/auth/check", {
            credentials: "include"
        });

        const data = await res.json();

        if (!data.authenticated || !data.user) {
            window.location.href = "login.html";
            return;
        }

        if (String(data.user.role).toLowerCase() !== "admin") {
            alert("Доступ дозволено лише адміністратору");
            window.location.href = "index.html";
        }

    } catch (err) {
        console.error("CHECK ADMIN ERROR:", err);
        window.location.href = "login.html";
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

/* ================= ТОВАРИ ================= */

async function loadProducts() {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">Завантаження товарів...</td></tr>`;

    try {
        const res = await fetch("/api/products", {
            credentials: "include"
        });

        const products = await res.json();

        productsCache = Array.isArray(products) ? products : [];

        if (!productsCache.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-row">Товарів поки немає</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        productsCache.forEach(product => {
            tbody.innerHTML += `
                <tr>
                    <td>${product.id}</td>
                    <td>
                        <img src="${product.image || "img/no-image.png"}"
                             class="admin-img"
                             onerror="this.src='img/no-image.png'">
                    </td>
                    <td><b>${escapeHtml(product.name || "-")}</b></td>
                    <td>${escapeHtml(product.category || "-")}</td>
                    <td>${escapeHtml(product.country || "-")}</td>
                    <td>${Number(product.price || 0).toFixed(2)} грн</td>
                    <td>${product.quantity ?? product.stock ?? 0}</td>
                    <td>
                        <button onclick="openStockModal(${product.id})">📦 Залишок</button>
                        <button onclick="openEditProductModal(${product.id})">✏️ Редагувати</button>
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Видалити</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("LOAD PRODUCTS ERROR:", err);
        tbody.innerHTML = `<tr><td colspan="8" class="empty-row">Помилка завантаження товарів</td></tr>`;
    }
}

function openAddProductModal() {
    closeModal();

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-bg">
            <div class="modal-box product-modal">
                <h2>➕ Додати товар</h2>

                <label>Назва</label>
                <input id="productName" placeholder="Орхідея Фаленопсис">

                <label>ID категорії</label>
                <input id="productCategoryId" type="number" value="1">

                <label>Країна</label>
                <input id="productCountry" placeholder="Нідерланди">

                <label>Ціна</label>
                <input id="productPrice" type="number" min="0" step="0.01">

                <label>Залишок</label>
                <input id="productQuantity" type="number" min="0" value="1">

                <label>Фото</label>
                <input id="productImage" placeholder="img/orchid.jpg">

                <label>Опис</label>
                <textarea id="productDescription" placeholder="Опис товару"></textarea>

                <div class="modal-actions">
                    <button onclick="createProduct()">Зберегти</button>
                    <button onclick="closeModal()">Скасувати</button>
                </div>
            </div>
        </div>
    `);
}

async function createProduct() {
    const product = readProductForm();

    if (!validateProduct(product)) return;

    try {
        const res = await fetch("/api/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(product)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося додати товар");
            return;
        }

        closeModal();
        await loadProducts();

    } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        alert("Помилка додавання товару");
    }
}

function openEditProductModal(id) {
    const product = productsCache.find(p => Number(p.id) === Number(id));
    if (!product) return;

    closeModal();

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-bg">
            <div class="modal-box product-modal">
                <h2>✏️ Редагування товару</h2>

                <label>Назва</label>
                <input id="productName" value="${escapeHtml(product.name || "")}">

                <label>ID категорії</label>
                <input id="productCategoryId" type="number" value="${product.category_id || 1}">

                <label>Країна</label>
                <input id="productCountry" value="${escapeHtml(product.country || "")}">

                <label>Ціна</label>
                <input id="productPrice" type="number" min="0" step="0.01" value="${product.price || 0}">

                <label>Залишок</label>
                <input id="productQuantity" type="number" min="0" value="${product.quantity ?? product.stock ?? 0}">

                <label>Фото</label>
                <input id="productImage" value="${escapeHtml(product.image || "")}">

                <label>Опис</label>
                <textarea id="productDescription">${escapeHtml(product.description || "")}</textarea>

                <div class="modal-actions">
                    <button onclick="updateProduct(${product.id})">Зберегти</button>
                    <button onclick="closeModal()">Скасувати</button>
                </div>
            </div>
        </div>
    `);
}

async function updateProduct(id) {
    const product = readProductForm();

    if (!validateProduct(product)) return;

    try {
        const res = await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(product)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося оновити товар");
            return;
        }

        closeModal();
        await loadProducts();

    } catch (err) {
        console.error("UPDATE PRODUCT ERROR:", err);
        alert("Помилка оновлення товару");
    }
}

function openStockModal(id) {
    const product = productsCache.find(p => Number(p.id) === Number(id));
    if (!product) return;

    closeModal();

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-bg">
            <div class="modal-box">
                <h2>📦 Зміна залишку</h2>
                <h3>${escapeHtml(product.name || "Товар")}</h3>
                <p><b>Країна:</b> ${escapeHtml(product.country || "-")}</p>
                <p>Поточний залишок: ${product.quantity ?? product.stock ?? 0}</p>

                <input id="newQuantity" type="number" min="0" value="${product.quantity ?? product.stock ?? 0}">

                <div class="modal-actions">
                    <button onclick="updateQuantity(${product.id})">Зберегти</button>
                    <button onclick="closeModal()">Скасувати</button>
                </div>
            </div>
        </div>
    `);
}

async function updateQuantity(id) {
    const quantity = Number(document.getElementById("newQuantity").value);

    if (Number.isNaN(quantity) || quantity < 0) {
        alert("Введіть правильну кількість");
        return;
    }

    try {
        const res = await fetch(`/api/products/${id}/quantity`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                quantity
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося оновити залишок");
            return;
        }

        closeModal();
        await loadProducts();

    } catch (err) {
        console.error("UPDATE QUANTITY ERROR:", err);
        alert("Помилка оновлення залишку");
    }
}

async function deleteProduct(id) {
    if (!confirm("Видалити цей товар?")) return;

    try {
        const res = await fetch(`/api/products/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося видалити товар");
            return;
        }

        await loadProducts();

    } catch (err) {
        console.error("DELETE PRODUCT ERROR:", err);
        alert("Помилка видалення товару");
    }
}

function readProductForm() {
    return {
        name: document.getElementById("productName").value.trim(),
        category_id: Number(document.getElementById("productCategoryId").value),
        country: document.getElementById("productCountry").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        quantity: Number(document.getElementById("productQuantity").value),
        image: document.getElementById("productImage").value.trim(),
        description: document.getElementById("productDescription").value.trim()
    };
}

function validateProduct(product) {
    if (!product.name) {
        alert("Введіть назву товару");
        return false;
    }

    if (!product.country) {
        alert("Введіть країну походження");
        return false;
    }

    if (Number.isNaN(product.price) || product.price <= 0) {
        alert("Введіть правильну ціну");
        return false;
    }

    if (Number.isNaN(product.quantity) || product.quantity < 0) {
        alert("Введіть правильний залишок");
        return false;
    }

    return true;
}

/* ================= КОРИСТУВАЧІ ================= */

async function loadUsers() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Завантаження користувачів...</td></tr>`;

    try {
        const res = await fetch("/api/users/all", {
            credentials: "include"
        });

        const users = await res.json();

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Користувачів немає</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        users.forEach(user => {
            const role = String(user.role || "user").toLowerCase();

            tbody.innerHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td>${escapeHtml(user.username || "-")}</td>
                    <td>${escapeHtml(user.email || "-")}</td>
                    <td>
                        <select onchange="changeUserRole(${user.id}, this.value)">
                            <option value="user" ${role === "user" ? "selected" : ""}>Користувач</option>
                            <option value="admin" ${role === "admin" ? "selected" : ""}>Адміністратор</option>
                        </select>
                    </td>
                    <td>
                        <button class="delete-btn" onclick="deleteUser(${user.id})">🗑️ Видалити</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("LOAD USERS ERROR:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Помилка завантаження користувачів</td></tr>`;
    }
}

async function changeUserRole(id, role) {
    try {
        const res = await fetch(`/api/users/${id}/role`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                role
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося змінити роль");
            return;
        }

        await loadUsers();

    } catch (err) {
        console.error("CHANGE USER ROLE ERROR:", err);
        alert("Помилка зміни ролі");
    }
}

async function deleteUser(id) {
    if (!confirm("Видалити цього користувача?")) return;

    try {
        const res = await fetch(`/api/users/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося видалити користувача");
            return;
        }

        await loadUsers();

    } catch (err) {
        console.error("DELETE USER ERROR:", err);
        alert("Помилка видалення користувача");
    }
}

/* ================= ЗАМОВЛЕННЯ ================= */

async function loadOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Завантаження замовлень...</td></tr>`;

    try {
        const res = await fetch("/api/orders/all", {
            credentials: "include"
        });

        const orders = await res.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Замовлень поки немає</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        orders.forEach(order => {
            const status = String(order.status || "").toUpperCase();
            const statusClass = getOrderStatusClass(status);

            tbody.innerHTML += `
                <tr class="${statusClass}">
                    <td>${order.id}</td>
                    <td>${escapeHtml(order.username || "-")}</td>
                    <td>${escapeHtml(order.email || "-")}</td>
                    <td>${Number(order.total_price || 0).toFixed(2)} грн</td>
                    <td>${translateStatus(status)}</td>
                    <td>${formatDate(order.created_at)}</td>
                    <td>
                        <select onchange="updateOrderStatus(${order.id}, this.value)">
                            <option value="NEW" ${status === "NEW" ? "selected" : ""}>Нове</option>
                            <option value="PROCESSING" ${status === "PROCESSING" ? "selected" : ""}>Обробляється</option>
                            <option value="SHIPPED" ${status === "SHIPPED" ? "selected" : ""}>Відправлено</option>
                            <option value="COMPLETED" ${(status === "COMPLETED" || status === "DONE") ? "selected" : ""}>Виконано</option>
                            <option value="CANCELLED" ${status === "CANCELLED" ? "selected" : ""}>Скасовано</option>
                        </select>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("LOAD ORDERS ERROR:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Помилка завантаження замовлень</td></tr>`;
    }
}

async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`/api/orders/status/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                status
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Не вдалося змінити статус");
            return;
        }

        await loadOrders();

    } catch (err) {
        console.error("UPDATE ORDER STATUS ERROR:", err);
        alert("Помилка зміни статусу");
    }
}

/* ================= СТАТИСТИКА ================= */

async function loadStats() {
    try {
        const res = await fetch("/api/stats/summary", {
            credentials: "include"
        });

        const stats = await res.json();

        setText("usersCount", stats.totalUsers || 0);
        setText("productsCount", stats.totalProducts || 0);
        setText("ordersCount", stats.totalOrders || 0);
        setText("revenue", `${Number(stats.totalSales || 0).toFixed(2)} грн`);

    } catch (err) {
        console.error("LOAD STATS ERROR:", err);
    }
}

async function loadCharts() {
    try {
        const salesRes = await fetch("/api/stats/sales-by-day", {
            credentials: "include"
        });

        const sales = await salesRes.json();

        const topRes = await fetch("/api/stats/top-products", {
            credentials: "include"
        });

        const top = await topRes.json();

        if (salesChartInstance) salesChartInstance.destroy();
        if (topProductsChartInstance) topProductsChartInstance.destroy();

        const salesCanvas = document.getElementById("salesChart");
        const topCanvas = document.getElementById("topProductsChart");

        if (salesCanvas && window.Chart) {
            salesChartInstance = new Chart(salesCanvas, {
                type: "line",
                data: {
                    labels: Array.isArray(sales) ? sales.map(i => formatDate(i.date)) : [],
                    datasets: [{
                        label: "Продажі, грн",
                        data: Array.isArray(sales) ? sales.map(i => Number(i.total || 0)) : []
                    }]
                }
            });
        }

        if (topCanvas && window.Chart) {
            topProductsChartInstance = new Chart(topCanvas, {
                type: "bar",
                data: {
                    labels: Array.isArray(top) ? top.map(i => i.name) : [],
                    datasets: [{
                        label: "Продано",
                        data: Array.isArray(top) ? top.map(i => Number(i.sold || 0)) : []
                    }]
                }
            });
        }

    } catch (err) {
        console.error("LOAD CHARTS ERROR:", err);
    }
}

/* ================= ЕКСПОРТ ================= */

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

        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: defaultName
            });

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            alert("Звіт успішно збережено");
            return;
        }

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

function exportOrdersExcel() {
    downloadReport("/api/stats/export/orders/excel", "orders_report.xlsx");
}

function exportOrdersPDF() {
    downloadReport("/api/stats/export/orders/pdf", "orders_report.pdf");
}

function exportUsersExcel() {
    downloadReport("/api/stats/export/users/excel", "users_report.xlsx");
}

function exportUsersPDF() {
    downloadReport("/api/stats/export/users/pdf", "users_report.pdf");
}

function exportProductsExcel() {
    downloadReport("/api/stats/export/products/excel", "products_report.xlsx");
}

function exportProductsPDF() {
    downloadReport("/api/stats/export/products/pdf", "products_report.pdf");
}

/* ================= ДОПОМІЖНІ ================= */

function closeModal() {
    document.querySelectorAll(".modal-bg").forEach(modal => modal.remove());
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getOrderStatusClass(status) {
    switch (String(status || "").toUpperCase()) {
        case "NEW":
            return "order-new";

        case "PROCESSING":
            return "order-processing";

        case "SHIPPED":
            return "order-shipped";

        case "DONE":
        case "COMPLETED":
            return "order-completed";

        case "CANCELLED":
            return "order-cancelled";

        default:
            return "";
    }
}

function translateStatus(status) {
    switch (String(status || "").toUpperCase()) {
        case "NEW":
            return "Нове";

        case "PROCESSING":
            return "Обробляється";

        case "SHIPPED":
            return "Відправлено";

        case "DONE":
        case "COMPLETED":
            return "Виконано";

        case "CANCELLED":
            return "Скасовано";

        default:
            return status || "-";
    }
}

function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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