const statusNames = {
    NEW: "Нове",
    PROCESSING: "В обробці",
    SHIPPED: "Відправлено",
    COMPLETED: "Виконано",
    CANCELLED: "Скасовано"
};

async function loadOrders() {
    const response = await fetch("/api/orders/my");
    const orders = await response.json();

    const list = document.getElementById("ordersList");
    list.innerHTML = "";

    if (!response.ok) {
        alert(orders.message || "Потрібно увійти в систему");
        window.location.href = "login.html";
        return;
    }

    if (!orders || orders.length === 0) {
        list.innerHTML = "<p>Замовлень ще немає</p>";
        return;
    }

    orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-card";

        div.innerHTML = `
            <h3>Замовлення №${order.id}</h3>
            <p><strong>Отримувач:</strong> ${order.full_name}</p>
            <p><strong>Телефон:</strong> ${order.phone}</p>
            <p><strong>Адреса:</strong> ${order.address}</p>
            <p><strong>Сума:</strong> ${order.total_price} грн</p>
            <p><strong>Статус:</strong> ${statusNames[order.status] || order.status}</p>
            <p><strong>Дата:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        `;

        list.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", loadOrders);