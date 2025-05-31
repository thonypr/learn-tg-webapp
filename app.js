// Initialize Telegram Web App
let tg = window.Telegram.WebApp;

// Expand to full height
tg.expand();

// Main function that runs when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI based on Telegram theme
    initTheme();
    
    // Display user information
    displayUserInfo();
    
    // Set up main button
    setupMainButton();
    
    // Set up event listeners
    setupEventListeners();
    
    // Let Telegram know the app is ready
    tg.ready();
});

// Function to initialize theme colors from Telegram
function initTheme() {
    // Apply Telegram theme colors to CSS variables
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hintColor || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.linkColor || '#2678b6');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor || '#40a7e3');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.secondaryBackgroundColor || '#f0f0f0');
    
    // Display theme info
    document.getElementById('theme-info').textContent = `Theme: ${tg.colorScheme || 'unknown'}`;
}

// Function to display user information
function displayUserInfo() {
    const userElement = document.getElementById('user-name');
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userElement.textContent = `Hello, ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}!`;
    } else {
        userElement.textContent = 'User not available';
    }
}

// Function to set up Telegram's main button
function setupMainButton() {
    tg.MainButton.setText('CONFIRM');
    tg.MainButton.setParams({
        text_color: '#FFFFFF',
        color: '#2cab37'
    });
    
    tg.MainButton.onClick(function() {
        // Example action when main button is clicked
        alert('Main button clicked!');
        
        // You can send data back to the Telegram app
        // tg.sendData(JSON.stringify({action: 'confirm', data: {}}));
    });
    
    // Alternative way to handle main button with DOM
    document.getElementById('main-button').addEventListener('click', function() {
        if (tg.MainButton.isVisible) {
            tg.MainButton.hide();
            this.textContent = 'Show Main Button';
        } else {
            tg.MainButton.show();
            this.textContent = 'Hide Main Button';
        }
    });
}

// Function to set up other event listeners
function setupEventListeners() {
    // Handle close app button
    document.getElementById('close-app').addEventListener('click', function() {
        tg.close();
    });
    
    // You can add more event listeners for your app functionality here
}

// Handle back button if needed
tg.onEvent('backButtonClicked', function() {
    // Handle back button action
    alert('Back button clicked!');
    // tg.sendData(JSON.stringify({action: 'back'}));
});

// Handle viewport changed
tg.onEvent('viewportChanged', function() {
    // Handle viewport changes if needed
    console.log('Viewport changed', tg.viewportHeight, tg.viewportStableHeight);
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.message);
    // Optionally log errors to your server
});

