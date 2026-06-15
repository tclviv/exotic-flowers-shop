document.addEventListener("DOMContentLoaded", () => {
    loadCart();
});

async function loadCart() {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    try {

        const res = await fetch("/api/cart");
        const items = await res.json();

        console.log("CART DATA:", items);

        cartItems.innerHTML = "";

        if (!items.length) {
            cartItems.innerHTML = "<p>Кошик порожній</p>";
            cartTotal.textContent = "0 грн";
            return;
        }

        let total = 0;

        items.forEach(item => {

            const price = Number(item.price);
            const quantity = Number(item.quantity);
            const itemTotal = Number(item.total);

            total += itemTotal;

            cartItems.innerHTML += `
                <div class="cart-card">

                    <img src="${item.image}" alt="${item.name}">

                    <div class="cart-info">

                        <h3>${item.name}</h3>

                        <p>
                            Ціна:
                            ${price.toFixed(2)} грн
                        </p>

                        <div class="quantity-box">

                            <button
                                class="qty-btn"
                                onclick="changeCartQty(${item.cart_id}, -1)">
                                −
                            </button>

                            <span>${quantity}</span>

                            <button
                                class="qty-btn"
                                onclick="changeCartQty(${item.cart_id}, 1)">
                                +
                            </button>

                        </div>

                        <p>
                            <b>Разом:</b>
                            ${itemTotal.toFixed(2)} грн
                        </p>

                        <button
                            class="remove-btn"
                            onclick="removeFromCart(${item.cart_id})">
                            Видалити
                        </button>

                    </div>

                </div>
            `;
        });

        cartTotal.textContent =
            total.toFixed(2) + " грн";

    }
    catch(error) {

        console.error(error);

        cartItems.innerHTML =
            "<p>Помилка завантаження кошика</p>";
    }
}

async function removeFromCart(cartId) {

    await fetch("/api/cart/" + cartId, {
        method: "DELETE"
    });

    loadCart();
}

async function changeCartQty(cartId, change) {

    await fetch("/api/cart/update", {
        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            cart_id: cartId,
            change: change
        })
    });

    loadCart();
}