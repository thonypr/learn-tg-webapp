// Function to initialize shake detection - FIXED VERSION
function initShakeDetection() {
    const motionStatus = document.getElementById('motion-status');
    
    if (!window.DeviceMotionEvent) {
        document.getElementById('shake-count').parentElement.innerHTML = 
            '<p>Device motion not supported on this device</p>';
        logDebug('Device motion not supported');
        return;
    }
    
    // FIXED: Better shake detection parameters
    const SHAKE_THRESHOLD = 15; // Increased threshold for better detection
    const SHAKE_COOLDOWN = 300; // Reduced cooldown for more responsive detection
    const MIN_SHAKE_FORCE = 2.5; // Minimum force to consider as potential shake
    
    // Variables for improved shake detection
    let lastUpdate = 0;
    let lastShakeTime = 0;
    
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
    
    // FIXED: Improved device motion handler
    function handleDeviceMotion(event) {
        const currentTime = new Date().getTime();
        
        // Throttle updates to avoid excessive processing
        if ((currentTime - lastUpdate) < 50) return;
        lastUpdate = currentTime;
        
        // Try to get acceleration data
        let acceleration = null;
        let accelerationType = '';
        
        if (event.acceleration && 
            (event.acceleration.x !== null && event.acceleration.y !== null && event.acceleration.z !== null)) {
            acceleration = event.acceleration;
            accelerationType = 'pure';
        } else if (event.accelerationIncludingGravity) {
            acceleration = event.accelerationIncludingGravity;
            accelerationType = 'withGravity';
        }
        
        if (!acceleration) {
            logDebug('No acceleration data available');
            return;
        }
        
        // FIXED: Better shake detection algorithm
        const x = acceleration.x || 0;
        const y = acceleration.y || 0;
        const z = acceleration.z || 0;
        
        // Calculate the magnitude of acceleration
        const accelerationMagnitude = Math.sqrt(x * x + y * y + z * z);
        
        // For acceleration including gravity, we need to subtract gravity (around 9.8)
        let totalForce;
        if (accelerationType === 'withGravity') {
            // Subtract approximate gravity and get absolute value
            totalForce = Math.abs(accelerationMagnitude - 9.8);
        } else {
            // Pure acceleration data
            totalForce = accelerationMagnitude;
        }
        
        // Log current motion data (less frequently to avoid spam)
        if (currentTime - lastTime > 1000) { // Log every second
            logDebug(`Motion data: force=${totalForce.toFixed(2)}, type=${accelerationType}`, {
                x: x.toFixed(2),
                y: y.toFixed(2),
                z: z.toFixed(2),
                magnitude: accelerationMagnitude.toFixed(2)
            });
            lastTime = currentTime;
        }
        
        // FIXED: Multi-level shake detection
        if (totalForce > MIN_SHAKE_FORCE) {
            // Calculate delta from last acceleration
            const deltaX = Math.abs(lastAcceleration.x - x);
            const deltaY = Math.abs(lastAcceleration.y - y);
            const deltaZ = Math.abs(lastAcceleration.z - z);
            const deltaSum = deltaX + deltaY + deltaZ;
            
            // Check for shake using both total force and delta
            if (totalForce > SHAKE_THRESHOLD || deltaSum > SHAKE_THRESHOLD) {
                if (currentTime - lastShakeTime > SHAKE_COOLDOWN) {
                    detectShake(totalForce, deltaSum, accelerationType);
                    lastShakeTime = currentTime;
                }
            }
        }
        
        // Update last acceleration
        lastAcceleration = { x, y, z };
    }
    
    // FIXED: Enhanced shake detection with better feedback
    function detectShake(force, delta, accelType) {
        shakeCount++;
        document.getElementById('shake-count').textContent = shakeCount;
        
        // Enhanced logging
        logInfo(`🎯 SHAKE DETECTED! Force: ${force.toFixed(2)}, Delta: ${delta.toFixed(2)}`, { 
            count: shakeCount,
            type: accelType,
            threshold: SHAKE_THRESHOLD
        });
        
        // Visual feedback
        motionStatus.textContent = 'SHAKE!';
        motionStatus.style.backgroundColor = '#4CAF50';
        motionStatus.style.color = 'white';
        motionStatus.style.fontWeight = 'bold';
        
        // Reset visual feedback
        setTimeout(() => {
            motionStatus.textContent = 'Active';
            motionStatus.style.backgroundColor = '';
            motionStatus.style.color = '';
            motionStatus.style.fontWeight = '';
        }, 800);
        
        // Haptic feedback if available
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('heavy');
        }
        
        // Optional: Flash the entire screen briefly
        document.body.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 100);
    }
    
    // FIXED: Better permission handling
    try {
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            
            logInfo('iOS - Motion permission required');
            
            const permissionBtn = document.createElement('button');
            permissionBtn.className = 'button';
            permissionBtn.textContent = '🔓 Enable Shake Detection';
            permissionBtn.style.backgroundColor = '#FF9800';
            permissionBtn.style.color = 'white';
            permissionBtn.style.fontWeight = 'bold';
            
            permissionBtn.onclick = function() {
                logInfo('Requesting DeviceMotion permission...');
                
                DeviceMotionEvent.requestPermission()
                    .then(response => {
                        logInfo(`Permission response: ${response}`);
                        
                        if (response === 'granted') {
                            startShakeDetection();
                            permissionBtn.remove();
                            logInfo('✅ Motion permission granted!');
                        } else {
                            logError('❌ Motion permission denied');
                            permissionBtn.textContent = '❌ Permission Denied';
                            permissionBtn.disabled = true;
                        }
                    })
                    .catch(error => {
                        logError('Motion permission error', { error: error.message });
                        permissionBtn.textContent = '❌ Permission Error';
                        permissionBtn.disabled = true;
                    });
            };
            
            const shakeBox = document.getElementById('shake-count').parentElement;
            shakeBox.insertBefore(permissionBtn, shakeBox.firstChild);
            
        } else {
            // Android or other platforms - start immediately
            logInfo('Starting shake detection (no permission needed)');
            startShakeDetection();
        }
    } catch (error) {
        logError('Error initializing shake detection', { error: error.message });
        
        motionStatus.textContent = 'Error';
        motionStatus.classList.remove('active');
        motionStatus.classList.add('inactive');
    }
}

// BONUS: Add a sensitivity adjustment function
function adjustShakeSensitivity(sensitivity = 'medium') {
    const settings = {
        'low': { threshold: 25, minForce: 4, cooldown: 500 },
        'medium': { threshold: 15, minForce: 2.5, cooldown: 300 },
        'high': { threshold: 8, minForce: 1.5, cooldown: 200 },
        'very_high': { threshold: 5, minForce: 1, cooldown: 150 }
    };
    
    const config = settings[sensitivity] || settings['medium'];
    
    // You can update the constants dynamically here if needed
    logInfo(`Shake sensitivity set to: ${sensitivity}`, config);
    
    return config;
}

// BONUS: Add debugging helper to show real-time motion data
function enableMotionDebugging() {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'motion-debug';
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
    `;
    document.body.appendChild(debugDiv);
    
    // Override the motion handler to include real-time debugging
    const originalHandler = handleDeviceMotionRef;
    
    handleDeviceMotionRef = function(event) {
        // Call original handler
        if (originalHandler) originalHandler(event);
        
        // Update debug display
        const acc = event.acceleration || event.accelerationIncludingGravity || {};
        const x = (acc.x || 0).toFixed(2);
        const y = (acc.y || 0).toFixed(2);
        const z = (acc.z || 0).toFixed(2);
        const magnitude = Math.sqrt(x*x + y*y + z*z).toFixed(2);
        
        debugDiv.innerHTML = `
            X: ${x}<br>
            Y: ${y}<br>
            Z: ${z}<br>
            Mag: ${magnitude}<br>
            Shakes: ${shakeCount}
        `;
    };
}