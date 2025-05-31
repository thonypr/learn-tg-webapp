// Initialize Telegram Web App
let tg = window.Telegram.WebApp;

// Expand to full height
tg.expand();

// Variables for shake detection
let shakeCount = 0;
let lastAcceleration = { x: 0, y: 0, z: 0 };
let lastTime = 0;
let isListeningForShake = false;

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
    
    // Set up device orientation tracking
    initOrientationTracking();
    
    // Set up shake detection
    initShakeDetection();
    
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
    
    // Handle reset shake count button
    document.getElementById('reset-shake').addEventListener('click', function() {
        resetShakeCount();
    });
}

// Function to initialize orientation tracking
function initOrientationTracking() {
    const orientationDisplay = document.getElementById('orientation-display');
    
    // Update orientation display based on viewport dimensions
    function updateOrientationDisplay() {
        const isPortrait = tg.viewportHeight > tg.viewportWidth;
        orientationDisplay.textContent = isPortrait ? 'Portrait' : 'Landscape';
        orientationDisplay.dataset.orientation = isPortrait ? 'portrait' : 'landscape';
    }
    
    // Initial update
    updateOrientationDisplay();
    
    // Listen for viewport changes from Telegram
    tg.onEvent('viewportChanged', function() {
        console.log('Viewport changed', tg.viewportHeight, tg.viewportStableHeight);
        updateOrientationDisplay();
    });
    
    // Also listen for window resize as a fallback
    window.addEventListener('resize', updateOrientationDisplay);
}

// Function to initialize shake detection
function initShakeDetection() {
    if (!window.DeviceMotionEvent) {
        document.getElementById('shake-count').parentElement.innerHTML = 
            '<p>Device motion not supported on this device</p>';
        return;
    }
    
    // Shake detection threshold and cooldown
    const SHAKE_THRESHOLD = 15;
    const SHAKE_COOLDOWN = 1000; // 1 second cooldown between shakes
    
    // Start listening for device motion
    function startShakeDetection() {
        if (isListeningForShake) return;
        
        isListeningForShake = true;
        window.addEventListener('devicemotion', handleDeviceMotion);
        console.log('Shake detection started');
    }
    
    // Handle device motion events
    function handleDeviceMotion(event) {
        const current = event.accelerationIncludingGravity;
        const currentTime = new Date().getTime();
        
        if (!current || (currentTime - lastTime) < 100) return; // Limit sampling rate
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Calculate change in acceleration
        const deltaX = Math.abs(lastAcceleration.x - current.x);
        const deltaY = Math.abs(lastAcceleration.y - current.y);
        const deltaZ = Math.abs(lastAcceleration.z - current.z);
        
        // Update last acceleration
        lastAcceleration = {
            x: current.x,
            y: current.y,
            z: current.z
        };
        
        // Calculate magnitude of change
        const totalAcceleration = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        
        // Check if acceleration exceeds threshold
        if (totalAcceleration > SHAKE_THRESHOLD) {
            detectShake();
        }
    }
    
    // Handle shake detection
    function detectShake() {
        const now = new Date().getTime();
        if (now - lastTime < SHAKE_COOLDOWN) return;
        
        shakeCount++;
        document.getElementById('shake-count').textContent = shakeCount;
        lastTime = now;
        
        // Optional: Provide haptic feedback if available
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
    
    // Try to start shake detection
    try {
        // Request permission for DeviceMotionEvent if needed (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            
            // Add a button to request permission
            const permissionBtn = document.createElement('button');
            permissionBtn.className = 'button';
            permissionBtn.textContent = 'Enable Shake Detection';
            permissionBtn.onclick = function() {
                DeviceMotionEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            startShakeDetection();
                            permissionBtn.remove();
                        } else {
                            document.getElementById('shake-count').parentElement.innerHTML = 
                                '<p>Permission denied for motion sensors</p>';
                        }
                    })
                    .catch(console.error);
            };
            
            document.getElementById('shake-count').parentElement.prepend(permissionBtn);
        } else {
            // No permission needed, start immediately
            startShakeDetection();
        }
    } catch (e) {
        console.error('Error initializing shake detection:', e);
        document.getElementById('shake-count').parentElement.innerHTML = 
            '<p>Error initializing motion sensors</p>';
    }
}

// Function to reset shake count
function resetShakeCount() {
    shakeCount = 0;
    document.getElementById('shake-count').textContent = '0';
}

// Handle back button if needed
tg.onEvent('backButtonClicked', function() {
    // Handle back button action
    alert('Back button clicked!');
    // tg.sendData(JSON.stringify({action: 'back'}));
});

// Cleanup function when app is closed or hidden
function cleanupSensors() {
    if (isListeningForShake) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
        isListeningForShake = false;
    }
    
    window.removeEventListener('resize', updateOrientationDisplay);
}

// Listen for app visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        cleanupSensors();
    } else if (document.visibilityState === 'visible') {
        // Reinitialize sensors if needed
        if (!isListeningForShake) {
            initShakeDetection();
        }
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.message);
    // Optionally log errors to your server
});

