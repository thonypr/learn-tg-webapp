// Initialize Telegram Web App
let tg = window.Telegram.WebApp;

// Expand to full height
tg.expand();

// Variables for shake detection
let shakeCount = 0;
let lastAcceleration = { x: 0, y: 0, z: 0 };
let lastTime = 0;
let isListeningForShake = false;

// Create a global reference to the motion handler so we can remove it later
let handleDeviceMotionRef = null;

// Logging system
const DEBUG = true;
const LOG_HISTORY_LIMIT = 100; // Maximum number of log entries to keep
let logHistory = [];

// Log levels
const LogLevel = {
    INFO: 'info',
    DEBUG: 'debug',
    WARN: 'warn',
    ERROR: 'error'
};

// Main logging function
function log(level, message, data) {
    if (!DEBUG && level === LogLevel.DEBUG) return;
    
    const timestamp = new Date().toISOString().substr(11, 8);
    const dataStr = data ? ': ' + JSON.stringify(data) : '';
    const logMessage = `${message}${dataStr}`;
    
    // Add to log history
    logHistory.push({
        timestamp,
        level,
        message: logMessage
    });
    
    // Trim history if needed
    if (logHistory.length > LOG_HISTORY_LIMIT) {
        logHistory = logHistory.slice(-LOG_HISTORY_LIMIT);
    }
    
    // Update the logs display
    updateLogsDisplay();
    
    // Also update the single line debug output
    const debugOutput = document.getElementById('debug-output');
    if (debugOutput) {
        debugOutput.textContent = `[${timestamp}] ${message}${dataStr}`;
    }
    
    // Log to console with appropriate level
    switch (level) {
        case LogLevel.ERROR:
            console.error(message, data);
            break;
        case LogLevel.WARN:
            console.warn(message, data);
            break;
        case LogLevel.INFO:
            console.info(message, data);
            break;
        default:
            console.log(message, data);
    }
}

// Helper functions for different log levels
function logInfo(message, data) {
    log(LogLevel.INFO, message, data);
}

function logDebug(message, data) {
    log(LogLevel.DEBUG, message, data);
}

function logWarn(message, data) {
    log(LogLevel.WARN, message, data);
}

function logError(message, data) {
    log(LogLevel.ERROR, message, data);
}

// Function to update the logs display
function updateLogsDisplay() {
    const logsContent = document.getElementById('logs-content');
    if (!logsContent) return;
    
    // Clear existing content
    logsContent.innerHTML = '';
    
    // Add each log entry
    logHistory.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = entry.timestamp;
        
        const level = document.createElement('span');
        level.className = `log-level ${entry.level}`;
        level.textContent = entry.level.toUpperCase();
        
        const message = document.createElement('span');
        message.className = 'log-message';
        message.textContent = entry.message;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(level);
        logEntry.appendChild(message);
        
        logsContent.appendChild(logEntry);
    });
    
    // Auto-scroll if enabled
    const logsArea = document.getElementById('logs-area');
    const autoScroll = document.getElementById('logs-autoscroll');
    
    if (logsArea && autoScroll && autoScroll.checked) {
        logsArea.scrollTop = logsArea.scrollHeight;
    }
}

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
    
    // Initial log entry
    logInfo('Application initialized', { 
        timestamp: new Date().toISOString(),
        platform: navigator.platform,
        userAgent: navigator.userAgent
    });
    
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
    
    // Handle clear logs button
    document.getElementById('clear-logs').addEventListener('click', function() {
        logHistory = [];
        updateLogsDisplay();
        logInfo('Logs cleared');
    });
}

// Function to initialize orientation tracking
function initOrientationTracking() {
    const orientationDisplay = document.getElementById('orientation-display');
    const orientationStatus = document.getElementById('orientation-status');
    
    // Update orientation display based on multiple sources
    function updateOrientationDisplay() {
        let orientationType = 'unknown';
        let source = 'none';
        
        // Try Screen Orientation API first
        if (window.screen && window.screen.orientation) {
            const orientation = window.screen.orientation.type;
            if (orientation.includes('portrait')) {
                orientationType = 'Portrait';
                source = 'Screen Orientation API';
            } else if (orientation.includes('landscape')) {
                orientationType = 'Landscape';
                source = 'Screen Orientation API';
            }
        } 
        // Then try Telegram viewport
        else if (tg.viewportHeight && tg.viewportWidth) {
            const isPortrait = tg.viewportHeight > tg.viewportWidth;
            orientationType = isPortrait ? 'Portrait' : 'Landscape';
            source = 'Telegram viewport';
        }
        // Fallback to window dimensions
        else {
            const isPortrait = window.innerHeight > window.innerWidth;
            orientationType = isPortrait ? 'Portrait' : 'Landscape';
            source = 'Window dimensions';
        }
        
        orientationDisplay.textContent = `${orientationType} (via ${source})`;
        orientationDisplay.dataset.orientation = orientationType.toLowerCase();
        
        // Update status indicator
        if (source !== 'none') {
            orientationStatus.textContent = 'Active';
            orientationStatus.classList.remove('inactive');
            orientationStatus.classList.add('active');
        } else {
            orientationStatus.textContent = 'Inactive';
            orientationStatus.classList.remove('active');
            orientationStatus.classList.add('inactive');
        }
        
        logDebug('Orientation updated', { type: orientationType, source, 
            viewportHeight: tg.viewportHeight, viewportWidth: tg.viewportWidth });
    }
    
    // Initial update
    updateOrientationDisplay();
    
    // Listen for viewport changes from Telegram
    tg.onEvent('viewportChanged', function() {
        logDebug('Viewport changed', { height: tg.viewportHeight, stableHeight: tg.viewportStableHeight });
        updateOrientationDisplay();
    });
    
    // Listen for orientation change if available
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', function() {
            logDebug('Screen orientation changed', { type: window.screen.orientation.type });
            updateOrientationDisplay();
        });
    }
    
    // Also listen for window resize as a fallback
    window.addEventListener('resize', updateOrientationDisplay);
    
    // Expose the update function globally so we can call it from other places
    window.updateOrientationDisplay = updateOrientationDisplay;
}

// Function to initialize shake detection
function initShakeDetection() {
    const motionStatus = document.getElementById('motion-status');
    
    if (!window.DeviceMotionEvent) {
        document.getElementById('shake-count').parentElement.innerHTML = 
            '<p>Device motion not supported on this device</p>';
        logDebug('Device motion not supported');
        return;
    }
    
    // Shake detection threshold and cooldown
    // Lower threshold to make it more sensitive for pure acceleration data
    const SHAKE_THRESHOLD = 0.15; // Lowered from 10 to 0.8 for pure acceleration
    const SHAKE_COOLDOWN = 800; // Reduced cooldown between shakes (was 1000ms)
    
    // Start listening for device motion
    function startShakeDetection() {
        if (isListeningForShake) return;
        
        // Create the motion handler function and store a reference to it
        handleDeviceMotionRef = function(event) {
            handleDeviceMotion(event);
        };
        
        isListeningForShake = true;
        window.addEventListener('devicemotion', handleDeviceMotionRef);
        
        // Update status indicator
        motionStatus.textContent = 'Active';
        motionStatus.classList.remove('inactive');
        motionStatus.classList.add('active');
        
        logInfo('Shake detection started');
    }
    
    // Handle device motion events
    function handleDeviceMotion(event) {
        // Try to use pure acceleration data first, fallback to accelerationIncludingGravity
        let current = null;
        let accelerationType = '';
        
        if (event.acceleration && (event.acceleration.x !== null || event.acceleration.y !== null || event.acceleration.z !== null)) {
            current = event.acceleration;
            accelerationType = 'pure';
        } else if (event.accelerationIncludingGravity) {
            current = event.accelerationIncludingGravity;
            accelerationType = 'withGravity';
        }
        
        // Store the acceleration type for use in shake detection
        window.lastAccelerationType = accelerationType;
        
        const currentTime = new Date().getTime();
        
        // Check if we have valid acceleration data
        if (!current) {
            // No need to log when acceleration data is unavailable
            return;
        }
        
        if ((currentTime - lastTime) < 50) return; // Limit sampling rate (was 100ms)
        
        // Calculate change in acceleration
        const deltaX = Math.abs((lastAcceleration.x || 0) - (current.x || 0));
        const deltaY = Math.abs((lastAcceleration.y || 0) - (current.y || 0));
        const deltaZ = Math.abs((lastAcceleration.z || 0) - (current.z || 0));
        
        // Update last acceleration
        lastAcceleration = {
            x: current.x || 0,
            y: current.y || 0,
            z: current.z || 0
        };
        
        // Calculate magnitude of change
        const totalAcceleration = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        
        // Removed periodic motion logging to reduce noise
        
        // Check if acceleration exceeds threshold
        if (totalAcceleration > SHAKE_THRESHOLD) {
            detectShake(totalAcceleration, accelerationType, current);
        }
        
        lastTime = currentTime;
    }
    
    // Handle shake detection
    function detectShake(magnitude, accelType, currentAcceleration) {
        const now = new Date().getTime();
        if (now - lastTime < SHAKE_COOLDOWN) return;
        
        shakeCount++;
        document.getElementById('shake-count').textContent = shakeCount;
        
        // Concise logging with only essential info when a shake is detected
        logInfo(`Shake detected! Acceleration: ${magnitude.toFixed(2)}, Threshold: ${SHAKE_THRESHOLD}`, { 
            count: shakeCount
        });
        
        // Flash the status indicator for visual feedback
        motionStatus.textContent = 'Shake!';
        motionStatus.style.backgroundColor = '#FFC107';
        
        setTimeout(() => {
            motionStatus.textContent = 'Active';
            motionStatus.style.backgroundColor = '';
        }, 500);
        
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
            
            logInfo('iOS permission required for motion sensors');
            
            // Add a button to request permission
            const permissionBtn = document.createElement('button');
            permissionBtn.className = 'button';
            permissionBtn.textContent = 'Enable Shake Detection';
            permissionBtn.onclick = function() {
                logInfo('Requesting motion permission');
                
                DeviceMotionEvent.requestPermission()
                    .then(response => {
                        logInfo('Permission response: ' + response);
                        
                        if (response === 'granted') {
                            startShakeDetection();
                            permissionBtn.remove();
                        } else {
                            document.getElementById('shake-count').parentElement.innerHTML = 
                                '<p>Permission denied for motion sensors</p>';
                        }
                    })
                    .catch(error => {
                        logError('Motion permission error: ' + error.message);
                        console.error('Motion permission error:', error);
                        
                        // Show error in UI
                        document.getElementById('debug-output').textContent = 
                            `Error: ${error.message}`;
                    });
            };
            
            // Insert the button at the top of the shake detection box
            const shakeBox = document.getElementById('shake-count').parentElement;
            shakeBox.insertBefore(permissionBtn, shakeBox.firstChild);
            
        } else {
            // No permission needed, start immediately
            logInfo('No permission needed for motion sensors');
            startShakeDetection();
        }
    } catch (e) {
        logError('Error initializing shake detection: ' + e.message);
        console.error('Error initializing shake detection:', e);
        
        // Show error in UI
        document.getElementById('debug-output').textContent = 
            `Error: ${e.message}`;
            
        // Update status indicator
        motionStatus.textContent = 'Error';
        motionStatus.classList.remove('active');
        motionStatus.classList.add('inactive');
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
    if (isListeningForShake && handleDeviceMotionRef) {
        window.removeEventListener('devicemotion', handleDeviceMotionRef);
        isListeningForShake = false;
        
        // Update status indicator
        const motionStatus = document.getElementById('motion-status');
        if (motionStatus) {
            motionStatus.textContent = 'Inactive';
            motionStatus.classList.remove('active');
            motionStatus.classList.add('inactive');
        }
        
        logInfo('Motion detection stopped');
    }
    
    // Remove orientation listeners
    window.removeEventListener('resize', window.updateOrientationDisplay);
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', window.updateOrientationDisplay);
    }
    
    // Update orientation status
    const orientationStatus = document.getElementById('orientation-status');
    if (orientationStatus) {
        orientationStatus.textContent = 'Inactive';
        orientationStatus.classList.remove('active');
        orientationStatus.classList.add('inactive');
    }
    
    logInfo('Sensors cleaned up');
}

// Listen for app visibility changes
document.addEventListener('visibilitychange', function() {
    logInfo('Visibility changed: ' + document.visibilityState);
    
    if (document.visibilityState === 'hidden') {
        cleanupSensors();
    } else if (document.visibilityState === 'visible') {
        // Reinitialize sensors if needed
        if (!isListeningForShake) {
            initShakeDetection();
        }
        
        // Update orientation display
        if (window.updateOrientationDisplay) {
            window.updateOrientationDisplay();
        }
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.message);
    
    // Show error in UI
    logDebug('Error occurred', { message: e.message });
    
    // Optionally log errors to your server
});

// Add a manual test button for shake if needed
document.addEventListener('DOMContentLoaded', function() {
    // Create test button
    const testButton = document.createElement('button');
    testButton.className = 'button secondary small';
    testButton.textContent = 'Test Shake';
    testButton.style.marginTop = '10px';
    testButton.onclick = function() {
        shakeCount++;
        document.getElementById('shake-count').textContent = shakeCount;
        
        logInfo('Manual shake triggered', { count: shakeCount });
        
        // Flash the status indicator
        const motionStatus = document.getElementById('motion-status');
        if (motionStatus) {
            motionStatus.textContent = 'Shake!';
            motionStatus.style.backgroundColor = '#FFC107';
            
            setTimeout(() => {
                motionStatus.textContent = isListeningForShake ? 'Active' : 'Inactive';
                motionStatus.style.backgroundColor = '';
            }, 500);
        }
    };
    
    // Add the button after the reset button
    const resetButton = document.getElementById('reset-shake');
    if (resetButton && resetButton.parentElement) {
        resetButton.parentElement.appendChild(testButton);
    }
    
    // Add test log buttons for different log levels
    const logLevelsContainer = document.createElement('div');
    logLevelsContainer.style.display = 'flex';
    logLevelsContainer.style.gap = '5px';
    logLevelsContainer.style.marginTop = '10px';
    
    const logLevels = [
        { level: 'info', color: '#2196F3' },
        { level: 'debug', color: '#4CAF50' },
        { level: 'warn', color: '#FF9800' },
        { level: 'error', color: '#F44336' }
    ];
    
    logLevels.forEach(({ level, color }) => {
        const logButton = document.createElement('button');
        logButton.className = 'button secondary small';
        logButton.textContent = `Test ${level}`;
        logButton.style.backgroundColor = color;
        logButton.style.color = 'white';
        logButton.style.padding = '4px 8px';
        logButton.style.fontSize = '12px';
        
        logButton.onclick = function() {
            switch (level) {
                case 'info':
                    logInfo(`Test ${level} message`, { timestamp: new Date().getTime() });
                    break;
                case 'debug':
                    logDebug(`Test ${level} message`, { timestamp: new Date().getTime() });
                    break;
                case 'warn':
                    logWarn(`Test ${level} message`, { timestamp: new Date().getTime() });
                    break;
                case 'error':
                    logError(`Test ${level} message`, { timestamp: new Date().getTime() });
                    break;
            }
        };
        
        logLevelsContainer.appendChild(logButton);
    });
    
    // Add log test buttons to the logs header
    const logsControls = document.querySelector('.logs-controls');
    if (logsControls) {
        logsControls.appendChild(logLevelsContainer);
    }
});
