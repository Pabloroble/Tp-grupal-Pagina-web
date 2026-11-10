const CART_STORAGE_KEY = "umineko-shop-cart";
const cartCount = document.querySelector("[data-cart-count]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartStatus = document.querySelector("[data-cart-status]");
let storageAvailable = true;

function showStorageMessage(message) {
    cartStatus.textContent = message;
}

function loadCart() {
    try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!storedCart) return [];

        const parsedCart = JSON.parse(storedCart);
        if (!Array.isArray(parsedCart)) {
            throw new TypeError("El contenido guardado del carrito no es válido.");
        }

        return parsedCart.filter((item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.image === "string" &&
            Number.isFinite(item.price) &&
            item.price >= 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        );
    } catch (error) {
        storageAvailable = false;
        console.error("No se pudo recuperar el carrito guardado.", error);
        showStorageMessage("No se pudo recuperar el carrito guardado. Funcionará hasta que cierres esta página.");
        return [];
    }
}

let cart = loadCart();

function saveCart() {
    if (!storageAvailable) return false;

    try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        return true;
    } catch (error) {
        storageAvailable = false;
        console.error("No se pudo guardar el carrito en este navegador.", error);
        showStorageMessage("No se pudo guardar el carrito. Funcionará hasta que cierres esta página.");
        return false;
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2
    }).format(price);
}

function createCartButton(label, action, itemId, text) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm btn-outline-dark";
    button.dataset.cartAction = action;
    button.dataset.productId = itemId;
    button.setAttribute("aria-label", label);
    button.textContent = text;
    return button;
}

function renderCart() {
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cartCount.textContent = itemCount;
    cartEmpty.hidden = cart.length > 0;
    cartItems.replaceChildren();

    for (const item of cart) {
        const row = document.createElement("li");
        row.className = "list-group-item cart-item d-flex align-items-center gap-3";

        const image = document.createElement("img");
        image.className = "cart-item-image";
        image.src = item.image;
        image.alt = "";

        const details = document.createElement("div");
        details.className = "flex-grow-1";

        const name = document.createElement("h3");
        name.className = "fs-6 mb-1";
        name.textContent = item.name;

        const price = document.createElement("p");
        price.className = "mb-2";
        price.textContent = `${formatPrice(item.price)} c/u`;

        const controls = document.createElement("div");
        controls.className = "cart-item-controls d-flex align-items-center gap-2";
        controls.append(
            createCartButton(`Restar una unidad de ${item.name}`, "decrease", item.id, "−")
        );

        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;
        quantity.setAttribute("aria-label", `Cantidad: ${item.quantity}`);
        controls.append(
            quantity,
            createCartButton(`Agregar una unidad de ${item.name}`, "increase", item.id, "+"),
            createCartButton(`Quitar ${item.name} del carrito`, "remove", item.id, "Quitar")
        );

        details.append(name, price, controls);
        row.append(image, details);
        cartItems.append(row);
    }

    cartTotal.textContent = cart.length > 0 ? `Total: ${formatPrice(total)}` : "";
}

document.querySelector(".row.gx-4")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;

    const card = button.closest("[data-product-id]");
    const name = card.querySelector(".card-body h5").textContent.trim();
    const image = card.querySelector(".card-img-top").src;
    const id = card.dataset.productId;
    const price = Number(card.dataset.price);
    const existingItem = cart.find((item) => item.id === id);

    if (!id || !name || !image || !Number.isFinite(price)) {
        console.error("No se pudo agregar el producto: faltan sus datos.");
        showStorageMessage("No se pudo agregar este producto porque faltan sus datos.");
        return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, image, price, quantity: 1 });
    }

    const saved = saveCart();
    renderCart();
    if (saved) showStorageMessage(`${name} se agregó al carrito.`);
});

cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const item = cart.find((entry) => entry.id === button.dataset.productId);
    if (!item) return;

    if (button.dataset.cartAction === "increase") item.quantity += 1;
    if (button.dataset.cartAction === "decrease") item.quantity -= 1;
    if (button.dataset.cartAction === "remove" || item.quantity <= 0) {
        cart = cart.filter((entry) => entry.id !== item.id);
    }

    saveCart();
    renderCart();
});

document.querySelector("[data-clear-cart]").addEventListener("click", () => {
    cart = [];
    const saved = saveCart();
    renderCart();
    if (saved) showStorageMessage("Carrito vaciado.");
});

renderCart();
