document.addEventListener("DOMContentLoaded", () => {
    loadCheckoutCart();

    const form = document.getElementById("checkoutForm");
    form.addEventListener("submit", submitOrder);
});

async function loadCheckoutCart() {
    const checkoutItems = document.getElementById("checkoutItems");
    const checkoutTotal = document.getElementById("checkoutTotal");

    try {
        const res = await fetch("/api/cart");
        const items = await res.json();

        checkoutItems.innerHTML = "";

        if (!items.length) {
            checkoutItems.innerHTML = "<p>Кошик порожній</p>";
            checkoutTotal.textContent = "0 грн";
            return;
        }

        let total = 0;

        items.forEach(item => {
            const price = Number(item.price);
            const quantity = Number(item.quantity);
            const itemTotal = Number(item.total);

            total += itemTotal;

            checkoutItems.innerHTML += `
                <div class="checkout-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div>
                        <h4>${item.name}</h4>
                        <p>${quantity} × ${price.toFixed(2)} грн</p>
                        <b>${itemTotal.toFixed(2)} грн</b>
                    </div>
                </div>
            `;
        });

        checkoutTotal.textContent = total.toFixed(2) + " грн";
    } catch (error) {
        console.error(error);
        checkoutItems.innerHTML = "<p>Помилка завантаження замовлення</p>";
    }
}

async function submitOrder(event) {
    event.preventDefault();

    const data = {
        customer_name: document.getElementById("customerName").value,
        phone: document.getElementById("phone").value,
        city: document.getElementById("city").value,
        address: document.getElementById("address").value,
        comment: document.getElementById("comment").value
    };

    try {
        const res = await fetch("/api/orders/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.error || "Помилка оформлення замовлення");
            return;
        }

        alert("Замовлення успішно оформлено!");
        window.location.href = "profile.html";
    } catch (error) {
        console.error(error);
        alert("Помилка з'єднання з сервером");
    }
}