// Initialize Telegram Web App
let tg = window.Telegram.WebApp;

// Expand to full height
tg.expand();

// Variables for shake detection
let shakeCount = 0;
let myShakeEvent = null;
let isShakeListening = false;

// Logging system
const DEBUG = true;
const LOG_HISTORY_LIMIT = 100;
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

// Load shake.js library dynamically
function loadShakeJS() {
    return new Promise((resolve, reject) => {
        // Check if shake.js is already loaded
        if (window.Shake) {
            logInfo('Shake.js already loaded');
            resolve();
            return;
        }
        
        logInfo('Loading shake.js library...');
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/shake.js/1.2.2/shake.min.js';
        script.onload = () => {
            logInfo('Shake.js loaded successfully');
            resolve();
        };
        script.onerror = (error) => {
            logError('Failed to load shake.js', { error: error.message });
            reject(error);
        };
        
        document.head.appendChild(script);
    });
}

// Initialize shake detection with shake.js
async function initShakeDetection() {
    const motionStatus = document.getElementById('motion-status');
    
    try {
        // Load shake.js library first
        await loadShakeJS();
        
        if (!window.Shake) {
            throw new Error('Shake.js library not loaded');
        }
        
        // Check for device motion support
        if (!window.DeviceMotionEvent) {
            document.getElementById('shake-count').parentElement.innerHTML = 
                '<p>Device motion not supported on this device</p>';
            logWarn('Device motion not supported');
            return;
        }
        
        // Create shake instance with custom options
        myShakeEvent = new window.Shake({
            threshold: 12,    // Shake sensitivity (default: 15)
            timeout: 800      // Time between shake events (default: 1000ms)
        });
        
        // Set up shake event listener
        function handleShakeEvent() {
            shakeCount++;
            document.getElementById('shake-count').textContent = shakeCount;
            
            logInfo('Shake detected!', { 
                count: shakeCount,
                timestamp: new Date().toISOString()
            });
            
            // Flash the status indicator for visual feedback
            motionStatus.textContent = 'Shake!';
            motionStatus.style.backgroundColor = '#FFC107';
            
            setTimeout(() => {
                motionStatus.textContent = isShakeListening ? 'Active' : 'Inactive';
                motionStatus.style.backgroundColor = '';
            }, 500);
            
            // Provide haptic feedback if available
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }
        
        // Start shake detection function
        function startShakeDetection() {
            if (isShakeListening) return;
            
            // Check if permission is required (iOS 13+)
            if (typeof DeviceMotionEvent !== 'undefined' && 
                typeof DeviceMotionEvent.requestPermission === 'function') {
                
                logInfo('iOS permission required for motion sensors');
                
                // Add permission request button
                const permissionBtn = document.createElement('button');
                permissionBtn.className = 'button';
                permissionBtn.textContent = 'Enable Shake Detection';
                permissionBtn.onclick = function() {
                    logInfo('Requesting motion permission...');
                    
                    DeviceMotionEvent.requestPermission()
                        .then(response => {
                            logInfo('Permission response: ' + response);
                            
                            if (response === 'granted') {
                                // Add shake event listener
                                window.addEventListener('shake', handleShakeEvent, false);
                                
                                // Start shake detection
                                myShakeEvent.start();
                                isShakeListening = true;
                                
                                // Update status
                                motionStatus.textContent = 'Active';
                                motionStatus.classList.remove('inactive');
                                motionStatus.classList.add('active');
                                
                                logInfo('Shake detection started with permission');
                                permissionBtn.remove();
                            } else {
                                logWarn('Motion permission denied');
                                document.getElementById('shake-count').parentElement.innerHTML = 
                                    '<p>Permission denied for motion sensors</p>';
                            }
                        })
                        .catch(error => {
                            logError('Motion permission error', { error: error.message });
                            document.getElementById('debug-output').textContent = 
                                `Error: ${error.message}`;
                        });
                };
                
                // Insert the button
                const shakeBox = document.getElementById('shake-count').parentElement;
                shakeBox.insertBefore(permissionBtn, shakeBox.firstChild);
                
            } else {
                // No permission needed, start immediately
                logInfo('Starting shake detection without permission request');
                
                // Add shake event listener
                window.addEventListener('shake', handleShakeEvent, false);
                
                // Start shake detection
                myShakeEvent.start();
                isShakeListening = true;
                
                // Update status
                motionStatus.textContent = 'Active';
                motionStatus.classList.remove('inactive');
                motionStatus.classList.add('active');
                
                logInfo('Shake detection started');
            }
        }
        
        // Start shake detection
        startShakeDetection();
        
    } catch (error) {
        logError('Error initializing shake detection', { error: error.message });
        console.error('Error initializing shake detection:', error);
        
        // Show error in UI
        document.getElementById('debug-output').textContent = 
            `Error: ${error.message}`;
            
        // Update status indicator
        motionStatus.textContent = 'Error';
        motionStatus.classList.remove('active');
        motionStatus.classList.add('inactive');
    }
}

// Function to stop shake detection
function stopShakeDetection() {
    if (myShakeEvent && isShakeListening) {
        // Remove event listener
        window.removeEventListener('shake', handleShakeEvent, false);
        
        // Stop shake detection
        myShakeEvent.stop();
        isShakeListening = false;
        
        // Update status
        const motionStatus = document.getElementById('motion-status');
        if (motionStatus) {
            motionStatus.textContent = 'Inactive';
            motionStatus.classList.remove('active');
            motionStatus.classList.add('inactive');
        }
        
        logInfo('Shake detection stopped');
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
    
    // Set up shake detection with shake.js
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
    
    // Add toggle shake detection button
    const toggleShakeBtn = document.createElement('button');
    toggleShakeBtn.className = 'button secondary';
    toggleShakeBtn.textContent = 'Toggle Shake Detection';
    toggleShakeBtn.onclick = function() {
        if (isShakeListening) {
            stopShakeDetection();
            this.textContent = 'Start Shake Detection';
        } else {
            initShakeDetection();
            this.textContent = 'Stop Shake Detection';
        }
    };
    
    // Add toggle button to the shake section
    const resetButton = document.getElementById('reset-shake');
    if (resetButton && resetButton.parentElement) {
        resetButton.parentElement.appendChild(toggleShakeBtn);
    }
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

// Function to reset shake count
function resetShakeCount() {
    shakeCount = 0;
    document.getElementById('shake-count').textContent = '0';
    logInfo('Shake count reset');
}

// Handle back button if needed
tg.onEvent('backButtonClicked', function() {
    // Handle back button action
    alert('Back button clicked!');
    // tg.sendData(JSON.stringify({action: 'back'}));
});

// Cleanup function when app is closed or hidden
function cleanupSensors() {
    // Stop shake detection
    stopShakeDetection();
    
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
        if (!isShakeListening) {
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
    logError('JavaScript error occurred', { 
        message: e.message, 
        filename: e.filename, 
        lineno: e.lineno 
    });
});

// Add test buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create manual test shake button
    const testButton = document.createElement('button');
    testButton.className = 'button secondary small';
    testButton.textContent = 'Test Shake';
    testButton.style.marginTop = '10px';
    testButton.onclick = function() {
        // Trigger a manual shake event
        const shakeEvent = new Event('shake');
        window.dispatchEvent(shakeEvent);
        
        logInfo('Manual shake triggered');
    };
    
    // Add the test button
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
    
    // Add log test buttons to the logs controls
    const logsControls = document.querySelector('.logs-controls');
    if (logsControls) {
        logsControls.appendChild(logLevelsContainer);
    }
});