let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentUser();
    await loadFlowers();
    await loadCartCount();
});

// ===============================
// Перевірка користувача
// ===============================
async function loadCurrentUser() {
    try {
        const res = await fetch("/api/auth/check", {
            credentials: "include"
        });

        const data = await res.json();

        currentUser = data.authenticated && data.user ? data.user : null;
        updateHeader();

    } catch (error) {
        console.error("Помилка перевірки користувача:", error);
        currentUser = null;
        updateHeader();
    }
}

// ===============================
// Оновлення шапки
// ===============================
function updateHeader() {
    const nameBlock = document.getElementById("currentUserName");
    const profileBtn = document.getElementById("profileBtn");
    const cartBtn = document.getElementById("cartBtn");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const adminBtn = document.getElementById("adminBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const authBlock = document.getElementById("authBlock");

    if (currentUser) {
        const username = currentUser.username || currentUser.name || currentUser.email || "користувач";

        if (nameBlock) nameBlock.textContent = "👤 " + username;
        if (profileBtn) profileBtn.style.display = "inline-block";
        if (cartBtn) cartBtn.style.display = "inline-block";
        if (checkoutBtn) checkoutBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (authBlock) authBlock.style.display = "none";

        if (adminBtn) {
            adminBtn.style.display =
                String(currentUser.role).toLowerCase() === "admin"
                    ? "inline-block"
                    : "none";
        }

    } else {
        if (nameBlock) nameBlock.textContent = "";
        if (profileBtn) profileBtn.style.display = "none";
        if (cartBtn) cartBtn.style.display = "none";
        if (checkoutBtn) checkoutBtn.style.display = "none";
        if (adminBtn) adminBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (authBlock) authBlock.style.display = "flex";
    }
}

// ===============================
// Завантаження квітів
// ===============================
async function loadFlowers() {
    const container =
        document.getElementById("flowersContainer") ||
        document.getElementById("productsContainer");

    if (!container) return;

    try {
        const res = await fetch("/api/products", {
            credentials: "include"
        });

        const flowers = await res.json();

        if (!res.ok) {
            container.innerHTML = "<p>Помилка завантаження товарів</p>";
            return;
        }

        container.innerHTML = "";

        if (!flowers || flowers.length === 0) {
            container.innerHTML = "<p>Товари поки не додані</p>";
            return;
        }

        flowers.forEach(flower => {
            const card = document.createElement("div");
            card.className = "flower-card";

            const image = flower.image || "images/no-image.png";
            const country = flower.country || flower.country_of_origin || "-";

            card.innerHTML = `
                <div class="flower-image-box">
                    <img 
                        src="${image}" 
                        alt="${flower.name || "Квітка"}"
                        onerror="this.src='images/no-image.png'"
                    >
                </div>

                <div class="flower-card-content">
                    <h3>${flower.name || "Без назви"}</h3>

                    <p class="flower-description">
                        ${flower.description || "Розкішна екзотична квітка для дому або подарунка."}
                    </p>

                    <p class="flower-country">
                        🌍 <b>Країна:</b> ${country}
                    </p>

                    <p class="price">
                        ${Number(flower.price || 0).toFixed(2)} грн
                    </p>

                    <div class="quantity-box">
                        <button class="qty-btn" onclick="changeQty(${flower.id}, -1)">−</button>
                        <span id="qty-${flower.id}">1</span>
                        <button class="qty-btn" onclick="changeQty(${flower.id}, 1)">+</button>
                    </div>

                    <button class="cart-btn" onclick="addToCart(${flower.id})">
                        🛒 Додати до кошика
                    </button>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("FLOWERS ERROR:", error);
        container.innerHTML = "<p>Не вдалося завантажити квіти</p>";
    }
}

// ===============================
// Кількість товару
// ===============================
function changeQty(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    if (!qtyElement) return;

    let qty = Number(qtyElement.textContent) || 1;
    qty += change;

    if (qty < 1) qty = 1;
    if (qty > 20) qty = 20;

    qtyElement.textContent = qty;
}

// ===============================
// Додавання в кошик
// ===============================
async function addToCart(productId) {
    if (!currentUser) {
        alert("Спочатку увійдіть у систему");
        window.location.href = "login.html";
        return;
    }

    const qtyElement = document.getElementById(`qty-${productId}`);
    const quantity = qtyElement ? Number(qtyElement.textContent) || 1 : 1;

    try {
        const res = await fetch("/api/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || data.message || "Помилка додавання до кошика");
            return;
        }

        await loadCartCount();

        showAddToCartModal();

    } catch (error) {
        console.error("CART ERROR:", error);
        alert("Помилка підключення до сервера");
    }
}

// ===============================
// Лічильник кошика
// ===============================
async function loadCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (!cartCount) return;

    if (!currentUser) {
        cartCount.textContent = "0";
        return;
    }

    try {
        const res = await fetch("/api/cart", {
            credentials: "include"
        });

        const items = await res.json();

        if (!res.ok || !Array.isArray(items)) {
            cartCount.textContent = "0";
            return;
        }

        const total = items.reduce((sum, item) => {
            return sum + Number(item.quantity || 0);
        }, 0);

        cartCount.textContent = total;

    } catch (error) {
        console.error("CART COUNT ERROR:", error);
        cartCount.textContent = "0";
    }
}

// ===============================
// Навігація
// ===============================
function goProfile() {
    window.location.href = "profile.html";
}

function goCart() {
    window.location.href = "cart.html";
}

function goCheckout() {
    window.location.href = "checkout.html";
}

function goAdmin() {
    if (!currentUser || String(currentUser.role).toLowerCase() !== "admin") {
        alert("Доступ лише для адміністратора");
        return;
    }

    window.location.href = "admin.html";
}

// ===============================
// Вихід
// ===============================
async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
    }

    localStorage.removeItem("user");
    currentUser = null;
    updateHeader();

    window.location.href = "index.html";
}
async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Введіть email і пароль");
        return;
    }

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.error || data.message || "Помилка входу");
            return;
        }

        currentUser = data.user;
        updateHeader();
        await loadCartCount();

        alert("Вхід успішний");

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        alert("Помилка з'єднання з сервером");
    }
}

async function register() {
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!username || !email || !password) {
        alert("Заповніть усі поля");
        return;
    }

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.error || data.message || "Помилка реєстрації");
            return;
        }

        alert("Реєстрація успішна. Тепер увійдіть.");

        document.getElementById("regUsername").value = "";
        document.getElementById("regEmail").value = "";
        document.getElementById("regPassword").value = "";

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        alert("Помилка з'єднання з сервером");
    }
}
function showAddToCartModal() {

    const oldModal = document.getElementById("cartSuccessModal");

    if (oldModal) {
        oldModal.remove();
    }

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-bg" id="cartSuccessModal">

            <div class="modal-box success-modal">

                <div class="success-icon">
                    🛒
                </div>

                <h2>Товар додано до кошика</h2>

                <p>
                    Оберіть подальшу дію
                </p>

                <div class="modal-actions">

                    <button
                        class="btn-secondary"
                        onclick="closeCartSuccessModal()">
                        Продовжити покупки
                    </button>

                    <button
                        class="btn-main"
                        onclick="goToCartFromModal()">
                        Перейти в кошик
                    </button>

                </div>

            </div>

        </div>
    `);
}

function closeCartSuccessModal() {
    const modal = document.getElementById("cartSuccessModal");

    if (modal) {
        modal.remove();
    }
}

function goToCartFromModal() {
    window.location.href = "cart.html";
}