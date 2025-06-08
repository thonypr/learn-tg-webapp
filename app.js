// Initialize Telegram Web App
let tg = window.Telegram.WebApp;

// Expand to full height
tg.expand();

// Mock data for now
const availableServices = ["ChatGPT Demo"];
const userSubscriptions = ["Github DEMO"];

const availableContainer = document.getElementById("available-services");
const userContainer = document.getElementById("user-subscriptions");

// Use a Set to keep track of selected subscriptions
const selected = new Set(userSubscriptions);

// Function to render services with checkboxes
function renderServices(container, services) {
    container.innerHTML = "";
    services.forEach(service => {
        const label = document.createElement("label");
        label.className = "service-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selected.has(service);
        checkbox.onchange = () => {
            if (checkbox.checked) selected.add(service);
            else selected.delete(service);
        };

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + service));
        container.appendChild(label);
    });
}

// Initial rendering on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    renderServices(availableContainer, availableServices);
    renderServices(userContainer, userSubscriptions);
});
